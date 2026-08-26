# Product Listing Pages and search - phased implementation plan

**Parent:** [`../storefront.md`](../storefront.md)  
**Depends on:** component foundation, shell/PHP, decision-map #2/#4/#5  
**Routes:** concern, brand, category, and search listings  
**Primary acceptance locale:** `fa`
**Cross-cutting contracts:** [`../../architecture/data-and-state-ownership.md`](../../architecture/data-and-state-ownership.md) and [`../../architecture/routing-navigation-and-outcomes.md`](../../architecture/routing-navigation-and-outcomes.md)

## 1. Outcome and journeys

Deliver server-rendered Persian listing pages that are crawlable, shareable, back/forward-safe, and honest about price, stock, restriction, and zero results.

The PLP serves four journeys:

1. a concern-led visitor landing directly from Persian search;
2. a brand/category browser arriving from the PHP;
3. a known-product visitor using the locale-prefixed search route, such as `/fa/shop/search`;
4. a customer refining results on mobile without losing context or entering a dead-end filter state.

## 2. Routes and ownership

- `/[locale]/shop/concern/[slug]`
- `/[locale]/shop/brand/[slug]`
- `/[locale]/shop/c/[category]`
- `/[locale]/shop/search?q=...`

### Route relationships and local navigation

| Entry                     | Listing scope      | Required context                                                        | Next navigation                               |
| ------------------------- | ------------------ | ----------------------------------------------------------------------- | --------------------------------------------- |
| PHP concern link          | `concern`          | canonical concern title/description and breadcrumb ancestry             | filtered/sorted/paginated concern URL or PDP  |
| PHP brand link            | `brand`            | canonical brand identity and approved description                       | filtered/sorted/paginated brand URL or PDP    |
| PHP category link         | `category`         | canonical category hierarchy                                            | filtered/sorted/paginated category URL or PDP |
| Command/search submission | `search`           | visible normalized query and search-specific empty recovery             | refined canonical search URL or PDP           |
| Direct/SEO URL            | any accepted scope | the same server-resolved scope and canonical URL as internal navigation | same-scope controls or PDP                    |

Breadcrumbs use canonical taxonomy ancestry supplied by the page model; they never reconstruct a path from `document.referrer` or browser history. Applied-filter removal, sort, pagination, and product links are local PLP navigation. They do not become primary shell or Relay entries. A product tile always links to `/[locale]/shop/p/[slug]` and preserves no hidden in-memory result state.

Each route is a thin Server Component. It awaits `params` and `searchParams`, passes them to `listProducts`, maps the typed outcome to redirect/not-found/invalid/error behavior, and renders `ProductListingScreen` for `ready`.

No route parses filters, builds facet counts, selects prices, or joins database rows.

## 3. Required research decisions

Ticket #5 must record the accepted values for every item below before PLP production implementation begins:

- canonical query parameter names;
- absence defaults;
- repeated-value encoding and ordering;
- OR-within/AND-across facet semantics;
- accepted browse/filter axes;
- availability filter meaning;
- sort keys and their stable tie-breakers;
- page size and maximum accepted page syntax;
- price-range input unit and normalization;
- invalid recognized values;
- unknown query parameters;
- canonical URL policy for filtered/sorted/paginated pages;
- page reset after filter/sort changes;
- search normalization, ranking, and zero-result recovery;
- share-link and browser back/forward behavior;
- desktop facet rail and Persian mobile filter-sheet behavior;
- SEO, structured data, analytics events, and index/noindex policy.

The implementation plan must replace `research-blocked` markers with the exact accepted contract before task PLP2 begins. Candidate values in discussions are not implementation defaults.

## 4. Functional requirements

### PLP-01 - Scope resolution

- `ListingScope` identifies `concern`, `brand`, `category`, or `search`.
- Slugs resolve against canonical published taxonomy.
- Unknown/unpublished scope is `not-found`.
- Search requires the accepted normalized query; missing/invalid query follows the #5 contract.
- Scope titles/descriptions are exact-locale content.

### PLP-02 - URL state and canonicalization

- The URL is the single source of filter, sort, search, and page state.
- Raw `searchParams` are parsed once with Zod inside Commerce.
- Semantically valid noncanonical input returns `redirect` to one stable locale-prefixed URL.
- Invalid recognized input returns the accepted explicit invalid-query outcome; it is never silently treated as the default.
- Filter value arrays are normalized and deduplicated.
- Client controls update navigation only; they do not filter an in-memory product list.
- Back/forward navigation restores visible controls from the URL without a separate client store.

