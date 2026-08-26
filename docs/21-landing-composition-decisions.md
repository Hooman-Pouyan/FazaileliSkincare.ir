# Landing composition decisions — L-1 … L-15

**Date:** 2026-08-25 · **Closes:** the composition questions raised for the first page
**Pattern:** interim decisions with re-review triggers, as used in `19-navigation-decisions.md`

---

## Why these are decided here

The maintainer described what the first page should hold: brand and personal
storytelling, shop sections, academy and workshop layouts, banners, testimonials,
booking entry points, blossom motifs, and motion on scroll. Most of that is
already specified — `04-information-architecture.md` §0 defines the Landing beat
by beat, and `10-design-playbook.md` Step 5 already forbids three of the named
techniques by name. Two of the ideas are genuinely new, one is blocked by consent,
and several were aimed at the wrong surface.

Rather than build to a description that conflicts with the authority order in
`18-storefront-direction-decisions.md` D-18-1, the reconciliation is recorded
here first. Nothing below invents a new surface; L-1 mostly redirects work to
the surface that already owns it.

---

## L-1 · The described page is the Landing, not the Shop hub

**Decision.** Brand story, Ms Fazaieli's history, proof and testimonials, the
academy beat and the booking beat compose **`/[locale]`**. `/[locale]/shop`
stays concern-first product discovery and gains no academy, booking or
biography section.

**Why.** `04-information-architecture.md` §0 defines the Landing as _"a
scroll-composed introduction to Mahdieh Fazaieli, not a homepage with a product
grid"_ with a fixed beat order — portrait → the claim → three doors → proof →
one closing invitation. §1 defines Shop as concern first, brand second, type
third. `09-brand-brief.md` closes with the constraint that decides it: _"Neither
should ever feel like they wandered into the other's shop."_ A `/shop` that
opens with biography and workshop cards flattens the rail-and-rooms IA that
`SHELL-00` exists to protect, and it pushes the concern tiles — the one thing a
woman arriving from Instagram with melasma needs in ten seconds — below the fold.

**What each surface gets:**

| Idea as described                                        | Surface that owns it                                                                |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Brand storytelling, Ms Fazaieli's history and background | Landing beat 2, long form on `/about`                                               |
| Testimonials / feedback rail                             | Landing beat 4 (proof), gated by L-4                                                |
| Before-and-after, student work                           | Landing beat 4, long form on `/results`                                             |
| Booking section                                          | Landing beat 3 as one door + one line; the flow is `/book`                          |
| Academy, courses, workshops, webinars grids              | `/academy` hub. Landing gets **one** beat: the next dated Mashhad workshop          |
| Banners                                                  | Landing beat 5 (closing invitation) only — see L-6                                  |
| Carousels, grids, card sections _for shop_               | `/shop` hub: concern tiles, brand row, curated routines, merchandised product rails |
| Blossom motif                                            | Both, as a section ornament — see L-5                                               |

**Gap carried.** `/about`, `/results` and `/academy` do not exist yet. Until they
do, the Landing's beats terminate at the rooms that do exist and the deeper links
are absent rather than dead.

---

## L-2 · The Landing beat order is fixed and is the IA's, not a section menu

**Decision.** Five beats, in this order, with no beat added without an amendment
to this document:

1. **Portrait, held for a beat** — full-bleed, no overlaid card, no scroll cue animation.
2. **The claim** — years of practice, students trained, official representative of Forlle'd Japan, certified instructor of the Technical & Vocational Organization. Set as editorial type over the institute's own photography, not as a counter row.
3. **Three doors** — Shop, Booking, Academy as three tall photographic panels with one line each, carrying their room accents (`--teal`, `--firouzeh`, `--gold`). Not three boxes with icons.
4. **Proof** — before/after, student work, testimonials. Subject to L-4.
5. **One closing invitation** — a single primary action, and the footer.

**Why fixed.** The order is `04-information-architecture.md` §0 verbatim, and
`10-design-playbook.md` records that the landing section order was the one
structural output adopted from the `ui-ux-pro-max` search. It has already been
through review once; re-deriving it per screen is how a page becomes a scroll of
unrelated modules.

**Gap carried.** Beat 2 needs two numbers — years in practice and students
trained — that no document in this repo states. They are claims about her
business and cannot be invented. Until supplied, beat 2 renders the two
verifiable credentials only.

**Re-review trigger.** A sixth beat is proposed, or `/about` and `/results` ship
and pull beat 4 thinner.

---

