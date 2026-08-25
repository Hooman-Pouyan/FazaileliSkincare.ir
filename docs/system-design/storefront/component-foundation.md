# Storefront component foundation - capability and implementation plan

**Parent:** [`../storefront.md`](../storefront.md)  
**Cross-cutting contracts:** [`../../architecture/README.md`](../../architecture/README.md) and [`../../ui/_template.md`](../../ui/_template.md)  
**Stage:** 1, with post-core rows feeding Stage 5  
**Status:** Planning baseline; rows marked research-blocked require accepted decision-map evidence

## 1. Outcome

Complete the smallest coherent UI system required by the storefront shell, PHP, PLP, PDP, and approved cart slice. The Claude Design inventory is used to detect missing capabilities, not to copy its appearance or install every possible component.

At the end of this stage:

- generic controls remain under `src/components/ui`;
- generic layout remains under `src/components/layout`;
- commerce presentation lives under `src/modules/commerce`;
- cart presentation lives under `src/modules/cart`;
- every approved primitive has default, hover, focus-visible, active, disabled, loading, error, RTL, and reduced-motion behavior where applicable;
- every visual value comes from `designs/tokens.json`/`designs/tokens.css`;
- no customer-facing composition resembles an admin card/table dashboard.

## 2. Disposition vocabulary

- **Reuse:** already present and adequate after verification.
- **Adapt:** present, but a required state, RTL behavior, accessibility rule, or storefront variant is missing.
- **New composition:** assemble existing primitives into a storefront-specific module component.
- **Research-blocked:** useful only after a named product/content decision is accepted.
- **Approved post-core:** implement after PHP/PLP/PDP pass.
- **Defer:** valid capability, but outside this storefront program.
- **Reject:** conflicts with an explicit architecture, brand, or scope decision.

## 3. Existing source inventory

The attached Claude Design capability-index screenshots are the current external inventory evidence. Recheck the shared Claude project before the Foundation gate closes; add any newly visible item as a matrix row with the same source/disposition/dependency/acceptance fields. A newly visible item does not override repository tokens, brand rules, or scope.

### Generic UI

`accordion`, `badge`, `button`, `checkbox`, `collapsible`, `dialog`, `input`, `label`, `scroll-area`, `separator`, `sheet`, `skeleton`, `slider`, and `sonner` already exist.

### Generic layout

`Container`, `Section`, `Rule`, `Breadcrumbs`, `PageHeader`, `EmptyState`, and the persistent `Rail` already exist.

### Commerce presentation

`CartDrawer`, `ConcernRail`, `FacetRail`, `FilterDrawer`, `Pagination`, `PairsWith`, `PlpToolbar`, `Price`, `PriceOnRequest`, `ProductDisclosure`, `ProductGallery`, `ProductGrid`, `ProductTile`, `QuantityStepper`, `SearchCommand`, `SortChips`, and `StockBadge` already exist as presentation components.

These files are not proof that the capability is complete. Each must be checked against the accepted page plan, server/client ownership, exact state model, Persian copy, RTL, keyboard behavior, and real data contract.

## 4. Primitive capability matrix

### Buttons and inputs

