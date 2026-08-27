# The next block — the end-to-end commerce slice

**Date:** 2026-08-26, revised the same day after the maintainer's scope input
**Parent:** [`17-execution-ledger.md`](17-execution-ledger.md) — that file stays the queue
**Read first:** [`29-handoff.md`](29-handoff.md), then `AGENTS.md`
**The plan this executes:** [`system-design/cart-checkout-payment-fulfilment-and-returns.md`](system-design/cart-checkout-payment-fulfilment-and-returns.md) — `COM-D1`…`COM-D11` and `COM0`…`COMn` already exist. This document sequences them and adds the account surface they assume.

---

## What is actually true right now, because the first version of this plan got it wrong

The maintainer asked whether the data layer, domain models and business rules
for accounts, checkout, invoices and order history exist, or whether this is a
toy. The answer is more encouraging than it looks from the running site.

### Built and migrated

| Table                   | Carries                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `person`                | phone, `phoneVerified`, first/last name, preferred locale, `closedAt`                                                                            |
| `address`               | `personId`, recipient name and phone, province, city, postal code, line, `isDefault`                                                             |
| `customer_order`        | order number, `personId` **or** `guestPhone`, status, subtotal/shipping/discount/total in rials, **`addressSnapshot`**, `checkoutIdempotencyKey` |
| `order_line`            | **snapshots** of product name, variant name, SKU and unit price — this _is_ an invoice line, frozen at purchase time                             |
| `payment`               | method, status, amount, provider, authority, reference, `idempotencyKey`, `requestHash`                                                          |
| `bank_transfer_claim`   | expected amount, tracking number, last 4, receipt object key, reviewer, review reason                                                            |
| `shipment`              | status, method, carrier, tracking code, the four timestamps                                                                                      |
| `inventory_reservation` | `sourceCartId`, `sourceCartItemId`, **`orderLineId`** — a hold converts into a sold line                                                         |

### Designed, decided, written down — and not implemented

`COM-D1`…`COM-D11` settle guest checkout, the guest→account merge, quote-and-place
(never a client-submitted total), order state separate from payment state,
bank-transfer evidence, one idempotent settlement path with two adapters,
ZarinPal as an external boundary, partial shipments, and returns as three
separate decisions. §6 fixes transaction boundaries and lock order; §7 the
error/retry contract.

**So the missing piece is not the thinking. It is the service layer, the routes
and the screens** — and, one level up, the maintainer's approval, which the plan
document withholds by design: _"no runtime implementation is authorized by this
document."_

### Not built, and needed

- Eight tables from §3.2: `iran_province`, `iran_city`, `shipping_rate`,
  `order_access_token`, `shipment_line`, `return_request`, `return_line`,
  `refund`.
- `/account` exists and shows a phone number and a sign-out button. There is no
  profile, no address book, no order history, no invoice, no payment history.
- No checkout route of any kind.

### The correction that changes the sequencing

The previous version of this plan said checkout was gated on the payment-gateway
paperwork. **That is wrong, and `COM-D1` says so plainly: bank transfer is the
launch payment method, and ZarinPal is enabled only afterwards.**

A customer can therefore place a real order, receive a real invoice, upload a
transfer receipt, and have a staff member confirm it against the bank statement
— with no eNamad, no ZarinPal, no merchant credentials. What the paperwork gates
is the _gateway_, which `COM-D9` already isolates behind an interface.

What genuinely does gate order placement is **policy the maintainer owns**:
shipping rates, the returns and refunds rules, and the terms/privacy/returns
pages. Those are decisions, not engineering, and they are listed at the end.

---

## The order, and why this order

Every phase after B adds screens. Building eight new screens at today's spacing
and then re-spacing them is the single largest avoidable waste in this block, so
**density comes second, not last** — which is a change from the previous plan.

| Phase | Packet | What                                           | Why here                                                                    |
| ----- | ------ | ---------------------------------------------- | --------------------------------------------------------------------------- |
| A     | 9 / 10 | Land the cart (`COM1`)                         | It is written; it needs its paperwork and a browser pass                    |
| B     | 11     | Density, `R-3`                                 | Everything after this adds screens. Do it once                              |
| C     | 12     | `COM0` remainder — the eight missing tables    | Checkout cannot be built against tables that do not exist                   |
| D     | 13     | Account and identity                           | Checkout assumes saved addresses and an owner; and it is the gap he can see |
| E     | 14     | Checkout → order → invoice, bank transfer live | The end-to-end slice, up to but not through the gateway                     |
| F     | 15     | Booking — schema, plan and UI                  | Gated on nothing but being built                                            |

