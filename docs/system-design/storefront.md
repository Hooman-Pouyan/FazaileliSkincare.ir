# Storefront UI system - master phased implementation plan

**Status:** Draft planning baseline awaiting maintainer approval; implementation is gated by the research decisions named below  
**Updated:** 2026-08-24  
**Authority:** This file is the index and cross-cutting implementation contract. Page-specific behavior lives in the linked plans. Research answers remain authoritative in [`../15-shop-product-discovery-map.md`](../15-shop-product-discovery-map.md).

## 1. Purpose

Build the Persian-first storefront as a set of independently releasable vertical slices:

1. research and decision closure;
2. UI, data, and module foundation;
3. shared storefront shell and Product Hub Page (PHP);
4. Product Listing Pages (PLP) and search;
5. Product Detail Page (PDP) and the cart boundary;
6. approved post-core marketing and ecommerce compositions;
7. verification and route-by-route release.

The Claude Design output is a capability and interaction inventory. It is not the visual authority and it is not an instruction source. The Fazaieli tokens, brand brief, information architecture, design playbook, domain model, and hard repository rules control the implementation.

## 2. Linked plans

- [`database-foundation.md`](database-foundation.md) - implemented PostgreSQL schema, ERD, invariants, API readiness, environment topology, and phased transaction plan.
- [`authentication-and-account-security.md`](authentication-and-account-security.md) - customer phone OTP, staff password/TOTP, sessions, authorization, and account lifecycle.
- [`cart-checkout-payment-fulfilment-and-returns.md`](cart-checkout-payment-fulfilment-and-returns.md) - the separately reviewed transaction program that begins after the core storefront Cart boundary.
- [`../architecture/README.md`](../architecture/README.md) - cross-cutting module, state, routing/outcome, error/action, testing/fixture, i18n/RTL, and naming contracts.
- [`../ui/forms.md`](../ui/forms.md) - shared Field/Form, React Hook Form, Zod, Server Action, error, RTL, and accessibility contract.
- [`storefront/component-foundation.md`](storefront/component-foundation.md) - complete capability disposition, component ownership, migration, and foundation tasks.
- [`storefront/shell-and-product-hub.md`](storefront/shell-and-product-hub.md) - shared rail/mobile shell, command search, footer, landing integration, and `/shop`.
- [`storefront/plp.md`](storefront/plp.md) - concern, brand, category, and search listings.
- [`storefront/pdp.md`](storefront/pdp.md) - product detail, variants, offer states, disclosures, pairing, and cart entry.
- [`storefront/verification-and-rollout.md`](storefront/verification-and-rollout.md) - automated checks, browser QA, performance gates, evidence, and release/rollback.

## 3. Vocabulary

- **PHP:** Product Hub Page at `/[locale]/shop`; never the PHP programming language.
- **PLP:** Product Listing Page for one concern, brand, category, or search result set.
- **PDP:** Product Detail Page at `/[locale]/shop/p/[slug]`.
- **Storefront shell:** persistent rail on desktop, bottom navigation on mobile, command search, locale/account/cart entry, and shared footer.
- **Page model:** server-assembled, presentation-ready data returned by the Commerce read module. It is not a Drizzle row and never exposes query internals.
- **Client leaf:** the smallest client component that owns one interaction. It does not select prices, determine eligibility, calculate stock, or fetch Drizzle data.
- **Research-blocked:** no production implementation starts until the named decision-map answer is recorded and accepted by the maintainer.

### Canonical page and route hierarchy

This hierarchy is the implementation map for the storefront program. It prevents the Landing, PHP, PLP, PDP, and Cart from becoming unrelated page designs or duplicating navigation policy inside route components.