### PLP-03 - Product selection

- Only published products and active variants participate.
- Exact-locale availability is enforced.
- Price/eligibility/publication predicates match PHP/PDP.
- Stable sorting always includes a product-ID tie-breaker.
- No hidden product cap; page size is explicit in the page model and UI.
- Search uses PostgreSQL `pg_trgm` over the canonical normalized search text, with representative infix/typo queries and `EXPLAIN (ANALYZE, BUFFERS)` evidence required by DB3. A remote search engine and Persian full-text configuration are deferred.

### PLP-04 - Facets and live counts

- Facet values include canonical value, localized label, count, selected state, and server-generated toggle href.
- Counts use the current query with the current facet group's selections removed, so alternatives remain meaningful.
- OR/AND semantics match the #5 decision and tests.
- Values with zero count follow the accepted hide/disable/display policy.
- Price bounds remain integer rials internally; UI formatting never creates float/toman query ambiguity.
- Searchable facet controls appear only above the accepted cardinality threshold.

### PLP-05 - Sorting

- Sort options are accepted keys with localized labels, selected state, and canonical href.
- The default sort is singular and documented.
- Price sorts operate on the canonical eligible offer projection; `on_request`/restricted placement follows #5 rather than an inferred zero/infinite price.
- Sort changes reset pagination according to the accepted policy.

### PLP-06 - Product summary behavior

- Tile shows canonical image or the approved no-media treatment, name, promise when approved, brand/line/size when present, and explicit offer state.
- Product href always leads to the canonical locale PDP.
- No product-card box, shadow, discount badge, inferred compare price, or client-calculated stock.
- `on_request` and restricted products show their state and PDP/enquiry route; they do not expose an add action.
- Quick view remains research-blocked until #5 accepts it and its mobile/keyboard behavior.

### PLP-07 - Pagination

- Numbered pagination is server-generated and crawlable according to #5 SEO policy.
- Page count derives from the same predicate as items and facets.
- Out-of-range page behavior is explicit and tested.
- Previous/next chevrons mirror in RTL and have descriptive labels.
- Mobile presentation may compress page links without hiding current position or next/previous access.

### PLP-08 - States

- **Loading:** toolbar/facet/grid skeletons preserve final geometry.
- **Collection empty:** taxonomy exists but has no published products.
- **Filters no match:** clear-all and removable applied filters are available.
- **Search no results:** recovery behavior follows #5 and never fabricates recommendations.
- **Invalid query:** typed issues and accepted recovery behavior.
- **Not found:** unknown/unpublished taxonomy.
- **Locale unavailable:** exact-locale content missing.
- **Operational error:** database/search failure through `error.tsx`, never an empty grid.

### PLP-09 - Search functionality

- Search is the `search` `ListingScope` rendered through the same `listProducts` contract, not a command-dialog product store or a separate client search implementation.
- `q` is visible in the page heading/context, normalized once by the accepted Persian search policy, and retained in canonical refine/sort/page links.
- Ticket #5 must decide minimum/maximum query handling, token normalization, ranking/tie-breakers, browse-versus-search facets, unknown parameters, zero-result recovery, canonical/robots behavior, and whether suggestions/autocomplete exist.
- Core command search performs GET navigation only. Live product autocomplete remains absent until its own bounded transport, accessibility, performance, rate-limit, and server-ownership contract is accepted.
- Search results never bypass exact locale, publication, offer, price, eligibility, or availability predicates.

### PLP-10 - Facet governance

- Ticket #5 must approve a facet manifest before implementation. Each row records stable code, localized label source, owning canonical data field/relation, applicable scopes/categories, operator semantics, URL encoding, display order, live-count behavior, zero-count policy, and SEO policy.
- Concern, brand, and category may be route scopes and may also be accepted refinements, but the manifest must define the distinction; components cannot duplicate them ad hoc.
- Ingredient, suitability, safety, pregnancy, post-treatment, professional, or similar specialist filters are absent until canonical evidence, content approval, and safe applicability rules exist.
- No facet is assigned by parsing product titles, descriptions, filenames, or generic taxonomy overlap.
- External storefront menus and labels are research evidence only; they do not become accepted facet codes or routes without the ticket #5 decision.
- The deferred Shop Relay may link to an accepted PLP scope or canonical filtered URL, but it cannot create a second filter grammar or client-only result set.