---

## Phase A · Land the cart — `COM1`

Unchanged from the previous plan, and still first.

- [ ] Close the **TanStack Query first-consumer gate** as a record, not as code
      comments: name the journey, show why Server Component refresh is
      insufficient, record keys/cache/retry/invalidation/hydration/error/offline,
      integration **and browser** evidence, confirm nothing server-owned was
      copied into Zustand.
- [ ] Write the review-log section **before** committing. `8.10` is why.
- [ ] `typecheck`, `lint`, `test:unit`, `test:integration`, then re-seed (`R-10`).
- [ ] Browser pass at 390/768/1440, Persian, **with JavaScript disabled**.
- [ ] Guest cart survives a reload; signing in merges it once and not twice.

**Exit gate:** `COM1`'s — two carts cannot reserve more than on-hand stock, and
retries or merges never duplicate or silently reduce quantities.

---

## Phase B · Packet 11 — density, `R-3`

The maintainer's words, twice: the PLP cards are too big, and the whole thing is
too spacious. `R-4`, `R-5`, `R-8` and every screen in phases C–F render against
what this decides.

- [ ] Choose **one** mechanism — a compact spacing scale in `designs/tokens.css`
      through `@theme inline`, **or** a `data-density` scope on the shop routes.
      Not both. Broadcast before building.
- [ ] Amend `10-design-playbook.md` (the 96px rule becomes surface-conditional)
      and `25-design-system-adherence.md` (the room table gains a density column).
- [ ] Apply through tokens and component variants. **No per-page `className`
      overrides** — one page tightened by hand is one page that drifts back.
- [ ] Hairlines survive. Compact means _less air between things_, never _more
      chrome around things_.
- [ ] Then the wins that were waiting on it: `R-4` (the listing tile — bring
      `object-contain` across from the PDP, per `8.3`), `R-7` (sticky rail,
      desktop only), `R-6` (price filter live, `GET` form retained underneath),
      `R-2` (hold scroll position, and announce the change).

**Exit gate:** shop surfaces visibly tighter, Landing untouched, every change
from a token or a variant, browser pass at three widths in Persian.

---

## Phase C · Packet 12 — `COM0` remainder

- [ ] `iran_province`, `iran_city` — canonical codes, Persian names, seeded
      deterministically. This is reviewed reference data, not invention: use an
      authoritative list and record where it came from.
- [ ] `shipping_rate` — flat rate per `COM-D2`, method plus location
      specificity, non-negative `bigint`.
- [ ] `order_access_token` — guest order access. **Hash only, never the raw
      token**, with expiry and revocation.
- [ ] `shipment_line`, `return_request`, `return_line`, `refund`.
- [ ] Failing schema tests first, then generate, **read the SQL**, migrate from
      zero, seed twice, probe the constraints live on PostgreSQL 16.

**Exit gate:** fresh migration path repeatable, every new FK indexed, every
constraint proved by a live probe rather than by reading.

---

## Phase D · Packet 13 — account and identity

The surface the maintainer cannot currently see anything in. Everything here is
a **read** or a profile write; no money moves.

- [ ] `/account` becomes a real dashboard: profile, addresses, orders.
- [ ] **Profile** — first name, last name, phone (verified, and not editable
      without re-verification), preferred locale.
- [ ] **Address book** — list, add, edit, delete, set default. Province and city
      from the seeded reference, postal code validated as Iranian format, plus
      recipient name and phone, because the person receiving is often not the
      person paying.
- [ ] **Orders** — list with status, and an order detail page that _is_ the
      invoice: the `order_line` snapshots, totals, address snapshot, payment
      status. Printable.
- [ ] **Payment history** — from `payment` and `bank_transfer_claim`.
- [ ] Every one of these is owner-scoped, and a signed-out visitor is sent to
      login and **returned to where they were going**, not to the home page.
- [ ] `AUTH2` is parked pending the maintainer's approval of the OTP screens
      (`checkpoints/auth2-test-checkpoint.md`). Confirm sign-up and sign-in
      actually record a `person` row before building on top of them — he has
      said he is not sure they do, and that is worth a five-minute check rather
      than an assumption.

**A map for the address is deliberately out of scope here.** Every usable map
tile provider is a foreign host, and `AGENTS.md` hard rule 10 says no runtime
asset comes from one — from Iranian infrastructure those requests hang and take
the page with them. If a pin is wanted, it needs an Iranian provider (Neshan
and Balad both have APIs) and that is a decision with a key, a cost and a
privacy question attached. **Recorded, not silently skipped.**

