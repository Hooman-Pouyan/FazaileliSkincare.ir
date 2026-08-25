# Product Detail Page and cart entry - phased implementation plan

**Parent:** [`../storefront.md`](../storefront.md)  
**Depends on:** component foundation, shell/PHP, PLP offer policy, decision-map #2/#4/#6, and the approved Cart slice in [`../cart-checkout-payment-fulfilment-and-returns.md`](../cart-checkout-payment-fulfilment-and-returns.md)  
**Routes:** `/[locale]/shop/p/[slug]` and `/[locale]/cart`  
**Primary acceptance locale:** `fa`
**Cross-cutting contracts:** [`../../architecture/data-and-state-ownership.md`](../../architecture/data-and-state-ownership.md), [`../../architecture/errors-and-actions.md`](../../architecture/errors-and-actions.md), and [`../../ui/forms.md`](../../ui/forms.md)

## 1. Outcome and journeys

Deliver an editorial PDP that helps a customer understand what a product is for, how to use it, whether it is suitable, what it costs, whether it is available, and what to do when purchase is restricted or uncertain. The PDP must not diagnose, invent clinical claims, imply authenticity evidence that is not approved, or silently add restricted/on-request products to a cart.

Primary journeys:

1. self-service buyer selects a variant and adds an eligible product;
2. customer encounters `on_request` and follows the approved enquiry path;
3. unverified professional/customer sees a restriction explanation and approved next step without price leakage;
4. customer compares variants/availability and recovers from sold-out state;
5. uncertain or post-treatment visitor reaches an approved human escalation path;
6. mobile customer reviews the cart on a real URL without entering checkout.

## 2. Prerequisites

- #2 accepts Iran-specific product, delivery, return, support, and privacy obligations.
- #4 accepts the PDP/cart customer journeys and escalation thresholds.
- #6 accepts claims, suitability, ingredients, usage, evidence, origin, delivery/returns, professional restrictions, pairing, guidance, safety, and structured-data requirements.
- The dedicated transaction plan's Cart slice accepts guest/account ownership, merge, reservation lifecycle, retry/idempotency, server revalidation, and checkout boundary.
- Ordered product media with approved alt text has a canonical data source.
- Explicit product-pair relationships and display order have a canonical data source.
- Professional eligibility has a canonical server-owned source. Until it exists, restricted products fail closed.
- Persian content and all clinical/product claims are approved by the business owner.
- IRC/authenticity display remains separately deferred and is not implemented by implication from #6 research.

## 3. PDP requirements

### PDP-01 - Route, publication, and locale

- Route: `/[locale]/shop/p/[slug]`.
- `getProduct({ locale, slug })` is the only page read.
- Unknown, unpublished, or unapproved-locale product maps to the typed outcome.
- Page and metadata share request-local read data.
- No route imports catalog schema or constructs fallback content.

### PDP-02 - Editorial identity and hierarchy

- 60/40 or accepted responsive split between media and product information.
- Shows approved product name, brand/line, one-line promise, size/variant context, and origin/representative wording only when canonical.
- Persian promise/copy is concise, factual, and non-diagnostic.
- Product identity remains visible while variant/offer state changes without creating a sticky obstruction on mobile.

### PDP-03 - Ordered media

- Media order, publication, asset path, dimensions/aspect ratio, and alt text are canonical.
- All runtime URLs follow the no-foreign-host rule.
- Primary media is server selected from explicit order; the browser does not infer it.
- Gallery selection is a client leaf; thumbnail buttons have accessible names and selected state.
- Missing optional media uses an approved no-media treatment. A required missing image is a content-integrity error if the publication contract requires one.
- No autoplay carousel or hover-only zoom.

### PDP-04 - Variants

- Render only active variants.
- Variant option includes canonical identifier, localized size label, offer state, and availability.
- No default variant is invented. If one canonical purchasable variant exists, it may be selected by the accepted policy; otherwise the user chooses.
- Changing variant updates only client-visible selected offer data already provided by the server page model; it does not recalculate price or stock.
- Selection remains keyboard-operable and announced.

### PDP-05 - Offer state

Offer-state precedence and copy are server-owned and exhaustively rendered:

1. **restricted** - professional eligibility required or unavailable; no protected price leak; approved explanation/action;
2. **on_request** - explicit product price visibility; approved enquiry action; never add-to-cart;
3. **unavailable** - no eligible in-stock variant or inactive catalog state; sold-out explanation/recovery;
4. **variant-required** - multiple eligible variants and no accepted default;
5. **purchasable** - selected eligible variant, integer-rial amount, truthful availability, add action allowed.

Missing price is never converted into `on_request`. Negative effective stock is an integrity fault. Compare-at pricing and price-history promotion display remain absent unless separately approved.

