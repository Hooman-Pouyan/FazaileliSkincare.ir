# Facet manifest — F-1 … F-6

**Date:** 2026-08-26 · **Closes:** the facet half of decision-map ticket #5, which `18-storefront-direction-decisions.md` left open and `plp.md` `PLP-10` requires before any facet beyond the first three is built
**Pattern:** interim decisions with re-review triggers, as used in `19-navigation-decisions.md`

---

## Why this document is the gate

`plp.md` `PLP-10` is unusually specific, and it was written for exactly this
moment:

> Ticket #5 must approve a facet manifest before implementation. Each row
> records stable code, localized label source, owning canonical data
> field/relation, applicable scopes/categories, operator semantics, URL
> encoding, display order, live-count behavior, zero-count policy, and SEO
> policy.

and:

> **External storefront menus and labels are research evidence only; they do not
> become accepted facet codes or routes without the ticket #5 decision.**

The request that prompted this arrived as screenshots of Face Reality, ZO Skin
Health, Forlle'd and Storyderm. Those are evidence. What follows is the decision.

The short version: **the schema already supports three more axes than the PLP
exposes**, and they are the strongest three available. Several other requested
axes have no canonical field, and two of them conflict with rules this project
already holds.

---

## F-1 · The manifest

`Owner` names the canonical field or relation. A facet with no owner is not
built — `PLP-10`: _"No facet is assigned by parsing product titles,
descriptions, filenames, or generic taxonomy overlap."_

| Order | Code        | Label source                    | Owner                                     | Scopes                                                     | Operator              | Encoding                                    | Zero-count          | SEO              | Status                           |
| ----- | ----------- | ------------------------------- | ----------------------------------------- | ---------------------------------------------------------- | --------------------- | ------------------------------------------- | ------------------- | ---------------- | -------------------------------- |
| 1     | `concern`   | `concernTranslation.name`       | `productConcern`                          | all but `concern`                                          | OR within, AND across | repeated `?concern=`                        | hide unless applied | `noindex,follow` | **live**                         |
| 2     | `skin_type` | `skinStateTranslation.name`     | `productSkinState` → `skinState`          | all                                                        | OR within, AND across | repeated `?skin_type=`                      | hide unless applied | `noindex,follow` | **this packet**                  |
| 3     | `brand`     | `brandTranslation.name`         | `product.brandId`                         | all but `brand`                                            | OR within, AND across | repeated `?brand=`                          | hide unless applied | `noindex,follow` | **live**                         |
| 4     | `line`      | `productLineTranslation.name`   | `product.lineId` → `productLine`          | all; **only rendered when the result set spans one brand** | OR within, AND across | repeated `?line=`                           | hide unless applied | `noindex,follow` | **this packet**                  |
| 5     | `category`  | `categoryTranslation.name`      | `product.categoryId`                      | all but `category`                                         | OR within, AND across | repeated `?category=`                       | hide unless applied | `noindex,follow` | **live**                         |
| 6     | `phase`     | `protocolPhaseTranslation.name` | `productProtocolPhase` → `protocolPhase`  | all                                                        | OR within, AND across | repeated `?phase=`                          | hide unless applied | `noindex,follow` | **this packet**                  |
| 7     | `price`     | — (numeric)                     | `price.amountRials`, eligible-group floor | all                                                        | range, AND            | `?price_min=` / `?price_max=` in **toman**  | n/a                 | `noindex,follow` | grammar live, **UI this packet** |
| 8     | `in_stock`  | catalogue message               | `inventory.onHand`                        | all                                                        | boolean, AND          | `?in_stock=1`                               | n/a                 | `noindex,follow` | **live**                         |
| 9     | `audience`  | catalogue message               | `product.isProfessionalOnly`              | all                                                        | single-select, AND    | `?audience=home` / `?audience=professional` | n/a                 | `noindex,follow` | **this packet**                  |

**Operator semantics, stated once.** OR within a group, AND across groups. Two
brands means either brand; a brand and a concern means both. This is what every
storefront in the research does and what a shopper assumes without being told.

**Zero-count policy, stated once.** A value with no products under the _other_
groups' selections is hidden, unless it is currently applied — an applied value
must stay visible or it can never be removed. This follows from `PLP-03`'s
counting rule rather than being a separate choice.

