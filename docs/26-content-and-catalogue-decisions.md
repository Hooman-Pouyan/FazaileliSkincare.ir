# Catalogue truth and the content spine — C-1 … C-17

**Date:** 2026-08-26 · **Packet:** 8
**Trigger:** the PLP's FAQ accordion and editorial band rendered as nothing because no table exists to hold their content, while ninety real Storyderm packshots sat unused beside a deliberately fictional development catalogue.
**Companions:** [`14-storyderm-draft-catalog-pipeline.md`](14-storyderm-draft-catalog-pipeline.md) · [`21-landing-composition-decisions.md`](21-landing-composition-decisions.md) · [`24-facet-manifest.md`](24-facet-manifest.md) · [`25-design-system-adherence.md`](25-design-system-adherence.md)
**Phased plans:** [`system-design/catalogue/storyderm-catalogue.md`](system-design/catalogue/storyderm-catalogue.md) · [`system-design/content/content-spine.md`](system-design/content/content-spine.md)

---

## Why this document exists

Three findings on 2026-08-26, each of which had a good reason at the time and
none of which survives contact with the next packet:

1. **There is no CMS in the database.** Thirty tables across catalogue, cart,
   order, payment, pricing and identity. Not one holds editorial content.
   `questions: []` is a literal in `commerce.reads.ts` because there is nothing
   to read from. `scope-questions.tsx` and the `FAQPage` JSON-LD emitter are
   built and waiting on a data layer that was never designed.
2. **The catalogue is fictional on purpose, and that is now the wrong shape.**
   `dev-data.ts` invents `dev-brand-alef` because `14-storyderm-draft-catalog-pipeline.md`
   P0 says _"prevent temporary assets from silently becoming fake commercial
   truth."_ But Storyderm and Forlle'd are brands the institute actually
   carries. Inventing a brand while ninety real packshots sit in `public/` is
   not caution, it is avoidance.
3. **The media layer was built CDN-ready and left empty.** `product_media`
   already carries `originalObjectKey`, `cardObjectKey` and `detailObjectKey`.
   Nothing writes them. Meanwhile the source PNGs run to 14 MiB each.

The through-line: **the storefront was built to render content that no one had
decided how to store.** Packet 8 decides that, and it decides it once for every
surface, because the Landing needs exactly the same thing.

---

## C-1 · Truth is per field, not per row

**Decision.** A catalogue row may mix verified and unverified fields. The unit
of honesty is the **field**, not the record.

Real, and therefore seeded as real:

- brand and product-line identity — Storyderm, Ultra Lift, Clinic-A, O2 White;
- the product's form and its pack size, where the packshot states it;
- the image itself and its provenance;
- the taxonomy the product belongs to.

Invented, and therefore marked as invented **in the row**:

- price, stock, SKU, barcode, IRC code;
- any clinical claim, indication, ingredient list or usage instruction;
- the sellable variant boundary where the packshot does not settle it.

**Why this replaces the old rule.** `docs/14` P0 protected against a real
danger — a filename becoming a commercial fact. It did so by making the whole
development catalogue fictional, which threw away the part that was true. A
per-field rule keeps the protection and recovers the realism: a PLP rendered
from real Storyderm identities with `DEMO-` prices tests the same things the
production PLP will do, and lies about nothing that a reader can mistake.

**What did not change.** Nothing in this document permits a generated claim, a
guessed SKU, or a filename promoted to a product sheet. `docs/14` P0 stands.

---

## C-2 · Three seed profiles, named in `docs/14` P2 and now implemented

| Profile           | Contains                                                                                                     | Publishable | Runs in production |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | ----------- | ------------------ |
| `reference`       | Locales, concerns, skin states, protocol phases, real brands, real product lines, real categories            | Yes         | Yes                |
| `storyderm-draft` | Real product identities and real media from the curated manifest, `reviewState: draft`, no price, no stock   | No          | **Refused**        |
| `commerce-demo`   | `DEMO-` variants, invented rial prices, invented inventory, and the publication flip that makes them visible | No          | **Refused**        |
| `content-draft`   | Scope questions, editorial bands and galleries, all `reviewState: draft`                                     | No          | **Refused**        |

Each profile is a transaction, is idempotent under a second run, upserts by
canonical key, and queries generated UUIDs rather than hardcoding them. The
existing `NODE_ENV=production` refusal is retained and extended to
`content-draft`.

The fictional `dev-*` catalogue is **retired**, not deleted in place: its
coverage matters. See C-6.

---

## C-3 · `DEMO-` is the marker, and it lives in the data

**Decision.** Every invented commercial value carries a marker a query can see:

- variant SKU begins `DEMO-`;
- `product.reviewState` stays `draft` for every manifest-derived product;
- `product_media.provenance = 'supplier_draft'` and `rights = 'unknown'` until
  the maintainer confirms otherwise.

**Why in the row rather than in a comment.** `L-13` already settled this for
the Instagram batches: _"invented fields are marked in the row, not only in a
comment."_ A comment protects the next reader of the file. A marker in the row
protects the next reader of the **database**, which is the one who ships.

The practical consequence: a single predicate — `sku not like 'DEMO-%'` — tells
anyone, at any point in the project's life, exactly which commercial figures
were never real.

---

## C-4 · Draft products are visible in development and invisible in production

**Decision.** `commerce-demo` sets `isPublished = true` on manifest-derived
products. Production reads remain gated on **both** an approved review state and
`isPublished`, and no search parameter can bypass that predicate.

Three independent things must all fail before a draft row reaches a customer:

1. the seed profile refuses to run against a production environment;
2. the production read requires `reviewState` in (`verified`, `approved`);
3. `product_media` with `rights = 'unknown'` is excluded from production reads.

**Why the flip is acceptable.** The alternative — leaving draft products
unpublished — means the PLP renders nothing, which is the state we are fixing.
The flip is local to a profile that cannot run in production, and it is
belt-and-braces with two predicates that live in the read layer rather than the
seed.

**Needs the maintainer.** Image rights. Every Storyderm packshot is
`supplier_draft` / `unknown`, and `docs/14` permits publication only for
`approved_supplier` or `brand_owned`. Confirm with the supplier, or tell me to
hold the media out of the seed entirely.

---

## C-5 · Persian product names are composed from facts, never invented

**Decision.** A Persian product name is built from three parts, each of which is
observable:

```
<form in Persian> <product name in Latin script> <size in Persian numerals>
کرم Clinic-A ۵۰ میلی‌لیتر
آمپول Princess Shine ۳۰ میلی‌لیتر
ماسک ورقه‌ای O2 White
```

- the **form** — cream, ampoule, essence, mask, peel, patch — translates,
  because it is a fact about the object;
- the **product name** stays in Latin script, because that is how Iranian
  skincare retail actually writes imported brands and because transliterating
  it would invent a Persian spelling nobody uses;
- the **size** uses Persian numerals and the Persian unit.

Every manifest entry records `nameSource` for each part: `packshot`, `filename`,
`product_sheet` or `owner`.

**Why not translate the product name.** «کلینیک-آ» is a spelling decision, and a
spelling decision on a brand's product is the supplier's to make, not mine. The
Latin form is unambiguous, searchable, and matches the packaging the customer
holds.

**Why not leave the name English entirely.** A Persian-first storefront whose
product titles are wholly English fails the primary locale. The form word is the
part a Persian speaker searches for — «کرم», «سرم», «ماسک» — and it is the part
we can supply truthfully.

---

## C-6 · The fictional catalogue is retired, its coverage is kept

**Decision.** `dev-data.ts`'s ten invented products are replaced by the
manifest-derived catalogue. The **states** they were chosen to cover are moved
onto real products and asserted by name in the seed test:

| State that must exist                 | Where it lives now                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| Published, priced, in stock           | The bulk of the manifest                                  |
| Published, priced, out of stock       | Two products, marked in the manifest                      |
| `priceVisibility: on_request`         | The professional-only clinic products                     |
| Professional-only                     | Clinic-A and the 1 kg bulk masks                          |
| Unpublished — must not appear         | Two manifest entries flagged `hold`                       |
| No active variant                     | The unresolved gallery groups                             |
| Multi-variant size ladder             | Every 150 ml / 500 ml and 50 ml / 220 ml pair             |

**Why this is worth stating.** The fictional set existed to make the route
handle every branch. Replacing it with realistic data is a regression if
realistic data happens to be uniform. The manifest is curated to keep every
branch populated — which is the same rule `F-8` learned about facets: _a value
that matches everything teaches nothing._

---

## C-7 · One function owns every media address

**Decision.** `src/lib/media/url.ts` exports the only way to turn a stored
object key into a URL. No component, no read, and no seed builds an image path
by string concatenation.

```ts
mediaUrl(objectKey: string): string
```

It resolves against `NEXT_PUBLIC_MEDIA_ORIGIN`, which defaults to a local origin
in development and points at the CDN in production.

**Why a rule and not a convenience.** This is the same class as R-1, the
locale-prefix defect: every individual `"/images/" + path` is correct, the
system built from them is not, and the day the origin changes there are
seventeen call sites and one of them is missed. One function makes the CDN
switch a single environment variable.

---

## C-8 · The object-key convention