## L-3 · Motion stays inside the existing budget; parallax and looping rails are refused

**Decision.** The Landing uses exactly the motion the token layer already
defines: one duration (`--duration: 480ms`), one easing
(`--easing: cubic-bezier(0.22, 1, 0.36, 1)`), fades and 8–16px rises on scroll
entry, each element revealing **once**. `prefers-reduced-motion` collapses
`--duration` to 1ms, already wired in `tokens.css`.

**Refused, with substitutes:**

| Asked for                                           | Why refused                                                                                                                                                                                                                                   | What is built instead                                                                                                                                                                                            |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parallax transition sections                        | `10-design-playbook.md` Step 5: _"No parallax, no bounce, no autoplay carousels, no countdown timers."_ Differential-scroll transforms also fight the CLS budget the same file sets at < 0.1                                                  | **Sticky band pinning** — `position: sticky` on a lapis or teal band while the content beside it scrolls past, then release. Reads as depth, moves nothing at a second speed, costs no scroll-linked layout work |
| Infinite fade-in / fade-out moving rails            | Same clause. `content/testimonials/README.md` adds: _"Do not put multiple continuously moving quote rails behind the page: the comments are meaningful content, not decorative texture"_                                                      | **A manually controlled RTL rail** — CSS scroll-snap, arrows and swipe, entry fade only. Reader-paced                                                                                                            |
| Autoplay carousels anywhere                         | Same clause                                                                                                                                                                                                                                   | Scroll-snap rails, and grids where the content is not sequential                                                                                                                                                 |
| Falling blossom leaves as a continuous ambient loop | A permanently animating layer is unbounded battery and main-thread cost on the mobile-first Iranian audience `09-brand-brief.md` describes, and it is the Instagram-template register the same document says the site takes its cue away from | See L-5                                                                                                                                                                                                          |

**Scroll-spy.** Accepted in its passive form only: a section observer that drives
the reveal-once transitions and, on desktop, marks position in the rail. Not a
sticky section nav, and never a scroll hijack.

**Why hold this line.** `AGENTS.md` requires one mechanism per concern. Reveal-on-
entry with one duration and one easing is that mechanism. A page that also has
parallax, also has loops, and also has a bespoke petal system has four, and every
future screen then has to decide which one it belongs to.

---

## L-4 · Unapproved source content cannot render, and every beat that depends on it degrades to absent

**Decision.** The three content batches in `content/` are unpublished draft
candidates and may not reach a public surface in their current state. Each needs
the same four steps before it renders:

1. A table of the shape its own README prescribes — a `testimonial` table, not a
   generic `feedback` table — with a publication state and an idempotent unique
   key (`sourceChecksum` for testimonials, `candidateKey` for academy,
   `slugCandidate` for brands).
2. An importer that inserts every record as an **unpublished draft**.
3. An owner review that resolves the specific unknowns each README lists.
4. A publication step that flips only reviewed records.

**What is actually blocked today:**