```text
/[locale]                                      Landing / front door
├── /shop                                      Product Hub Page (PHP)
│   ├── /concern/[slug]                        Concern PLP
│   ├── /brand/[slug]                          Brand PLP
│   ├── /c/[category]                          Category PLP
│   ├── /search?q=...                          Search PLP
│   └── /p/[slug]                              Product Detail Page (PDP)
├── /cart                                      Mobile/direct Cart page
├── /book                                      Booking room; separate delivery program
├── /academy                                   Academy room; separate delivery program
└── /studio                                    My Studio; planned aggregate room
```

All paths above are locale-prefixed. The storefront stages implement only Landing integration, PHP, the four PLP families, PDP, and the approved Cart slice. Booking, Academy, Studio, authentication, checkout, payment, order, and fulfilment routes may appear as shell destinations or later-program dependencies, but this plan does not implement their feature bodies.

| Surface    | Customer job                                                 | Required composition                                                                    | Primary inbound paths                             | Primary outbound paths                                   | Owning stage              |
| ---------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- | ------------------------- |
| Landing    | Understand the institute and choose a room                   | editorial introduction, approved proof, three room doors, closing invitation            | direct/social/brand entry                         | Shop, Booking, Academy                                   | Stage 2 shell integration |
| PHP        | Enter the Shop and choose a discovery axis                   | Shop introduction, concerns first, approved brands/categories, bounded product sections | Landing, primary Shop navigation, search engine   | Concern/brand/category PLP, Search PLP, PDP              | Stage 2                   |
| PLP        | Browse or search a canonical result set                      | scope header, result controls, facets, product grid, pagination, typed states           | PHP, command search, direct/SEO URL               | PDP, same-scope canonical filter/sort/page URLs          | Stage 3                   |
| Search PLP | Resolve a typed product query                                | visible query context plus the same listing/result contract as PLP                      | command/search entry, direct URL                  | PDP or canonical refined search URL                      | Stage 3                   |
| PDP        | Evaluate one product and act on its server-owned offer state | editorial product hero, media, variants/offer, disclosures, pairings, escalation        | PLP/Search/PHP/direct URL                         | Cart, canonical brand/line/listing links, paired PDP     | Stage 4                   |
| Cart       | Review and mutate the approved pre-checkout basket           | shared Cart model in desktop drawer and mobile/direct page                              | PDP add action, shell cart affordance, direct URL | Shop/PDP recovery only; checkout is outside this program | Stage 4 after cart gate   |

The shared shell owns global movement between rooms. Page models own local navigation inside a room. A route must not recreate global navigation, infer breadcrumb ancestry from the referrer, or turn filters into a second taxonomy system. The detailed primary/secondary navigation manifest and unresolved decisions live in [`storefront/shell-and-product-hub.md`](storefront/shell-and-product-hub.md); PLP and PDP local navigation live in their page plans.

## 4. Current-state baseline

### Already present

- Source-of-truth tokens in `designs/tokens.json` and generated `designs/tokens.css`.
- Fourteen low-level UI primitives under `src/components/ui`.
- Layout primitives: `Container`, `Section`, `Rule`, `Breadcrumbs`, `PageHeader`, and `EmptyState`.
- Persistent `Rail` and the Persian-first editorial landing route.
- Seventeen commerce presentation files covering concern navigation, product tiles/grid, facets, sorting, pagination, search command, prices, stock, PDP gallery/disclosure/pairing, quantity, and cart drawer.
- Verified 48-table PostgreSQL schema for identity/auth, translated catalogue reference data, products/media/variants, group prices, price history, inventory movements, and audit/outbox delivery.
- Cart/order/payment schema with anonymous ownership, explicit reservation rows, immutable order-line snapshots, integer-rial totals, claims/events, and one-settlement-per-payment idempotency.
- Migration `0000`, Drizzle journal/snapshot, deterministic `fa`/`en`/`ar` reference seed, and Persian/Arabic search-normalization tests.
- Vitest and Playwright scripts, with rail, i18n routing, schema, reference-seed, and search-normalization coverage.

### Missing