### PDP-06 - Price and availability presentation

- Database/domain amount remains `bigint` rials.
- Persian view displays toman through the one approved formatter with Persian digits and U+066C grouping.
- Client leaf receives a branded rial string only if it needs the selected variant amount.
- Availability uses `inventory.onHand - SUM(inventoryReservation.quantity)` for active, unexpired reservations of the selected variant; display labels follow accepted #6/cart copy.
- Price, stock, and restriction changes are announced without stealing focus.

### PDP-07 - Disclosures

- Use accordion, not tabs.
- Candidate sections are ingredients, usage, suitability, safety, delivery, and returns; final list/order comes from #6.
- Section content is server rendered and available to crawlers/assistive technology.
- Empty optional sections are omitted only when allowed by the approved content contract.
- No unsupported authenticity/IRC section is added.

### PDP-08 - Pairing and routines

- Label is the approved Persian equivalent of “Pairs with,” never generic “related products.”
- Source is explicit product-pair rows with direction/sort order.
- Limit is visible and bounded to three unless #6 accepts another value.
- Pairing cannot bypass publication, locale, eligibility, or offer policy.
- No concern/category inference is used as a fallback.

### PDP-09 - Escalation and restricted actions

- Approved enquiry/consultation/support destination comes from #4/#6.
- Copy explains why self-service purchase is unavailable without shaming or making a diagnosis.
- WhatsApp/chat behavior requires accepted staffing, privacy, availability-hours, and failure policy; otherwise use a stable contact route.
- No fake “contact us” action that points nowhere.

### PDP-10 - Route states and SEO

- Loading skeleton matches gallery/information/disclosure geometry.
- Not-found, locale-unavailable, and operational error remain distinct.
- SEO title/description/canonical/social image and Product structured data include only canonical approved fields.
- Structured data never exposes a hidden price or false availability.

### PDP-11 - Navigation and journey continuity

- Inbound PHP/PLP/Search/Relay product links always resolve the same canonical locale-prefixed PDP; the PDP does not vary its truth or breadcrumb ancestry by referrer.
- Breadcrumbs use one accepted canonical ancestry from the page model, such as Home → Shop → canonical scope → Product. Ticket #6 must settle the scope rule when a product belongs to multiple categories/concerns.
- Approved brand and line labels may link to canonical listing routes only when those routes and exact-locale content are published.
- “Pairs with” is product-to-product discovery and follows explicit ordered relationships; it is not a replacement for breadcrumbs or a generic related-products loop.
- Add-to-cart opens/updates the desktop Cart drawer or supports the canonical mobile/direct `/[locale]/cart` journey only after the Cart gate. Checkout is not a PDP navigation destination in this program.
- Browser back remains normal browser history. The UI does not invent a “back to results” URL from referrer or copy hidden PLP state into Zustand.

## 4. Product page model

`ProductDetailPageModel` contains:

- `seo` and `breadcrumbs`;
- `product`: slug, name, promise, approved description context, brand/line links, origin/representative facts;
- `media`: ordered source, alt, dimensions/aspect ratio;
- `variants`: canonical identifier, label, offer state;
- `primaryOffer`: explicit server-selected state when one exists;
- `disclosures`: approved key/title/body list;
- `pairsWith`: bounded page-ready summaries;
- `escalation`: approved action when required.

The model does not contain raw Drizzle rows, cart ownership, browser-inferred media, guessed translations, or hidden restricted prices.

## 5. Cart-slice requirements

Cart implementation starts only after the maintainer accepts the Cart slice in [`../cart-checkout-payment-fulfilment-and-returns.md`](../cart-checkout-payment-fulfilment-and-returns.md). The rest of that transaction program remains separately phased.

### CART-01 - Ownership

- Guest cart uses a high-entropy server-issued identifier in an httpOnly, SameSite cookie; it is not trusted from arbitrary client input.
- Authenticated cart ownership comes from the server session.
- Guest-to-account merge behavior, conflict handling, and expiry follow the accepted cart decision.
- Every action performs Zod parse first, ownership/authorization second, database work third.

### CART-02 - Actions

- `addLine`: accepts canonical variant ID and positive integer quantity; re-resolves publication, locale-independent catalog identity, eligibility, price visibility, and availability.
- `setLineQuantity`: validates ownership, positive quantity/accepted maximum, availability, and reservation renewal.
- `removeLine`: validates ownership and releases reservation inside the same transaction.
- Expected errors are typed and mapped to Persian action feedback; unknown faults propagate to the operational error boundary/logging.
- Retry/idempotency semantics follow the accepted cart decision.

### CART-03 - Reservation lifecycle