**Exit gate:** he can sign in, complete his profile, save an address, and see an
order — because Phase E will have produced one.

---

## Phase E · Packet 14 — checkout, order, invoice

`COM2` onward. The journey he described, in the order he described it.

- [ ] **The auth gate.** Cart → checkout checks authentication. A guest may
      continue as a guest (`COM-D1`: creating an account is never required to
      buy) **or** sign in; if they sign in, the cart merges atomically
      (`COM-D4`) and they land back in checkout, not on the home page.
- [ ] **Address step.** A signed-in customer picks a saved address or adds one;
      a guest fills the same form and it becomes an order-only snapshot.
- [ ] **Shipping quote.** Flat rate from `shipping_rate` — pickup, Mashhad
      courier, nationwide post.
- [ ] **Review.** Quote-and-place (`COM-D5`): the server recomputes the total
      from the cart, and **the client's number is never an input**.
- [ ] **Place order.** One transaction: order and lines written with snapshots,
      reservations converted to `orderLineId`, stock decremented only against a
      confirmed payment (hard rule 6), `checkoutIdempotencyKey` so a refreshed
      submit cannot create two orders.
- [ ] **Invoice.** The order detail page from Phase D, now with something in it.
- [ ] **Bank transfer.** The customer sees the account details, uploads a
      receipt, and it is recorded as a **claim, not proof** (hard rule 8). A
      staff member matching the real statement is what moves an order to `paid`.
- [ ] **Guest order access** through `order_access_token` — hashed, expiring,
      revocable. An order number is never sufficient authorisation.
- [ ] **ZarinPal is stubbed behind `COM-D9`'s interface** and not wired. The
      day credentials exist it is one adapter, not a refactor.

**Exit gate:** a real order can be placed by a guest and by a signed-in
customer, on real seeded products, with a real invoice and a real transfer
claim — and no gateway, no eNamad, no merchant account involved.

---

## Phase F · Packet 15 — Booking

Both were confirmed in scope: schema, relations, phased plan and UI.

- [x] **`docs/system-design/booking.md` is written** (2026-08-27) and covers the
      resource model, `BOOK-D3`'s dwell-time scheduling, hold/deposit/confirm/expire,
      Jalali over `timestamptz`, the empty-calendar case, and the deposit question —
      answered yes, so it inherits Phase E's payment path rather than inventing a
      second one. [`system-design/academy.md`](system-design/academy.md) and
      [`system-design/studio.md`](system-design/studio.md) were written alongside it,
      because mentorship reuses Booking's scheduler and Studio composes all three.
      **All three await the maintainer's approval and his answers to their `§10`.**
- [ ] Then schema and migration, with the double-booking invariant enforced **in
      the database** and proved by a concurrent integration test the way the
      cart's oversell test is.
- [ ] Then reads, routes and screens, at Phase B's density.

---

## Still not in this block

- **The content-depth pass.** The maintainer is right that the pages read as
  deserted for a commercial storefront, and it is being planned with him
  separately. **No phase above adds page sections, content kinds or taxonomy.**
  If a phase feels thin because the page is thin, record it and carry on —
  filling it in ahead of the plan produces the sections the plan then unpicks.
- ZarinPal wiring, `R-1` infinite scroll, `R-4a` three.js, Academy, Studio, the
  Shop Relay, Forlle'd and Thalgo catalogues.

---

## What only the maintainer can supply, and what each one blocks

| Needed                                                          | Blocks                                           |
| --------------------------------------------------------------- | ------------------------------------------------ |
| **Approval of the checkout plan** — it authorises nothing today | Phases C, D and E entirely                       |
| Shipping rates — pickup, Mashhad courier, nationwide post       | Phase E's shipping step                          |
| Returns and refunds policy                                      | `return_request` and `refund` behaviour          |
| Terms, privacy and returns pages                                | Placing a real order in front of a real customer |
| Bank account details for transfers                              | Phase E's payment step                           |
| Approval of the OTP screens (`AUTH2`)                           | Trusting sign-up in Phase D                      |
| The WhatsApp number                                             | The enquiry control on three surfaces            |
| Storyderm image rights, real prices, product sheets             | Anything customer-facing in production           |
| eNamad, ZarinPal, business licence                              | **Only** the gateway — not orders, not invoices  |
