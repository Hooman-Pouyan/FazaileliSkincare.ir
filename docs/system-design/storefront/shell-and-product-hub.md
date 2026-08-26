# Shared storefront shell and Product Hub Page - phased implementation plan

**Parent:** [`../storefront.md`](../storefront.md)  
**Depends on:** component foundation; decision-map #2, #4, and #5  
**Routes:** `/[locale]` integration and `/[locale]/shop`  
**Primary acceptance locale:** `fa`
**Cross-cutting contracts:** [`../../architecture/README.md`](../../architecture/README.md), especially module/state/routing/i18n ownership

## 1. Outcome and customer journey

The shell makes Landing, Shop, Booking, Academy, and account feel like separate rooms inside one coherent product. The PHP is the Shop's editorial front door: a customer arriving from Instagram or search should understand where they are, browse by skin concern, discover approved brand/category paths, and reach a listing or product without encountering a marketplace dashboard.

The primary Persian journey is:

1. arrive on the existing landing page or `/fa/shop`;
2. identify the active room from the rail/bottom navigation;
3. browse a concern or use command search;
4. follow a canonical locale-prefixed link to PLP/search/PDP;
5. open the cart affordance without losing page context;
6. recover clearly from no content, unavailable locale, or operational failure.

## 2. Prerequisites

- Decision #2 defines mandatory Iran-specific legal/support/connectivity content.
- Decision #4 accepts first-time, known-product, uncertain, post-treatment, student/professional, and returning customer journeys.
- Decision #5 accepts PHP sections, browse axes, search entry behavior, merchandising, analytics, SEO, empty/error states, and Persian mobile behavior.
- Foundation page models, outcome union, exact-locale policy, price/offer models, and component migration are complete.
- Canonical Persian concern, brand, category, and published product data exists.
- Any hero/editorial photography is local, approved, sized, and has final alt-text treatment.
- Legal/footer copy is supplied by the business owner; it is not invented by implementation.
- Before `NAV1` closes, #4/#5 must settle the exact mobile bottom-navigation items/order, the `/studio` versus any future `/account` relationship, locale switching when destination commerce content is unavailable, and the final canonical concern/brand/category labels exposed by command navigation.

## 3. Shell requirements

### SHELL-00 - Navigation ownership and canonical manifest

One typed, locale-aware navigation definition feeds the desktop rail, mobile bottom navigation, command destinations, and footer references. Rendering variants may omit or regroup items for the accepted viewport, but labels, destinations, feature availability, and active-room rules cannot be duplicated in separate arrays.

Primary navigation means global movement between application rooms or global utilities:

| Item            | Planned destination or action                                  | Desktop rail role              | Mobile role                                               | Status before implementation                                                  |
| --------------- | -------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Brand medallion | `/[locale]`                                                    | first/home control             | home destination only if accepted in the final mobile set | settled destination; final mobile placement belongs to `NAV1`                 |
| Shop            | `/[locale]/shop`                                               | room destination               | required commerce destination                             | settled                                                                       |
| Booking         | `/[locale]/book`                                               | room destination               | placement decided by `NAV1`                               | route is canonical; feature body is outside this plan                         |
| Academy         | `/[locale]/academy`                                            | room destination               | placement decided by `NAV1`                               | route is canonical; feature body is outside this plan                         |
| Command/search  | opens Command; search submits to `/[locale]/shop/search?q=...` | global utility                 | placement/trigger decided by `NAV1`                       | core behavior settled; exact mobile placement blocked                         |
| Locale          | locale switch/recovery action                                  | global utility                 | accessible through the accepted mobile utility treatment  | unavailable-content behavior blocked by `NAV1`                                |
| Cart            | desktop drawer; `/[locale]/cart` on mobile/direct access       | global utility after Cart gate | cart destination after Cart gate                          | blocked by narrow Cart gate                                                   |
| Studio/account  | current IA destination `/[locale]/studio`                      | global identity destination    | placement decided by `NAV1`                               | naming and relationship to future auth/account routes remain research-blocked |

