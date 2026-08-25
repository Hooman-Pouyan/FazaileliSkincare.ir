# Execution ledger

**Date:** 2026-08-25 · **Status:** live — update it as work lands, do not let it drift

This is the only file that answers *what is next and why*. It owns no design
decisions: every row points at the plan that does. Open this first, then open the
plan the row names.

---

## Why this file exists

The project accumulated five numbering schemes for one body of work, each
internally consistent and none of them able to produce an ordered queue:

| Scheme | Lives in | Covers |
|---|---|---|
| Phase 0–5 | [`12-implementation-plan.md`](12-implementation-plan.md) | The macro roadmap: paperwork, foundation, shop, booking, academy, studio |
| DB0–DB8 | [`system-design/database-foundation.md`](system-design/database-foundation.md) | Schema, provisioning, read models, transactional services, operations |
| AUTH0–AUTH6 | [`system-design/authentication-and-account-security.md`](system-design/authentication-and-account-security.md) | Identity contract through production rollout |
| Stage 0–6, with `PLP0–5` / `PDP1–6` / `CART1` | [`system-design/storefront.md`](system-design/storefront.md) and its page plans | Storefront delivery order |
| C1–C8 | [`16-review-storefront-and-database.md`](16-review-storefront-and-database.md) | Review corrections |
| D-18-n | [`18-storefront-direction-decisions.md`](18-storefront-direction-decisions.md) | Design authority, restricted-product behaviour, SEO |

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

| Work | Satisfies | Evidence |
|---|---|---|
| Foundation scaffold, tokens, money, jalali, rail, landing | Phase 1 | `next build` on Next 16.3.2, three locales prerendering |
| 48-table schema, migration `0000`, journal, snapshot, Persian seeds | DB0 | Fresh migration from zero, invariant suite |
| Reproducible local/CI PostgreSQL | DB1 | `compose.yaml`, `scripts/database.sh`, `db:up/reset/verify` |
| Better Auth schema contract | AUTH0 | Migration `0001`, `schema.test.ts` field mappings |
| Phone normalization, rate limiting, Notifier boundary | AUTH1 | 20 files under `src/lib/auth` |
| Customer phone-OTP runtime and screens | AUTH2, DB2 customer half | 68 unit tests, production build, `/[locale]/login` and `/verify` |
| Local-first development seam | — | [`runbooks/local-development.md`](runbooks/local-development.md) |
| Order survives customer deletion; settlement bound to its payment | C1, C2 | Migration `0002`, schema contract suite, and behavioural proof against a real database in [`evidence/c3-trgm-search.md`](evidence/c3-trgm-search.md) |
| Persian search folding, trigram index, offer state, catalogue visibility | C3, C4, DB3 policy | 134 unit tests; `EXPLAIN` evidence recorded |
| Research gates 4, 5, 6 closed by recorded deferral | Stage 0 | [`research/shop-research-gate-deferrals.md`](research/shop-research-gate-deferrals.md) |

---

## The active block

**Goal:** an end-to-end storefront that can be used and judged — browse, search,
open a product, put it in a cart — running entirely on local infrastructure with
no production provider, no verified catalogue, and no money moving.

**Not the goal:** launching. Nothing in this block is customer-ready, and the
research deferrals expire the moment it is shown to a customer.

| # | Packet | Satisfies | Exit gate | Status |
|---|---|---|---|---|
| 1 | This ledger and the status corrections it required | — | The three status sections match reality | **done** |
| 2 | Fictional dev catalogue seed, production-refused | DB3 fixtures | `pnpm db:seed dev` fills brands, concerns, categories, products, variants, prices, stock, media across every offer state; refuses to run under `NODE_ENV=production` | **done** |
| 3 | Catalogue read models, Arabic-form folding, `pg_trgm` GIN | DB3, C3, C4 | `getShopHub`, `listProducts`, `getProduct` enforce exact-locale, publication, active variant, eligible price, approved media and availability; infix search proves index use with `EXPLAIN (ANALYZE, BUFFERS)` | **done** — facet counts deliberately deferred to packet 6, see below |
| 4 | Storefront module foundation and shell — header, footer, mobile navigation, command palette, locale/cart/account controls, minimal `/fa/account` | Stage 1 minimum, Stage 2 shell | Landing renders inside the shared shell at 390/768/1440 with Persian RTL passing; a signed-in customer can see their phone and sign out | |
| 5 | `/fa/shop` product hub | Stage 2, DB4 | Concern-first hub renders from PostgreSQL with JavaScript disabled; route states and metadata present | |
| 6 | PLP and search | Stage 3, `PLP0–5` | Concern, brand, category and `?q=` routes use canonical URL state, server results, live counts, stable pagination, verified empty and error states | |
| 7 | PDP | Stage 4, `PDP1–6` | Offer states are truthful; `on_request`, professional-only, unavailable and variant-required cannot enter the cart | |
| 8 | Cart presentation — drawer and `/fa/cart` | Stage 4, `CART1` | The shared cart model renders in both surfaces; no checkout, payment or settlement code exists | |
| 9 | Transactional cart, reservations, `resolveCartOwner` | DB5, C5 | Concurrent requests cannot oversell; removal works; retries and guest-to-account merge are idempotent; the expiry predicate is observable | |

