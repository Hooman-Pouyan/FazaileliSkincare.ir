# Cart, checkout, payment, fulfilment, and returns - phased implementation plan

**Status:** **Approved by the maintainer on 2026-08-26.** Runtime implementation is authorized, within the bounds below  
**Updated:** 2026-08-26

> **What the approval covers, and what it does not.**
>
> It authorises building `COM1` onward: the cart (done, packets 9/10), the
> account surface, checkout, order placement, invoices and the bank-transfer
> path. `COM-D1`…`COM-D11` are the governing decisions and are not reopened by
> this note.
>
> It does **not** authorise inventing the facts the plan leaves to the
> maintainer. Three of them gate parts of the journey rather than the whole:
>
> | Still his                                                 | What it blocks                                   |
> | --------------------------------------------------------- | ------------------------------------------------ |
> | Bank account details for transfers                        | The transfer instructions a customer is shown    |
> | Shipping rates — pickup, Mashhad courier, nationwide post | The shipping step's quote                        |
> | Terms, privacy and returns pages                          | Placing a real order in front of a real customer |
>
> Where one of those is missing the surface is built and **fails closed** —
> absent rather than filled with a plausible number — exactly as `PDP-09` does
> for the enquiry link that has no WhatsApp number behind it.
>
> ZarinPal remains out of scope. `COM-D9` isolates it behind an interface and
> `COM-D1` makes bank transfer the launch method, so the gateway paperwork gates
> one adapter, not the journey.
> **Scope:** Cart continuation through order completion, including shipping, bank transfer, gateway payment, fulfilment, cancellation, returns, refunds, customer status, and staff operations  
> **Depends on:** [`storefront.md`](storefront.md), [`storefront/pdp.md`](storefront/pdp.md), [`database-foundation.md`](database-foundation.md), [`authentication-and-account-security.md`](authentication-and-account-security.md), [`../02-adr-002-infrastructure.md`](../02-adr-002-infrastructure.md), and [`../03-domain-model.md`](../03-domain-model.md)  
> **Review input:** [`../16-review-storefront-and-database.md`](../16-review-storefront-and-database.md)

## 1. Goal and stopping boundary

Deliver the smallest complete commerce transaction system in which a customer can:

1. maintain a guest or authenticated cart;
2. enter an Iranian delivery address or choose institute pickup;
3. receive server-calculated shipping options and totals;
4. place an idempotent order;
5. pay by bank transfer at launch or by ZarinPal when credentials are approved;
6. recover from failed, duplicated, late, or refreshed payment flows;
7. view order and shipment status through an account or signed guest link;
8. request cancellation or return under the approved policy;
9. receive a correctly recorded refund without inventory or ledger corruption.

Staff can verify transfers, manage orders and shipments, review returns, record refunds, and inspect audit/payment events through explicit queues.

This program starts where the storefront PDP/cart plan stops. It does not redesign PHP, PLP, search, PDP, catalogue administration, promotions, coupons, loyalty, subscriptions, marketplace sellers, multi-currency, international shipping, automatic carrier labels, tax e-invoicing, or a general background-job system.

## 2. Launch decisions

### COM-D1 - Launch methods and order access

- Guest checkout is supported. Creating an account is never required to buy.
- Authenticated customers may select a saved address; guests provide an order-only address snapshot.
- Bank transfer is the launch payment method.
- ZarinPal is enabled only after merchant credentials and a staging callback test exist.
- Cash on pickup remains disabled at launch even though the enum can represent it; enabling it requires an explicit fraud/no-show policy.
- Orders are visible to authenticated owners or through a high-entropy guest access token stored only as a hash with expiry and revocation.
- An order number is human-readable but is never sufficient authorization.

### COM-D2 - Shipping is flat-rate and explicit in v1

Launch offers:

- institute pickup: available to all orders, zero shipping charge;
- local courier: Mashhad only, one active database-configured flat rate;
- nationwide post: Iranian addresses, one active database-configured flat rate.