| Claude capability | Evidence/current source | Disposition                                    | Owner/stage        | Prerequisite and acceptance                                                                                                          |
| ----------------- | ----------------------- | ---------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Buttons           | `ui/button.tsx`         | Adapt                                          | Foundation         | Add/verify primary, secondary, ghost, destructive, loading, disabled, icon-leading/trailing; 44px target; visible focus; 2px radius. |
| Button Group      | Button primitive        | New composition                                | Foundation         | Logical border joining in RTL; roving or normal tab order matches use; no rounded pill default.                                      |
| Icon Buttons      | Button primitive        | Adapt                                          | Shell/PLP/PDP      | Accessible name required; Lucide 16/20/24 grid; directional icons mirror; 44px target.                                               |
| Input group       | Input/Label             | New composition                                | Foundation         | One visible label, help/error ownership, prefix/suffix direction safety, focus ring around the correct interactive element.          |
| Text Input        | `ui/input.tsx`          | Adapt                                          | Foundation         | Visible label, described error, autocomplete/inputmode policy, 44px height, exact RTL/LTR value handling.                            |
| Select            | Missing                 | New primitive                                  | Foundation         | Add only for a confirmed use; visible label, keyboard/typeahead, portal direction, no placeholder-as-label.                          |
| Textarea          | Missing                 | New primitive                                  | Approved post-core | Needed for contact/review-like forms only after route approval; same Field contract as input.                                        |
| Input Number      | Quantity stepper exists | Adapt                                          | PDP/cart           | Do not use generic floating-number semantics for money; quantity accepts positive integers and exposes increment/decrement labels.   |
| OTP input         | Missing                 | Defer                                          | Account/Auth       | Belongs to phone authentication, not storefront foundation.                                                                          |
| File Input        | Missing                 | Defer                                          | Account/Admin      | Receipt/content uploads are outside this program.                                                                                    |
| Checkbox          | `ui/checkbox.tsx`       | Adapt                                          | PLP                | Verify label target, indeterminate state if required, 44px row, and RTL alignment.                                                   |
| Radio             | Missing                 | New primitive if #5 requires exclusive filters | PLP                | Keyboard group semantics and visible selected state; otherwise omit.                                                                 |
| Switch            | Missing                 | Defer                                          | Account/Admin      | No approved storefront switch behavior.                                                                                              |
| Form              | No shared Field set yet | New composition                                | Cart/post-core     | One react-hook-form + Zod form contract; no form factory and no duplicate client/server schema.                                      |
| Field             | Label/Input primitives  | New composition                                | Foundation         | Shared label, description, control, and error anatomy; `aria-describedby`; server/client schema reuse.                               |

### Navigation

| Claude capability    | Evidence/current source   | Disposition                       | Owner/stage              | Prerequisite and acceptance                                                                                                                                                       |
| -------------------- | ------------------------- | --------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Breadcrumbs          | `layout/breadcrumbs.tsx`  | Adapt                             | PHP/PLP/PDP              | Locale-prefixed links, current-page semantics, mobile overflow, mirrored separator icon.                                                                                          |
| Progress             | Missing                   | Defer                             | Checkout/Booking         | Transaction flows are outside storefront discovery/cart scope.                                                                                                                    |
| Tabs                 | Missing                   | Reject for PDP                    | PDP                      | Accordions are the settled progressive-disclosure pattern; no hidden tab content.                                                                                                 |
| Pagination           | `commerce/pagination.tsx` | Adapt                             | PLP                      | Server-generated hrefs, current-page semantics, prev/next mirroring, keyboard and small-screen compression.                                                                       |
| Toggle               | Missing                   | New primitive only if #5 approves | PLP                      | Use for a genuine binary URL filter; never invent one to justify the primitive.                                                                                                   |
| Toggle group         | Missing                   | Adapt via sort chips              | PLP                      | Sort chips remain links/URL state unless #5 requires a selectable group; 44px targets.                                                                                            |
| Navigation menu      | Existing Rail             | Adapt                             | Shell                    | Rail is the primary navigation contract; no cross-room horizontal ecommerce menu.                                                                                                 |
| Shop Relay mega-menu | Missing                   | Defer                             | Approved post-core/Shell | Shop-only concern/brand/category/product/recommendation relay; requires `RELAY0` taxonomy, page-model/data, imagery, motion, responsive, accessibility, and performance approval. |
| Menubar              | Missing                   | Reject                            | Shell                    | A cross-room application menubar conflicts with the one-room-at-a-time shell and command palette; this does not reject the separately deferred Shop Relay.                        |
| Data table           | Missing                   | Reject for storefront             | Admin                    | Dashboard/table language is admin-only.                                                                                                                                           |
| Sidebar              | Existing Rail/facet rail  | Adapt                             | Shell/PLP                | Distinguish global rail from PLP facet rail; each owns one scroll region and mirrors logically.                                                                                   |
| Combobox             | Missing                   | Research-blocked                  | Search                   | Add only if accepted search/guidance behavior requires selection; otherwise command results suffice.                                                                              |

