# Execution ledger

**Date:** 2026-08-25 · **Status:** live — update it as work lands, do not let it drift

This is the only file that answers _what is next and why_. It owns no design
decisions: every row points at the plan that does. Open this first, then open the
plan the row names.

---

## Why this file exists

The project accumulated five numbering schemes for one body of work, each
internally consistent and none of them able to produce an ordered queue:

| Scheme                                        | Lives in                                                                                                       | Covers                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Phase 0–5                                     | [`12-implementation-plan.md`](12-implementation-plan.md)                                                       | The macro roadmap: paperwork, foundation, shop, booking, academy, studio |
| DB0–DB8                                       | [`system-design/database-foundation.md`](system-design/database-foundation.md)                                 | Schema, provisioning, read models, transactional services, operations    |
| AUTH0–AUTH6                                   | [`system-design/authentication-and-account-security.md`](system-design/authentication-and-account-security.md) | Identity contract through production rollout                             |
| Stage 0–6, with `PLP0–5` / `PDP1–6` / `CART1` | [`system-design/storefront.md`](system-design/storefront.md) and its page plans                                | Storefront delivery order                                                |
| C1–C8                                         | [`16-review-storefront-and-database.md`](16-review-storefront-and-database.md)                                 | Review corrections                                                       |
| D-18-n                                        | [`21-landing-composition-decisions.md`](21-landing-composition-decisions.md)                                   |

settles the first page: which surface owns brand storytelling, testimonials,
academy and booking (L-1), the fixed beat order (L-2), the refusal of parallax,
autoplay and looping rails with the substitutes that replace them (L-3), the
one content-approval rule covering all three batches (L-4), the Forlle'd blossom
vocabulary and the partner-brand colour rule (L-5, L-9), and Landing SEO bounded
to verifiable claims (L-7). One item there is **proposed, not adopted**: the
bounded petal reveal in L-5 waits on the maintainer.

[`18-storefront-direction-decisions.md`](18-storefront-direction-decisions.md) | Design authority, restricted-product behaviour, SEO |

A row below may satisfy parts of several at once. The leading number is a
**position in the queue, not an identifier** — cite the underlying ID (`DB3`,
`Stage 2`, `C4`) in commits and reviews, never the queue position.

---

## Current position

Local development runs end to end: PostgreSQL 16.9 in a container, migrations
`0000`–`0002` applied, reference seed loaded, and customer phone-OTP sign-in
working against a fake SMS provider that prints the code to the dev console.
`pnpm test:unit` is 14 files and 68 tests, green, with no database.

Nothing customer-facing exists beyond the Persian landing page. There is no
shop, no product list, no product page, no cart, and no shell around the
landing route.

### Settled

| Work                                                                     | Satisfies                | Evidence                                                                                                                                             |
| ------------------------------------------------------------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation scaffold, tokens, money, jalali, rail, landing                | Phase 1                  | `next build` on Next 16.3.2, three locales prerendering                                                                                              |
| 48-table schema, migration `0000`, journal, snapshot, Persian seeds      | DB0                      | Fresh migration from zero, invariant suite                                                                                                           |
| Reproducible local/CI PostgreSQL                                         | DB1                      | `compose.yaml`, `scripts/database.sh`, `db:up/reset/verify`                                                                                          |
| Better Auth schema contract                                              | AUTH0                    | Migration `0001`, `schema.test.ts` field mappings                                                                                                    |
| Phone normalization, rate limiting, Notifier boundary                    | AUTH1                    | 20 files under `src/lib/auth`                                                                                                                        |
| Customer phone-OTP runtime and screens                                   | AUTH2, DB2 customer half | 68 unit tests, production build, `/[locale]/login` and `/verify`                                                                                     |
| Local-first development seam                                             | —                        | [`runbooks/local-development.md`](runbooks/local-development.md)                                                                                     |
| Order survives customer deletion; settlement bound to its payment        | C1, C2                   | Migration `0002`, schema contract suite, and behavioural proof against a real database in [`evidence/c3-trgm-search.md`](evidence/c3-trgm-search.md) |
| Persian search folding, trigram index, offer state, catalogue visibility | C3, C4, DB3 policy       | 134 unit tests; `EXPLAIN` evidence recorded                                                                                                          |
| Research gates 4, 5, 6 closed by recorded deferral                       | Stage 0                  | [`research/shop-research-gate-deferrals.md`](research/shop-research-gate-deferrals.md)                                                               |