- Adding/updating creates or renews the cart item's active `inventoryReservation` row with the accepted quantity, `expiresAt`, status, and idempotency key in the same transaction.
- Cart operations never decrement `inventory.onHand`.
- Remove/expiry resolves the reservation row to `released`/`expired` with the required resolution timestamp through the accepted synchronous/request-time reclamation strategy; no mutable reserved counter or deferred background queue is introduced.
- The accepted TTL is explicit and visible in operational documentation, not a silent constant.
- Concurrency tests prove two carts cannot reserve more than available stock.

### CART-04 - Cart read, model, and totals

- `getCart({ locale })` resolves ownership from the server session/anonymous cookie and returns `CartOutcome<CartPageModel>`; callers never pass cart/user/customer-group identity.
- Every outcome carries `summary.itemCount`; `ready` returns line ID, exact-locale variant/product identity, approved media, quantity, current server price/offer status, availability, and server-computed subtotal in rials.
- `locale-unavailable` never renders fallback line content; operational/integrity failures throw and never impersonate an empty cart.
- Changed price, expired reservation, unavailable/restricted item, and removed/unpublished product are explicit line states.
- Cart UI never treats its previously rendered price as authoritative.
- Checkout totals and settlement are outside this program.

### CART-05 - Drawer and mobile page

- Desktop cart drawer and `/[locale]/cart` render the same Cart module model.
- Drawer preserves focus and restores it to the trigger.
- Mobile page clears bottom navigation safe area and supports direct/share/reload behavior.
- Quantity changes show pending/error/success state without optimistic commerce lies.
- Empty cart has a useful Shop/concern return action.
- Checkout action is absent or explicitly disabled behind the later transaction program; do not ship a dead button.

## 6. Component composition

```text
ProductDetailScreen
  Breadcrumbs
  ProductHero (60/40)
    ProductGallery (client leaf)
    ProductPurchasePanel
      Brand/line/name/promise
      VariantSelector (client leaf)
      Price / OfferState
      StockBadge
      QuantityStepper (client leaf)
      AddToCart or approved alternative
  ProductDisclosure
  PairsWith
    ProductGrid/ProductTile
  CartDrawer (shared Cart module)

CartScreen
  PageHeader
  CartLineList
    CartLine
      QuantityStepper
      Remove action
      Line state/error
  CartSummary
  EmptyState
```

Existing components to migrate/adapt: `ProductGallery`, `ProductDisclosure`, `PairsWith`, `Price`, `PriceOnRequest`, `StockBadge`, `QuantityStepper`, `ProductGrid`, `ProductTile`, `CartDrawer`, `Accordion`, `Sheet`, `Skeleton`, `Sonner`, and `EmptyState`.

New components are limited to `ProductDetailScreen`, `ProductHero`, `ProductPurchasePanel`, `VariantSelector`, exhaustive `OfferState`, `CartScreen`, `CartLineList`, and typed action feedback.

## 7. Data prerequisites

### Ordered media contract

The data stage must define product relation, storage key/app-origin URL, media kind, sort order, width/height or aspect ratio, publication state, and approved alt text. Exact schema shape is reviewed with the catalog module before migration; the UI never reads temporary Storyderm filenames as truth.

### Pairing contract

Define source product, paired product, sort order, active/publication policy, and whether relation is directional. Duplicate/self-pair rows are rejected at the database/application boundary.

### Locale contract

Persian PDP content uses existing canonical fields after approval. English/Arabic route publication remains off until the data model can represent complete approved content; no schema-independent fallback logic is added.

## 8. Responsive, RTL, and accessibility

### Mobile 390px

- Gallery and purchase information stack in task order.
- Variant/quantity/add controls remain visible and operable without sticky overlap.
- Long Persian names and Latin brand strings wrap naturally.
- Accordion and cart targets are at least 44px.
- Cart page is primary; drawer does not become an inaccessible full-screen duplicate.

### Tablet 768px

- Split may remain or stack according to measured content; no narrow unreadable purchase column.
- Gallery thumbnails and disclosure widths avoid horizontal overflow.

### Desktop 1440px

- 60/40 editorial split, hairline/whitespace separation, no card container.
- Product identity and purchase decision remain above the first disclosure without crowding.
- Major sections retain 96px spacing.

### Accessibility

- Gallery/variant/quantity controls have explicit names, selected/disabled state, and keyboard operation.
- Price/availability updates use appropriate live announcements without repetition.
- Accordions expose heading/button relationships.
- Restricted/on-request copy is not encoded by color alone.
- Drawer focus trap/restore and page landmark order are verified.
- Reduced motion covers gallery/disclosure/drawer transitions.

## 9. Phased task list

### PDP1 - Close content, data, and offer decisions

1. Accept #6 and the dedicated transaction plan's Cart slice.
2. Approve ordered media, pairings, professional eligibility, disclosure, escalation, offer-state rules, canonical breadcrumb ancestry, and published brand/line destinations.
3. Update this plan with exact accepted copy/field requirements and explicit deferrals.