Province and city are canonical reference identifiers, not arbitrary shipping-rule strings. Address and order snapshots retain approved Persian display names. The rate selector uses exact city, then province, then nationwide specificity; duplicate active rules at one specificity are rejected.

Weight tiers, live carrier quotes, Tehran courier, international addresses, split-origin shipping, and automatic label purchasing remain deferred. The schema can add those rules later without changing order snapshots or the `ShippingQuote` interface.

### COM-D3 - Reservations are explicit, expiring rows

- Cart mutation reserves stock for 20 minutes.
- Reading a cart does not extend a reservation.
- A successful quantity mutation renews only the affected line.
- Checkout revalidates every line and renews gateway reservations for 15 minutes.
- A bank-transfer order holds its order-line reservations for 24 hours.
- Availability always subtracts only reservations with `status = 'active' AND expires_at > now()`.
- Request-time reclamation marks expired rows for cleanliness; correctness never waits for a sweeper.
- Stock decrements only inside successful settlement, never on add-to-cart or order placement.

The general background worker remains deferred. A later sweeper may reduce row accumulation, but it cannot be required for accurate availability.

### COM-D4 - Guest-to-account cart merge is atomic and never silently truncates

At login:

- if no active account cart exists, ownership of the guest cart moves to the person in one transaction;
- if both carts exist, quantities are summed by variant only when every resulting quantity can be fully reserved;
- if any line cannot be fully reserved or has become unavailable/ineligible, the transaction makes no merge changes and returns explicit line conflicts;
- the customer chooses quantities or removes conflicts, then retries with the same merge idempotency key;
- a successful merge converts the guest cart and rotates/deletes its anonymous cookie.

No quantity is capped silently, no price is copied from browser state, and a retry cannot merge twice.

### COM-D5 - Checkout is a quote-and-place workflow, not a client total submission

The checkout read returns current cart lines, availability, contact, address choices, shipping quotes, and server-computed totals. The browser may submit selected identifiers and a cart version; it never submits authoritative prices, discounts, stock, shipping money, or order totals.

`placeOrder` re-reads and locks the cart, lines, prices, inventory, reservations, and selected shipping rule. It rejects changed prices, expired reservations, unavailable/restricted products, stale cart versions, invalid address coverage, and incomplete contact data with explicit recoverable outcomes.

The order stores immutable line, contact, address, shipping-label, and amount snapshots. Later catalogue, customer, address, or shipping-rate edits never rewrite the order.

### COM-D6 - Order and payment state are separate

Order state describes fulfilment progress. Payment state describes money evidence. They do not impersonate each other.

Order transitions:

```text
draft
  -> awaiting_transfer -> payment_review -> paid -> fulfilled -> completed
  -> awaiting_payment ---------------------> paid -> fulfilled -> completed

draft / awaiting_transfer / awaiting_payment -> cancelled
paid / fulfilled / completed --full approved refund--> refunded
```

A partial refund is derived from refund records and displayed separately; it does not move the entire order to `refunded`. A failed gateway attempt leaves the order `awaiting_payment` while that payment becomes `failed`, allowing a new payment attempt.

Shipment transitions:

```text
pending -> ready -> shipped -> delivered
pending / ready -> cancelled
delivered -> returned
```

Pickup uses the same shipment aggregate: `ready` means ready at the institute and `delivered` means collected.

### COM-D7 - Bank-transfer evidence and matching amount are explicit

A transfer receipt, tracking number, card suffix, or customer statement is a claim, not proof. Only a staff member who has matched the real bank statement may accept a claim and invoke settlement.

Money meanings are fixed:

- `customer_order.total_rials` is the invoice total for goods, shipping, and discounts;
- `payment.amount_rials` is the exact amount the customer is expected to send for that payment attempt;
- `bank_transfer_claim.expected_amount_rials` is copied from `payment.amount_rials` by the service and is never accepted from the client;
- `payment_settlement.amount_rials` is the verified amount received for that payment.