### Data display and overlays

| Claude capability | Evidence/current source       | Disposition                                     | Owner/stage              | Prerequisite and acceptance                                                                                                                                                                                                   |
| ----------------- | ----------------------------- | ----------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Item              | Product/concern rows exist    | Adapt                                           | Foundation               | Define semantic list-row anatomy rather than a generic catch-all item API.                                                                                                                                                    |
| Card              | No storefront card            | Reject for product content                      | Storefront               | Products remain borderless image + type; cards remain admin-only.                                                                                                                                                             |
| Accordion         | `ui/accordion.tsx`            | Reuse/adapt                                     | PDP                      | Server-visible content, keyboard behavior, visible focus, reduced motion, Persian titles.                                                                                                                                     |
| Popover           | Missing                       | New primitive if demanded                       | Search/PLP               | Add only for a real anchored interaction; correct focus dismissal and RTL placement.                                                                                                                                          |
| Dialog            | `ui/dialog.tsx`               | Adapt                                           | Quick view/alerts        | Scrim + hairline, no shadow, focus trap/restore, surface radius, mobile fallback.                                                                                                                                             |
| Avatar            | Missing                       | Approved post-core                              | Testimonials/credentials | Only real people with approved assets and meaningful alt text.                                                                                                                                                                |
| Badge             | `ui/badge.tsx`                | Adapt                                           | PLP/PDP                  | Restrict to stock/professional/capacity states; no permanent sale furniture.                                                                                                                                                  |
| Tooltip           | Missing                       | Adapt through Radix if needed                   | Shell                    | Never the only label; keyboard/hover parity; avoid on touch-primary actions.                                                                                                                                                  |
| Dropdown menu     | Missing                       | Defer unless accepted                           | Shell/Account            | Command palette and direct links cover storefront navigation.                                                                                                                                                                 |
| Alert             | Missing                       | New composition                                 | Routes/cart              | Inline operational/restriction/validation states; live-region behavior chosen by severity.                                                                                                                                    |
| Alert Dialog      | Dialog primitive              | New composition                                 | Cart                     | Only for destructive cart confirmation if research accepts it; otherwise undo/toast is preferred.                                                                                                                             |
| Slider            | `ui/slider.tsx`               | Adapt                                           | PLP                      | Price in integer rials; paired numeric inputs/labels; keyboard step; URL serialization; #5 gate.                                                                                                                              |
| Calendar          | Missing                       | Defer                                           | Booking                  | Jalali booking surface is a separate program.                                                                                                                                                                                 |
| Date picker       | Missing                       | Defer                                           | Booking/Account          | No storefront discovery requirement.                                                                                                                                                                                          |
| Sheet             | `ui/sheet.tsx`                | Adapt                                           | Filters/cart             | RTL edge, scrim, focus trap/restore, no shadow, desktop/mobile ownership.                                                                                                                                                     |
| Hover card        | Missing                       | Reject for essential content                    | Storefront               | Hover-only content is inaccessible and poor on mobile.                                                                                                                                                                        |
| Drawer            | Sheet primitive               | Adapt                                           | Cart/filters             | Use Sheet implementation; do not add a competing overlay primitive.                                                                                                                                                           |
| Collapsible       | `ui/collapsible.tsx`          | Reuse/adapt                                     | PLP                      | Facet groups; button semantics, expanded state, reduced motion.                                                                                                                                                               |
| Separator         | `ui/separator.tsx`            | Reuse                                           | All                      | Use token hairlines; decorative separators hidden from accessibility tree.                                                                                                                                                    |
| Skeleton          | `ui/skeleton.tsx`             | Adapt                                           | All routes               | Match final geometry and media aspect ratios; no fake textual content; prevent CLS.                                                                                                                                           |
| Carousel          | Missing                       | Reject by default                               | Storefront               | No autoplay; gallery uses explicit media selection. Reconsider only with a specific approved journey.                                                                                                                         |
| Sonner            | `ui/sonner.tsx`               | Adapt                                           | Cart                     | Persian bottom-start, accessible announcement, no success toast before server confirmation.                                                                                                                                   |
| Table             | Missing                       | Reject for storefront                           | Admin                    | Admin-only capability.                                                                                                                                                                                                        |
| Command           | `commerce/search-command.tsx` | Adapt                                           | Shell/search             | Static locale-aware room/taxonomy destinations plus GET submission to the canonical search PLP, keyboard navigation, focus restore, and no core mega-menu. Live product autocomplete and the Shop Relay are separately gated. |
| Kbd               | Missing                       | New micro-primitive                             | Shell                    | Visual shortcut hint only; localize platform label; hidden where shortcut unavailable.                                                                                                                                        |
| Scroll area       | `ui/scroll-area.tsx`          | Reuse/adapt                                     | Command/sheets           | Correct scroll ownership, touch behavior, focus visibility, no nested scroll traps.                                                                                                                                           |
| Spinner           | Missing                       | New micro-primitive only when skeleton is wrong | Actions                  | Accessible label; reduced motion; do not replace page skeletons.                                                                                                                                                              |
| Context menu      | Missing                       | Reject                                          | Storefront               | No approved storefront task requires a secondary-click interaction.                                                                                                                                                           |

