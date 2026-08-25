# Routing, navigation, and outcomes

**Status:** Accepted  
**Accepted:** 2026-08-24  
**Framework:** Next.js App Router with locale-prefixed public routes

## Route ownership

Public application routes live below `src/app/[locale]/`. Persian (`fa`) is the first complete locale. Route files stay thin and own only framework integration:

- await `params` and `searchParams`;
- validate the locale and route grammar;
- call one page-shaped module read or render one module screen;
- translate a typed outcome into `redirect()`, `notFound()`, an unavailable/invalid composition, or ready rendering;
- expose metadata from the same canonical page model;
- select route-level loading and error boundaries.

Routes do not import Drizzle tables, calculate commerce decisions, construct fallback content, or maintain client state.

## Locale-prefixed grammar

- Canonical public URLs include the locale: `/fa/shop`, `/fa/book`, `/fa/academy`.
- Internal links use the locale-aware navigation helpers in `src/i18n/navigation.ts`.
- Incoming non-canonical URLs redirect once to a canonical locale-prefixed URL when the redirect is safe and unambiguous.
- Unknown taxonomies and unpublished entities are not-found outcomes, not empty result sets.
- A known entity without approved exact-locale content is locale-unavailable, not not-found and never a fallback-locale page.

Route-specific grammar is owned by the approved page plan and research decision. The storefront grammar is defined in `docs/system-design/storefront.md` and its PHP/PLP/PDP plans.

## URL state

Any state that customers must share, bookmark, restore with back/forward, or index belongs in the URL:

- listing scope and taxonomy slug;
- search query;
- applied filters;
- sort;
- page;
- approved view mode, only if it changes the shareable result interpretation.

The module parses raw `searchParams` once with Zod into a canonical query. It produces a canonical serialized order for generated links. Invalid values follow the accepted route contract: remove-and-redirect, render `invalid-query` with recovery, or reject as not-found. Components do not invent their own parsing rules.

Draft filter state can live in Zustand until Apply; applied state remains the URL. Pagination resets when filter/search/sort semantics require it.

## Typed storefront outcomes

`StorefrontOutcome<T>` distinguishes:

| Outcome              | Meaning                                                  | Route response                                                      |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| `ready`              | Complete, approved page model                            | Render screen                                                       |
| `redirect`           | Request is valid but non-canonical                       | Redirect to provided canonical URL                                  |
| `not-found`          | Entity/scope does not exist or cannot be published       | `notFound()` or approved route not-found composition                |
| `locale-unavailable` | Entity exists but exact approved locale content does not | Locale-unavailable composition; no fallback copy                    |
| `invalid-query`      | URL input cannot form an accepted listing request        | Typed recovery composition or canonical redirect per route contract |

Valid zero results are a `ready` listing page model with a typed empty state. Database outages and integrity failures are thrown operational errors and reach `error.tsx`; they never become `ready` with zero products.

Cart uses its own `CartOutcome<T>` because an empty cart is a normal ready state and ownership is resolved from the server session/cookie rather than a route parameter.

## Navigation ownership

- The shared shell owns the primary rail, mobile bottom navigation, locale/account/cart entry, and command entry.
- Each feature owns its local breadcrumbs, tabs, pagination, and task navigation through its page model.
- One canonical navigation definition feeds desktop/mobile variants; do not duplicate labels and destinations in separate arrays.
- Command navigation is not a mega-menu. Search-result behavior follows the discovery contract.
- Navigation state that is merely visual, such as an open sheet, belongs in Zustand; the current destination remains the router's state.

Navigation terms are exact:

- **Primary navigation:** global room destinations and global utilities owned by the shell.
- **Secondary navigation:** page/feature-owned breadcrumbs, taxonomy links, filters, sorting, pagination, brand/line links, and task transitions.
- **Contextual action:** an operation such as opening Command, opening the Cart drawer, applying draft filters, or adding an eligible line; it is not a route hierarchy.
- **Transactional continuation:** Cart and later checkout/order movement. Only Cart belongs to the current storefront program.

The authoritative route tree and surface relationships are recorded in `docs/system-design/storefront.md`. The ordered responsive navigation manifest and its unresolved mobile/account/locale decisions are owned by `docs/system-design/storefront/shell-and-product-hub.md`. Page plans must turn every accepted relationship into a named implementation task and verification scenario.

No route or component may introduce a global horizontal header, a cross-room marketplace mega-menu, hover-only primary navigation, referrer-derived breadcrumbs, or a second responsive navigation array. The post-core Shop Relay is the only currently contemplated mega-menu form: it is Shop-only, remains deferred, and follows the dedicated gate in the shell plan. A third-party menu can inform research vocabulary but cannot change routing/navigation architecture without an accepted decision-map update.

## Loading and transitions

- `loading.tsx` mirrors the geometry of the route it protects.
- Client controls may show a pending navigation state while the URL transition is in flight.
- Pending UI must not display invented product results, counts, availability, or totals.
- Back/forward navigation reconciles Zustand draft controls to the canonical URL.
- Focus moves to the appropriate result/page heading after meaningful navigation when browser defaults do not provide understandable context.

## SEO and metadata

Metadata is assembled from the same page-shaped server result used by the route and deduplicated request-locally. Canonical URLs omit default/redundant query values. Structured data contains only approved exact-locale content and server-owned offer truth.

## Route review checklist

- Locale and async parameters are awaited and validated.
- Route calls only the approved module interface.
- Canonical, invalid, empty, unavailable, not-found, and operational-error states remain distinct.
- Shareable state is in the URL and round-trips through one parser/serializer.
- Navigation uses locale-aware helpers and restores browser history correctly.
- Metadata and page rendering cannot disagree about publication, locale, price, or availability.