Secondary navigation is owned by the active surface rather than the shell:

| Owner      | Secondary navigation                                                        | Destination rule                                                          |
| ---------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Landing    | three room doors                                                            | direct locale-prefixed Shop, Booking, and Academy links                   |
| PHP        | concern, approved brand, approved category, bounded product links           | final hrefs from `ShopHubPageModel`; no in-place hidden-grid filtering    |
| PLP/Search | breadcrumbs, applied-filter removals, sort links, pagination, product links | final canonical hrefs from `ProductListingPageModel`                      |
| PDP        | canonical breadcrumbs, approved brand/line links, pairings, Cart action     | final hrefs/actions from `ProductDetailPageModel`; never referrer-derived |
| Footer     | approved room, legal, contact, and locale links                             | one shared source; no separate marketplace sitemap menu                   |

The core implementation excludes a global horizontal header, hover-owned primary navigation, and a marketplace mega-menu that mixes all rooms. The command palette is the cross-room discovery surface; PHP sections and page-local controls provide Shop depth. External storefront menus may inform research vocabulary, but they do not change this navigation contract unless a new decision is proposed, reviewed, and accepted in the decision map.

### SHELL-01 - Desktop rail

- Fixed 56px inline-start rail: right in Persian/Arabic, left in English.
- Brand medallion links to the locale landing page and never mirrors.
- Room destinations link to Shop, Booking, and Academy; the active room has a 2px room-accent indicator.
- Command, locale, account, and cart entry points have accessible names and 44px targets.
- Directional icons mirror; room marks and brand mark do not.
- Page content reserves rail space without physical `left`/`right` properties.

### SHELL-02 - Mobile bottom navigation

- Replaces the rail at the accepted mobile breakpoint; never duplicates both interactive navs for assistive technology.
- Includes the destinations accepted by #4/#5, with Shop active on commerce routes.
- Uses safe-area padding and remains reachable without covering page actions or cart controls.
- Active state is visible without relying on color alone.

### SHELL-03 - Command search

- Opens from the command control and documented keyboard shortcut.
- Core delivery contains static, canonical locale-prefixed room/taxonomy destinations and a search field that submits a GET navigation to `/[locale]/shop/search?q=...`.
- Search results, loading, zero-results, invalid-query, operational-error, and unavailable-locale behavior belong to the Search PLP rather than an in-dialog data source.
- Keyboard navigation, escape dismissal, focus restoration, and screen-reader status are explicit.
- Core delivery has no live product autocomplete and therefore introduces no fourth Commerce read or client data endpoint.
- If ticket #5 later approves live autocomplete, amend this plan before implementation with a thin Zod-validated, rate-limited transport that delegates to `listProducts` search scope and maps a bounded public DTO; it may not select price/eligibility in the browser or create another Commerce read.
- Core delivery contains no mega-menu. The separate Shop Relay enhancement remains deferred under `RELAY-01`.

### SHELL-04 - Cart affordance

- Displays `summary.itemCount` only from the Cart module's `getCart({ locale })` outcome.
- Desktop opens the cart drawer after the narrow cart gate; mobile links to `/[locale]/cart`.
- A `locale-unavailable` Cart outcome may retain its non-content item count in the shell, but the drawer/page never renders fallback-locale line content.
- Before cart actions are approved, the affordance may render a non-mutating empty/coming-later state only in development evidence, never as a misleading production control.

### SHELL-05 - Footer

- One semantic `<footer>` with contact, legal, locale, and room links approved for the current phase.
- Locale-prefixed terms, privacy, and returns links remain visible where required even when publishing those pages is a separate prerequisite.
- No invented opening hours, delivery promises, representative claims, or social metrics.
- Mobile order follows the Persian reading/task sequence and does not become a marketplace mega-footer.

### SHELL-06 - Shared route states

- Route-specific `loading.tsx`, `error.tsx`, and not-found behavior reuse common visual anatomy without flattening different state meanings.
- Operational errors include a safe retry where appropriate and an opaque diagnostic reference.
- `locale-unavailable` explains that the Shop is not yet published in that language and provides a Persian route link; it does not fall back silently.

