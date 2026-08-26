# Storefront verification and route-by-route rollout plan

**Parent:** [`../storefront.md`](../storefront.md)  
**Applies to:** component foundation, shared shell, PHP, PLP/search, PDP, and the approved cart slice  
**Primary acceptance locale:** `fa`
**Cross-cutting contracts:** [`../../architecture/testing-and-fixtures.md`](../../architecture/testing-and-fixtures.md), [`../../architecture/i18n-and-direction.md`](../../architecture/i18n-and-direction.md), and [`../../architecture/errors-and-actions.md`](../../architecture/errors-and-actions.md)
**Status:** Planning baseline; numeric performance budgets and research-owned behaviors remain research-blocked

## 1. Outcome

Provide one evidence contract for deciding whether a storefront slice is safe to expose. Verification must prove the behavior at the Commerce/Cart interfaces, route boundary, and real Persian browser surface. A green unit suite alone is insufficient, and a database outage must never pass as a valid empty catalog.

Release one completed route slice at a time. A slice is complete only when its page-plan checklist, implementation, automated checks, browser evidence, performance evidence, and production-equivalent smoke all describe the same behavior.

This document plans application verification and rollout. The Markdown files under `docs/system-design/` are the only documentation artifacts in this delivery; no DOCX production or document-rendering workflow is required.

## 2. Entry prerequisites

Before any application verification task begins:

- the owning page plan is maintainer-approved;
- every required decision-map gate is accepted, or the behavior is explicitly deferred;
- the route, page-model inputs, states, Persian source copy, and canonical data sources are named;
- test fixtures can represent publication, locale, price, eligibility, variants, inventory, reservations, and operational failures without production data;
- numeric route budgets for payload, client JavaScript, TTFB, LCP, INP, and CLS are accepted during the Foundation gate;
- the target deployment/environment, rollback owner, and evidence location are recorded;
- unrelated dirty work is excluded from the slice diff and evidence.

If a prerequisite is missing, record the slice as `blocked`; do not weaken the scenario or reinterpret an unresolved decision as an implementation default.

## 3. Evidence contract

### 3.1 Required evidence per slice

Each slice retains:

1. **Scope manifest:** routes, modules, migrations, content, flags if any, and deferred behavior.
2. **Decision evidence:** accepted ticket outputs and the plan sections they unblock.
3. **Automated result:** exact command, date, revision, environment, exit code, and failure classification.
4. **Database/interface evidence:** fixture identity, scenarios, query-count result, and representative query-plan result where applicable.
5. **Browser evidence:** locale, viewport, route/state, interaction log, screenshot path, and accessibility observations.
6. **Performance evidence:** measurement method, sample/run count, observed values, accepted budgets, and pass/fail.
7. **Runtime-dependency evidence:** network capture proving no foreign runtime font, script, stylesheet, or media dependency.
8. **Release evidence:** deployed revision, smoke result, exposure decision, monitoring window, and rollback result if invoked.

Evidence must be tied to the exact revision being released. A screenshot from an earlier UI revision or a test log from a different schema revision does not close the gate.

### 3.2 Result vocabulary

- **Pass:** the named observable matches the accepted requirement.
- **Fail:** the observable violates the requirement.
- **Blocked:** a required decision, environment, fixture, content source, or authority is unavailable.
- **Baseline:** a pre-existing issue observed outside the slice; it remains visible and is not counted as a slice regression.
- **Not run:** no evidence exists. This never means pass.

### 3.3 Failure classification

When a standard command fails, classify it as:

- **slice regression:** caused by the current route slice and must be fixed;
- **pre-existing baseline:** reproducible without the slice and recorded without modifying unrelated work;
- **environment blocker:** required service/tool is unavailable and the exact blocker is recorded;
- **research/content blocker:** the expected result cannot be known until its gate closes.

No failing check is suppressed, skipped, or relabeled as empty-state behavior.

## 4. Standard repository checks

Run from the repository root against the final candidate revision:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Use targeted tests during development, then run the full standard sequence once for the release candidate. Record each exit code independently so a later command cannot hide an earlier failure.

Additional storefront checks must cover:

- physical-direction CSS scan for `left`/`right` declarations in changed storefront styles, reviewed for unavoidable semantic exceptions;
- raw-color scan to prevent bypassing design tokens;
- runtime network capture for foreign fonts/scripts/styles/media;
- route manifest check confirming expected locale-prefixed routes and route-state files;
- migration/schema review when canonical media, pairings, or cart reservation behavior changes;
- accessibility and performance scenarios below.

## 5. Automated test architecture

### 5.1 Pure policy and model tests