---

## The active block

**Goal:** an end-to-end storefront that can be used and judged — browse, search,
open a product, put it in a cart — running entirely on local infrastructure with
no production provider, no verified catalogue, and no money moving.

**Not the goal:** launching. Nothing in this block is customer-ready, and the
research deferrals expire the moment it is shown to a customer.

| #   | Packet                                                                                                                                                                                                                                      | Satisfies                                                             | Exit gate                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Status                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | This ledger and the status corrections it required                                                                                                                                                                                          | —                                                                     | The three status sections match reality                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | **done**                                                                                                 |
| 2   | Fictional dev catalogue seed, production-refused                                                                                                                                                                                            | DB3 fixtures                                                          | `pnpm db:seed dev` fills brands, concerns, categories, products, variants, prices, stock, media across every offer state; refuses to run under `NODE_ENV=production`                                                                                                                                                                                                                                                                                                                                            | **done**                                                                                                 |
| 3   | Catalogue read models, Arabic-form folding, `pg_trgm` GIN                                                                                                                                                                                   | DB3, C3, C4                                                           | `getShopHub`, `listProducts`, `getProduct` enforce exact-locale, publication, active variant, eligible price, approved media and availability; infix search proves index use with `EXPLAIN (ANALYZE, BUFFERS)`                                                                                                                                                                                                                                                                                                  | **done** — facet counts deliberately deferred to packet 7, see below                                     |
| 4   | Storefront module foundation and shell — header, footer, mobile navigation, command palette, locale/cart/account controls, minimal `/fa/account`                                                                                            | Stage 1 minimum, Stage 2 shell                                        | Landing renders inside the shared shell at 390/768/1440 with Persian RTL passing; a signed-in customer can see their phone and sign out                                                                                                                                                                                                                                                                                                                                                                         | **built — awaiting the maintainer's browser pass**                                                       |
| 5   | `/fa/shop` product hub                                                                                                                                                                                                                      | Stage 2, DB4                                                          | Concern-first hub renders from PostgreSQL with JavaScript disabled; route states and metadata present                                                                                                                                                                                                                                                                                                                                                                                                           | **built — awaiting a request against a real database, review item 5.8**                                  |
| 6   | Landing composition — the five IA beats, the growth spine and ornament set, and the three source-content batches seeded as marked drafts. Plan: [`system-design/storefront/landing.md`](system-design/storefront/landing.md)                | Stage 2, `LAND-01`–`LAND-11`, `CONTENT-01`–`CONTENT-04`, `L-1`–`L-15` | `/fa` renders the five beats in order at 390/768/1440 with Persian RTL passing and JavaScript disabled; every beat whose content is unapproved is **absent**, not empty-framed; motion is reveal-once on the existing duration and easing, and `prefers-reduced-motion` is verified; `Organization`+`LocalBusiness`+`WebSite` JSON-LD emits, with no `AggregateRating`; every batch is seeded idempotently, refuses under production, and no real testimonial is publishable                                    |                                                                                                          |
| 7   | PLP and search                                                                                                                                                                                                                              | Stage 3, `PLP0–5`                                                     | Concern, brand, category and `?q=` routes use canonical URL state, server results, live counts, stable pagination, verified empty and error states                                                                                                                                                                                                                                                                                                                                                              |                                                                                                          |
| 7B  | **Catalogue truth and the content spine.** Plans: [`system-design/catalogue/storyderm-catalogue.md`](system-design/catalogue/storyderm-catalogue.md) and [`system-design/content/content-spine.md`](system-design/content/content-spine.md) | `CAT0–CAT5`, `CONTENT0–CONTENT5`, `C-1`–`C-17`, `docs/14` P0–P2       | `/fa/shop/all` lists the real Storyderm catalogue from real imagery served through derivatives, with an editorial band below the breadcrumb and an FAQ accordion below the results, both read from PostgreSQL; the manifest reconciles to ninety source files; every invented commercial figure carries a `DEMO-` marker in the row; held, unpublished and professional-only rows are provably absent; `FAQPage` markup matches the rendered questions exactly; both seeds are idempotent and refuse production | **built — awaiting `pnpm db:reset && pnpm db:seed demo && pnpm test:integration`, and the first CI run** |
| 8   | PDP                                                                                                                                                                                                                                         | Stage 4, `PDP1–6`                                                     | Offer states are truthful; `on_request`, professional-only, unavailable and variant-required cannot enter the cart                                                                                                                                                                                                                                                                                                                                                                                              |                                                                                                          |
| 9   | Cart presentation — drawer and `/fa/cart`                                                                                                                                                                                                   | Stage 4, `CART1`                                                      | The shared cart model renders in both surfaces; no checkout, payment or settlement code exists                                                                                                                                                                                                                                                                                                                                                                                                                  |                                                                                                          |
| 10  | Transactional cart, reservations, `resolveCartOwner`                                                                                                                                                                                        | DB5, C5                                                               | Concurrent requests cannot oversell; removal works; retries and guest-to-account merge are idempotent; the expiry predicate is observable                                                                                                                                                                                                                                                                                                                                                                       |                                                                                                          |