### RELAY-01 - Deferred Shop Relay mega-menu

The Shop Relay is a desired post-core enhancement, not a Stage 2 dependency. It is a Shop-only, visually expressive mega-menu attached to the Shop destination in the desktop rail and may provide direct access to accepted concern, brand, product-type/category, product, and curated recommendation destinations. The Shop destination must remain a reliable link to the PHP; the Relay cannot make that route hover-dependent or replace the primary rail/bottom navigation, PHP, or command search. It does not contain Booking, Academy, Studio, account, or unrelated marketing navigation.

Its visual direction is restrained editorial navigation rather than marketplace chrome: asymmetric grouping, hairline structure, generous spacing, and an approved symbolic background image or illustration that changes coherently with the active group. Motion may coordinate image and content transitions only through approved opacity/transform choreography; it cannot autoplay, delay navigation, obscure labels, or survive when reduced motion is requested.

Before implementation, a dedicated Relay gate must accept:

- its exact Shop-rail trigger, the link-versus-disclosure semantics that preserve direct PHP navigation, and its presence across PHP, PLP, Search, and PDP routes;
- the canonical grouping/order and whether each group is concern, brand, category/product type, product, or approved recommendation;
- the data/content source for every link and recommendation, including explicit curation and display order where applicable;
- how its data fits the existing three Commerce reads/page models without silently adding a fourth public read or duplicating catalog truth;
- final Persian labels, descriptions, image/illustration source, alt/decorative treatment, and locale availability;
- desktop click, hover, focus, escape, outside-click, pointer-travel, and focus-restoration behavior;
- mobile behavior, which may be a nested Shop sheet rather than a desktop mega-menu compressed into a small viewport;
- motion tokens and choreography using compositor-safe opacity/transform transitions, plus an equivalent reduced-motion state;
- contrast/readability over the symbolic image background, including a tokenized overlay/scrim and visible focus;
- payload/image budgets, preload policy, no-foreign-runtime requirement, analytics, and failure/empty behavior.

Each visual group may use one approved app-origin symbolic background image or illustration, but imagery cannot supply the only label, obscure links, autoplay, or turn navigation into an advertising carousel. The Relay must be fully operable without hover and without animation. Product/recommendation entries are omitted when their canonical source or approval is missing; they are never inferred from filenames, generic concern overlap, popularity claims, or client state.

## 4. Landing page requirements

> **Extended by [`landing.md`](landing.md).** `LAND-01`-`LAND-04` below define the Landing's route role, reading order, navigation continuity and responsive rules, and they still bind. What the page is _made of_ - the storytelling spine, the ornament and motion vocabulary, the proof surfaces, and how unapproved source content reaches a development database - is `LAND-05`-`LAND-11` and `CONTENT-01`-`CONTENT-04` in that plan, under the decisions in [`../../21-landing-composition-decisions.md`](../../21-landing-composition-decisions.md).

### LAND-01 - Route role and content source

- Route: `/[locale]`.
- The Landing is the institute's editorial front door, not the PHP and not a generic commerce homepage.
- It may use approved local editorial content and proof sources, but it does not call `getShopHub` or embed a hidden product catalogue.
- Existing unrelated landing content is preserved unless an accepted Landing requirement explicitly replaces it.

### LAND-02 - Planned document structure

The planned reading order is:

1. portrait/interior-led introduction and approved primary claim;
2. approved institute/practitioner proof, with no fabricated counts or credentials;
3. three visually distinct room doors for Shop, Booking, and Academy;
4. approved proof/editorial bands such as testimonials, student work, or consent-safe cases only when their content gates close;
5. one closing invitation and the shared footer.

Each block has one job in the customer journey. Product grids, generic feature-card rows, permanent promotion furniture, and a duplicate Shop taxonomy menu do not belong on the Landing.

### LAND-03 - Navigation and continuity