**Verify:** no PDP/cart task depends on a placeholder policy.

### PDP2 - Define page model and offer policy with TDD

1. Add failing tests for published/unpublished/exact-locale behavior and every offer-state precedence case.
2. Add failing tests for variants, media order, disclosure omission, pairing constraints, and hidden restricted prices.
3. Implement readonly types, policy functions, and exhaustive render mapping.

**Verify:** all variants are type-exhaustive and incorrect states cannot be constructed through the public interface.

### PDP3 - Add canonical media/pairing data

1. Write migration tests/constraints or schema assertions first.
2. Add minimal canonical relations required by approved PDP behavior.
3. Add fixtures with real app-origin placeholder assets only where clearly labeled test data.

**Verify:** migration SQL is reviewed before application; integrity fixtures prove ordering/duplicate/publication behavior.

### PDP4 - Implement `getProduct`

1. Add interface tests for ready/not-found/locale-unavailable and operational faults.
2. Implement bounded batched query/projection for product, variants/offers, media, disclosures, and three pairings.
3. Reuse the same offer policy as PHP/PLP.

**Verify:** real Postgres fixtures, no N+1, request-local metadata/page reuse.

### PDP5 - Compose the route

1. Migrate/adapt current PDP presentation components.
2. Add component/route tests for canonical breadcrumbs, brand/line links, gallery, variant changes, offers, disclosures, pairing, Cart continuity, route states, and metadata.
3. Implement `/[locale]/shop/p/[slug]`, loading, error, and not-found mapping.

**Verify:** targeted Vitest, typecheck, build.

### CART1 - Implement the approved Cart module

1. Add failing read/action integration tests for ownership, ready/empty/locale-unavailable/error outcomes, add/update/remove, price/eligibility/stock recheck, TTL, expiry release, retry, and concurrency.
2. Implement `getCart`, shared Zod schemas, the three named actions, scoped Zustand interaction store, transactions, and typed action results.
3. Keep drawer visibility/pending interaction in Zustand while cart lines, totals, availability, eligibility, reservations, and errors remain server/Query/action owned.
4. Decide whether the drawer is the first TanStack Query consumer. If yes, close the documented query-key, hydration, stale/retry, invalidation, and error gate; if no, use the Server Component/Action refresh path and do not install Query for consistency alone.
5. Migrate cart presentation and make drawer/page share one server-owned model.
6. Do not add checkout/payment behavior.

**Verify:** action tests with real database transactions and concurrent reservation scenarios.

### PDP6 - Browser QA and refinement

1. Exercise purchasable single/multi-variant, on-request, restricted, sold-out, missing locale, unpublished, operational error, and pairing states.
2. Enter from PHP, each PLP family, Search, and a direct URL; verify one canonical PDP and page-model-owned breadcrumb ancestry.
3. Add/update/remove cart lines on desktop and mobile; reload and direct-open `/cart`.
4. Capture fresh 390, 768, and 1440 screenshots after the last edit.
5. Repair visual, Persian wrapping, focus, announcement, drawer, and safe-area defects; recapture all required pages.

## 10. Required fixtures and scenarios

- One published product with one purchasable variant.
- Multi-variant product requiring selection.
- `on_request` product with no add action.
- Professional-only product for ineligible and eligible server contexts.
- Sold-out product and product with reserved inventory.
- Public-price product missing public price (integrity fault).
- Inactive variant and unpublished product.
- Ordered media and no-media case.
- Complete/partial optional disclosures under accepted policy.
- Three valid pairings plus invalid/unpublished/restricted pairing candidates.
- Persian content with Latin brand/ingredient fragments.
- English/Arabic unavailable locale.
- Guest cart, authenticated cart, merge conflict, expired reservation, price change, item unpublished, and concurrent reservation contention.
- Database failure distinct from not-found/sold-out.

## 11. Exit gate

- #6 and the transaction plan's Cart decisions are accepted and linked.
- Ordered media, pairings, and professional eligibility have canonical sources or fail-closed behavior.
- PDP uses `getProduct` and exhaustive offer states.
- PDP navigation and breadcrumb ancestry are canonical, page-model-owned, and independent of referrer or copied PLP state.
- Restricted/on-request products cannot silently enter the cart or leak protected price.
- Cart actions parse, authorize/resolve ownership, revalidate, and transact in the required order.
- Reservations do not decrement on-hand stock and concurrency is tested.
- Desktop drawer and mobile `/cart` share one model.
- Persian RTL, keyboard, reduced-motion, responsive, error, and accessibility journeys pass.
- No checkout/payment/settlement or IRC/authenticity display was introduced.