| Batch                   | Records                     | What the README requires before publication                                                                                                                                                                         |
| ----------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content/testimonials/` | 42 (14 + 28)                | `publicationConsent` is `unknown` on every record. _"none may render publicly in that state"_ · _"never publish directly from this JSON file"_                                                                      |
| `content/brands/`       | 13                          | Relationship type, country, canonical spelling and approved display names per brand. `imageRightsStatus` is `unknown` — **no logo may be published**. Official-representative status is confirmed for Forlle'd only |
| `content/academy/`      | 10 (2 courses, 8 workshops) | Price interpretation (۱۸م / ۳۹م / ۶م تومان) is `needs_owner_confirmation`; certificate issuers unconfirmed; dates, capacity, venue and instructors absent                                                           |

**Why this is stated once, here.** Three separate READMEs each say the same thing
about their own batch, and the Landing is the first surface that would touch all
three at once. Treating it as one rule stops it being re-litigated per component.
For the testimonials specifically it is not a process nicety: these are named
women's words about their own skin, and publishing them unasked is not
recoverable by editing a file afterwards.

**Consequence to accept now.** On the day the Landing is built, beat 4's
testimonial rail has **zero** items and the academy beat has **zero** dated
workshops. Both must degrade to _absent_ — not to an empty frame, not to
placeholder quotes, not to "coming soon". The components are still worth
building; they are what makes collecting consent and confirming prices worth
doing. But the page has to be correct with them missing, and that is a design
requirement on the composition, not an edge case for later.

**Needs the maintainer — and this is now the critical path.** Three review
passes, in decreasing order of what they unblock:

1. **Academy prices and certificates** — unblocks the academy beat and the whole
   `/academy` room.
2. **Testimonial consent** — unblocks beat 4's strongest content.
3. **Brand relationships and image rights** — unblocks the Shop hub's brand row
   with real names rather than seeded fiction.

A staff admin is deliberately out of this block (AUTH4), so the review surface
should be the cheapest thing that works: a generated review sheet per batch that
records the answers back into the JSON, with the importer refusing anything still
marked unknown. Building an admin to unblock this would invert the sequence.

---

## L-5 · The blossom is adopted in form, held in colour, and held again in motion

**Status:** form **adopted**; palette treatment **decided**; the motion allowance
is ⚠️ **proposed and not implemented until the maintainer says yes**, per the
`AGENTS.md` rule that an addition to the design language is broadcast, then
documented, then built.

**The evidence.** `designs/references/forlled/forlled-workshop-invitation-1402-11-15.png`
is Forlle'd's own co-branded invitation to a joint workshop with the institute,
dated ۱۴۰۲/۱۱/۱۵. The motif is therefore not decoration chosen from a library —
it is the visual language the brand relationship already uses, which is the same
test the palette had to pass. It matters commercially too:
`09-brand-brief.md` records counterfeit anxiety as the category's biggest
objection, and a motif that reads as genuinely Forlle'd is an authenticity
signal, not an ornament.

**What the reference actually shows** (full observation table in that folder's
README): a branch drawn as four or five **parallel hairlines forming a contour**
rather than a filled silhouette; concentric blossoms with a pale outer disc and a
dark centre; scattered ochre secondary dots; a repeated thin diagonal `/` used as
rhythm; a red 日本製 hanko stamp; and roughly **85% empty white**. One motif, one
stamp, one column of text, no frame, no gradient, no shadow.

**The finding.** The reference corroborates `10-design-playbook.md` instead of
challenging it. Hairlines, negative space and a single ornament are already the
house language. The thing to import is the **restraint**, and the trap is to
import the motif without it.

**Adopted — the form.**

- **Inline SVG contour line art**, parallel hairlines, no fill, no gradient, no
  shadow, no frame. The stroke weight is the hairline the design system already
  uses for rules.
- `aria-hidden` always; it never carries meaning and never crowds text.
- Uses: (a) a band-boundary ornament where a section changes ground, (b) a single
  branch at the beat-2 margin, (c) the empty state of the Academy beat, (d) the
  Forlle'd brand page and Forlle'd-sponsored academy items.
- The **diagonal slash** is adopted as a section-rhythm mark on the same terms.

**Decided — the colour, and the rule it establishes.** The reference's pink is
not imported. `09-brand-brief.md` rejects a generic pink-and-lavender beauty
palette, and importing Forlle'd's pink as _our_ accent would do exactly what that
rejection exists to prevent. On our surfaces the branch is `--champagne` or
`--gold` with the blossom centre in `--gold-light`, and it appears **only on the
lapis and teal bands** — `tokens.css` line 6 states gold, firouzeh, champagne and
sand fail contrast on `--ground`, so a blossom on cool white would be either
invisible or a rule violation.

> **The general rule this sets:** _our palette governs our surfaces; a partner
> brand's own marks are quoted, not restyled._ Where Forlle'd's own artwork is
> reproduced as itself — a brand page, a co-branded workshop card — it keeps its
> own colours, inside a bounded region, credited. It never becomes a site accent.
> This applies to Storyderm and Thalgo identically. Note that no brand logo may
> be published at all until `imageRightsStatus` stops being `unknown` (L-4).

**The 日本製 stamp is a product decision, not a decorative one.** An authenticity
mark on Forlle'd items answers the objection the brand brief names as the
category's biggest. It should be a real, earned signal tied to the confirmed
official-representative status — not a graphic applied to every tile. Where it
appears and what it asserts is a separate decision that belongs with the PDP
authenticity work (`اصالت` is already a named PDP accordion section in
`10-design-playbook.md`), and it is recorded here only so the idea is not lost.

**Proposed — the motion allowance.** At most six petals, revealing **once** on
scroll entry using the existing `--duration` and `--easing`, ending at a fixed
resting position. No loop, no `requestAnimationFrame`, no canvas, nothing that
runs after the reveal completes. Reduced-motion renders the resting state
directly.

**Refused even with the ornament adopted.** A canvas or WebGL petal layer,
continuous falling petals, cursor-reactive petals, page-background petal texture,
and any use of the Forlle'd wordmark outside a credited brand context.

**Gap carried.** No blossom asset exists in `public/`, `design-system/` or
`designs/`. Tracing the reference is not permitted. The branch has to be drawn
fresh — either from a photograph of the office branch or as original SVG — and
that is design work, not implementation work.

---

## L-6 · "Banner" means the closing invitation, and no promotional furniture

**Decision.** The Landing carries at most one full-bleed banner: beat 5's closing
invitation. It carries no promotional strip, no discount ribbon, no seasonal
campaign bar, and no countdown.

**Why.** `09-brand-brief.md`: _"No permanent discount furniture — no countdown
timers, no `-۳۰٪` on every tile, no «فروش ویژه» as a nav item. On medical-grade
product, visible permanent discounting tells patients the price was never real,
and by extension that the recommendation isn't either."_

**Re-review trigger.** A real, dated campaign with a real end date. A campaign is
a page, not permanent furniture on the Landing.

---

## L-7 · Landing SEO is the brand-entity contract

**Decision.** Under D-18-3, `/[locale]` is a scope page: self-canonical per
locale, `hreflang` across fa/en/ar, and it carries the site's
`Organization` + `LocalBusiness` (`HealthAndBeautyBusiness`) JSON-LD with
`WebSite` + `SearchAction`. `Person` for Mahdieh Fazaieli is emitted only with
the credentials that are verifiable — the Technical & Vocational Organization
instructorship and the Forlle'd representation.

**Bounded to truth.** No `AggregateRating`, no `Review` markup, and no `Offer`
on the Landing. `AggregateRating` in particular cannot be emitted from
testimonials that are not published, and emitting it from unpublished or
unconsented records would be both a structured-data violation and the same
consent failure as L-4.

**Needs the maintainer.** `LocalBusiness` requires a real street address,
telephone and opening hours — the same three facts review item 4.2 is already
waiting on for the footer.

---

## L-8 · The Shop hub keeps its own merchandising vocabulary

**Decision.** The "carousels, grids and card sections for shops" belong to
`/[locale]/shop` and compose from `getShopHub` only: concern tiles first, brand
row second, curated routines third, and merchandised product rails beneath.

**Constraints inherited, not restated per component.** `09-brand-brief.md`:
_"No card grid. A product tile is a borderless image with type beneath it."_ and
_"No shadows."_ Any rail is scroll-snap and reader-paced under L-3. Any product
appearing in any rail passes `isPubliclyVisible` and renders its true offer state
under D-18-2 — a professional-only product may appear and may not acquire a
purchase control.

---

## L-9 · Japanese vocabulary is admitted where the business has earned it, and refused as costume

**Decision.** The Japanese register enters through **Forlle'd**, which the
institute exclusively represents, and through the practice's own method — not
through generic japonisme.

**Admitted, because it is ours to use:**

- The blossom branch and the diagonal slash, on L-5's terms.
- The 日本製 authenticity mark, on Forlle'd surfaces only, tied to confirmed
  representative status.
- **間 (ma)** — negative space as a compositional element. This is already the
  house rule under a different name: `09-brand-brief.md` asks for whitespace,
  hairlines and tone shifts, and the Forlle'd reference is 85% empty. It changes
  nothing; it explains why the existing rule is right.
- **改善 (kaizen)** — admitted as _method_, in the Academy's own voice: a
  curriculum built in ordered steps, protocols that are revised rather than
  replaced, a practitioner who improves continuously. It belongs in copy on
  `/academy` and `/about`. It is **not** a UI pattern, a section label, or a word
  to print in Latin on a page.

**Refused:** torii gates, red-sun discs, kanji used decoratively or as a heading
ornament, faux-brushstroke typography, "zen garden" textures, wave patterns, and
any Japanese word set as decoration rather than said because it means something.
These are costume. They would also undercut the exact claim the register is there
to support — the Forlle'd relationship is real, and dressing it up makes it read
as theme rather than fact.

**The test for anything not on either list.** Can it be traced to Forlle'd's own
material, to the institute's room, or to how she actually teaches? If not, it
does not go on the site.

**Re-review trigger.** A second Japanese brand relationship, or Forlle'd
supplying an official brand-guidelines document.

---

## L-11 · The blossom assets are drawn in-repo, not sourced

**Decision.** The ornament set is authored originally for this repository as
inline SVG — three branch segments, a bud, an open blossom, a petal, the slash.
Nothing is traced from `designs/references/forlled/`, and nothing is downloaded
from a third-party sakura set.

**Why not source them.** Two reasons, and the second is the one that decides it.

Licence origin is not a formality here. Most freely available sakura SVG sets are
CC-BY (attribution in the page, which we would not want) or non-commercial (which
this storefront is not). Shipping an asset we do not have the right to ship, on a
site whose central pitch is that its Japanese products are genuine, is a bad
trade at any price — and `09-brand-brief.md` records counterfeit anxiety as the
category's biggest objection.

The Forlle'd invitation is Forlle'd's artwork. Tracing it would be the same
mistake with a shorter path.

**Why drawing them is cheap.** They are contour hairlines. There is no
photography, no shading and no gradient to reproduce — the reference's whole
technique is parallel strokes. Six small pieces, token-bound, a few KB inline,
no request, no licence, and they match the palette by construction rather than by
recolouring someone else's file.

**Re-review trigger.** Forlle'd supplies official brand assets with a written
usage right, in which case they are quoted as theirs under L-5's partner-brand
rule rather than replacing ours.

---

## L-12 · The Japanese register is carried by a growth spine, and 3D stays off the storefront path

**Decision — the spine.** Authenticity, freshness, youth, health and 改善 are
carried by **one branch that grows down the page**, changing state at each of the
five beats, with every stage adjacent to a claim that is independently true.
`landing.md` `LAND-05` holds the state table.

**Why a spine rather than a section.** The obvious way to express those concepts
is a row of four cards with icons and adjectives, and that is exactly the generic
beauty-marketing artefact `09-brand-brief.md` says the site exists to escape. A
concept stated in isolation is a claim about feeling; a concept placed beside the
exclusive Forlle'd representation, the 日本製 mark, an ordered curriculum or a
consented result is a claim about fact. One motif doing structural work across
five beats is also cheaper, more coherent, and impossible to sprinkle.

**Refused explicitly:** a values row, an icon-and-adjective grid, and any Japanese
word set as decoration rather than said because it means something (L-9).

**Decision — 3D.** WebGL and Three.js stay off the storefront critical path.

**Why.** Three.js is roughly 600KB before any asset, against the mobile-first
Iranian audience `09-brand-brief.md` describes, on a page whose job is to be
understood in ten seconds. It is also a second motion mechanism, which
`AGENTS.md` forbids without a reason the existing one cannot serve — and
reveal-once SVG serves this one.

**Where it could live.** A dedicated brand-story route, lazy-loaded behind an
interaction, with the SVG spine as the no-WebGL fallback and reduced-motion
rendering a still. That is a Phase 5 conversation, not a packet 6 one.

**A note on authoring.** Blazor is a .NET UI framework and has no place in a
Next.js application; if the intent was Blender for authoring the assets, that
works — model there, export glTF, and the constraint above still applies to how
it is delivered.

---

## L-13 · Source batches are seeded as marked drafts; real testimonials never render

**Decision.** All three batches are completed into full development fixtures and
loaded through the seed path — never imported at runtime. Details are in
`landing.md` `CONTENT-01`–`CONTENT-04`; the reasoning is here.

**Why seed rather than import.** Reading `content/*.json` in a route would put a
second read mechanism beside PostgreSQL, duplicate the publication predicate that
already exists in SQL, and break the contract every one of those READMEs states.
Seeding runs the real code path, which is the entire point of having fixtures.

**Why complete them fictionally.** The batches are transcriptions from Instagram
highlights: they have titles and prices but no cohort dates, capacity, venue or
instructors, and no testimonial authorship. A flow cannot be walked against a
half-record. Completing them unblocks the walk-through now and costs nothing
later, because the importer is idempotent on a stable key and the real values
overwrite the invented ones when they arrive.

**The risk, and the guard.** A plausible invention silently becoming believed is
the failure mode. So every completed field is marked **in the row**, not in a
comment — the fiction has to be visible to someone reading the database, not only
to someone reading the seeder.

**The exception that matters.** Real testimonials are imported with their real
text and stay unpublished forever until consent exists (L-4). Development
previews render a **separate fictional set**, so the rail can be judged full
without a real quote leaving draft state. The importer has no branch that
publishes a real record, and a test asserts that rather than trusting it.

**Re-review trigger.** The first real approved content lands, at which point the
fictional completion for that batch is deleted rather than left to rot beside it.

---

## L-14 · Brand logos render only against a recorded right

**Decision.** Logo files live in `content/brands/logos/` with a per-brand note
saying where the right to publish comes from. `imageRightsStatus` stays `unknown`
until the note exists, and unknown means the mark does not render — the brand
appears as its approved display name instead.

**Why a note per brand.** Thirteen marks were transcribed from one screenshot.
Official-representative status is confirmed for **Forlle'd only**; the other
twelve are `works_with` candidates whose commercial relationship is still draft.
Exclusive representation plausibly carries the right to display Forlle'd's mark.
It carries nothing about the other twelve, and "we stock it" is not by itself a
licence.

**What the note needs.** One line: the source of the right (representation
agreement, distributor permission, brand press kit with published terms), and the
date it was confirmed. Not a legal opinion — a record of who said yes.

---

## L-15 · Before/after ships as structure now, and its content gate is legal as well as ethical

**Decision.** The comparison component is built in packet 6 against placeholder
imagery. It accepts no real image until two separate gates close.

**Gate one — consent.** Per person, for this use, in a form that can be shown
later. `09-brand-brief.md` already conditions showing her work on consent.

**Gate two — advertising rules.** Before/after imagery in a medical-adjacent
category makes an implied claim about results. Iranian advertising regulation
and eNamad certification both bear on that, and this repository has no research
on either. It sits beside terms, privacy and returns as a content-and-legal item
with a long lead, not an engineering one.

**Interaction, decided now so it is not decided twice.** A labelled pair, or a
draggable divider the reader controls. No automatic wipe and no autoplay — under
L-3, and because an animation that reveals a result on its own schedule is doing
persuasion the reader did not ask for.

**Why build it before the content exists.** The same reason as the testimonial
rail: the structure is what makes collecting consent worth the effort, and
placeholder imagery proves layout while explicitly proving nothing about art
direction.

---

## L-10 · Where the ideas landed

Recorded so the maintainer's list can be checked off rather than re-read.

| Asked for                                        | Outcome                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Shop carousels, grids, card sections             | **Yes**, on `/shop` — L-8. Borderless tiles, scroll-snap rails, no shadows         |
| Academy / courses / workshops / webinars layouts | **Yes**, on `/academy`. Landing gets one beat — L-1, L-2                           |
| Banners                                          | **One**, the closing invitation — L-6                                              |
| Testimonials with a polished modern look         | **Component yes, content blocked** — L-4                                           |
| Infinite fade in/out moving rails                | **No.** Reader-paced RTL scroll-snap rail instead — L-3                            |
| Booking sections                                 | **Yes**, as one door plus one line — L-1, L-2                                      |
| Parallax transition sections                     | **No.** Sticky band pinning instead — L-3                                          |
| Forlle'd Japanese blossom tree elements          | **Yes, in form** — L-5. Palette held, motion proposed                              |
| Falling blossom leaves                           | **No as a loop.** A bounded six-petal reveal-once is proposed — L-5                |
| Scroll-spy animation                             | **Yes**, passive reveal-once only. No sticky section nav, no scroll hijack — L-3   |
| Brand and Ms Fazaieli storytelling               | **Yes**, Landing beat 2, long form on `/about` — L-2. Two facts still needed       |
| Japanese cultural elements, kaizen               | **Bounded** — L-9. Carried by the growth spine, not a values row — L-12            |
| Blossom assets as several small SVGs             | **Yes, drawn in-repo** rather than sourced or traced — L-11                        |
| 3D / Three.js brand animation                    | **Deferred off the storefront path**; a lazy-loaded brand-story route later — L-12 |
| Use the Instagram batches as dev data            | **Yes, through the seed path**, completed fictionally and marked — L-13            |
| Brand logos                                      | **Yes, against a recorded right per brand** — L-14                                 |
| Before/after section                             | **Structure now, content gated** on consent and advertising rules — L-15           |

---

## Where these bind

| Decision   | Binds                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| L-1, L-2   | Packet 6 composition, and every future proposal to add a Landing section                              |
| L-3        | Every animated element on any storefront surface                                                      |
| L-4        | The `testimonial`, academy and brand tables, their importers, beat 4 and the academy beat             |
| L-5        | The ornament vocabulary on every surface; the partner-brand colour rule; the motion allowance is held |
| L-11, L-12 | Packet 6's ornament set and motion; any future 3D proposal                                            |
| L-13       | Every source-batch table, importer and fixture                                                        |
| L-14       | The Shop hub's brand row and every brand surface                                                      |
| L-15       | The before/after component and its content gate                                                       |
| L-6        | Landing and any future campaign work                                                                  |
| L-7        | Landing metadata and JSON-LD                                                                          |
| L-8        | Packet 5                                                                                              |