The current deterministic bank-transfer remainder is retained only if the invoice represents it as an explicit `payment_matching_adjustment_rials` and the total equation includes that adjustment. The adjustment is 0 for gateway and pickup methods. A customer must never be asked to pay more than the invoice total without an invoice line explaining the difference.

Payment method and its matching adjustment are locked when the order is placed. Switching an unpaid order to another method cancels that unpaid order and starts a fresh idempotent checkout; it never mutates an already issued invoice in place.

Before implementation, the migration therefore adds the adjustment column and changes the total check to:

```text
total = subtotal + shipping + payment_matching_adjustment - discount
```

The service derives the transfer payment amount from the final order total, and the claim derives its expected amount from the payment. No independent caller-provided value exists.

### COM-D8 - One idempotent settlement path has two evidence adapters

Both accepted bank transfer and successful gateway verification call one server-only transaction service:

```ts
settleOrder(input: SettlementEvidence): Promise<SettlementResult>
```

The adapters differ only in how they establish funds evidence. The transaction then:

1. locks payment and order;
2. returns the existing result for the same idempotency key and request hash;
3. rejects key reuse with a different request hash;
4. locks order reservations and inventory rows in ascending `variant_id` order;
5. proves the payment belongs to the same order through a composite database foreign key;
6. verifies received amount against the payment attempt;
7. rechecks or atomically reacquires expired reservation quantities;
8. inserts the unique settlement;
9. decrements inventory and appends one movement per variant;
10. consumes reservations;
11. advances payment and order timestamps/states;
12. writes audit and notification-outbox rows;
13. commits everything together.

Any failure rolls back every step. A duplicate callback, double-click, provider retry, or staff retry cannot decrement twice or emit a duplicate notification.

If bank funds arrived after stock became unavailable, the payment moves to `funds_received`, the order moves to `payment_review`, and a staff refund-or-contact case is created. The order does not become paid and inventory does not go negative.

### COM-D9 - ZarinPal is an external boundary, not an internal API layer

The application defines:

```ts
interface PaymentGateway {
  request(input: GatewayRequest): Promise<GatewayRequestResult>;
  verify(input: GatewayVerifyRequest): Promise<GatewayVerifyResult>;
}
```

`ZarinpalGateway` is the first adapter. Request/response DTOs use branded decimal rial strings at JSON boundaries and convert to `bigint` only inside server-only code. Provider timeouts and malformed responses are operational failures, not payment declines.

ZarinPal's currently published account/invoice/refund documentation includes a GraphQL endpoint at `/api/v4/graphql`, while the familiar merchant gateway contract uses request/redirect/verify semantics. COM5 records and contract-tests the exact API/version enabled for the real merchant terminal instead of assuming an old endpoint from memory. Both transports map to the same two application operations and the same settlement evidence.

The callback query string is not proof. The Route Handler performs server-to-server verification. Provider success and already-verified responses both converge on idempotent settlement. Every request, response classification, and provider identifier is recorded in `payment_event` with secrets and unnecessary personal data removed.

Refund automation is not invented before an approved provider contract exists. V1 staff issue the refund through the actual banking/gateway channel, then `recordRefund` stores verified reference, amount, actor, and inventory disposition. A future provider refund adapter can call the same refund-recording transaction.

### COM-D10 - Fulfilment supports partial shipments without forcing them

One order may have multiple shipments. `shipment_line` records the quantity of each order line in a shipment. V1 UI normally creates one shipment containing every remaining shippable line; the data model can represent a partial/backorder without rewriting existing orders.

An order becomes `fulfilled` when all non-returned quantities have been assigned to shipped/pickup-ready shipments. It becomes `completed` when all are delivered/collected and no open return needs action. Tracking changes are staff-only and audited.

### COM-D11 - Returns, refunds, and restocking are separate decisions

A return request is a customer claim. Approval does not automatically refund or restock.

Flow:

```text
requested -> approved | rejected
approved -> in_transit -> received -> inspected
inspected -> resolved
```

Each return line records requested quantity, approved quantity, received quantity, condition, and resolution. Staff independently choose:

- refund amount;
- whether the item is safe and eligible to restock;
- whether shipping is refunded;
- whether the case is rejected with a policy reason.

Restocking inserts an `inventory_movement(type='refund_restock')` and increments inventory in the same transaction. Damaged/opened/unsafe skincare never returns to sellable stock. Refund totals cannot exceed settled funds minus prior successful refunds. A full refund may transition the order to `refunded`; a partial refund remains an attached financial state.

The business-approved `/returns` policy is a launch gate. Code does not invent return windows, hygiene eligibility, shipping responsibility, or refund service levels.

## 3. Database correction and extension contract

### 3.1 Review corrections that land before transaction code

The first commerce migration must implement the accepted findings from the review:

1. add required `customer_order.contact_phone`, backfill it, and remove the person-or-guest contact check;
2. add unique `(payment.id, payment.order_id)` and a composite foreign key from `payment_settlement(payment_id, order_id)`;
3. make `inventory_reservation.source_cart_item_id` nullable with `ON DELETE SET NULL`, add required historical `source_cart_id`, and retain variant/quantity audit facts;
4. add status/timestamp checks for settled/refunded payments and ready/shipped/delivered/returned shipments;
5. add unique `(order_id, variant_id)` to `order_line` because checkout produces one snapshot line per variant;
6. replace free-text `payment_event.kind` with an explicit enum used by every gateway/transfer event;
7. drop `price.effective_at`; scheduled pricing is not supported by the current one-row-per-variant/group model;
8. simplify the redundant published-product index predicate while preserving the publication check;
9. add `payment_matching_adjustment_rials` and update the order total equation;
10. make every claim expected amount service-derived from its payment.

The search-index and Arabic/Persian normalization corrections from the same review remain DB3 prerequisites in `database-foundation.md`; they are not hidden inside checkout work.

### 3.2 New checkout and operations tables

Add only the structures required by the launch flow:

| Table                | Purpose                                          | Key constraints/indexes                                                                                                     |
| -------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `iran_province`      | Canonical province reference                     | stable code PK, unique Persian name                                                                                         |
| `iran_city`          | Canonical city reference                         | code PK, province FK, unique province/name, province index                                                                  |
| `shipping_rate`      | Active flat-rate pickup/courier/post rules       | method + location specificity uniqueness; non-negative `bigint`; active lookup index                                        |
| `order_access_token` | Guest order/status access                        | token hash unique, order FK, expiry/revocation index; raw token never stored                                                |
| `shipment_line`      | Quantity allocation for partial shipment support | shipment/order-line unique, positive quantity, both FKs indexed                                                             |
| `return_request`     | Customer/staff return workflow                   | order/person, status, request idempotency+hash, status/time index, reviewer checks                                          |
| `return_line`        | Per-line quantities and disposition              | return/order-line unique, non-negative bounded quantities                                                                   |
| `refund`             | Partial/full refund ledger                       | payment+order composite relation, amount `bigint`, idempotency+hash, provider reference uniqueness, status/timestamp checks |

Order/address snapshots include schema-versioned JSON with recipient name, contact phone, canonical province/city codes and labels, postal code, line, and delivery instructions. Snapshot parsing is versioned server-side; client code never interprets arbitrary historical JSON.

No coupon, promotion, tax, warehouse, carrier-label, RMA-package, or generic workflow table is introduced by this plan.

## 4. Module and file boundaries

```text
src/modules/cart/
  cart.reads.ts
  cart.actions.ts
  cart.service.ts
  cart.schemas.ts
  cart.models.ts
  cart.store.ts
  tests/cart.integration.test.ts

src/modules/checkout/
  checkout.reads.ts
  checkout.actions.ts
  checkout.service.ts
  shipping.service.ts
  checkout.schemas.ts
  checkout.models.ts
  components/
  screens/
  tests/checkout.integration.test.ts
  checkout.store.ts

src/modules/orders/
  order.reads.ts
  order.actions.ts
  order.models.ts
  access-token.ts
  components/
  screens/
  tests/order-status.integration.test.ts
  orders.store.ts

src/modules/payments/
  payment-gateway.ts
  zarinpal.gateway.ts
  bank-transfer.service.ts
  settlement.service.ts
  refund.service.ts
  payment.schemas.ts
  payment.models.ts
  tests/settlement.integration.test.ts
  payments.store.ts

src/modules/fulfilment/
  fulfilment.reads.ts
  fulfilment.actions.ts
  fulfilment.service.ts
  return.service.ts
  fulfilment.schemas.ts
  fulfilment.models.ts
  components/
  screens/
  tests/fulfilment.integration.test.ts
  fulfilment.store.ts
```