**SEO, stated once.** Every filtered permutation is `noindex,follow` and
canonicals to the clean scope, per `D-18-3`. Filters multiply URLs faster than
they add distinct content; the scope pages are what rank.

---

## F-2 · `line` is the brand-contextual filter, and it is why it is conditional

Storyderm sells Ultra Lift, Princess Shine, O2 White, TimeMachine Calming,
Clinic-A. Forlle'd sells Platinum, AC Clear, BW, P-effect, Re-Dify. Both put
those on their own navigation, and the request was that selecting a brand should
surface its ranges.

`product.lineId` → `productLine` already models this, and `productLine` is unique
on `(brandId, slug)` — a line belongs to exactly one brand.

**Decision.** The `line` facet renders **only when the current result set spans a
single brand** — on `/shop/brand/storyderm`, or on any scope where `?brand=` has
narrowed to one. Otherwise it is absent.

**Why conditional rather than always.** Shown unconditionally on `/shop`, `line`
is a flat list of every range from every brand — thirty values with no context,
where "Ultra Lift" and "Platinum Line" sit side by side meaning nothing to a
customer who has not chosen a brand. It is a facet that only means something once
another one has been used, and pretending otherwise produces the dead-end rail
`08-competitive-research.md` warns about: _"Facets that produce mostly
one-product dead ends."_

**Re-review trigger.** A customer arriving already knowing a line name — evidence
would be search terms like «اولترا لیفت». If that happens, `line` wants to be a
route scope (`/shop/line/ultra-lift`), not only a facet.

---

## F-3 · `audience` replaces "only for therapists" as a single-select

**Decision.** One facet, `audience`, with two values: home use and professional.
`product.isProfessionalOnly` owns it.

**Why single-select and not a toggle.** A checkbox labelled "professional only"
answers one question and leaves the other unaskable — a customer cannot say
"show me only what I can actually buy", which is the more common need on a site
that deliberately displays professional stock it will not sell (`D-18-2`). Two
named values ask the question in both directions.

**What it must never do.** Hide professional products by default.
`08-competitive-research.md` lists _"Hiding professional eligibility until
checkout"_ under **Avoid**, and `D-18-2` makes them visible and non-purchasable
on purpose. The facet narrows on request; it does not become a silent gate.

---

## F-4 · What was requested and is not being built, with what each needs

None of these is a refusal on taste. Each is a missing canonical field, missing
content, or a conflict with a rule already held.