### Known bounds — packet 4

The command palette lists the room destinations and a search field. The five
canonical concerns decision N-4 names are absent for now because they live in the
database, and reading them in the shell would put a query on every page including
the landing; they arrive with a cached reference read. There is no client-side
filtering or autocomplete — `SHELL-03` puts results on the Search PLP and
requires a plan amendment before a live transport exists, and four rooms is not
a list that needs searching.

### Known bound — the Landing is content-starved, deliberately

Packet 6 builds the Landing's composition, not its content. All three source
batches in `content/` are unpublished drafts — 42 testimonials with
`publicationConsent = unknown`, 13 brands with unknown image rights, 10 academy
offerings with unconfirmed prices and no dates.
[`21-landing-composition-decisions.md`](21-landing-composition-decisions.md) L-4
makes that one rule instead of three, and requires every dependent beat to
degrade to _absent_. The page will therefore ship correct and thin. It gets
thicker when the maintainer's three review passes land, in the order L-4 names:
academy prices, testimonial consent, brand relationships. Those passes are the
critical path for the Landing and they are not engineering work.

Packet 6 does not wait on them. L-13 completes each batch into full development
fixtures — real records unpublished, missing fields filled with clearly marked
fiction — so every flow is walkable now and the real values overwrite the
invented ones through the same idempotent importer when they arrive. Real
testimonials are the one exception: they are imported and never rendered, and the
preview rail runs on a separate fictional set.

### Closed bound — facet counts

`listProducts` returned an empty `facets` array through packets 3–6. Packet 7
closed it: each group is counted with its own selections removed, one query per
group, and the scope's own axis is not offered as a facet. The behaviour is
asserted by integration tests rather than by inspection.

### Why 7B was inserted ahead of the Landing

Packet 6 is the Landing and was next. It is deferred one packet by the
maintainer's instruction on 2026-08-26, and the reason is structural rather
than a change of mind.

The Landing's own plan says its reads come from PostgreSQL, always
(`CONTENT-01`), and that unapproved content must be **absent** rather than
empty-framed (`L-4`). Neither is achievable: there is no content table in the
schema. The PLP hit the same wall first — `F-5` built an FAQ block and a
`FAQPage` emitter against `questions: []`, a literal in `commerce.reads.ts`
because nothing exists to read.

Building the content store on the PLP is the cheaper place to get it right: one
surface, two block kinds, and an integration suite already pointed at it. The
Landing then consumes the same four tables instead of growing a second store
beside them. `LANDING0` is therefore superseded by `CONTENT0`–`CONTENT3` and
should be re-scoped to Landing-specific blocks when packet 6 resumes.

The catalogue half rides along for the same reason: the content seed references
media by object key, and the object-key convention has to exist before either
half can be seeded. See [`26-content-and-catalogue-decisions.md`](26-content-and-catalogue-decisions.md).

**Explicitly not blocking:** the Arvan or Liara object-storage account. `C-10`
makes the CDN an environment variable, so the infrastructure work can happen on
its own day without any of this being rewritten.

---

### Direction decisions binding this block

[`18-storefront-direction-decisions.md`](18-storefront-direction-decisions.md)
settles three things packets 3–10 depend on: the order of design authority and
where invention is permitted (D-18-1), professional-only products as visible and
non-purchasable (D-18-2), and SEO as a per-route requirement rather than a later
pass (D-18-3). D-18-3 closes the SEO half of the gate-5 deferral; the facet
manifest and sort defaults remain open.