### Charts and useful components

| Claude capability | Evidence/current source | Disposition                 | Owner/stage     | Prerequisite and acceptance                                                                            |
| ----------------- | ----------------------- | --------------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| Radar chart       | None                    | Reject                      | Admin/analytics | Charts are outside this customer storefront program.                                                   |
| Area chart        | None                    | Reject                      | Admin/analytics | Charts are outside scope.                                                                              |
| Radial chart      | None                    | Reject                      | Admin/analytics | Charts are outside scope.                                                                              |
| Line chart        | None                    | Reject                      | Admin/analytics | Charts are outside scope.                                                                              |
| Pie chart         | None                    | Reject                      | Admin/analytics | Charts are outside scope.                                                                              |
| Bar chart         | None                    | Reject                      | Admin/analytics | Charts are outside scope.                                                                              |
| Footer            | Missing                 | New composition             | Shell/PHP       | Legal/contact/room links, locale, no mega columns without content; mobile order and landmark verified. |
| Navbar            | Rail exists             | Adapt                       | Shell           | Rail desktop + bottom nav mobile; no horizontal header clone.                                          |
| Rating            | Missing                 | Research-blocked            | PDP/post-core   | Requires review policy, canonical data, moderation, and ticket #6/#8 acceptance.                       |
| Timeline          | Missing                 | Approved post-core or defer | Marketing/order | Use only for a real process/history; not decorative brand storytelling by default.                     |

## 5. Marketing composition matrix