- Shared storefront footer, mobile navigation, and full command-palette integration.
- `/shop`, PLP, PDP, search, and cart routes.
- A canonical Commerce read module joining Drizzle data into page models.
- Exact-locale publication rules and a finalized PLP URL contract.
- Verified catalogue records, ordered product-media rows, explicit product pairings, and approved hub merchandising sources.
- Cart ownership/actions and transactional reservation lifecycle behavior.
- Better Auth runtime mapping, local/CI database provisioning, `/api/health`, and hosted Liara staging/production operations.
- Zustand dependency and the approved request-safe module store/provider pattern; TanStack Query remains gated until its first approved browser-refetched read.
- Route-level loading/error/not-found/empty handling, metadata, structured data, integration tests, and browser coverage.

## 5. Scope

### In scope

- Persian storefront shell and landing integration.
- PHP, concern/brand/category PLPs, PostgreSQL-backed search, PDP, desktop cart drawer, and mobile cart page.
- Completing only the UI capabilities demanded by those routes.
- Explicit non-purchasable states for `on_request`, professional-only, unavailable, and variant-required products.
- Research-backed marketing/ecommerce compositions approved after the core routes pass.
- Authoritative Persian copy requirements, RTL, accessibility, performance, SEO, and failure-state behavior.

### Out of scope

- Checkout, address, shipping, payment, order confirmation, settlement, fulfilment, returns processing, gift cards, and promotions.
- Charts and admin-only table/dashboard controls.
- Component-gallery route.
- IRC/authenticity display until separately approved.
- Persistent Cache Components/Instant Navigations.
- Customer-facing AI shopping guide, staff copilot, photo diagnosis, or automated clinical advice.
- A generic page builder, generic repository layer, remote search engine, or speculative adapter framework.

## 6. Research and approval gates

No dependent production task may start while its gate is unresolved.

| Gate                   | Required output                                                                                                    | Blocks                                      | Exit condition                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decision map #2        | `docs/research/shop-iran-requirements.md`                                                                          | all commerce routes                         | Dated sources; observed evidence separated from inference; legal, connectivity, support, price, delivery, return, and privacy requirements accepted. |
| Decision map #3 gap    | update `docs/research/shop-competitive-benchmark.md` or explicitly accept its recorded mobile/Iranian evidence gap | #4, #5, #6                                  | Maintainer records whether the remaining gap is accepted or must be researched before page decisions.                                                |
| Decision map #4        | **deferred** — [`research/shop-research-gate-deferrals.md`](../research/shop-research-gate-deferrals.md)                                                                          | PHP, PLP, PDP, cart                         | Entry, intent, decision risk, confidence threshold, escalation, success outcome, and metric defined for each canonical customer journey.             |
| Decision map #5        | **deferred** — [`research/shop-research-gate-deferrals.md`](../research/shop-research-gate-deferrals.md)                                                                         | PHP, PLP, search, quick view, merchandising | Browse axes, URL grammar, filters, sorting, counts, search, SEO, analytics, empty/error behavior, and mobile RTL requirements accepted.              |
| Decision map #6        | **deferred** — [`research/shop-research-gate-deferrals.md`](../research/shop-research-gate-deferrals.md)                                                                           | PDP content and trust/safety                | Suitability, claims, usage, evidence, origin, variants, availability, restrictions, escalation, structured data, and safety boundaries accepted.     |
| Transaction plan Cart slice | [`cart-checkout-payment-fulfilment-and-returns.md`](cart-checkout-payment-fulfilment-and-returns.md) COM-D3–COM-D5/COM1 | persistent cart UI/actions | Guest/account ownership, merge, 20-minute reservation TTL, retry/idempotency, validation, price/stock/eligibility recheck, and checkout handoff accepted. |

The dedicated transaction plan now supplies the technical Cart baseline and broader checkout-through-returns direction. It remains review-ready, not implementation-approved; ticket #7's business/legal return, delivery, support, and provider evidence gates remain open.