### Known bound — facet counts

`listProducts` returns an empty `facets` array. PLP-03 requires each group's
counts to be computed with that group's own selections removed, which is a
separate query per group, and it lands with the facet rail in packet 6 that
renders them. Recorded here rather than left to read as a complete result.

### Direction decisions binding this block

[`18-storefront-direction-decisions.md`](18-storefront-direction-decisions.md)
settles three things packets 3–9 depend on: the order of design authority and
where invention is permitted (D-18-1), professional-only products as visible and
non-purchasable (D-18-2), and SEO as a per-route requirement rather than a later
pass (D-18-3). D-18-3 closes the SEO half of the gate-5 deferral; the facet
manifest and sort defaults remain open.

### Restructuring note — Stage 1 runs vertically

`storefront.md` Stage 1 reads as a foundation phase that ends with nothing on
screen. Stage 1 item 7 already permits the alternative: *"implement each
database-backed read only in its owning route slice after that slice's
prerequisites close."* This block takes that route. Packet 4 builds only the
foundation the shell needs; packets 5–8 each carry the module, page-model and
fixture work their own route requires.

The Stage 1 exit conditions are unchanged and still all apply — they are simply
proven incrementally rather than in one gate. No page route imports Drizzle
directly. Zustand stays request-safe and never duplicates server, URL or form
truth. TanStack Query stays uninstalled until a slice names its first
browser-refetched read.

---

## Deliberately out of the block

| Work | Why | Comes back when |
|---|---|---|
| AUTH3 centralized authorization | Nothing in packets 1–8 is protected. Packet 9 needs cart ownership, which `resolveCartOwner` supplies without the full slice. | Any protected write beyond the cart |
| AUTH4 staff password and TOTP | Admin teaches nothing about the customer product right now | Before any admin screen |
| AUTH5 security page, phone change, account closure | Same | After the storefront direction settles |
| AUTH6 production hardening | No production to harden | With DB7 |
| AUTH2 verification checkpoint CP1–CP8 | Parked by the maintainer pending product approval of the OTP screens | [`checkpoints/auth2-test-checkpoint.md`](checkpoints/auth2-test-checkpoint.md), on explicit instruction |
| Step 7 production foundation, DB7 Liara operations | Local and preview infrastructure is enough to judge the product | After the block, with the host decision |
| Checkout, payment, settlement, fulfilment, returns (DB6, ticket 7) | Writes permanent financial records under policy the owner has not settled | After ticket 7's business and legal gates |
| Shop Relay mega-menu | Post-core and separately gated. Designing it before the concern/brand/category axes have been used means building it twice. | Stage 5, after its gate |
| Booking, Academy, Studio (Phases 3–5, DB8) | After the commerce vertical slice | Per the macro roadmap |
| Phase 0 paperwork — eNamad, ZarinPal, licence, legal pages | Owner track, not engineering. It is the real critical path to taking money and no code shortens it. | Runs in parallel, now |

### Stretch, with a hard stop

Checkout **reads** — province/city reference data, address form, a placeholder
shipping table — are pure local work and complete the end-to-end feel. Order
placement is not: it creates immutable financial records under unsettled policy.
The stop is between the two.

---

## Corrections still open

| ID | Correction | Lands in |
|---|---|---|
| C3 | `pg_trgm` GIN on `normalized_search_text` with `EXPLAIN` evidence | **done** — migration `0003`, evidence in [`evidence/c3-trgm-search.md`](evidence/c3-trgm-search.md) |
| C4 | `أإآٱ→ا`, `ة→ه` folding; document the ZWNJ consequence | **done** |
| C5 | `source_cart_item_id` nullable with `SET NULL`, add `source_cart_id` | packet 9 |
| C6 | Status/timestamp checks on `payment` and `shipment` | DB6, out of block |

---

## How to keep this honest

A packet is `done` when its exit gate is met and the evidence exists — not when
the code is written. Move a row's status, add the evidence, and correct any plan
section the work invalidated in the same commit. A ledger that lags the
repository is worse than no ledger, because it is believed.