- Room doors and primary rail destinations use the same canonical navigation definition.
- Selecting Shop enters `/[locale]/shop`; the Landing does not reveal or operate PLP filters.
- Active-room treatment is neutral on the front door and becomes room-specific after navigation.
- Back/forward, locale prefix, focus destination, and reduced-motion behavior are verified across every room-door transition.

### LAND-04 - Responsive and content states

- Mobile keeps the editorial reading order and exposes the accepted bottom navigation without covering the closing action/footer.
- Tablet and desktop preserve asymmetry where supported by the approved imagery and copy.
- Missing optional proof omits the whole approved block; required missing claims/media are content blockers rather than placeholder text.
- Operational failures for any future data-backed proof remain distinct from an intentionally absent optional section.

## 5. PHP requirements

### HUB-01 - Route and SEO

- Route: `/[locale]/shop`.
- `getShopHub({ locale })` is the only data read used by the page.
- Page and metadata share request-local data rather than issuing divergent reads.
- Canonical URL, Persian title/description, Open Graph image, breadcrumbs, and structured data are supplied only after #5 accepts them.
- Unpublished or unsupported locale behavior follows `StorefrontOutcome` exactly.

### HUB-02 - Editorial introduction

- One Persian-first statement explains the expert-guided Shop and the concern-first approach.
- Copy is approved by the business owner and avoids diagnosis, guaranteed results, or unsupported clinical claims.
- Composition uses an asymmetric editorial split or approved local image, not a centered ecommerce banner/card.
- The first primary action leads to concern navigation; secondary search remains available through the shell.

### HUB-03 - Concern-first navigation

- Displays the canonical concerns in database `sortOrder`.
- Each entry links to `/[locale]/shop/concern/[slug]`; the hub never filters a hidden grid in place.
- Entry labels/descriptions use exact-locale approved content.
- Missing required Persian description is a content-integrity issue or intentionally omitted field, not synthesized copy.

### HUB-04 - Brand and category discovery

- Brand and category sections appear only if #5 accepts them and canonical published products exist.
- Official-representative wording is shown only for brands where the canonical flag and approved copy support it.
- Counts, if shown, use the same publication/eligibility predicate as destination listings.

### HUB-05 - Product sections

- The default non-curated section is newest published products ordered by `createdAt` plus stable ID tie-breaker.
- The limit is explicit in the page model and plan; no hidden top-N.
- Curated routines, staff selections, or merchandising require the exact source and ordering accepted by #5.
- Product summaries use the shared offer model and never invent representative variants or comparison prices.

### HUB-06 - States

- **Loading:** geometry-matched editorial and product skeletons.
- **Valid empty:** published Shop with no products shows a clear content/availability message and concern/search recovery only when meaningful.
- **Locale unavailable:** distinct outcome and Persian alternative.
- **Operational error:** never presented as an empty Shop.
- **Partial optional section:** omit an optional section only when the page model marks it absent; never catch and suppress query failures.

## 6. Page-model contract

`ShopHubPageModel` must contain only caller-ready values:

- `seo`: title, description, canonical path, structured-data inputs, social image if canonical;
- `breadcrumbs`;
- `introduction`: eyebrow/title/body/image/action according to accepted content;
- `concerns`, `brands`, and `categories`: label, description when available, href, optional truthful count;
- `productSections`: semantic purpose, heading, explicit limit, product summaries;
- `footerContext` only if the shared footer genuinely varies by room.

Product summaries carry `slug`, `href`, approved names/promise, brand/line/size, canonical media or null, and an explicit offer state. The PHP does not calculate price, availability, or professional access.

## 7. Component composition

```text
StorefrontShell
  Rail (desktop) / MobileBottomNav (mobile)
  CommandSearch
  Main
    LandingScreen
      EditorialIntroduction
      ApprovedProof
      RoomDoorNavigation
      optional ApprovedEvidenceBands
      ClosingInvitation
    or ShopHubScreen
      Breadcrumbs
      ShopIntroduction
      ConcernNavigation
      optional BrandNavigation
      optional CategoryNavigation
      ProductShelf(s)
        ProductGrid
          ProductTile
            Price / PriceOnRequest / Restriction treatment
            StockBadge
  StorefrontFooter
  CartDrawer (desktop, after cart gate)
  optional ShopRelay (post-core, after Relay gate)
```