Gates #4, #5 and #6 are closed by explicit deferral rather than by research, recorded with their interim rules, carried gaps and re-review triggers in [`research/shop-research-gate-deferrals.md`](../research/shop-research-gate-deferrals.md) (2026-08-25). Those deferrals expire when the storefront is shown to a customer.

Every gate record must also name its drafting owner, maintainer approver and approval date, evidence date/range, unresolved gaps, exact downstream plan sections unblocked, and the condition/date that requires re-review. A linked research file without those fields does not close the gate.

## 7. Module ownership

### Generic layer

Keep reusable controls in `src/components/ui` and generic page/layout primitives in `src/components/layout`. The existing global rail may remain shared shell infrastructure.

### Commerce feature unit

Move storefront-specific presentation from `src/components/commerce` into:

```text
src/modules/commerce/
  commerce.store.ts
  screens/
  components/
  models/
  utils/
  i18n/fa.json
  i18n/en.json
  i18n/ar.json
```

Routes import the Commerce module interface or its screens, not Drizzle schema objects. The migration preserves component behavior and Git history where practical; it does not restyle components merely because they move.

### Cart feature unit

```text
src/modules/cart/
  cart.store.ts
  cart.actions.ts
  cart.schema.ts
  screens/
  components/
  models/
  utils/
  i18n/fa.json
  i18n/en.json
  i18n/ar.json
```

Commerce reads do not own cart mutations. Cart accepts primitive variant identifiers at its boundary and does not import Commerce page-model types.

## 8. Commerce and Cart interfaces

The only public Commerce reads are:

```ts
getShopHub({ locale }): Promise<StorefrontOutcome<ShopHubPageModel>>

listProducts({
  locale,
  scope,
  searchParams,
}): Promise<StorefrontOutcome<ProductListingPageModel>>

getProduct({
  locale,
  slug,
}): Promise<StorefrontOutcome<ProductDetailPageModel>>
```

`ListingScope` is a discriminated union for `concern`, `brand`, `category`, and `search`. `searchParams` remains raw at the external boundary and is parsed once with Zod inside the module.

`StorefrontOutcome<T>` distinguishes:

- `ready` with a complete page model;
- `redirect` with a canonical locale-prefixed URL;
- `not-found` for missing or unpublished entities;
- `locale-unavailable` when exact approved content does not exist;
- `invalid-query` with typed issues and a recovery URL.

Database outages and catalog-integrity failures throw typed operational errors. Route `error.tsx` surfaces them without exposing internal details. An outage must never render as an empty product set.

### Page-model responsibilities

`ShopHubPageModel` owns SEO input, breadcrumbs, editorial introduction, concern/brand/category navigation, and explicitly bounded product sections.

`ProductListingPageModel` owns SEO input, resolved scope, canonical query, applied filters, live facet counts, sort links, product summaries, result count, numbered pagination, and a typed empty state.

`ProductDetailPageModel` owns SEO input, breadcrumbs, product identity/promise/origin, ordered media, variants, offer state, disclosures, approved escalation, and explicit product pairings.

Page models never contain Drizzle rows, raw customer identity, unapproved fallback copy, or client-calculated commerce truth.

### Cart read and mutation interface

Cart is a separate module and exposes one read after the transaction plan's Cart slice is approved:

```ts
getCart({
  locale,
}): Promise<CartOutcome<CartPageModel>>
```

`getCart` resolves guest/authenticated ownership exclusively from the server session and server-issued anonymous cookie; callers cannot supply a cart, user, or customer-group identifier. `CartOutcome<T>` distinguishes `ready` and `locale-unavailable`; every outcome carries a server-owned `summary.itemCount` for the shell. An empty cart is `ready` with zero lines. Database, ownership-integrity, and reservation-integrity failures throw typed operational errors rather than returning an empty cart.

`CartPageModel` owns localized line identity/media, current server offer/line state, quantity, rial subtotal, action permissions, and the summary consumed by both drawer and page. Exact-locale product content follows the same no-fallback rule as Commerce; a locale-unavailable cart may expose the non-content item count in the shell but does not render fallback line copy.