## 5. Page-model contract

`ProductListingPageModel` contains:

- `seo` and `breadcrumbs`;
- resolved `scope` with kind, slug/query, title, and optional approved introduction;
- canonical `query` containing only accepted parsed values;
- `appliedFilters` with label/remove href;
- `facets` with live values and toggle hrefs;
- `sortOptions` with canonical hrefs;
- `products` as page-ready summaries;
- `resultCount`;
- `pagination` with page, explicit page size, page count, and links;
- optional typed `emptyState`.

The model contains final hrefs so client leaves never rebuild query-string policy independently.

## 6. Component composition

```text
ProductListingScreen
  Breadcrumbs
  PageHeader / listing introduction
  PlpToolbar
    ResultCount
    AppliedFilterList
    SortChips
    FilterDrawer trigger (mobile)
  ListingLayout
    FacetRail (desktop)
    ProductGrid
      ProductTile
  Pagination
  FilterDrawer (mobile sheet)
  optional QuickView (research-blocked)
```

Existing components to migrate/adapt: `FacetRail`, `FilterDrawer`, `PlpToolbar`, `SortChips`, `ProductGrid`, `ProductTile`, `Pagination`, `Price`, `StockBadge`, `Sheet`, `Checkbox`, `Slider`, `Collapsible`, `Skeleton`, and `EmptyState`.

New compositions: applied-filter list/chips if #5 requires them, result-count treatment, invalid-query recovery, collection-empty/filter-empty/search-empty variants, and `ProductListingScreen`.

## 7. Data and query implementation

### Query pipeline

1. Parse raw params with the accepted Zod schema.
2. Normalize locale-sensitive search input and canonical values.
3. Resolve scope subject and exact-locale publication.
4. Build one canonical product predicate.
5. Query page items and total count with stable ordering.
6. Query facet aggregates using the same predicate and accepted disjunctive-count behavior.
7. Batch-load offers, primary media, brands/lines, and stock for page IDs.
8. Assemble final links, SEO inputs, summaries, and state.

### Performance contract

- No query count growth per product or facet value.
- Page size is explicit; initial candidate is 24 but is not locked until #5 accepts it.
- Representative concern/brand/category/search queries receive `EXPLAIN ANALYZE` review before adding indexes.
- Add only evidence-backed indexes, such as published category/concern joins required by measured query plans.
- Search candidates never override publication, price, eligibility, or inventory truth.

## 8. Responsive, RTL, and accessibility

### Mobile 390px

- Facets open in an inline-end-correct sheet with focus trap/restore and safe-area clearance.
- Applied filters remain removable without horizontal page overflow.
- Sort remains understandable without a cramped generic dropdown unless #5 explicitly chooses one.
- Product grid, names, prices, and badges do not clip mixed Persian/Latin text.
- Closing/applying filters preserves URL and scroll behavior accepted by #5.

### Tablet 768px

- Accepted breakpoint decides facet rail versus drawer.
- Grid and toolbar do not create a dashboard-like control band.

### Desktop 1440px

- Facet rail and grid form an editorial listing, separated by whitespace/hairlines.
- Sort remains a chip/link row.
- Result count and applied filters do not dominate the page hierarchy.

### Accessibility

- Every filter control has a real label and target row at least 44px high.
- Selected/disabled/count states are announced.
- Sheet focus is trapped/restored; escape works.
- Pagination/current-page semantics are explicit.
- Updates announce new result count without moving focus unexpectedly.
- Contrast and focus rings follow the light/dark token rules.

## 9. Phased task list

### PLP0 - Accept the discovery and navigation manifest

1. Close ticket #5 with the exact route-scope, search, facet, sort, pagination, SEO, analytics, and mobile behavior decisions required by sections 2 through 4.
2. Record one row per accepted facet with its code, localized source, canonical data dependency, applicability, operator, URL representation, count policy, zero policy, and acceptance fixture.
3. Record canonical breadcrumb ancestry and every PHP/command/direct entry relationship for concern, brand, category, and search scopes.
4. Explicitly defer unsupported specialist/safety facets and live autocomplete rather than adding placeholder controls or inferred data.