| Claude capability  | Disposition                        | Owning route/stage         | Required source and acceptance                                                            |
| ------------------ | ---------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------- |
| Hero               | Adapt existing landing composition | Shell/landing, PHP         | Approved Persian claim and local imagery; asymmetric composition; one clear route action. |
| Features           | Approved post-core                 | About/landing              | Convert to editorial proof bands, not three cards; factual source required.               |
| CTA                | New shared composition             | All                        | One primary action, clear destination, dark-field colors used accessibly.                 |
| Testimonials       | Approved post-core                 | Landing/about              | Canonical approved quote/source and consent; no invented social proof.                    |
| FAQ                | Approved post-core                 | `/faq`, PDP where approved | Canonical answers, accordion markup, SEO reviewed; no filler questions.                   |
| Pricing Details    | Defer                              | Academy/services           | Product pricing uses Price/Offer components instead.                                      |
| Team               | Approved post-core                 | `/about`                   | Credentials and approved portraits; no generic avatar grid.                               |
| Portfolio          | Research-blocked                   | `/results`                 | Before/after consent default-deny; revocation and no-index behavior.                      |
| Blog               | Approved post-core                 | `/journal`                 | Editorial content model and ownership accepted first.                                     |
| Contact Us         | Approved post-core                 | `/contact`                 | Canonical address, hours, phone/WhatsApp policy, map/runtime-host policy.                 |
| Gallery            | Research-blocked                   | `/results`, landing        | Local approved media, alt text, consent, responsive sizes; no autoplay carousel.          |
| About Us           | Approved post-core                 | `/about`                   | Mahdieh-first editorial page; approved facts and credentials.                             |
| Authentication     | Defer                              | Account/Auth               | Phone/OTP belongs to account delivery, not storefront UI foundation.                      |
| Cookie             | Research-blocked                   | Global                     | Iran/privacy requirements and actual tracking inventory decide whether consent UI exists. |
| Footer             | New composition                    | Shell                      | Same footer contract as primitive matrix.                                                 |
| Navbar             | Adapt Rail                         | Shell                      | Same navigation contract as primitive matrix.                                             |
| Error              | New route composition              | All                        | Friendly Persian message, retry where safe, diagnostic reference without internal detail. |
| App Integration    | Defer                              | Future integrations        | No approved external app integration in storefront scope.                                 |
| Social Proof       | Approved post-core                 | Landing/PHP                | Evidence-backed counts/credentials/quotes only; no fabricated metrics.                    |
| Logo Cloud         | Approved post-core                 | Landing/PHP                | Approved represented/carried brands; official-representative wording remains exact.       |
| Compare            | Research-blocked                   | PLP/PDP                    | Ticket #5/#6 must prove customer value and data completeness.                             |
| Video call         | Defer                              | Booking/guidance           | Separate consultation program.                                                            |
| Chat bubble        | Research-blocked                   | Human escalation           | Must settle channel, staffing, privacy, hours, and failure state.                         |
| User schedule      | Defer                              | Booking/Account            | Separate program.                                                                         |
| Timeline           | Approved post-core/defer           | About/order                | Only when a real temporal task is approved.                                               |
| Download           | Defer                              | Academy/content            | No approved storefront download.                                                          |
| Waitlist           | Defer                              | Academy/retention          | Separate feature/research.                                                                |
| Billing & payments | Defer                              | Checkout/Account           | Explicitly outside this program.                                                          |

## 6. Ecommerce composition matrix

| Claude capability   | Evidence/current source        | Disposition                | Owner/stage         | Prerequisite and acceptance                                                                      |
| ------------------- | ------------------------------ | -------------------------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| Product list        | ProductGrid/ProductTile        | Adapt                      | PHP/PLP             | Page-model products, truthful offers, responsive borderless grid, empty/loading/error.           |
| Product Category    | ConcernRail + taxonomy         | Adapt                      | PHP/PLP             | Concern-first, then brand/category; canonical links and live counts.                             |
| Category Filter     | FacetRail/FilterDrawer         | Adapt                      | PLP                 | Ticket #5 URL grammar and facet policy; desktop rail/mobile sheet parity.                        |
| Product Overview    | Gallery/disclosure/price/stock | New screen composition     | PDP                 | Ticket #6, ordered media, variants, offer state, approved content.                               |
| Mega Footer         | Missing                        | Adapt as restrained footer | Shell/post-core     | Use only content-backed groups; avoid marketplace density.                                       |
| Shopping Cart       | CartDrawer/QuantityStepper     | Adapt/migrate              | Cart                | Narrow cart research gate and separate Cart module.                                              |
| Product Review      | Missing                        | Research-blocked           | PDP/post-core       | Moderation, purchase verification, consent, data model, and ticket #8.                           |
| Mega Menu           | Missing                        | Reject                     | Shell               | Command palette is the settled replacement.                                                      |
| Order Summary       | Missing                        | Defer                      | Checkout            | Outside this program.                                                                            |
| Offer Model         | Price/Stock components         | Adapt                      | Commerce model      | Discriminated server-owned offer states; no discount/promotion inference.                        |
| Checkout            | Missing                        | Defer                      | Transaction program | Outside this program.                                                                            |
| Product Quick View  | Dialog + product summary       | Research-blocked           | PLP/post-core       | Ticket #5 must show conversion value; keyboard/mobile behavior and canonical PDP link required.  |
| Announcement banner | Missing                        | Approved post-core         | Shell/PHP           | Only factual service/availability notices; dismiss/persistence policy required; no fake urgency. |
| Gift card           | Missing                        | Defer                      | Transaction/growth  | Requires liability, expiry, payment, fraud, and accounting decisions.                            |

