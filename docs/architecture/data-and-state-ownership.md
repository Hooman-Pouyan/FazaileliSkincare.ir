# Data and state ownership

**Status:** Accepted  
**Accepted:** 2026-08-24  
**Decision:** Zustand is required for shared client interaction state. TanStack Query is the approved secondary tool for bounded browser-refetched server state, introduced with its first approved consumer. Neither replaces Server Components, URL state, forms, or server-owned commerce decisions.

## One source of truth per state kind

| State kind                      | Canonical owner                                        | Examples                                                                                                |
| ------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Database/domain truth           | PostgreSQL through server-only Drizzle code            | products, translations, prices, inventory, reservations, eligibility, orders                            |
| Initial page server state       | Page-shaped module reads + Server Components           | PHP, PLP, PDP, metadata, facet counts, cart model                                                       |
| Shareable navigation state      | Locale-prefixed URL                                    | listing scope, search query, filters, sort, page                                                        |
| Shared client interaction state | Module-scoped Zustand store                            | draft filters, drawer state, command state, selected variant, gallery selection, pending UI transitions |
| Form state                      | React Hook Form using the form's shared Zod schema     | field values, touched/dirty state, local validation                                                     |
| Leaf-only transient state       | Local React state                                      | a disclosure toggle or isolated hover-independent selection with no cross-component consumer            |
| Browser-refetched server state  | TanStack Query, only for an approved client-owned read | cart drawer synchronization, approved autocomplete, live booking availability, account status refresh   |
| Route/action errors             | Typed outcomes, action results, or thrown boundaries   | invalid query, unavailable locale, field errors, database outage                                        |

The same fact must not be copied into several owners. A selected filter can exist as a draft in Zustand and as an applied value in the URL only when the transition between those states is explicit. Product results derived from the applied URL never move into Zustand.

## Server state

Server Components call the approved server-only module read. Reads hide Drizzle schema/query construction, exact-locale publication, pricing precedence, availability, canonicalization, and page-model mapping.

- PHP/PLP/PDP data remains server-owned even after Zustand and TanStack Query are installed.
- Metadata and page rendering use request-local deduplication when they need the same read.
- An operational or integrity failure throws; it is never converted to an empty page model.
- Client code cannot supply customer-group, cart-owner, price, stock, or eligibility truth.

## URL and listing workflow

Filters, search, sort, and pagination are shareable navigation state. Their canonical applied state is the URL, not Zustand and not a component.

```text
URL searchParams
  -> parse canonical ListingQuery
  -> server listProducts(ListingQuery)
  -> initialize client controls from canonical query
  -> controls dispatch Zustand draft actions
  -> Apply serializes the draft and updates the URL
  -> navigation reruns the Server Component read
```

Rules:

- Parser and serializer are pure module utilities with round-trip tests.
- Store actions use domain names such as `toggleDraftFacet`, `setDraftPriceRange`, `resetDraftFilters`, and `commitDraftSnapshot`.
- Applying a filter resets pagination according to the approved URL contract.
- Back/forward navigation reinitializes or reconciles the store from the new canonical URL.
- Do not mirror URL query state to `localStorage`.
- Immediate controls may update the URL directly; draft/apply controls use Zustand to coordinate the pending state.

## Zustand contract

Zustand 5 is required infrastructure for feature interaction state.

- Create stores per mounted feature/provider; never use a mutable process-global store that can leak between Next.js requests.
- React Server Components never read or write the store.
- The provider receives serializable initial state from the server/URL and creates one vanilla store instance for its mounted scope.
- Components subscribe through narrow selectors. Avoid whole-store subscriptions.
- State and actions remain flat unless a measured interaction requires otherwise.
- Store actions never call Drizzle, import server-only code, or become a hidden repository.
- Errors are not retained as canonical store state. Pending presentation state may reference an action identifier, while the action result/boundary owns the error.
- Persistence is default-off. It requires a named harmless preference, hydration behavior, version/migration policy, and privacy review.

Zustand may coordinate cart-drawer visibility and a pending quantity interaction, but the cart lines, totals, availability, and reservation expiry come from the Cart server model or an approved TanStack Query cache.

## TanStack Query contract

TanStack Query is approved beside Zustand because it solves a different problem: browser-owned asynchronous server-state synchronization. It is not yet a blanket dependency for all reads.

Introduce it with the first approved consumer that needs background refetch, deduplication, invalidation, or shared client cache without a full navigation. Expected candidates are:

1. cart drawer synchronization across routes;
2. command-palette suggestions if discovery research approves autocomplete;
3. account/order status that needs polling or focus refetch;
4. booking availability during an interactive date/time flow.

When introduced:

- document the first query keys, ownership, stale policy, retry policy, hydration boundary, and invalidation events;
- create a browser `QueryClient` without sharing it across server requests;
- hydrate only the bounded client subtree that consumes the data;
- use keys derived from canonical primitive identifiers;
- treat query data as server state and never copy it into Zustand;
- route mutations through Server Actions or approved server endpoints, then invalidate/refetch the relevant query and/or refresh the route;
- do not use optimistic price, eligibility, stock, reservation, or total values unless a separate invariant explicitly authorizes a reversible presentation.

PHP, PLP, PDP, SEO, and server-owned facets do not become Query reads merely for consistency.

## Forms and actions

React Hook Form owns edit buffers. Zustand may coordinate a multi-step workflow or cross-component selection, but form values stay in the form unless the accepted journey requires preserving a draft between mounted steps. The one shared Zod schema parses both the client submission and Server Action input.

Server Actions return typed recoverable results for expected failures and throw unknown operational failures. After a successful mutation, the server decides which route cache, tag, or client query becomes stale.

## Prohibited state flows

- Server data -> TanStack Query -> Zustand copy.
- URL filters -> local component copy -> unrelated store copy.
- Client-provided price/stock/customer group -> Server Action decision.
- Persisted browser cart as the ownership authority.
- Global Zustand store created during module evaluation and mutated from an RSC.
- Query retries for non-idempotent actions without a documented idempotency key.

## Adoption gates

### Zustand foundation gate

- Pin and record the dependency.
- Add the scoped provider/store pattern with hydration tests.
- Prove selector-based updates and URL reconciliation.
- Migrate only interactions that need shared coordination; keep truly local leaves local.

### TanStack Query first-consumer gate

- Name the route and user journey that requires browser refetching.
- Demonstrate why Server Component navigation/refresh alone is insufficient.
- Record query keys, cache lifetime, retry, invalidation, hydration, error, and offline behavior.
- Add focused integration and browser evidence.
- Confirm no server-owned commerce state was duplicated into Zustand.