### Restructuring note — Stage 1 runs vertically

`storefront.md` Stage 1 reads as a foundation phase that ends with nothing on
screen. Stage 1 item 7 already permits the alternative: _"implement each
database-backed read only in its owning route slice after that slice's
prerequisites close."_ This block takes that route. Packet 4 builds only the
foundation the shell needs; packets 5–9 each carry the module, page-model and
fixture work their own route requires.

The Stage 1 exit conditions are unchanged and still all apply — they are simply
proven incrementally rather than in one gate. No page route imports Drizzle
directly. Zustand stays request-safe and never duplicates server, URL or form
truth. TanStack Query stays uninstalled until a slice names its first
browser-refetched read.

---

## Deliberately out of the block

| Work                                                               | Why                                                                                                                            | Comes back when                                                                                         |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| AUTH3 centralized authorization                                    | Nothing in packets 1–9 is protected. Packet 10 needs cart ownership, which `resolveCartOwner` supplies without the full slice. | Any protected write beyond the cart                                                                     |
| AUTH4 staff password and TOTP                                      | Admin teaches nothing about the customer product right now                                                                     | Before any admin screen                                                                                 |
| AUTH5 security page, phone change, account closure                 | Same                                                                                                                           | After the storefront direction settles                                                                  |
| AUTH6 production hardening                                         | No production to harden                                                                                                        | With DB7                                                                                                |
| AUTH2 verification checkpoint CP1–CP8                              | Parked by the maintainer pending product approval of the OTP screens                                                           | [`checkpoints/auth2-test-checkpoint.md`](checkpoints/auth2-test-checkpoint.md), on explicit instruction |
| Step 7 production foundation, DB7 Liara operations                 | Local and preview infrastructure is enough to judge the product                                                                | After the block, with the host decision                                                                 |
| Checkout, payment, settlement, fulfilment, returns (DB6, ticket 7) | Writes permanent financial records under policy the owner has not settled                                                      | After ticket 7's business and legal gates                                                               |
| Shop Relay mega-menu                                               | Post-core and separately gated. Designing it before the concern/brand/category axes have been used means building it twice.    | Stage 5, after its gate                                                                                 |
| Booking, Academy, Studio (Phases 3–5, DB8)                         | After the commerce vertical slice                                                                                              | Per the macro roadmap                                                                                   |
| Phase 0 paperwork — eNamad, ZarinPal, licence, legal pages         | Owner track, not engineering. It is the real critical path to taking money and no code shortens it.                            | Runs in parallel, now                                                                                   |

### Stretch, with a hard stop

Checkout **reads** — province/city reference data, address form, a placeholder
shipping table — are pure local work and complete the end-to-end feel. Order
placement is not: it creates immutable financial records under unsettled policy.
The stop is between the two.

---

## Everything still waiting on someone

<!-- BEGIN:open-items -->

Generated by `pnpm docs:open-items` from [`20-packet-review-log.md`](20-packet-review-log.md). Do not edit by hand — edit the entry in the review log and re-run.

### Waiting on the maintainer

Nothing below is a defect. Each is a decision, a fact or a permission only you can supply, and each blocks something.