The shared payment abstraction lives in `src/lib/payments/` only when Booking or Academy becomes a real second consumer. Until then, it remains inside `src/modules/payments/`; no speculative shared package is created.

Routes stay thin and map locale/session/token outcomes. They do not import Drizzle schema or provider clients.

## 5. Reads, mutations, and external routes

### 5.1 Server-only reads

```ts
getCart({ locale }): Promise<CartOutcome<CartPageModel>>
getCheckout({ locale }): Promise<CheckoutOutcome<CheckoutPageModel>>
getOrderStatus({ locale, orderNumber, guestToken }): Promise<OrderStatusOutcome>
listTransferClaims(input: StaffQueueInput): Promise<TransferQueuePageModel>
listOrders(input: StaffOrderQueueInput): Promise<StaffOrderQueuePageModel>
getFulfilmentOrder(input: StaffOrderInput): Promise<FulfilmentOrderPageModel>
listReturnRequests(input: StaffReturnQueueInput): Promise<ReturnQueuePageModel>
```

`guestToken` is verified against its hash before any order facts are returned. Authenticated ownership comes from the server session and is never accepted as a parameter.

### 5.2 Customer/guest Server Actions

```ts
addLine(input: unknown): Promise<CartActionResult>
setLineQuantity(input: unknown): Promise<CartActionResult>
removeLine(input: unknown): Promise<CartActionResult>
mergeGuestCart(input: unknown): Promise<CartMergeResult>
placeOrder(input: unknown): Promise<PlaceOrderResult>
startGatewayPayment(input: unknown): Promise<GatewayStartResult>
submitTransferClaim(input: unknown): Promise<TransferClaimResult>
cancelUnpaidOrder(input: unknown): Promise<OrderActionResult>
requestReturn(input: unknown): Promise<ReturnActionResult>
```

For guest-owned actions, “authorization” means resolving and verifying the server-issued anonymous cart/order token from an httpOnly cookie or submitted guest access token. Arbitrary cart, line, order, payment, or claim identifiers never establish ownership.

### 5.3 Staff Server Actions

```ts
acceptTransferClaim(input: unknown): Promise<StaffPaymentActionResult>
rejectTransferClaim(input: unknown): Promise<StaffPaymentActionResult>
createShipment(input: unknown): Promise<FulfilmentActionResult>
advanceShipment(input: unknown): Promise<FulfilmentActionResult>
reviewReturn(input: unknown): Promise<ReturnActionResult>
receiveReturn(input: unknown): Promise<ReturnActionResult>
resolveReturn(input: unknown): Promise<ReturnActionResult>
recordRefund(input: unknown): Promise<RefundActionResult>
```

Every Server Action performs shared Zod parsing first, then role/ownership authorization, then calls one transaction service.

### 5.4 Route Handlers

| Route                                     | Purpose                                                                                        | Security                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `GET /[locale]/checkout/gateway/callback` | Receive browser return, verify server-to-server, settle idempotently, redirect to order status | no trust in query status; strict provider/DB evidence              |
| `POST /api/payments/zarinpal/webhook`     | Reserved only if an approved ZarinPal contract supplies signed events                          | absent until real webhook verification exists                      |
| `POST /api/uploads/receipt-request`       | Issue short-lived Iran-hosted object-storage upload authorization                              | cart/order ownership, MIME/size limits, object key scoped to claim |
| `GET /api/health`                         | Database and application health in deployment phase                                            | no secret/detail leakage; timeout and dependency classification    |