Reuse `Container`, `Section`, `Rule`, `Breadcrumbs`, `ProductGrid`, `ProductTile`, `Price`, `StockBadge`, `ConcernRail`, `SearchCommand`, `Sheet`, `Skeleton`, and `Sonner` after their Foundation disposition is complete.

Core compositions are limited to `StorefrontShell`, `MobileBottomNav`, `StorefrontFooter`, the Landing sections demanded by `LAND-01` through `LAND-04`, `ShopIntroduction`, semantic PHP navigation sections, and `ProductShelf`. `ShopRelay` is excluded from core and may be added only through its accepted post-core gate.

## 8. Responsive and interaction behavior

### Mobile - 390px target

- Bottom navigation owns global movement; no persistent desktop rail.
- PHP sections remain scroll-document content with at least the accepted mobile spacing.
- Concern/brand navigation becomes a readable one-column or horizontal treatment only if touch, focus, and overflow are proven.
- Product grid follows the accepted mobile column count; product names/prices do not clip or force horizontal scrolling.
- Footer and cart controls clear the bottom-navigation safe area.

### Tablet - 768px target

- The rail/bottom-nav breakpoint is accepted and documented rather than inferred per component.
- Asymmetric sections may compress but retain hierarchy and logical order.

### Desktop - 1440px target

- 56px rail remains fixed; content uses the full editorial canvas.
- Major sections retain at least 96px vertical separation.
- Layout uses 60/40 or 70/30 asymmetry where content supports it.

### Keyboard and reduced motion

- Skip link enters `<main>`.
- Rail/bottom-nav/command order is predictable.
- Command focus returns to its trigger.
- All hover affordances have keyboard equivalents.
- Motion uses token duration/easing and collapses through `prefers-reduced-motion`.

## 9. Phased task list

### NAV1 - Accept the navigation manifest

1. Record one ordered canonical definition containing stable item ID, localized label key, destination/action, owning room, active-match rule, availability gate, desktop placement, and accepted mobile placement.
2. Close the mobile item/order, Studio/account, locale-unavailable switching, and command taxonomy decisions named in the prerequisites.
3. Add pure tests proving locale prefixing, active-room matching, stable ordering, and the absence of duplicate desktop/mobile definitions.
4. Record the rejection of a cross-room marketplace mega-menu and the separate deferred status of the Shop Relay.

**Verify:** every shell destination and action has one source and one accepted responsive placement before shell composition begins.

### SH1 - Pin current landing and rail behavior

1. Add characterization tests for existing locale landing links, rail destinations, direction, and current focus behavior.
2. Capture Persian desktop/mobile baseline screenshots before shell changes.
3. Record any baseline defects separately from task regressions.

**Verify:** targeted rail/landing tests pass before restructuring.

### SH2 - Build shell contracts

1. Add failing tests for locale-aware destinations, active room, mobile/desktop visibility, accessible names, and unavailable-locale recovery.
2. Implement shared shell compositions using existing tokens and logical properties.
3. Add footer content only from approved sources.

**Verify:** component/route tests and browser keyboard traversal.

### LAND1 - Integrate the Landing with the accepted shell

1. Add failing route/component tests for the planned Landing reading order, room-door destinations, neutral front-door state, approved content omissions, and absence of product/PLP behavior.
2. Move existing Landing composition under the shared shell without an unrelated visual rewrite.
3. Add only approved missing Landing blocks whose content source and acceptance journey are recorded.

**Verify:** `/fa` preserves the accepted editorial hierarchy and enters each canonical room through the shared navigation definition at all required viewports.

### SH3 - Integrate command search entry and cart entry

1. Add failing tests for open/close, focus restore, static destination hrefs, query encoding, and GET navigation to the Search PLP.
2. Keep live autocomplete absent unless #5 approves it and this plan records its transport contract.
3. Connect the cart affordance to `getCart({ locale })` only after the narrow Cart contract exists.

