# TanStack Query — the first-consumer gate, closed

**Date:** 2026-08-26 · **Packet:** 9/10, the cart slice
**Closes:** the gate in [`architecture/data-and-state-ownership.md`](architecture/data-and-state-ownership.md) § _TanStack Query contract_
**Also records:** Zustand's first store, under the same document's § _Zustand contract_

---

## Why this document exists at all

The library was pre-approved. `data-and-state-ownership.md` names TanStack
Query as _"the approved secondary tool for bounded browser-refetched server
state"_ and even names the expected first consumer — _"cart drawer
synchronization across routes"_, candidate 1 of four.

What it does **not** do is let the first consumer arrive silently. The contract
attaches a list to introduction: _"document the first query keys, ownership,
stale policy, retry policy, hydration boundary, and invalidation events."_ That
list is the gate, and this is it, written down rather than left in code
comments — because a comment answers "what does this line do" and a reader
three packets from now needs "why is this library here, and what is it allowed
to touch."

---

## 1 · The journey, named

A customer adds something from a product page. The drawer opens showing what
they now have. They navigate to another product, add a second thing, and the
drawer must already know about the first. They open `/cart`, change a quantity,
go back to the shop — and the rail's cart must not be stale.

**The drawer outlives every navigation.** It is mounted once in
`storefront-shell.tsx` and survives every route change beneath it. That is the
whole problem: the drawer's data has no page to belong to.

---

## 2 · Why Server Component refresh is insufficient here

This is the question the gate really asks, and it deserves a real answer rather
than "Query is nicer".

`revalidatePath` refreshes a **route**. The drawer is not a route — it is a
component in the shell that persists across routes, so there is no path whose
revalidation reliably re-renders it with fresh data. `router.refresh()` would
re-render the whole tree beneath the shell on every quantity change, which
means re-rendering a product listing to update a number in a drawer.

There are three further things the route-refresh path cannot do:

- **Deduplicate.** The drawer and a badge asking for the same cart at the same
  moment are one request under Query and two without it.
- **Refetch on focus.** A reservation has a twenty-minute life (`COM-D3`).
  Returning to a tab left open over lunch is exactly when the cart is most
  likely to be wrong, and nothing about a Server Component notices a tab
  regaining focus.
- **Survive without a server render to inherit.** The drawer has no
  `page.tsx` behind it. It has to fetch for itself the first time it opens.

**Where route refresh _is_ sufficient, it is used instead.** `/cart` is a real
route with a real server render, so it is **not** a Query consumer — see §7.

---

## 3 · Keys

One key, in one file — `src/lib/query/query-keys.ts`:

```ts
cart: (locale: string) => ["cart", locale] as const;
```

- **Derived from a canonical primitive**, as the contract requires: a locale
  string, the same value the URL carries.
- **Locale is in the key** because the model carries localised names and a
  formatted price. Reusing a Persian cart on `/en/cart` would render Persian
  product names under English chrome.
- **Ownership is deliberately _not_ in the key.** The server resolves the owner
  from the session and the httpOnly cookie (`CART-01`), so a key carrying a
  cart id would be both redundant and a way to ask for somebody else's.

Keys live together so invalidation is reviewable. `["cart"]` written by hand in
four components, misspelled in one, fails by silently never invalidating.

---

## 4 · Cache, stale and retry policy

From `src/lib/query/query-client.ts`, with the reasoning:

| Setting                | Value     | Why                                                                                                                                                                                                |
| ---------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `staleTime`            | `0`       | Everything cached here is commerce truth the server may have changed — a price, a stock level, a lapsed reservation. Query's job is deduplication and invalidation, **not** a freshness assumption |
| `gcTime`               | 5 minutes | Long enough that navigating away and back does not refetch from cold; short enough that an abandoned tab is not holding a stale cart                                                               |
| `retry` (queries)      | `1`       | Iranian mobile infrastructure fails transiently often enough to be worth one retry, and rarely enough that three would only delay showing an honest error                                          |
| `retry` (mutations)    | `0`       | A mutation is a Server Action that has **already written**. Retrying automatically would re-run a write whose idempotency this layer cannot see                                                    |
| `refetchOnWindowFocus` | `true`    | Returning to a tab is precisely when a twenty-minute reservation is most likely to have expired                                                                                                    |

---

## 5 · Invalidation events

Every mutation, in `onSettled` — **not** `onSuccess`:

```ts
await client.invalidateQueries({ queryKey: queryKeys.cart(locale) });
```

`onSettled` is the deliberate choice. A rejected mutation usually means the
server knows something the cache does not — the stock went, the product was
withdrawn, the reservation lapsed — so a refusal is a **stronger** reason to
re-read than a success.