The same Next.js application does not call these routes for its ordinary reads.

## 6. Transaction boundaries and lock order

All transaction services use this lock order to reduce deadlocks:

```text
cart -> cart_item -> customer_order -> payment -> inventory_reservation
     -> inventory (ascending variant_id) -> shipment/return/refund
```

Not every transaction locks every aggregate; when it does, it follows the relative order.

### Cart mutation

Lock owner cart and version, reclaim relevant expired reservations, resolve publication/eligibility/current price, lock inventory+active reservations for the variant, validate full requested quantity, upsert absolute line quantity, renew reservation, increment cart version, commit.

### Place order

Lock cart/version and all lines, validate contact/address/shipping, re-read prices and offer policy, lock inventory/reservations in stable order, create immutable order and one line per variant, attach/extend reservations, create the selected payment attempt, convert cart, issue guest token when needed, append audit/outbox records, commit.

### Gateway verification or transfer acceptance

Record sanitized evidence classification, then call the single settlement transaction described in COM-D8. External HTTP calls occur outside the database transaction; their verified result is passed in with idempotency and request hash.

### Shipment transition

Lock order/shipment/lines, validate state and allocated quantities, advance timestamp/status, derive order fulfilment status, append audit/outbox, commit.

### Return resolution and refund

Lock return/order/payment/refunds and affected inventory rows, validate refundable balance and received quantities, insert refund, optionally restock through inventory movements, derive full/partial refund display state, advance return/order states, append audit/outbox, commit.

## 7. Error and retry contract

Expected recoverable codes include:

- cart: `CART_EXPIRED`, `CART_VERSION_CHANGED`, `LINE_UNAVAILABLE`, `QUANTITY_UNAVAILABLE`, `PRICE_CHANGED`, `PRODUCT_RESTRICTED`, `MERGE_CONFLICT`;
- checkout: `CONTACT_REQUIRED`, `ADDRESS_INVALID`, `SHIPPING_UNAVAILABLE`, `RESERVATION_EXPIRED`, `CHECKOUT_ALREADY_COMPLETED`;
- payment: `PAYMENT_ALREADY_SETTLED`, `PAYMENT_AMOUNT_MISMATCH`, `PAYMENT_NOT_VERIFIED`, `TRANSFER_CLAIM_ALREADY_REVIEWED`, `FUNDS_RECEIVED_STOCK_UNAVAILABLE`;
- fulfilment: `INVALID_ORDER_TRANSITION`, `INVALID_SHIPMENT_TRANSITION`, `TRACKING_REQUIRED`, `RETURN_WINDOW_CLOSED`, `RETURN_QUANTITY_INVALID`, `REFUND_EXCEEDS_SETTLED_AMOUNT`;
- ownership/auth: `UNAUTHORIZED`, `FORBIDDEN`, `ORDER_ACCESS_INVALID`, `ORDER_ACCESS_EXPIRED`.

Database outages, provider timeouts, malformed provider responses, impossible totals, negative effective availability, and broken settlement relations throw operational/integrity errors. They are never represented as an empty cart, declined payment, or successful retry.

Every idempotent write stores a key and request hash. Same key+same hash returns the recorded result; same key+different hash returns `IDEMPOTENCY_CONFLICT`.

## 8. Phased delivery

### COM0 - Apply review corrections and transaction schema extensions

**Files:** commerce/identity schema files, generated next Drizzle migration/snapshot, schema/invariant tests.

- [ ] Write failing schema tests for all ten review corrections in section 3.1.
- [ ] Add failing tests for province/city, shipping rate, guest order token, shipment line, return, and refund constraints.
- [ ] Generate and review SQL; do not edit migration history `0000`.
- [ ] Migrate from zero, seed twice, and run live constraint probes on PostgreSQL 16.

**Exit gate:** the review's live deletion and settlement defects are closed in schema, every new FK is indexed, and the fresh migration path is repeatable.