**Verify:** every visible control and generated href traces to an accepted manifest row and canonical data source.

### PLP1 - Accept and encode the URL contract

1. Paste/link the accepted `PLP0` grammar into this plan without adding implementation defaults.
2. Write failing pure tests for missing/default, valid, invalid, duplicate, noncanonical, filter-change, sort-change, page, and locale/search cases.
3. Implement the Zod parser and canonical URL builder.

**Verify:** every accepted URL example has one expected canonical outcome; malformed inputs fail for the intended reason.

### PLP2 - Build `listProducts`

1. Add interface tests for each scope, exact locale, unpublished subjects/products, all offer states, stable pagination, live counts, and operational failures.
2. Implement scope resolution and shared predicates.
3. Implement bounded batched projections and page-model assembly.
4. Add query-count and representative query-plan assertions.

**Verify:** real Postgres fixtures produce the expected page models and query counts.

### PLP3 - Migrate/adapt presentation

1. Move listing components into Commerce ownership without visual/behavior regressions.
2. Add failing component tests for URL hrefs, labels, selected states, drawer focus, and empty/error variants.
3. Implement the scoped Commerce Zustand store for draft filter/drawer interaction, initialized and reconciled from the canonical URL query.
4. Keep applied filters, sorting, pagination, results, counts, prices, and eligibility out of the store; Apply serializes one canonical URL and navigation reruns the server read.
5. Implement the screen composition using final page-model hrefs.

**Verify:** targeted Vitest, store-isolation/hydration tests, URL round-trip/back-forward tests, and accessibility assertions.

### PLP4 - Add routes and SEO

1. Add concern, brand, category, and search routes with `loading.tsx`, `error.tsx`, and not-found mapping.
2. Implement metadata from the same request-local read.
3. Verify canonical/index/noindex behavior accepted by #5.

**Verify:** route tests, metadata tests, build.

### PLP5 - Browser journeys and refinement

1. Browse concern, brand, and category from PHP.
2. Search a known term and a zero-result term.
3. Apply/remove multiple filters, change sort, paginate, share URL, and use back/forward.
4. Follow canonical breadcrumbs and product links, then confirm PDP entry does not depend on hidden PLP client state.
5. Exercise invalid query, unknown taxonomy, locale unavailable, valid empty, and operational error.
6. Capture complete fresh screenshots at 390, 768, and 1440 after the last edit.

**Verify:** visual/interaction review passes with no skipped route/state required by the verification matrix.

## 10. Required test fixtures

- Published/unpublished products.
- Products with active/inactive variants.
- Public, student, professional, and missing-price cases.
- `on_request`, restricted, sold-out, and multi-variant offers.
- Reserved inventory.
- Concern, brand, and category with products; valid empty taxonomy; unknown taxonomy.
- Equal sort values to prove stable tie-breaking.
- Facet combinations proving OR-within/AND-across behavior.
- Persian mixed with Latin brand/line names.
- Missing Persian/English/Arabic content and exact-locale outcomes.
- Search match, normalized Persian-character match, and no match.
- Database failure separate from zero results.

## 11. Exit gate

- Ticket #5 URL/discovery contract is accepted and represented exactly in tests.
- `PLP0` records every scope, local navigation relationship, search behavior, and facet data source; unsupported specialist filters remain absent.
- All four route families use `listProducts` and no route imports Drizzle.
- URL, live counts, sorting, pagination, search, and every state pass interface/route/browser tests.
- Product summaries never leak false price, stock, or eligibility.
- Persian RTL and keyboard journeys pass at required viewports.
- Query count is bounded and representative plans are reviewed.
- Quick view remains absent unless separately accepted with its own requirements and tests.

---

## Next iteration — not scheduled

The PLP was seen running against the real catalogue on 2026-08-26 and eight
refinements came out of it: infinite scroll layered over the paginated URLs,
scroll position held across a filter, a compact density closer to Ant Design,
a less-cropped and more branded product tile, the price filter's Apply button,
a sticky rail, and a composed top-of-page.

They are recorded with their conflicts and a recommended shape in
[`../../27-storefront-refinement-backlog.md`](../../27-storefront-refinement-backlog.md)
(`R-1`–`R-8`). **None is implemented, and none should be until Landing, PDP,
cart and checkout land.** `R-3` — density — goes first among them, because it
changes the tokens the other visual entries render against.