Test at the public Commerce/Cart interfaces or a proven colocated pure policy seam:

- `StorefrontOutcome<T>` and `CartOutcome<T>` exhaustiveness and route mapping;
- branded base-10 `RialString` conversion boundaries and the sole toman formatter;
- publication and exact-locale rules with no fallback chain;
- customer-group price precedence and missing-price integrity failure;
- offer-state precedence: `restricted`, `on_request`, `unavailable`, `variant-required`, `purchasable`;
- availability from `inventory.onHand` minus active, unexpired reservation-row quantities;
- URL parsing, canonical ordering, invalid recognized values, page reset, and final href generation;
- stable sort/pagination tie-breakers;
- media ordering, disclosure omission policy, and pairing constraints;
- cart Zod schemas, ownership resolution, typed action results, retry/idempotency behavior, and reservation transitions.

Avoid tests that only restate constants or mock internal collaborators. The three Commerce reads and Cart actions are the principal behavioral surfaces.

### 5.2 Real PostgreSQL interface tests

Run `getShopHub`, `listProducts`, `getProduct`, `getCart`, and the three approved Cart actions against isolated real Postgres fixtures. Tests must prove:

- published versus unpublished taxonomies/products/variants;
- Persian ready versus English/Arabic locale-unavailable behavior;
- public, student, professional, on-request, missing-price, and restricted pricing cases;
- single-variant, multi-variant, inactive-variant, sold-out, reserved, and negative-effective-stock integrity cases;
- valid empty catalog/listing versus database failure;
- concern/brand/category/search scopes and normalized Persian search;
- live facet counts and accepted OR-within/AND-across semantics;
- equal sort values across page boundaries to prove stability;
- ordered media, missing optional media, disclosures, and explicit pairings;
- guest/authenticated cart ownership, merge behavior, price change, item removal/unpublication, reservation expiry, retry, and concurrent contention.

Operational-error fixtures must cause the interface to throw and the route error surface to render. They must not return `ready` with an empty array.

### 5.3 Query-count and query-plan checks

- PHP query count is bounded independently of product-section size.
- PLP query count does not grow per product or facet value.
- PDP query count does not grow per media, variant, disclosure, or pairing row.
- Cart action query/lock behavior is bounded and reviewed for the accepted transaction sequence.
- Representative concern, brand, category, search, PDP, and reservation-contention cases receive `EXPLAIN (ANALYZE, BUFFERS)` review in a non-production test database.
- Add an index only when the measured plan and expected production cardinality justify it; retain the before/after plan in evidence.

The exact numeric query-count bounds are accepted when the implementation query shape is known. They may not be silently relaxed to make an N+1 implementation pass.

### 5.4 Route and metadata tests

For each route family, test:

- `ready`, `redirect`, `not-found`, `locale-unavailable`, and `invalid-query` outcomes where applicable;
- thrown operational/integrity errors through `error.tsx`;
- loading and valid-empty compositions;
- canonical locale-prefixed hrefs and breadcrumb ancestry;
- canonical URL, title, description, robots policy, Open Graph inputs, and approved structured data;
- request-local reuse between metadata and page rendering;
- absence of restricted prices, false availability, fallback-locale content, and unapproved structured-data fields.

## 6. Route/state verification matrix

| Slice         | Routes/surfaces                          | Required ready journeys                                                                               | Required non-ready states                                                                              | Research gate                                                        |
| ------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Foundation    | focused harnesses only; no gallery route | primitive states, offer rendering, locale/money policy                                                | disabled, loading, validation, unavailable                                                             | #2 plus accepted foundation contracts                                |
| Shell/landing | `/[locale]` shell integration            | room navigation, command open/close, static destinations, GET search submission, Cart summary, footer | search/Cart locale-unavailable recovery; live autocomplete absent                                      | #2, #4, #5 plus approved transaction-plan Cart gate for count/drawer |
| PHP           | `/[locale]/shop`                         | introduction, concern entry, approved brand/category, bounded products                                | loading, valid empty, locale unavailable, operational error                                            | #2, #4, #5                                                           |
| PLP           | concern, brand, category routes          | browse, filter, sort, paginate, share, back/forward                                                   | collection empty, filtered empty, invalid query, not found, locale unavailable, operational error      | #2, #4, #5                                                           |
| Search        | `/[locale]/shop/search?q=...`            | normalized known query, share, back/forward                                                           | missing/invalid query per #5, zero results, locale unavailable, operational error                      | #5                                                                   |
| PDP           | `/[locale]/shop/p/[slug]`                | single/multi-variant, disclosures, ordered media, pairing                                             | `on_request`, restricted, sold-out, variant-required, not found, locale unavailable, operational error | #2, #4, #6                                                           |
| Cart          | drawer and `/[locale]/cart`              | add, set quantity, remove, reload/direct open, guest/account behavior                                 | empty, expired reservation, price/eligibility/stock change, ownership/action error                     | approved transaction-plan Cart slice                                 |