```
catalog/<brand>/<line>/<product-slug>/<role>-<width>.webp
catalog/storyderm/clinic-a/clinic-a-cream/primary-640.webp
catalog/storyderm/clinic-a/clinic-a-cream/primary-1600.webp
```

- keys are lowercase, ASCII, hyphenated, and contain no spaces — the source
  filenames contain spaces, parentheses and Korean characters, none of which
  belong in a URL;
- the **product slug**, not the product UUID, so a key is readable in a bucket
  listing and survives a database restore;
- the width is in the key, so a derivative is immutable and cacheable forever;
- the original keeps its own key with its own extension and is never served to
  a browser.

**Why the slug and not the id.** A UUID in a key means a bucket listing is
unreadable and a mis-mapped image is undiagnosable. The trade is that renaming a
product slug orphans keys — accepted, because C-16 makes re-derivation a script
run, not a migration.

---

## C-9 · Derivatives are generated, and the original is never touched

**Decision.** `scripts/media/derive.ts` reads the manifest, and for every mapped
source file writes `card` (640 px) and `detail` (1600 px) WebP derivatives into
`public/media/` under the C-8 key. It never writes to
`public/images/brands/storyderm/`, and it is idempotent: an existing derivative
with a matching source checksum is skipped.

Checksums, dimensions, MIME type and byte size are computed from the **source**
and stored on the media row, as `docs/14` P0 requires.

**Why 640 and 1600.** The tile renders at 320 CSS px at the widest breakpoint
and the gallery at 800; both double for high-density displays. Two derivatives
cover every current surface. A third is added when a surface needs it, not
speculatively.

---

## C-10 · The CDN is configuration, and this packet does not need it

**Decision.** Derivatives are written to `public/media/` and served by Next in
development. The Arvan or Liara switch is `NEXT_PUBLIC_MEDIA_ORIGIN` plus an
upload of the same directory, preserving keys.

**Explicitly:** the infrastructure account setup is **not a dependency of packet
8** and is deferred at the maintainer's request. Nothing in this packet blocks
on it, and nothing in it will need rewriting when it happens — that is the whole
point of C-7 and C-8.

`public/media/` is gitignored. The source images stay in the repository; the
derived ones are reproducible from a script and do not belong in git history.

---

## C-11 · The content spine is four tables, shared by every surface

**Decision.** One small content model serves the PLP's FAQ, the PLP's editorial
band, the Landing's sections, and whatever the Booking and Academy surfaces need
later.

```
content_block               kind · surface · scopeKind · scopeSlug · sortOrder
                            publication · reviewState · effectiveFrom/Until
content_block_translation   localeCode · heading · body · ctaLabel · ctaHref
content_item                blockId · sortOrder · mediaObjectKey
content_item_translation    localeCode · title · body
```

`content_item` is the repeated child: a question-and-answer pair inside an FAQ
block, a slide inside a gallery, a point inside a list. One shape, because the
alternative is a table per kind and a migration per idea.

**Why not a headless CMS.** Hosting is inside Iran, every foreign host is a
hanging request (`AGENTS.md` hard rule 10), and the maintainer is one person who
already has an admin surface planned. A CMS would be a second source of truth
and a second deployment.

**Why not MDX or JSON in the repository.** Content changes on a different clock
than code. Publishing a campaign or fixing an answer should not be a deploy, and
translation rows need the same locale integrity the catalogue already enforces
through `locale.code`.

---

## C-12 · Content targets a surface, optionally narrows to a scope, and resolves specific-then-generic

**Decision.**

```
surface     "shop.listing" | "shop.hub" | "landing" | "pdp" | …
scopeKind   null | "concern" | "brand" | "category"
scopeSlug   null | the taxonomy slug
```

Resolution for a request: take blocks matching `(surface, scopeKind, scopeSlug)`
exactly; if none, fall back to `(surface, null, null)`. Never merge the two —
a specific set **replaces** the generic set rather than appending to it.

**Why replace and not merge.** A concern page that has its own three questions
should show those three, not those three plus five generic ones. Merging makes
the page's content depend on rows the author of the specific set never saw.
Replacement means the author of `concern/lak` questions controls that page
completely.

**Why not a free-text placement key.** A string like `"shop.concern.lak.faq"`
is unqueryable, untypeable and unjoinable — a typo produces silence, which is
exactly the failure `F-8` recorded. The scope columns are foreign-keyed to the
taxonomy where the slug exists.

---

## C-13 · Publication is a window, not a boolean

**Decision.** `effectiveFrom` and `effectiveUntil` are `timestamptz`. A block is
live when it is published, review-approved, and now falls inside its window.