### COM1 - Finish the cart and reservation slice

**Files:** `src/modules/cart/*`, `/[locale]/cart`, and cart/reservation integration tests.

- [ ] Test guest/account ownership, absolute quantity changes, removal, 20-minute TTL, expiry, retry, version conflict, concurrent contention, and atomic merge.
- [ ] Implement `getCart`, the four cart actions, and transaction service.
- [ ] Connect the shared cart drawer and mobile page to the same server model.
- [ ] Confirm `source_cart_item_id` becomes null safely after removal while reservation history remains queryable through `source_cart_id`.

**Exit gate:** two carts cannot reserve more than on-hand stock, and retries/merges never duplicate or silently reduce quantities.

### COM2 - Build Iranian address, shipping quote, and checkout read

**Files:** reference seeds, shipping schema/service, checkout models/schemas/reads, address form, and tests.

- [ ] Seed reviewed Iranian province/city references deterministically.
- [ ] Test pickup, Mashhad courier, nationwide post, inactive/missing/duplicate rates, free threshold if configured, and stale address identifiers.
- [ ] Implement `ShippingQuote` and `getCheckout` with server-owned totals.
- [ ] Build the Persian address/shipping UI with explicit LTR isolation for phone/postal values.

**Exit gate:** every displayed shipping choice and total comes from one server quote and can be reproduced from its canonical inputs.

### COM3 - Place immutable guest/account orders

**Files:** checkout service/action, order access-token service, order reads/screens, and integration tests.

- [ ] Test stale cart, price change, expired reservation, unavailable/restricted line, guest contact, saved address, idempotent retry, and concurrent checkout.
- [ ] Implement `placeOrder`, immutable snapshots, payment attempt creation, reservation conversion, cart conversion, and guest token issuance.
- [ ] Implement order confirmation/status reads for session owner and signed guest access.
- [ ] Verify order number enumeration reveals no data.

**Exit gate:** one cart/version/idempotency request creates at most one correct order with server totals and durable access.

### COM4 - Launch bank transfer and staff verification

**Files:** bank-transfer service, transfer claim form, `/admin/transfers`, settlement service, and tests.

- [ ] Test expected amount derivation, duplicate claims, accepted/rejected review, staff authorization, late funds with/without stock, and settlement retry.
- [ ] Implement customer transfer instructions/claim submission and the staff transfer queue.
- [ ] Implement `settleOrder` and prove atomic stock, movement, reservation, payment, order, audit, and outbox effects.
- [ ] Add the explicit refund-or-contact queue for late funds with unavailable stock.

**Exit gate:** a real staff-confirmed transfer settles once, and a receipt alone can never mark an order paid.

### COM5 - Add ZarinPal behind the gateway boundary

**Files:** payment gateway interface, ZarinPal adapter, callback route, gateway-start action, and contract/integration tests.

- [ ] Test request success/failure/timeout/malformed response, callback cancellation, verify success, already-verified success, verify failure, duplicate callback, and amount mismatch.
- [ ] Implement request outside a DB transaction, persist authority safely, redirect, verify server-to-server, then call `settleOrder`.
- [ ] Record sanitized payment events before/after provider interactions.
- [ ] Exercise the provider sandbox from Iranian staging with the production callback shape.

**Exit gate:** repeated browser/provider callbacks settle one order once; a query-string success without verify cannot settle.

### COM6 - Implement fulfilment and customer tracking

**Files:** fulfilment module, staff order/shipment screens, customer order status, and tests.

- [ ] Test full and partial shipment allocation, pickup, tracking requirements, invalid transitions, delivery completion, and retry.
- [ ] Implement shipment creation/advancement and derived order fulfilment state.
- [ ] Render customer status/timeline from page-ready models, not raw enum labels.
- [ ] Add notification-outbox events without implementing a general worker in this phase.

**Exit gate:** staff can ship or mark pickup ready, customers see truthful status, and invalid transitions fail in the transaction.

### COM7 - Implement cancellation, returns, refunds, and restocking