### 6.1 Page structure and navigation contract

| Surface    | Required structure evidence                                                                                         | Required navigation evidence                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Landing    | editorial introduction → approved proof → three room doors → optional approved evidence → closing invitation/footer | neutral front-door state; canonical Shop/Booking/Academy destinations; no product grid or PLP controls                             |
| Shell      | one desktop rail/mobile bottom-nav source, Command, locale, Cart, Studio/account, footer                            | exact accepted item IDs/order/placement, active-room matching, locale prefixes, keyboard path, no duplicate responsive definitions |
| PHP        | Shop introduction → concern-first navigation → approved brand/category → bounded product sections                   | final page-model hrefs to each PLP family/Search/PDP; no hidden-grid filtering or cross-room mega-menu                             |
| PLP/Search | scope/query header → toolbar/applied filters → facet rail/sheet → product grid → pagination                         | canonical breadcrumbs, filter/remove/sort/page hrefs, product-to-PDP links, back/forward/share restoration                         |
| PDP        | breadcrumbs → product hero/media/purchase → disclosures → pairings                                                  | canonical ancestry independent of referrer, approved brand/line links, paired PDP links, Cart continuity                           |
| Cart       | shared drawer/page line list and summary                                                                            | shell/PDP entry, direct/reload mobile route, Shop/PDP recovery; no checkout continuation in this program                           |

Verification must fail when a required composition block is missing, appears out of accepted task order, uses a noncanonical destination, or migrates from page-owned secondary navigation into the global shell. Route existence alone is not sufficient evidence.

The deferred Shop Relay is not part of core release verification. If `RELAY0` is later approved, add a separate matrix row covering its canonical groups/links, imagery and contrast, pointer/keyboard/touch behavior, focus restoration, reduced motion, image failure, locale unavailability, payload budget, and proof that it does not duplicate filter/query state.

## 7. Persian-first browser QA

### 7.1 Required viewport set

Run every slice's primary journeys at:

- `390 × 844` - small mobile and bottom navigation;
- `768 × 1024` - tablet/breakpoint behavior;
- `1440 × 900` - desktop rail and editorial canvas.

Capture a fresh complete set after the final UI change. Earlier captures are comparison evidence, not release evidence.

### 7.2 Persian and bidirectional content

Verify with canonical or fixture strings that include:

- Persian headings, multi-line product names, and long error/help copy;
- Latin brand, SKU, ingredient, and URL fragments embedded in Persian text;
- Persian and Latin numerals where each is intentionally supported;
- rial-to-toman display, Persian digits, U+066C grouping, and no floating-point artifacts;
- logical alignment, spacing, borders, overlay edges, breadcrumb/pagination icons, and rail mirroring;
- non-mirrored brand/product marks and correctly mirrored directional icons;
- Jalali output only where a storefront requirement genuinely displays a date, through the canonical utility.

English LTR and Arabic RTL receive route/outcome smoke checks only when exact approved commerce content exists. Until then, the expected result is `locale-unavailable`, not fallback content.

### 7.3 Keyboard and assistive technology

Verify:

- skip link and landmark order;
- primary navigation order, active-room semantics, and parity from the single canonical definition across desktop/mobile variants;
- Landing room-door order and destinations, PHP discovery links, PLP local navigation, PDP canonical ancestry, and Cart continuity;
- visible focus on every interactive target;
- command palette arrow/enter/escape behavior and focus restoration;
- filter sheet and cart drawer focus trap, escape, close, and trigger restoration;
- gallery, variant, quantity, accordion, applied-filter, and pagination keyboard behavior;
- screen-reader names, current/selected/expanded/disabled state, result-count announcements, and action errors;
- 44px minimum targets;
- reduced-motion behavior;
- contrast on light/dark token fields, including focus/error/disabled states;
- no information communicated only through color, hover, icon, or motion.
- no global horizontal header, cross-room marketplace mega-menu, hover-only primary navigation, referrer-derived breadcrumb, or duplicated desktop/mobile navigation source.

Use an automated accessibility scan as a defect detector, then complete keyboard and screen-reader-name review manually. Zero automated findings does not replace interaction QA.

### 7.4 Visual brand review

At every viewport confirm:

- hairlines instead of shadows;
- borderless product presentation rather than card grids;
- asymmetric editorial hierarchy where content supports it;
- at least the accepted major-section spacing, initially 96px from the design authority;
- gold/firouzeh/champagne are not used as low-contrast text on white;
- typography, wrapping, image ratios, skeleton geometry, empty/error hierarchy, and safe-area clearance match the intended route state;
- no admin-dashboard density, cross-room marketplace mega-menu, unapproved Shop Relay, permanent sale furniture, or raw-token bypass.

## 8. Security and commerce-integrity verification

### Commerce reads

- unpublished products/taxonomies never render through alternate slugs, search, facets, pairings, or structured data;
- missing exact-locale content never falls back;
- professional/restricted prices are absent from page models and HTML for ineligible viewers;
- `on_request` derives only from the canonical state, not a missing price;
- client inputs cannot select customer group, price, publication, eligibility, or stock truth;
- invalid queries cannot reach dynamic query construction outside the accepted parser;
- core command search has no client data endpoint; any later approved autocomplete transport delegates to `listProducts`, validates/rate-limits input, and returns only its bounded public DTO;
- operational errors expose no schema, SQL, session, or internal diagnostic detail.

### Cart actions

- each action executes Zod parse, ownership/authorization, then database work in that order;
- `getCart` resolves ownership server-side and never accepts caller-provided cart/user/customer-group identity;
- arbitrary cart/line identifiers cannot access another guest or authenticated cart;
- anonymous ownership cookie is server-issued, httpOnly, SameSite, and high entropy;
- add/update/remove revalidate publication, eligibility, price visibility, price, and available inventory;
- transactions create/renew/release reservations without decrementing `onHand`;
- concurrent actions cannot over-reserve;
- retries cannot duplicate a line/reservation effect beyond the accepted cart policy;
- typed recoverable errors do not conceal unknown operational faults;
- no checkout total, payment, settlement, or fulfilment behavior is introduced.

## 9. Runtime dependency and performance gates

### 9.1 No foreign runtime dependencies

For each released route, inspect the production-equivalent network log after hard reload and primary interaction. Fail the gate if a runtime font, script, stylesheet, or media request targets a foreign host. API/data calls must also follow the accepted Iranian-hosting architecture.

Record every external origin observed and its disposition. Browser extensions and developer-tool requests are excluded only when proven not to originate from the application.

### 9.2 Numeric budgets

Foundation must approve numeric budgets before route implementation for:

- route document/data payload;
- route client JavaScript and interaction-specific lazy chunks;
- server TTFB under the accepted Iran-representative profile;
- LCP, INP, and CLS at mobile and desktop targets;
- image bytes/dimensions and above-fold loading policy;
- query latency and query count for each Commerce read;
- Cart action latency and failure rate where the cart slice applies.

This plan does not invent numbers before the measurement environment, catalog size, hosting target, and business tolerance are accepted. Once accepted, record the values in this section and in the owning page plan; a release may not use an undocumented budget.

### 9.3 Measurement method

- use a production build and production-equivalent data path;
- run cold and warm navigation scenarios separately;
- use the accepted mobile network/CPU profile and record it exactly;
- retain raw Lighthouse/trace/network artifacts or equivalent measurements;
- report per-route observed value, sample count, variance/percentile used, budget, and verdict;
- investigate regressions against the previous released slice rather than averaging them away.

## 10. Slice verification task sequence

### V1 - Freeze the acceptance manifest

1. Copy the owning plan's approved routes, ordered page composition, requirements, states, fixtures, and exit gate into the slice evidence record.
2. Record the accepted canonical navigation-manifest entries, page-owned local-navigation relationships, route ancestry, and cross-surface transitions exercised by the slice.
3. Link accepted research outputs and record explicit deferrals, including proof that the Shop Relay remains absent from every core slice unless `RELAY0` has been separately approved and scheduled.
4. Record the candidate revision, environment, owner, numeric budgets, and rollback method.

**Exit:** every accepted composition block and navigation relationship has a binary expected result and evidence owner; every deferred capability is demonstrably absent from the candidate.

### V2 - Prove policy and database behavior

1. Add failing-first tests before changing application behavior.
2. Implement the smallest behavior behind the approved Commerce/Cart interface.
3. Run pure policy and real-Postgres interface scenarios.
4. Review query counts/plans and transactional contention where applicable.

**Exit:** policy, data integrity, error distinction, and performance shape pass at the module interface.

### V3 - Prove route behavior

1. Test every typed outcome and thrown operational error at the route boundary.
2. Test metadata/canonical/structured-data behavior from the same read.
3. Run typecheck, lint, targeted tests, and build before browser QA.