Server Actions additionally call `revalidatePath("/cart")`, which refreshes the
server-rendered page. The two mechanisms cover the two surfaces and neither is
a source of truth.

---

## 6 · Hydration boundary

**There isn't one, and that is the finding.**

The first design server-rendered `/cart`, passed the result in as
`initialData`, and had the page subscribe to Query. It was wrong in a way worth
recording: a form action refreshed the **server** render while the screen kept
reading a cache seeded once at mount, so removing a line changed nothing on
screen. Two owners for one fact — the exact failure
`data-and-state-ownership.md` exists to prevent, reached from the direction of
adding a cache rather than adding a copy.

So the boundary is a **split by surface** instead:

| Surface    | Renders from                            | Why                                                              |
| ---------- | --------------------------------------- | ---------------------------------------------------------------- |
| `/cart`    | The server, via `getCart` in `page.tsx` | It is a real route with a real render. Works with JavaScript off |
| The drawer | Query                                   | It has no route and no server render to inherit                  |

Nothing is hydrated from server state into the Query cache. The drawer fetches
for itself, which is acceptable precisely because a drawer cannot exist without
JavaScript in the first place.

---

## 7 · What is **not** a Query consumer, and stays that way

The contract is explicit: _"PHP, PLP, PDP, SEO, and server-owned facets do not
become Query reads merely for consistency."_ Verified by inspection at the time
of writing:

| Surface                      | Query reads |
| ---------------------------- | ----------- |
| `shop-hub.screen.tsx`        | 0           |
| `product-listing.screen.tsx` | 0           |
| `product-detail.screen.tsx`  | 0           |
| `cart.screen.tsx`            | 0           |

The **only** `useQuery` in the application is `useCart()` in
`cart-drawer.tsx`. Three components consume mutations — `add-to-cart.tsx` and
the drawer's `LiveControls` in `cart-lines.tsx`.

`QueryProvider` is mounted in `storefront-shell.tsx` rather than the root
layout, so the boundary is bounded to the storefront by construction. Those
listing pages are server-rendered because that is the site's competitive
argument; putting them behind a client cache would trade ranking for
consistency.

---

## 8 · Errors, and what stays out of Zustand

**Nothing server-owned is in the store.** `cart.store.ts` holds exactly two
fields:

```ts
isDrawerOpen: boolean;
pendingLineId: string | null;
```

No prices, no quantities, no line list, no availability, no reservation expiry,
no totals. Those are re-read after every mutation. A cart that rendered its own
remembered price is how someone reaches checkout expecting a number the server
will refuse — `AGENTS.md` rule 5, one layer up.

`pendingLineId` rather than `isPending` is also deliberate: the Zustand
contract permits pending presentation state to _reference an action
identifier_ while the boundary owns the result. The store knows **which** line
is busy and nothing about how it went.

**There is no error field.** Errors are not canonical store state; the action
result owns them. `AddToCart` keeps a rejection in local component state, where
it dies with the click that caused it.

**No optimistic commerce values.** The contract forbids optimistic price,
eligibility, stock, reservation or total values, and none are used. The stepper
disables while a line is in flight and the real number arrives from the server.

---

## 9 · Offline and failure behaviour

One retry, then the error surfaces. There is no offline queue and no background
sync, deliberately: a queued cart mutation replayed on reconnection would take
stock against availability measured minutes earlier, and `COM-D3` makes
availability a live question. A failed mutation leaves the cart exactly as the
server has it, and the next read shows the truth.

---

## 10 · Evidence

- **Integration**, `cart.service.integration.test.ts`, 13 tests against real
  PostgreSQL: concurrent carts cannot oversell (verified to bite by deleting
  `FOR UPDATE` and re-running), absolute quantities make retries idempotent,
  expired reservations stop counting, `C5` release-on-remove, cross-owner writes
  refused.
- **Browser, JavaScript on**, 390 and 1440, Persian: choose a size → add →
  drawer opens with the product and a subtotal → raise quantity → `/cart` shows
  the same line → remove → empty. Zero console errors at both widths.
- **Browser, JavaScript off**, 390, Persian: the cart renders with product,
  quantity, line total and subtotal; the `+` control raises 2 → 3 and the total
  ۸٬۳۶۰٬۰۰۰ → ۱۲٬۵۴۰٬۰۰۰; remove empties it. All three controls are `<form
action={serverAction}>`.

---

## Re-review trigger

A second consumer. The contract lists three more candidates — command-palette
autocomplete, account/order status polling, booking availability — and each one
should extend this document rather than start its own. If a consumer ever wants
a `staleTime` above zero, that is a new decision about freshness and belongs
here with its reason.