| Where                                                          | #     | What                                                                                   | Kind               |
| -------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------- | ------------------ |
| Packet 4 — the storefront shell                                | 4.2   | The footer omits the address and telephone                                             | content            |
| Packet 4 — the storefront shell                                | 4.3   | Terms, privacy and returns are linked but unwritten                                    | content / legal    |
| Packet 4 — the storefront shell                                | 4.11  | The shell has had no browser pass                                                      | verification       |
| Packet 5 — the Shop hub                                        | 5.3   | `enquiryHref` is `https://wa.me/` with no number                                       | content            |
| Packet 5 — the Shop hub                                        | 5.8   | `/fa/shop` has not been rendered against a real database in this session               | verification       |
| Design-system adherence and the facet manifest — 2026-08-26    | D.4   | The `Divider` is in use                                                                | UI                 |
| Design-system adherence and the facet manifest — 2026-08-26    | D.7   | Six requested filters were not built, each for a stated reason                         | product            |
| Design-system adherence and the facet manifest — 2026-08-26    | D.8   | The FAQ block ships as structure with no content                                       | content / SEO      |
| Design-system adherence and the facet manifest — 2026-08-26    | D.14  | Arabic catalogue vocabulary is unreviewed, so `/ar` lists products with no facets      | content            |
| Packet 7 — PLP and search                                      | 7.11  | No listing has been rendered against a real database in this session                   | verification       |
| Shop hub and PLP refinement backlog — 2026-08-26               | R.9   | The SSR document appears to contain no catalogue, FAQ or SEO markup                    | SEO / verification |
| Packet 7B — catalogue truth and the content spine — 2026-08-26 | 7B.3  | Fifty products from ninety files, grouped by hand                                      | product            |
| Packet 7B — catalogue truth and the content spine — 2026-08-26 | 7B.4  | Persian product names are composed, not translated                                     | product            |
| Packet 7B — catalogue truth and the content spine — 2026-08-26 | 7B.6  | Two products are deliberately held back                                                | product            |
| Packet 7B — catalogue truth and the content spine — 2026-08-26 | 7B.7  | Concern, skin-state and phase placement is the one inference in the manifest           | product            |
| Packet 7B — catalogue truth and the content spine — 2026-08-26 | 7B.8  | Every FAQ answer is written by me, in her voice, and cannot publish                    | content            |
| Packet 7B — catalogue truth and the content spine — 2026-08-26 | 7B.9  | Image rights are still `unknown` on all ninety packshots                               | legal              |
| Packet 7B — catalogue truth and the content spine — 2026-08-26 | 7B.15 | Proven against a real database, and it found three defects                             | verification       |
| Packet 7B — catalogue truth and the content spine — 2026-08-26 | 7B.18 | Retired files are stuck inside `.git/_agent-quarantine/`                               | process            |
| Packet 7B — catalogue truth and the content spine — 2026-08-26 | 7B.21 | The `brand` facet offers one value that matches every result                           | product            |
| Packet 7B — catalogue truth and the content spine — 2026-08-26 | 7B.16 | Uncommitted work appeared in `src/app` and `src/components/layout` during this session | process            |
| Hub blocks and the motion stack — 2026-08-26                   | C.1   | B1, B3 and B10 are built                                                               | UI                 |
| Hub blocks and the motion stack — 2026-08-26                   | C.7   | Nine bands is a judgement, not a measurement                                           | UI                 |
| Shop hero and asset pass — 2026-08-26                          | A.1   | The hero is now a shop hero, not a second landing hero                                 | UI                 |
| Shop hero and asset pass — 2026-08-26                          | A.2   | The Forlle'd hero photograph is marked `Permission not verified`                       | legal              |
| Hub composition and voice pass — 2026-08-25                    | M.1   | The Persian copy was rewritten to sound like a person                                  | content / voice    |
| Hub composition and voice pass — 2026-08-25                    | M.4   | The hero takes a video and has none                                                    | content            |
| Hub composition and voice pass — 2026-08-25                    | M.6   | Concern panels are flat sand with a hover wash                                         | UI / content       |
| Hub composition and voice pass — 2026-08-25                    | M.9   | The hub was still not rendered against a real database                                 | verification       |
| Locale routing pass — 2026-08-25                               | R.2   | Persian now has no URL prefix                                                          | SEO / product      |
| Landing direction pass — 2026-08-25, ahead of packet 6         | L.1   | Academy prices are unconfirmed                                                         | content            |
| Landing direction pass — 2026-08-25, ahead of packet 6         | L.2   | No testimonial may be published                                                        | content / consent  |
| Landing direction pass — 2026-08-25, ahead of packet 6         | L.3   | Brand relationships and image rights are unresolved                                    | content / legal    |
| Landing direction pass — 2026-08-25, ahead of packet 6         | L.4   | Beat 2 needs two numbers                                                               | content            |
| Landing direction pass — 2026-08-25, ahead of packet 6         | L.5   | The blossom petal reveal is proposed, not adopted                                      | UI / motion        |
| Landing direction pass — 2026-08-25, ahead of packet 6         | L.7   | `LocalBusiness` JSON-LD needs the same three facts as the footer                       | SEO / content      |
| Landing direction pass — 2026-08-25, ahead of packet 6         | L.15  | Brand logos need one line each recording where the right comes from                    | legal              |
| Landing direction pass — 2026-08-25, ahead of packet 6         | L.16  | Before/after carries a second gate beyond consent                                      | legal              |