| Requested                                                    | Why not                                                                                                                                                                                                                                                                                                                                    | What would unblock it                                                                                                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Discount / on-sale filter**                                | There is no promotion model, and `09-brand-brief.md` is explicit: _"No permanent discount furniture — no countdown timers, no `-۳۰٪` on every tile."_ On medical-grade product, visible permanent discounting tells patients the price was never real                                                                                      | A dated campaign model with a real end date, per `L-6`. Then the filter is honest because the discount is temporary                                                              |
| **Customer rating / score**                                  | No review table exists, and `D-18-3` forbids `AggregateRating` until real reviews do. The 42 testimonials are consent-blocked under `L-4`                                                                                                                                                                                                  | A review model with verified purchases, plus the consent work. A rating filter over unverified text would be the fabricated structured data D-18-3 names as a manual-action risk |
| **Active ingredient** (Face Reality's «Hyaluronic acid (1)») | `PLP-10`: _"Ingredient, suitability, safety, pregnancy, post-treatment, professional, or similar specialist filters are absent until canonical evidence, content approval, and safe applicability rules exist."_ `productTranslation.ingredients` is free prose; deriving a facet from it is exactly the title-parsing that clause forbids | A canonical `ingredient` entity with per-product links, entered by a person who can be held to it. This is the highest-value item on this list and the most work                 |
| **"Recommended by us"**                                      | `product.merchandisingRank` is an integer sort weight, not an editorial claim. Filtering on `rank > 0` would turn a merchandising knob into a promise                                                                                                                                                                                      | A boolean `isInstituteChoice` with a staff surface to set it, and a decision about what the claim means                                                                          |
| **Exclusive**                                                | No field, and no definition. "Exclusive" at this business most plausibly means the Forlle'd representation, which is a _brand_ fact already visible                                                                                                                                                                                        | A definition first, then a field                                                                                                                                                 |
| **Packages / home-care kits**                                | No bundle model. A kit is not a filtered view of products, it is a product composed of products, with its own price and stock                                                                                                                                                                                                              | A bundle entity — real work, and a cart concern as much as a catalogue one                                                                                                       |

**The honest ranking, if these are worked through in order:** ingredient facet
first (real customer value, and the research calls it differentiating), then
bundles (a genuine revenue path), then reviews (needed for trust, blocked on
process not code), then campaigns. "Recommended" and "exclusive" are labels
looking for a meaning and should wait until they have one.

---

## F-5 · PLP editorial and SEO content

The request was for FAQ, promotional banners and a gallery on listing pages.

| Element                                     | Decision                                                                                                                                                                                                                                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scope introduction**                      | **Live.** `concernTranslation.description` already renders above the results. It is the highest-value SEO text on the page because it is about the concern the page ranks for                                                                                                          |
| **FAQ block + `FAQPage` JSON-LD**           | **Built this packet as structure, absent until content exists.** Per-scope questions, answered in her voice. `FAQPage` markup emits only for questions actually on the page — Google penalises markup without a visible counterpart. Content is the blocker and it is the maintainer's |
| **Editorial gallery**                       | **Deferred.** The cleared photography would decorate a listing rather than help someone choose. It belongs on the concern's own editorial section when `/results` and the Landing exist                                                                                                |
| **Promotional banner below the breadcrumb** | **Refused as furniture, allowed as a campaign.** `L-6` already settles this: no permanent strip. A dated campaign with a real end date is a different thing and gets a slot when one exists                                                                                            |

**Why the FAQ is worth building empty.** A concern page that answers «لک چقدر
طول می‌کشد تا کم شود؟» in her own words is the single strongest ranking asset
this site can have — it is a question people type, answered by someone
qualified. Building the structure now means the content has somewhere to land
the day it is written.

---

## F-7 · The whole catalogue has an address: `/shop/all`

**Decision.** The `hub` scope — "no scope" — renders at `/shop/all`, not `/shop`.

**What was wrong.** `/shop` is the hub _screen_: an editorial front door that
asks a customer to choose a concern. The query grammar's `hub` scope has always
meant the unfiltered catalogue, `listProducts` has always handled it, and
`scopePath` mapped it to `/shop` — where the hub screen renders instead. So
there was no page anywhere on the site where a customer could see the filter
rail without first picking an axis.

That is backwards. A rail exists so someone can narrow from everything; making
it appear only _after_ something has already narrowed is the opposite of
browsing. It is also the page every competitor in the research has — Face
Reality's is literally called "All Products".

The hub links to it from the concerns heading, or nobody would find it.

---

## F-8 · The facets were empty because two taxonomies had no rows

**What was actually wrong** when the rail looked deserted: nothing in the
manifest, the queries or the components. `skin_state` and `protocol_phase` had
**zero rows** — neither the reference seed nor the development seed created any,
and no product linked to them. Under the zero-count policy every value was
hidden, correctly, and the groups rendered as nothing.

**Fixed:** five skin states and one `daily-care` protocol with four phases
(cleanse, treat, hydrate, protect) are now reference taxonomy, seeded beside the
concerns where they belong. All ten development products link to both, chosen so
every value has at least one product and no value has all of them — a facet
where everything matches teaches nothing.

**The lesson worth keeping.** A facet with no data and a facet that is broken
look identical from the outside. When a group is missing, check the row count
before the query.

**Arabic is deliberately absent.** `reference-data.test.ts` guards a decision in
the name of its own test — _"seeds only reviewed Persian and English concern
translations"_. Arabic catalogue vocabulary has not been reviewed, so under the
exact-locale rule these facets do not render on `/ar`. Arabic names were briefly
added here and then removed: inventing them is the same mistake as fabricating
any other unreviewed content.

**Needs the maintainer.** Arabic concern, skin-state and phase names, if `/ar`
is meant to be browsable. Until then it lists products without facets.

---

## F-6 · Adding a facet later

One row in F-1, one field or relation that already exists, one migration if it
does not, and the tests that come with it. A facet added without a row here is
drift, and the URL grammar is the place it will show — every accepted parameter
is part of a contract that redirects everything else.

**Re-review trigger for the whole manifest.** The real catalogue lands and turns
out to be shaped differently from the ten-product development seed — in
particular if lines, skin states or protocol phases prove sparsely populated, in
which case a facet that looks good here produces dead ends in practice.