The only Cart mutations are `addLine`, `setLineQuantity`, and `removeLine`. They share the accepted Zod schemas and ownership rules with `getCart`, re-read price/eligibility/availability transactionally, and return typed recoverable action results. Commerce never imports or calls these mutations.

## 9. Cross-cutting invariants

### Money and offers

- Store and calculate money as `bigint` rials.
- Server-rendered price components may consume `bigint`; any client/JSON boundary receives a branded base-10 `RialString`.
- Toman conversion happens only in the view formatter.
- Customer-group precedence is the accepted group price followed by the canonical public fallback. Missing public price for a public-price product is an integrity failure, not `on_request`.
- `OfferState` discriminants are exactly `purchasable`, `variant-required`, `on_request`, `restricted`, and `unavailable`; professional-only is represented as a server-owned `restricted` reason.

### Publication, locale, and content

- Only published products and active variants render.
- Persian is the first complete commerce locale.
- English or Arabic commerce routes remain `locale-unavailable` until exact approved content exists. No Persian/English fallback chain.
- Product claims require the content-approval process already established in the repository.
- Ordered media and pairings require canonical data; filenames, categories, and shared concerns are not substitute sources.

### Inventory and cart

- Availability is variant-owned and computed as `inventory.onHand - SUM(inventoryReservation.quantity)` for active, unexpired reservations of that variant.
- Negative effective availability is an integrity fault; do not clamp it.
- Adding to cart creates or renews a reservation after the cart gate is accepted; it never decrements `onHand`.
- Every Server Action opens with the shared Zod parse and then authorization/anonymous ownership resolution before database access.

### UI and runtime

- Server Components own reads, metadata inputs, and page composition.
- The URL owns applied shareable search/filter/sort/page state.
- Module-scoped Zustand stores own shared client interaction state such as draft filters, drawers, command state, selected variants, and gallery selection. They never own products, prices, stock, eligibility, reservations, totals, or errors.
- React Hook Form owns form buffers through one shared client/server Zod schema.
- Client leaves own only real interaction and subscribe through narrow store selectors.
- TanStack Query is introduced only for a named browser-refetched server read. Query data is never copied into Zustand, and PHP/PLP/PDP remain Server Component reads.
- Wrap the canonical primitive-key database read with React `cache` so `generateMetadata` and the page deduplicate it within the same server render; do not pass separately allocated request objects as cache keys.
- Do not enable persistent Cache Components in this program.
- Every runtime font, script, stylesheet, and public media URL is app-origin or Iranian-hosted; no foreign runtime dependency.

## 10. Delivery stages and dependency order

### Stage 0 - planning artifacts and research closure

1. Create this Markdown bundle from settled evidence.
2. Link the dedicated transaction plan and preserve its business/legal approval gates.
3. Resolve/accept #3 gaps; then complete #2 and #4.
4. Complete #5 and #6 in parallel after their dependencies close.
5. Approve the transaction plan's Cart slice after #2 and #4.
6. Replace every `research-blocked` item in the page plans with an accepted decision or an explicit deferral.
7. Obtain maintainer approval of the updated bundle.

**Exit:** no task in Stages 1-5 depends on an unresolved decision.

### Stage 1 - component, module, and data foundation

1. Complete the capability matrix.
2. Pin Zustand and establish the request-safe scoped module store/provider pattern with selector and hydration tests.
3. Migrate commerce presentation into `src/modules/commerce` and cart presentation into `src/modules/cart` without behavior changes.
4. Define page-model, outcome, offer-state, canonical query, Zustand interaction-state, and rial-string types with tests.
5. Implement exact-locale and publication policy.
6. Add canonical ordered media and pairing data contracts; add hub curation only if #5 requires it.
7. Create shared real-Postgres fixture infrastructure and the minimal shared locale/publication/money/offer policies required by the three reads; implement each database-backed read only in its owning route slice after that slice's data/research prerequisites close.
8. Finish shared component states required by the approved page plans.
9. Install/configure TanStack Query only if an approved slice names its first browser-refetched read and closes the query-key, hydration, stale/retry, error, and invalidation gate.