### Open — decided when it next matters

| Where                                                          | #     | What                                                                                                                                  | Kind            |
| -------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Packet 2 — fictional development catalogue                     | 2.1   | Ten products across five concerns is enough to exercise every offer state but not enough to judge a grid, a facet rail, or pagination | product         |
| Packet 3 — catalogue reads                                     | 3.1   | Sort default is `featured`                                                                                                            | product         |
| Packet 3 — catalogue reads                                     | 3.2   | Price bounds cross the URL in toman, storage is rials                                                                                 | product         |
| Packet 3 — catalogue reads                                     | 3.5   | Media resolution uses `cardObjectKey`/`detailObjectKey` verbatim                                                                      | technical       |
| Packet 3 — catalogue reads                                     | 3.6   | Professional-only products are visible and non-purchasable (D-18-2)                                                                   | product / legal |
| Packet 4 — the storefront shell                                | 4.1   | The bottom bar carries four items and excludes Booking and Academy                                                                    | product         |
| Packet 4 — the storefront shell                                | 4.4   | The eNamad slot is an empty bordered square                                                                                           | UI              |
| Packet 4 — the storefront shell                                | 4.8   | Bodoni Moda ships as variable TrueType, not woff2                                                                                     | performance     |
| Packet 4 — the storefront shell                                | 4.14  | Two spellings for the same token are in use                                                                                           | drift           |
| Packet 5 — the Shop hub                                        | 5.2   | The hub's metadata copy now comes from the read, and the route caches the read                                                        | technical       |
| Packet 5 — the Shop hub                                        | 5.6   | Country names come from `Intl.DisplayNames`, not the catalogue                                                                        | i18n            |
| Packet 5 — the Shop hub                                        | 5.7   | The featured rail is `merchandisingRank` with no editorial control                                                                    | product         |
| Design-system adherence and the facet manifest — 2026-08-26    | D.6   | `line` renders only when the results are one brand                                                                                    | product         |
| Design-system adherence and the facet manifest — 2026-08-26    | D.9   | Promotional banners below the breadcrumb were refused as furniture and allowed as campaigns                                           | product         |
| Design-system adherence and the facet manifest — 2026-08-26    | D.11  | The design system's `FacetRail` collapses its groups and puts a search box inside any facet over ~10 values                           | UI              |
| Packet 7 — PLP and search                                      | 7.2   | The scope's own axis is not offered as a facet                                                                                        | product         |
| Packet 7 — PLP and search                                      | 7.7   | `invalid-query` renders not-found rather than dropping the bad parameter                                                              | product         |
| Packet 7 — PLP and search                                      | 7.8   | The facet rail sits below the results on mobile, not behind a drawer                                                                  | UI              |
| Packet 7 — PLP and search                                      | 7.10  | `getShopHub` and `listProducts` now run several queries each                                                                          | performance     |
| Shop hub and PLP refinement backlog — 2026-08-26               | R.1   | Infinite scroll instead of pagination                                                                                                 | product         |
| Shop hub and PLP refinement backlog — 2026-08-26               | R.2   | Filter changes lose the scroll position                                                                                               | UX / a11y       |
| Shop hub and PLP refinement backlog — 2026-08-26               | R.3   | Density — tighter, closer to Ant Design                                                                                               | design          |
| Shop hub and PLP refinement backlog — 2026-08-26               | R.4   | The product tile is plain and its packshot is cropped                                                                                 | UI              |
| Shop hub and PLP refinement backlog — 2026-08-26               | R.4a  | Three.js product spin                                                                                                                 | UI / perf       |
| Shop hub and PLP refinement backlog — 2026-08-26               | R.5   | The hub still runs on four hardcoded editorial image paths                                                                            | content         |
| Shop hub and PLP refinement backlog — 2026-08-26               | R.6   | The price filter's Apply button                                                                                                       | product         |
| Shop hub and PLP refinement backlog — 2026-08-26               | R.7   | The filter rail should be sticky                                                                                                      | UI              |
| Shop hub and PLP refinement backlog — 2026-08-26               | R.8   | The top of the PLP is a stack, not a composition                                                                                      | UI / design     |
| Shop hub and PLP refinement backlog — 2026-08-26               | R.10  | The integration suite leaves the development database damaged                                                                         | technical       |
| Packet 7B — catalogue truth and the content spine — 2026-08-26 | 7B.5  | Three files are unresolved and stay that way                                                                                          | product         |
| Packet 7B — catalogue truth and the content spine — 2026-08-26 | 7B.11 | Offline asset and data tooling is Python                                                                                              | structure       |
| Hub blocks and the motion stack — 2026-08-26                   | C.3   | anime.js is bounded to choreography                                                                                                   | technical       |
| Hub blocks and the motion stack — 2026-08-26                   | C.4   | `getShopHub` now runs three extra queries                                                                                             | performance     |
| Hub blocks and the motion stack — 2026-08-26                   | C.6   | The mosaic photography shows other brands' products                                                                                   | UI / content    |
| Shop hero and asset pass — 2026-08-26                          | A.4   | Six cleared Japanese photographs are sitting unused                                                                                   | UI              |
| Shop hero and asset pass — 2026-08-26                          | A.5   | `public/images` is 173MB                                                                                                              | technical       |
| Hub composition and voice pass — 2026-08-25                    | M.2   | No carousel library                                                                                                                   | technical       |
| Hub composition and voice pass — 2026-08-25                    | M.3   | GSAP, anime.js, AOS, Swiper and Three.js were all refused, with the trigger that would change each                                    | technical       |
| Hub composition and voice pass — 2026-08-25                    | M.5   | The authenticity band renders only when the catalogue has something                                                                   | product         |
| Hub composition and voice pass — 2026-08-25                    | M.7   | The blossom ornament shipped early                                                                                                    | UI              |
| Hub composition and voice pass — 2026-08-25                    | M.8   | `ScrollRail` hides its scrollbar                                                                                                      | UI              |
| Locale routing pass — 2026-08-25                               | R.4   | `x-default` is not emitted                                                                                                            | SEO             |
| Locale routing pass — 2026-08-25                               | R.5   | `/en` and `/ar` were not fetched in a browser during this pass                                                                        | verification    |
| Landing direction pass — 2026-08-25, ahead of packet 6         | L.6   | Parallax, autoplay carousels and looping testimonial rails were asked for and refused                                                 | UI / motion     |
| Landing direction pass — 2026-08-25, ahead of packet 6         | L.8   | The content review surface is deliberately not an admin                                                                               | process         |
| Landing direction pass — 2026-08-25, ahead of packet 6         | L.12  | The Japanese concepts are carried by a growth spine, not a values row                                                                 | UI              |
| Landing direction pass — 2026-08-25, ahead of packet 6         | L.14  | Source batches are completed with fictional development values                                                                        | data            |