**Exit:** the production build exposes only the approved routes and truthful states.

### V4 - Prove the real Persian surface

1. Run the primary Persian journeys with keyboard interaction.
2. Exercise every required state at 390, 768, and 1440.
3. Run accessibility, reduced-motion, bidirectional-copy, visual-brand, and foreign-network checks.
4. Fix defects and recapture the complete viewport/state set after the final UI edit.

**Exit:** fresh browser evidence matches the approved page plan with no skipped required state.

### V5 - Prove budgets and full regression

1. Measure the production build against accepted route budgets.
2. Run the full standard repository command sequence.
3. Classify every failure and resolve all slice regressions.
4. Re-run only invalidated evidence, then capture one final complete release-candidate result set.

**Exit:** all required checks pass or a pre-existing/environment blocker is explicitly accepted by the maintainer; no blocker is silently waived.

### V6 - Production-equivalent smoke and exposure

1. Deploy the exact verified revision to the release target with the accepted schema/content prerequisites.
2. Run Persian desktop and mobile smoke journeys before exposure.
3. Confirm network origins, logs/errors, database connectivity, canonical URLs, and no fallback content.
4. Expose only the verified route slice.
5. Observe the accepted monitoring window and record the outcome.

**Exit:** production evidence matches release-candidate evidence and no rollback trigger fires.

## 11. Release order and dependency graph

```text
Foundation contracts and primitives
  -> Shared shell on existing landing
    -> PHP /[locale]/shop
      -> Concern/brand/category PLPs
      -> Search PLP
        -> PDP
          -> Approved cart drawer + /[locale]/cart
            -> Approved post-core compositions
```

PHP must pass before destination PLPs are exposed. PLP offer policy must pass before PDP is exposed. PDP read behavior may pass before Cart, but add-to-cart and the production cart affordance remain unavailable until the transaction plan's Cart slice and Cart verification pass.

Release concern, brand, category, and search as one PLP slice only if they share the accepted parser/predicate and all four route families pass. Otherwise hold the incomplete family; do not expose two URL behaviors behind one listing interface.

## 12. Exposure and rollback

### Exposure policy

- Prefer route-by-route deployment with no permanent flag.
- Add a route-scoped feature flag only when replacing an already-live route that requires instant rollback.
- A flag controls exposure, not alternate business logic; old and new pricing/eligibility policies must not coexist behind the flag.
- Do not create a global storefront operating-system flag.

### Rollback triggers

Rollback or disable the affected route slice when any accepted trigger occurs, including:

- protected price/publication/locale leakage;
- add-to-cart eligibility or stock-integrity failure;
- reservation over-allocation or ownership breach;
- operational errors rendering as empty/available catalog states;
- canonical URL loop or material route loss;
- foreign runtime dependency causing route failure;
- accessibility blocker on a primary purchase/discovery action;
- accepted performance/error-rate budget breach during the monitoring window.

### Rollback procedure requirements

- identify the exact route deployment/flag and schema compatibility before exposure;
- prefer reverting the affected route deployment or disabling its scoped flag;
- do not roll back a shared schema migration until backward compatibility and data preservation are proven;
- run the previous revision's Persian desktop/mobile smoke after rollback;
- record trigger, timestamps, owner, revision, customer impact, recovery evidence, and follow-up decision.

## 13. Slice exit checklist

A route slice may be marked complete only when:

- all prerequisite decisions and canonical content/data sources are accepted;
- its route files are thin and use only the approved Commerce/Cart interface;
- every ready, empty, invalid, not-found, locale-unavailable, restricted, sold-out, and operational state relevant to the slice is tested;
- real Postgres fixtures prove price, publication, locale, variant, inventory, reservation, and integrity behavior relevant to the slice;
- query count does not grow with row/card/facet count;
- Persian keyboard, RTL, mixed-direction, responsive, reduced-motion, and accessibility scenarios pass;
- the production-equivalent network contains no forbidden foreign runtime dependency;
- accepted numeric performance budgets pass;
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm test:e2e` pass or any non-slice blocker has explicit maintainer disposition;
- screenshots and logs are fresh for the exact candidate revision;
- production-equivalent Persian desktop/mobile smoke passes;
- exposure and rollback evidence is recorded;
- the owning Markdown checklist and implementation evidence agree.

## 14. Program completion gate

The core storefront verification program closes when Shell/PHP, all four PLP/search families, PDP, and the approved Cart slice have independently passed this contract; no research-blocked capability was smuggled into production; no checkout/payment/settlement behavior was added; and the maintainer has accepted the final route-by-route evidence record.