**Exit:** foundation tests pass; Zustand state is request-safe and does not duplicate server/URL/form truth; Persian primitive/state harness has responsive and keyboard evidence; no page route imports Drizzle directly.

### Stage 2 - shell and PHP

Follow [`storefront/shell-and-product-hub.md`](storefront/shell-and-product-hub.md).

**Exit:** the accepted navigation manifest, Persian Landing composition, and `/fa/shop` work through the shared shell at mobile, tablet, and desktop with approved route states, local/global navigation boundaries, and metadata.

### Stage 3 - PLP and search

Follow [`storefront/plp.md`](storefront/plp.md).

**Exit:** concern, brand, category, and search routes use canonical URL state, server results, live counts, stable pagination, and verified empty/error behavior.

### Stage 4 - PDP and cart

Follow [`storefront/pdp.md`](storefront/pdp.md).

**Exit:** PDP offer states are truthful and the approved cart slice works without crossing into checkout/payment.

### Stage 5 - approved post-core catalog

Implement only capability-matrix rows marked `approved-post-core`, reusing proven primitives and page compositions. No generic page-builder abstraction is introduced.

The deferred Shop Relay mega-menu may enter this stage only after the core PHP/PLP/PDP slices pass and its dedicated gate in the shell plan is accepted. It remains Shop-only and cannot replace the primary room rail or flatten Booking/Academy/Studio into commerce navigation.

**Exit:** every included capability names its route, canonical content source, owner, tests, and browser evidence.

### Stage 6 - system verification and release

Follow [`storefront/verification-and-rollout.md`](storefront/verification-and-rollout.md). Release one route slice at a time.

## 11. Lightweight traceability

| Requirement family                  | Decision source                                 | Implementation plan                      | Verification owner                                    |
| ----------------------------------- | ----------------------------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| Architecture/module/state ownership | AGENTS.md, domain model, architecture contracts | this file, component foundation          | typecheck, hydration/state tests, architecture review |
| Page hierarchy and composition      | IA, accepted journeys, page-specific research   | master route map and every page plan     | route composition matrix + Persian browser journeys   |
| Primary/secondary navigation        | IA, decision map #4/#5, routing contract        | shell/PHP, PLP, and PDP plans            | manifest tests + route ancestry/continuity QA         |
| Design/RTL/accessibility            | IA, brand brief, design playbook                | component foundation and every page plan | browser visual/accessibility QA                       |
| Iranian storefront requirements     | decision map #2                                 | all page plans after acceptance          | research acceptance + route tests                     |
| Customer journeys                   | decision map #4                                 | PHP, PLP, PDP, cart                      | narrative Playwright journeys                         |
| Discovery/SEO/URL behavior          | decision map #5                                 | PHP and PLP plans                        | URL, metadata, search, pagination tests               |
| PDP trust/safety                    | decision map #6                                 | PDP plan                                 | content review + PDP state tests                      |
| Cart ownership/reservation          | dedicated transaction plan Cart slice            | PDP/cart plan                            | action/integration tests                              |
| Deferred Shop Relay                 | post-core `RELAY0` maintainer approval          | shell/PHP and component foundation plans | separate Relay prototype/matrix; absent from core QA  |
| Release and performance             | accepted foundation budgets                     | verification plan                        | build, browser, performance evidence                  |

## 12. Program completion definition

The storefront program is complete only when:

- every included route is backed by the approved module interface and canonical data;
- all research-blocked requirements are resolved or explicitly deferred;
- the Persian journey passes automated and manual browser checks;
- English/Arabic never receive fallback catalog data;
- `on_request` and restricted products cannot silently enter the cart;
- checkout/payment/settlement code has not leaked into this scope;
- all standard repository checks pass;
- the final route-by-route release evidence is recorded in the verification plan.