**Verify:** keyboard-only search journey and mobile cart navigation.

### HUB1 - Implement `getShopHub`

1. Add interface tests for publication, locale, ordered concerns, stable newest products, explicit limits, optional sections, and operational failures.
2. Implement batched Drizzle projections with no component/query-row leakage.
3. Produce complete SEO/page models from the same read.

**Verify:** real database integration fixtures and query-count assertion.

### HUB2 - Compose `/shop`

1. Add failing route tests for ready, empty, locale-unavailable, not-found where applicable, and thrown-error mapping.
2. Implement the Server Component page and route states.
3. Integrate only approved sections and Persian source copy.

**Verify:** route tests, metadata assertions, build.

### HUB3 - Browser QA and refinement

1. Exercise landing-to-Shop, concern entry, command search, locale unavailable, empty, and error journeys.
2. Capture 390, 768, and 1440 screenshots after the last UI edit.
3. Fix RTL, focus, typography, overflow, safe-area, and visual-hierarchy defects.
4. Re-run the complete fresh capture set after fixes.

### RELAY0 - Post-core Relay design and approval gate

1. Start only after Shell/PHP, PLP/Search, and PDP pass their core exit gates.
2. Produce the accepted Relay information architecture, taxonomy/content manifest, responsive interaction specification, motion storyboard, imagery/contrast contract, page-model/data decision, and numeric payload budget.
3. Prototype and test keyboard, pointer, touch, reduced-motion, image-failure, locale-unavailable, and long-Persian-label behavior before production implementation is scheduled.
4. Amend the component foundation, shell plan, verification matrix, and affected page-model tasks with the accepted design.

**Verify:** maintainer approval records the exact Relay scope and evidence; otherwise it remains deferred and no production component/data contract is added.

## 10. Test scenarios

- The canonical route manifest produces the same IDs, labels, destinations, and active-room behavior for rail, bottom navigation, command, and footer consumers.
- The exact accepted mobile items and order remain stable at 390px; desktop-only items remain reachable through the accepted mobile utility path.
- Landing renders the approved editorial sequence, links its three room doors correctly, and contains no product-grid or PLP filter behavior.
- Persian visitor sees the Shop room active and follows a concern link with the `fa` prefix.
- PHP concern/brand/category links, PLP breadcrumbs/filter/sort/page links, and PDP breadcrumbs/brand/line/pair links remain page-owned secondary navigation rather than shell menu items.
- English/Arabic visitor without approved catalog content sees `locale-unavailable`, not Persian fallback copy.
- Keyboard user opens command search, navigates static destinations or submits a query to the Search PLP, closes it, and regains focus.
- A database failure reaches the error surface and never shows a zero-product PHP.
- Empty published catalog shows the valid empty state without fake products.
- `on_request` and restricted product summaries never expose an add action.
- Desktop cart trigger and mobile `/cart` destination remain semantically consistent after the cart gate.
- No runtime request is made to a foreign font/script/stylesheet host.
- Core routes contain no cross-room marketplace mega-menu or hover-only primary navigation; the Shop Relay is absent until `RELAY0` is approved and scheduled.

## 11. Exit gate

- #2, #4, and #5 decisions are accepted and linked.
- `NAV1` is accepted with exact mobile placement/order, Studio/account relationship, locale switching, command sections, and active-match rules.
- Shared shell works on the landing page and `/fa/shop` without unrelated landing redesign.
- Landing, PHP, and every primary/secondary navigation boundary match the canonical page hierarchy in the master plan.
- PHP uses `getShopHub` and canonical data only.
- Every route state is implemented and tested.
- Persian RTL, keyboard, reduced-motion, and responsive evidence passes.
- Metadata and structured data are accepted and source-backed.
- No cross-room marketplace mega-menu, product-card box/shadow, raw color, or physical-direction CSS was introduced. The deferred Shop Relay remains absent unless separately accepted after core release.