**Files:** return/refund services, customer request UI, staff return queue, refund screens, and tests.

- [ ] Encode the owner-approved return policy as shared Zod/domain rules and tests.
- [ ] Test unpaid cancellation, late cancellation rejection, requested/approved/rejected/received/inspected/resolved returns, partial/full refunds, duplicate refund, refund ceiling, restock, and no-restock.
- [ ] Implement customer and staff actions with full audit history.
- [ ] Prove restock and refund records commit atomically and unsafe products never re-enter stock.

**Exit gate:** every returned rial and every restocked unit has a reviewed, idempotent, auditable reason.

### COM8 - End-to-end operations, failure drills, and rollout

**Files:** Playwright journeys, runbooks, dashboards/alerts, and rollout evidence.

- [ ] Run browse -> cart -> guest checkout -> transfer claim -> admin accept -> shipment -> delivery.
- [ ] Run authenticated checkout -> ZarinPal -> refreshed callback -> order status.
- [ ] Run late transfer with unavailable stock -> staff refund/contact -> recorded refund.
- [ ] Run delivered order -> partial return -> receive/inspect -> partial refund -> no restock.
- [ ] Inject database/provider/object-storage/SMS failure and process restart at each transaction boundary.
- [ ] Complete Persian RTL, keyboard, screen-reader, reduced-motion, print invoice, and 390/768/1440 visual QA.
- [ ] Roll out bank transfer first, fulfilment second, ZarinPal third, returns/refunds fourth, with feature flags/configuration rollback at each boundary.

**Exit gate:** real PostgreSQL and Iranian staging evidence covers success, retry, concurrency, failure, staff operations, customer recovery, and rollback.

## 9. Required query and performance evidence

Before release, capture `EXPLAIN (ANALYZE, BUFFERS)` with representative data for:

- active cart by person/anonymous hash;
- cart lines plus active unexpired reservations;
- availability by variant under concurrent reservation load;
- staff transfer queue by status/time;
- customer orders by person/time;
- guest order token hash lookup;
- staff order/fulfilment queue by status/time;
- shipment and return lines by order;
- refundable balance by payment and successful refunds.

No query may load all orders/payments/returns and filter in application memory. Customer and staff lists use stable keyset pagination where mutable status queues permit it; public order detail is a bounded point lookup.

## 10. Operational and security checklist

- Order totals and claim expected amounts are never accepted from clients.
- Guest tokens and anonymous cart keys are stored hashed and compared server-side.
- Uploaded receipts are private, size/type bounded, and never treated as proof.
- Payment/provider payload logs redact secrets and unnecessary personal data.
- All staff transitions require current role checks and produce audit rows.
- Settlement/refund/inventory effects are in one transaction and idempotent.
- Reservation expiry correctness does not depend on a worker.
- Notification outbox insertion is transactional; delivery failure cannot roll back money/stock truth.
- Order/invoice snapshots remain readable after account closure and catalogue changes.
- Return/restock policy prevents opened or unsafe skincare from becoming sellable.
- Legal terms, privacy, returns, and invoice/tax decisions are approved before production orders.

## 11. Explicit deferrals

- coupons, promotions, gift cards, loyalty, referrals, subscriptions, instalments for shop orders;
- live carrier pricing, carrier label APIs, multiple warehouses, international shipping;
- automated receipt OCR or automatic bank-statement matching;
- automated gateway refunds before a verified provider contract;
- background job queue or general outbox worker;
- fraud scoring, marketplace sellers, multi-currency, cash on delivery/pickup;
- exchanges as a special workflow: v1 records a return/refund and a new order;
- AI access to customer, payment, refund, or return authority.

## 12. Completion definition

The transaction program is complete only when guest and authenticated carts, Iranian checkout, bank transfer, optional ZarinPal, idempotent settlement, inventory accounting, fulfilment, customer status, staff queues, cancellation, returns, refunds, Persian RTL QA, concurrency tests, failure drills, and Iranian staging verification all pass. Database tables without these transaction and operational proofs are not a live shop.