**Why.** `L-6` refused permanent promotional furniture and allowed _"a dated
campaign with a real end date."_ A boolean cannot express that; it expresses
"someone will remember to turn this off," and nobody does. The window makes the
Nowruz banner disappear on the day it should, with no admin action and no
deploy.

An always-on block sets `effectiveUntil = null` — permitted for editorial and
FAQ, and the schema does not forbid it for a campaign, because the discipline
is L-6's and the enforcement is review, not a constraint.

---

## C-14 · Copy written in Mahdieh's voice is seeded as draft and cannot publish

**Decision.** Every FAQ answer and editorial paragraph in the seed carries
`reviewState: 'draft'` and `authorAttribution: 'unreviewed_draft'`. Development
renders it. Production cannot.

**Why this is not over-caution.** An FAQ answer about how long a pigmentation
mark takes to fade, published under the name of a licensed skincare specialist,
is a clinical statement attributed to a person who did not write it. `D25`
already assigned that authority: _"I draft from brand catalogues, you approve
the claims."_ The draft state is how the draft reaches her without reaching a
customer.

**What this does not block.** The accordions render, the counts are real, the
JSON-LD emits in development, the tests assert against real rows. Everything the
packet is trying to prove is provable.

---

## C-15 · Structured data follows the rendered page, never leads it

**Decision.** `FAQPage` JSON-LD is emitted from the same array the accordion
renders. Zero questions on the page means zero markup — not an empty `FAQPage`,
not markup for questions filtered out by locale or publication.

**Why.** Structured data describing content a crawler cannot see is a
rich-result penalty, and it is the easy mistake to make when markup is generated
from a query and the page is generated from a different one. One array, two
consumers.

This restates `D-18-3`'s SEO contract rather than replacing it.

---

## C-16 · The manifest is the review artefact; the seeder never reads the filesystem for truth

**Decision.** `content/catalogue/storyderm-manifest.json` is checked in, curated
by hand, and is the **only** input to the catalogue seed. The seeder resolves
files by path from the manifest and fails loudly if a listed file is missing. It
never globs a directory, never infers a product from a filename, and never
creates a row for a file the manifest does not mention.

Unmapped files stay in the manifest's `unresolved` array with a reason. They are
visible, counted, and not silently dropped — `AGENTS.md`, _"no silent caps."_

**Why.** `docs/14`'s gate is _"every usable file is mapped, deliberately
excluded, or marked unresolved; no file count is presented as product count."_
A glob cannot satisfy that gate; a manifest is the gate made executable.

---

## C-17 · The `hold` flag exists so a real product can be deliberately absent

**Decision.** A manifest entry may set `"disposition": "hold"` with a reason.
Held entries are seeded as products, remain unpublished, and are asserted absent
from listing results by the integration test.

**Why not just omit them.** An omitted product is indistinguishable from a
forgotten one. A held product is a recorded decision with a reason attached, and
it gives the test suite a row that must never appear — which is the only way to
prove the publication predicate actually works.

---

## Open items for the maintainer

| # | Item | Blocks |
| - | ---- | ------ |
| 1 | **Storyderm image rights.** All ninety packshots are `supplier_draft` / `unknown`. `docs/14` permits publication only at `approved_supplier` or `brand_owned`. Confirm with the supplier, or say to hold them out of the seed | Production media, not this packet |
| 2 | **FAQ answers.** Seeded drafts need her review before they can publish. They are listed in `system-design/content/content-spine.md` §7 | Production FAQ |
| 3 | **Product sheets.** Ingredients, usage, indications, IRC codes and the verified sellable boundary for each Storyderm product | `reviewState: verified` |
| 4 | **Real prices and stock.** Every price in the seed is `DEMO-` | A sellable shop |
| 5 | **Arabic catalogue vocabulary.** Carried forward from `F-8`; the same gap now applies to content translations | `/ar` browsability |
| 6 | **Forlle'd and Thalgo.** This packet covers Storyderm only, because Storyderm is the brand with usable imagery in the repository. The other two need assets before they can be modelled | Their listings |
| 7 | **Object storage account** (Arvan or Liara). Deferred by the maintainer; C-10 makes it configuration | Production media serving |

---

## What this packet deliberately does not do

- **No admin UI.** Content is seeded and read. Authoring it through a screen is
  Phase 5's `/studio`, and building a half-admin now would be the second source
  of truth C-11 exists to avoid.
- **No Forlle'd or Thalgo catalogue.** No usable imagery in the repository.
- **No PDP work.** The manifest gives the PDP everything it needs, but proving
  it is packet 9's job.
- **No search-index change.** Postgres full-text stays as it is.
- **No CDN account.** C-10.