## 7. Foundation implementation tasks

### F1 - Freeze ownership and migration map

1. Classify every existing commerce file as Commerce, Cart, or generic.
2. Record destination imports and callers before moving anything.
3. Move in behavior-preserving batches; update the commerce barrel only after destinations exist.
4. Keep page routes thin and prevent direct schema imports.
5. Run targeted tests after each batch.

**Acceptance:** no duplicate old/new component implementation remains; generic UI imports do not depend on Commerce or Cart.

### F2 - Define typed contracts first

1. Add failing tests for outcome exhaustiveness, query parsing boundaries, `RialString`, offer-state precedence, and exact-locale behavior.
2. Define readonly page models and branded semantic primitives.
3. Add exhaustive render adapters for every outcome/offer variant.
4. Keep server-only money as `bigint`; convert only at a proven client boundary.
5. Pin Zustand and implement the approved scoped store/provider pattern; define module interaction state separately from server page models and canonical URL queries.
6. Prove hydration and back/forward reconciliation without copying products, facet counts, prices, stock, eligibility, cart totals, or errors into the store.

**Acceptance:** TypeScript prevents price/visibility/eligibility states that the UI must never render, and the state tests prove URL/server/form truth is not duplicated into Zustand.

### F3 - Complete core primitives

1. Implement only `Adapt`/`New` rows owned by Foundation or an approved core slice.
2. Document component anatomy, states, interaction, and RTL rules in code-level tests or the owning page plan.
3. Verify focus, keyboard, target size, contrast, reduced motion, and logical placement.
4. Document reusable components through [`../../ui/_template.md`](../../ui/_template.md); forms follow [`../../ui/forms.md`](../../ui/forms.md).

**Acceptance:** required component states can be exercised without a component-gallery route, through focused test harnesses and real page states.

### F4 - Canonical content/data prerequisites

1. Add ordered product media only after its storage/publication/alt-text contract is accepted.
2. Add explicit directional product pairings with sort order.
3. Add hub curation only if #5 approves it; otherwise query canonical concerns and an explicit newest-product limit.
4. Record exact-locale availability; do not fabricate Arabic fields or fallback behavior.

**Acceptance:** PHP/PDP page models can be assembled without placeholders or unrelated-state fallback chains.

### F5 - Foundation verification

Run typecheck, lint, targeted Vitest, build, logical-property scan, raw-color scan, and Persian browser checks at 390, 768, and 1440 widths. Follow the evidence contract in [`verification-and-rollout.md`](verification-and-rollout.md).

## 8. Foundation exit gate

- Research dependencies needed by Stage 1 are accepted.
- Capability matrix has no unowned `Adapt`, `New`, or `Research-blocked` row.
- Commerce and Cart ownership is explicit.
- Page-model and offer-state tests pass.
- Every required primitive state has keyboard, focus, RTL, and responsive evidence.
- No raw hex values were introduced into components.
- No new component exists solely because it appeared in Claude Design.