**Totals:** 38 waiting on the maintainer, 47 open.

<!-- END:open-items -->

---

## Corrections still open

| ID  | Correction                                                           | Lands in                                                                                            |
| --- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| C3  | `pg_trgm` GIN on `normalized_search_text` with `EXPLAIN` evidence    | **done** — migration `0003`, evidence in [`evidence/c3-trgm-search.md`](evidence/c3-trgm-search.md) |
| C4  | `أإآٱ→ا`, `ة→ه` folding; document the ZWNJ consequence               | **done**                                                                                            |
| C5  | `source_cart_item_id` nullable with `SET NULL`, add `source_cart_id` | packet 9                                                                                            |
| C6  | Status/timestamp checks on `payment` and `shipment`                  | DB6, out of block                                                                                   |

---

## Closing a packet

A packet is not finished when its code lands. It closes when its row here reads
`done` **and** its section in [`20-packet-review-log.md`](20-packet-review-log.md)
records what deserves a second look: calls made on thin evidence, deliberate
omissions with their reasons, product questions the building surfaced, and the
content or legal items only the owner can supply. Those accumulate deliberately,
so a refinement pass over any packet starts from a written list rather than from
memory.

## How to keep this honest

A packet is `done` when its exit gate is met and the evidence exists — not when
the code is written. Move a row's status, add the evidence, and correct any plan
section the work invalidated in the same commit. A ledger that lags the
repository is worse than no ledger, because it is believed.
