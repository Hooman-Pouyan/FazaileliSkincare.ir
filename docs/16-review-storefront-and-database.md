# Review — storefront plans and database foundation

**Date:** 2026-08-24 · **Reviewer pass:** read-only · **Scope:** commit `7f212b7` (48 tables, migration `0000`) plus the storefront/architecture planning bundle.
**Verdict: `approve with targeted corrections`.**

Six corrections are worth making before DB3/DB5 code is written. One is a live defect that will surface the first time anyone deletes a customer. Nothing here requires rework of the schema's shape, and none of it invalidates the phase order.

---

## 1 · Findings, by severity

### 🔴 HIGH-1 — Deleting a person aborts on their own orders

`src/lib/db/schema/order.ts` · migration lines 439 + 638

```sql
person_id … ON DELETE set null
CONSTRAINT "customer_order_contact_check"
  CHECK (person_id is not null or guest_phone is not null)
```

A registered customer's order has `guest_phone = NULL`. Deleting that person sets `person_id → NULL`, which immediately violates the check. **The DELETE aborts.** Every downstream cascade (`address`, `cart`, `person_role`, sessions) is configured for deletion, so account deletion is clearly an intended flow — it just cannot complete for anyone who has ordered.

Worse, the failure surfaces as an opaque constraint error inside a cascade, not as a domain rule.

**Smallest correction:** snapshot the contact at placement rather than depending on the person row.

```sql
ALTER TABLE customer_order ADD COLUMN contact_phone text;
UPDATE customer_order SET contact_phone = guest_phone WHERE contact_phone IS NULL;
-- backfill from person for existing rows, then:
ALTER TABLE customer_order ALTER COLUMN contact_phone SET NOT NULL;
ALTER TABLE customer_order DROP CONSTRAINT customer_order_contact_check;
```

An order is a financial record; it should carry its own contact and survive the customer row. This also fixes guest→account linking later. *(Task: fold into `DB6`, or a small `DB0.1` fix migration.)*

### 🔴 HIGH-2 — A settlement can be attached to the wrong order

`payment_settlement` carries `payment_id` and `order_id` as **two independent foreign keys** (migration 646–647). Nothing prevents `payment_settlement.order_id ≠ payment.order_id`. A settlement service with a transposed variable marks the wrong order paid, and every invariant test still passes.

**Smallest correction — enforce it in the database, not in a code review:**

```sql
ALTER TABLE payment ADD CONSTRAINT payment_id_order_unique UNIQUE (id, order_id);
ALTER TABLE payment_settlement DROP CONSTRAINT payment_settlement_payment_id_payment_id_fk;
ALTER TABLE payment_settlement DROP CONSTRAINT payment_settlement_order_id_customer_order_id_fk;
ALTER TABLE payment_settlement ADD CONSTRAINT payment_settlement_payment_order_fk
  FOREIGN KEY (payment_id, order_id) REFERENCES payment (id, order_id) ON DELETE RESTRICT;
```

This is the exact class of invariant the rest of this schema enforces well; it is a gap, not a philosophy difference. *(Task: `DB6` prerequisite.)*

### 🟠 MEDIUM-3 — The search index cannot serve the search query

`product_translation_search_idx` is a **B-tree on `(locale_code, normalized_search_text)`**. A B-tree serves `=` and prefix (`LIKE 'x%'`). Persian catalogue search is overwhelmingly **infix** — a customer types «ویتامین» expecting «سرم ویتامین ث». `LIKE '%ویتامین%'` cannot use this index and will sequential-scan.

`docs/system-design/storefront/plp.md:94` says "PostgreSQL full-text/trigram behavior accepted," but the migration contains **no `pg_trgm`, no GIN, no tsvector** (verified by grep).

**Recommendation — `pg_trgm`, not full-text.** Postgres ships no Persian stemmer or stop-word list; `to_tsvector('simple', …)` would give you token matching with no morphology, which is barely better than LIKE and much more machinery. Trigram GIN handles infix, typos and the ZWNJ-vs-space problem (below) in one index:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX product_translation_search_trgm
  ON product_translation USING gin (normalized_search_text gin_trgm_ops);
```

Keep the existing B-tree — it still serves exact-locale lookups. Do this at **DB3**, when the query shape exists, and capture the `EXPLAIN (ANALYZE, BUFFERS)` the plan already asks for.

### 🟠 MEDIUM-4 — Normalization misses the Arabic letter forms Persian users actually type

`src/lib/db/normalize-catalog-search.ts` folds `ي/ى→ی`, `ك→ک`, both digit sets, tatweel, diacritics and ZWNJ. That is the right list — and it is missing the two most common remaining cases:

| Typed | Should fold to | Handled? |
|---|---|---|
| `أ إ آ ٱ` | `ا` | ❌ |
| `ة` | `ه` | ❌ |
| `ؤ ئ` | `و` / `ی` | ❌ |

`NFKC` does not fold these — they are distinct letters, not presentation forms. Products with Arabic-influenced spelling will silently fail to match. One line each:

```ts
.replace(/[أإآٱ]/gu, "ا")
.replace(/ة/gu, "ه")
```

**Separately, a documented consequence worth stating:** ZWNJ collapses to a space, so «می‌روم» → «می روم». That matches a user typing the space, but **not** a user typing «میروم» with no separator. Trigram indexing (MEDIUM-3) is what closes that gap; note it rather than adding more folding rules.

### 🟠 MEDIUM-5 — `inventory_reservation.source_cart_item_id` makes cart items undeletable

`NOT NULL` + `ON DELETE RESTRICT` (`reservation.ts`). Once an item is reserved, its `cart_item` row can never be deleted — so "remove from cart" must become a soft-delete, and cart rows accumulate permanently. Nothing in the plan says that.

**Smallest correction:** make the link nullable and denormalize what the audit trail actually needs.

```sql
ALTER TABLE inventory_reservation ALTER COLUMN source_cart_item_id DROP NOT NULL;
-- FK → ON DELETE SET NULL
ALTER TABLE inventory_reservation ADD COLUMN source_cart_id uuid REFERENCES cart(id);
```

`variant_id` and `quantity` already live on the reservation, so releasing the cart item loses nothing that matters. The partial unique on active reservations still holds. *(Task: `DB5`.)*

### 🟡 LOW-6 — Status/timestamp checks are applied inconsistently

`bank_transfer_claim` has an exemplary `review_check` tying status to `reviewed_by`/`reviewed_at`. `payment` and `shipment` have **no equivalent** — `status='settled'` with `settled_at IS NULL` is currently legal, as is `shipment.status='delivered'` with no `delivered_at`.

```sql
ALTER TABLE payment ADD CONSTRAINT payment_settled_check
  CHECK ((status = 'settled') = (settled_at IS NOT NULL));
```

Same shape for `refunded_at` and for shipment. Cheap, and it matches the standard this schema otherwise sets.

### 🟡 LOW-7 — Small gaps

- **`order_line` has no unique on `(order_id, variant_id)`** (verified: no unique index exists). `cart_item` has one. A retry bug produces two lines for one variant and the totals check still passes.
- **`person.phone` has no format check** while `address.postal_code` has a regex. Add `CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{7,14}$')` — E.164, consistent with the normalisation the auth layer will do anyway.
- **`payment_event.kind` is free `text`** while every comparable field is an enum. A typo becomes a silently unqueryable audit row.
- **`price.effective_at` is decorative.** The unique on `(variant_id, customer_group)` permits exactly one row per pair, so a future-dated price cannot be stored. Either drop the column or make scheduling real — as it stands it advertises a capability the constraint forbids.
- **`product_public_catalog_idx` predicate is redundant**: `product_published_state_check` already guarantees `is_published ⇒ review_state='approved'`. Harmless, but the index predicate can drop that clause.

### 🟡 LOW-8 — Publication does not imply purchasability

`product_published_state_check` requires approval + `published_at`. It does **not** require an active variant, a public price, approved media, or a translation in the requested locale. A published product with no variant renders on the PLP with no price and no add-to-cart.

**Do not add a database constraint for this** — it spans four tables and would need triggers or deferred checks. Put it in the **read predicate** at DB3 (`EXISTS(active variant) AND EXISTS(price for group) AND EXISTS(translation for locale)`) and mirror it as a staff-workflow gate. Record it as one rule in `database-foundation.md` so both places cite the same definition.

---

## 2 · Code ↔ document drift

| # | Document says | Code / reality | Disposition |
|---|---|---|---|
| D-a | `06-site-map.md:72` — "there is no password" | `12-implementation-plan.md:104`, `database-foundation.md:174,218` — "phone OTP **plus** email/password"; `auth_account.password` exists | **Contradiction. Resolve in favour of passwordless for customers** (§4) |
| D-b | `00-decision-map.md:38` D13 — "**no mega-menu**" | `storefront.md:323,344` introduces a deferred Shop Relay mega-menu | Amend D13 to a scoped exception, or rename Relay so it is not a mega-menu. Do not leave both standing |
| D-c | `plp.md:94` — "full-text/trigram behavior accepted" | No `pg_trgm`, GIN or tsvector in migration `0000` | MEDIUM-3 — plan it at DB3, or soften the doc to "index strategy pending `EXPLAIN` evidence" |
| D-d | `database-foundation.md:127` — "reserved stock derived from active, **unexpired** reservations" | Index predicate is `status='active'` only; expiry is time-based and cannot be indexed | Not a defect — but the read predicate **must** include `expires_at > now()`, and the sweeper is cleanup, not correctness. State that explicitly |
| D-e | Repo rule "no background job queue until it hurts" | `notification_outbox` has `locked_at`/`locked_by`/`attempts`/`available_at` — a worker-shaped table | Table is justified (SMS costs money; duplicates are worse). The **worker** is the deferred part. Say so, or the next reader will build one |
| D-f | Storefront plan stops before checkout | `12-implementation-plan.md` Phase 2 still describes checkout, ZarinPal and `/admin/transfers` | Add a pointer from Phase 2 to the storefront stopping boundary so the newer, narrower scope wins |

---

## 3 · Overengineering assessment — kept separate

**48 tables is defensible.** I looked for tables to cut and found few worth cutting:

| Table | Verdict |
|---|---|
| `price_history`, `price_adjustment_batch` | **Keep.** Rial pricing on imported stock moves monthly; "why is this more than last month" is a real customer conversation. Retro-fitting history after live orders is expensive |
| `inventory_movement` | **Keep.** The append-only ledger is what makes stock arguments resolvable |
| `notification_outbox` | **Keep the table, defer the worker.** Duplicate SMS costs money |
| `audit_log` | **Keep.** Payments are attached |
| `protocol_phase`, `product_protocol_phase` | **Keep, but they are the one speculative pair.** They exist for the protocol-as-IA strategy, which is well-evidenced but not yet a product decision. Cost is two tables and a join — cheap. Add nothing more until the protocol is named |
| `skin_state`, `product_skin_state` | **Keep.** `پس از درمان` is the one facet only a business with treatment rooms can offer |

**The genuinely over-abstract item is not a table — it is `price.effective_at`** (LOW-7): a scheduling affordance the unique constraint makes unusable.

**On the storefront plan:** 3,050 lines across nine documents is a lot of planning for one shop. It is *not* a speculative framework — the ownership boundaries are concrete and the three Commerce reads are page-shaped rather than a generic query layer, which is exactly right. But it is close to the ceiling of what can stay true while the code moves. **Recommendation:** freeze the storefront bundle at its current size. New planning goes into task tickets, not new documents.

**The three reads are correctly deep.** `getShopHub`/`listProducts`/`getProduct` return page models, not row sets, and nothing pushes ORM shapes into components. Protect the count: autocomplete and Relay must attach to `listProducts` with an argument, or take an explicit fourth read through `RELAY0` — not silently.

---

## 4 · Authentication — one recommendation

**Use Better Auth. Ship customers as phone + OTP only. Give email/password to staff, later, as a separate path.**

Auth0 and every managed alternative are out for the same reason Vercel and Neon are: US-operated, sanctioned, unreachable. That is not a trade-off, it is a closed door.

Custom auth is smaller than people think **for OTP alone** — issue, verify, rate-limit, session rotate. It stops being small the moment you add password hashing, reset tokens, and email verification. So the decision hinges entirely on whether email/password exists in v1.

**It should not, and `06-site-map.md` already got this right.** Dropping it resolves the drift *and* removes the schema's biggest friction:

- `person.email NOT NULL` exists to satisfy Better Auth's own `getTempEmail` for phone-first signup. `email_is_placeholder` plus the check that a placeholder can never be verified is a **thoughtful** accommodation, not a mistake — credit where due.
- But it leaves two live risks: placeholder emails must stay unique under `lower(email)`, so a re-signup on a recycled phone number can collide; and the transition when a customer later adds a real email needs an explicit, tested path.
- Passwordless customers make both risks small and rare instead of routine.

**Concretely:**
1. Customers: `phoneNumber` plugin, 6-digit OTP, short TTL, rate-limited by **phone *and* IP** — Better Auth's 3-attempt limit protects one code, not your SMS budget.
2. Staff: a separate `/admin` entry with email+password and TOTP. Password earns its place where step-up matters.
3. `auth_session.token` is stored in plaintext with a unique index — Better Auth's default. Note it: a database read becomes session takeover. Hashing it diverges from the adapter, so treat it as a **backup-encryption and access-control** requirement rather than a schema change.
4. Delete `auth_account.password` from the customer path only after the staff path lands; it costs nothing to leave the column.

**Amend `12-implementation-plan.md:104` and `database-foundation.md:174,218` to match `06-site-map.md`.** That is the smallest edit that removes the contradiction, and it happens to be the better product decision.

---

## 5 · Phase order — two changes only

DB0–DB8 is sound. Two adjustments:

- **DB2 (Better Auth spike) should not block DB3/DB4.** The public catalogue is anonymous. Nothing in the Persian browse/detail slice needs a session. Run DB2 in parallel with DB3; make it block DB5 (carts need identity or an anonymous key) rather than the read models. This shortens the path to the first observable customer value by a whole phase.
- **`/api/health` belongs in DB7, not DB1.** DB1's real content is reproducible local/CI Postgres. A health endpoint with nothing deployed to watch it is ceremony; it earns its place alongside the uptime check.

Everything else — commerce vertical slice before booking/academy, migrations committed with journal and snapshot, Iran-hosted production with Neon for previews only — is right and should not be revisited.

---

## 6 · What is sound — do not redesign

Stated plainly, because a review that only lists problems misrepresents this work:

- **Idempotency is modelled properly and consistently** — `idempotency_key` + `request_hash` on payments, checkout, claims, reservations and movements. That is the hard part of commerce and it is done.
- **Reservations are rows with TTL, not a mutable `reserved` counter**, and stock is never decremented on add-to-cart. This is the design most shops get wrong.
- **Partial unique indexes are used with real skill** — one primary locale, one default address, one active cart per owner, one active reservation per cart item, one settlement per payment, one primary media per product.
- **Money is `bigint` rials with a total-equation check.** `total = subtotal + shipping - discount` enforced in the database.
- **Media provenance and rights are first-class enums** — `supplier_draft` vs `brand_owned`, `rights` defaulting to `unknown`. That is exactly the discipline the Storyderm placeholder situation demands, and it was not obvious.
- **Locale rows and translation tables instead of language columns**, with no automatic fallback chain.
- **Server Components calling server-only Drizzle read modules, no internal HTTP API.** Correct, and worth defending when someone proposes "an API layer".
- 67 FKs, 95 indexes, 38 checks, zero FKs without a supporting index. That last one is a real discipline most projects skip.

---

## 7 · Residual questions for the maintainer

1. **Is `payment.amount_rials` the order total, or the total plus the bank-transfer matching remainder?** Nothing ties `payment.amount` to `order.total`, which is *correct* if the remainder lives there — but undocumented. Someone will "fix" it with a constraint and break statement matching. Also decide whether `bank_transfer_claim.expected_amount_rials` must equal `payment.amount_rials` (it should, and the service should derive it).
2. **D13 vs Shop Relay** — amend the decision, or rename the feature. Both cannot stand.
3. **Is account deletion a real product requirement?** If yes, HIGH-1 is blocking. If it is anonymisation instead, the FK should be `RESTRICT` and the flow should scrub PII in place.
4. **Should zero primary locales ever be valid?** The unique index guarantees *at most* one. Operationally there should always be exactly one — worth a seed assertion.
5. **Protocol phases** — is the protocol strategy accepted? Two tables are already waiting for it.

---

## Correction list

| ID | Correction | Blocks |
|---|---|---|
| C1 | `customer_order.contact_phone` snapshot; drop `contact_check` (HIGH-1) | account deletion, `DB6` |
| C2 | Composite FK `payment_settlement (payment_id, order_id) → payment (id, order_id)` (HIGH-2) | `DB6` |
| C3 | `pg_trgm` + GIN on `normalized_search_text`, with `EXPLAIN` evidence (MEDIUM-3) | `DB3`/`DB4` search |
| C4 | Add `أإآٱ→ا`, `ة→ه` folding; document the ZWNJ consequence (MEDIUM-4) | `DB3` |
| C5 | `source_cart_item_id` nullable + `SET NULL`, add `source_cart_id` (MEDIUM-5) | `DB5` |
| C6 | Status↔timestamp checks on `payment` and `shipment` (LOW-6) | `DB6` |
| C7 | Doc edits: auth to passwordless (D-a), D13/Relay (D-b), read-predicate publication rule (LOW-8), outbox-worker deferral (D-e), Phase 2 → storefront boundary pointer (D-f) | none — do now |
| C8 | Phase order: DB2 parallel to DB3; `/api/health` → DB7 | `DB1` scope |

C1, C2 and C7 are worth doing before any DB3 code. C3–C6 land inside the phases that need them.

---

## 8 · Planning disposition after maintainer request

**Added:** 2026-08-24  
**Meaning:** This section records how the review was incorporated into review-ready plans. It does not change the reviewer's original findings and does not claim the schema/runtime corrections are implemented.

| Review item | Accepted disposition | Source of truth / delivery |
|---|---|---|
| HIGH-1 / C1 | Accept contact snapshot and make the financial record independent of live identity. Customer self-service closure anonymizes identity in place; the corrected FK/check also keeps controlled physical deletion coherent. | [`system-design/authentication-and-account-security.md`](system-design/authentication-and-account-security.md) AUTH-D10/AUTH0 and [`system-design/cart-checkout-payment-fulfilment-and-returns.md`](system-design/cart-checkout-payment-fulfilment-and-returns.md) COM0 |
| HIGH-2 / C2 | Accept composite payment/order relation at the database boundary. | Transaction plan COM0, before `settleOrder` |
| MEDIUM-3 / C3 | Accept `pg_trgm` GIN for normalized infix/typo search, followed by measured `EXPLAIN` evidence. | [`system-design/database-foundation.md`](system-design/database-foundation.md) DB3 |
| MEDIUM-4 / C4 | Accept the additional Arabic forms and document the remaining no-separator/ZWNJ distinction. | Database plan DB3 |
| MEDIUM-5 / C5 | Accept nullable cart-item provenance, `ON DELETE SET NULL`, and historical cart reference. | Transaction plan COM0/COM1 |
| LOW-6 / C6 | Accept payment/shipment status-timestamp checks. | Transaction plan COM0 |
| LOW-7 | Accept order-line uniqueness, E.164 phone check, and payment-event enum. Drop decorative `price.effective_at`; scheduled pricing remains deferred. Simplify the redundant publication index predicate. | AUTH0/COM0 |
| LOW-8 | Keep this out of a cross-table DB constraint. Enforce exact-locale translation, active variant, eligible price, approved media, and publication in the DB3 read predicate and staff publication gate. **Amended 2026-08-25:** approved primary media is enforced at the publication gate only, not in the runtime read predicate — see the note below. | `modules/commerce/models/publication.ts` |
| D-a / auth recommendation | Accept phone OTP only for customers in v1. Staff use separately provisioned email/password plus mandatory TOTP. | Dedicated auth plan; decision map, ADR, domain model, master plan aligned |
| D-b / Relay | Resolve D13 as “no cross-room/marketplace mega-menu”; a Shop-only Relay remains post-core and separately gated. | `00-decision-map.md` D13 and storefront Relay gate |
| D-d / expiry | Make `expires_at > now()` an explicit availability predicate; cleanup is not correctness. | Database and transaction plans |
| D-e / outbox | Keep the outbox table. Transactional inserts are in scope; the general delivery worker remains deferred. | Database and transaction plans |
| D-f / scope | Keep storefront core ending at Cart; checkout and later routes now point to their separate plan. | Master and storefront plans |
| C8 / phase order | Run DB2 beside DB3, block Cart on auth rather than public catalogue, and move health to DB7 deployment operations. | Database plan phases |

Residual question decisions for this planning pass:

1. `payment.amount_rials` is the exact requested payment amount. A bank-transfer matching remainder is legal only as an explicit invoice/order adjustment; the claim derives its expected amount from payment and settlement records the verified received amount.
2. Customer account closure is a real product capability implemented as in-place identity anonymization; financial and cross-context records survive through immutable snapshots and foreign keys. Staff identities are deprovisioned rather than self-deleted.
3. The primary locale seed must assert exactly one primary row after every seed run.
4. Protocol-phase tables remain available but receive no further implementation until the merchandising protocol is approved.

**Implementation state:** documentation aligned. Application services, APIs,
provider integration, and UI remain unimplemented pending maintainer review.

### Correction implementation log

| ID | State | Evidence |
|---|---|---|
| C1 | **Implemented** — `customer_order.contact_phone` landed in migration `0001` (AUTH0); `customer_order_contact_check` dropped in migration `0002` | `drizzle/0002_c1_c2_review_corrections.sql`; `schema.test.ts` "lets an order outlive its customer instead of blocking the delete" |
| C2 | **Implemented** — composite `payment_settlement (payment_id, order_id) -> payment (id, order_id)`, backed by a unique index on `payment (id, order_id)`; both independent foreign keys dropped | `drizzle/0002_c1_c2_review_corrections.sql`; `schema.test.ts` "reaches an order only through the payment being settled" |
| C3 | Open — belongs to DB3 | — |
| C4 | Open — belongs to DB3 | — |
| C5 | Open — belongs to DB5 | — |
| C6 | Open — belongs to DB6 | — |
| C7 | Implemented — documentation edits | this bundle |
| C8 | Implemented — phase order recorded | `system-design/database-foundation.md` |

Migration `0002` was hand-ordered after generation: `drizzle-kit` emitted the
composite foreign key before the unique index it depends on, which PostgreSQL
rejects. The committed file creates the index first.

### Amendment — where approved media is enforced

**Date:** 2026-08-25 · **Applies to:** LOW-8

The disposition above named both the read predicate and the staff publication
gate. The implementation splits them, and enforces approved primary media only
at the gate.

`isPubliclyVisible` — the runtime predicate every catalogue read applies —
requires publication, approval, an exact-locale translation and an active
variant. `publicationBlockers` — the staff gate — requires all of that plus
approved primary media and either a price or a deliberate `on_request` marking.

The reason is failure mode, not convenience. A runtime media requirement means
deleting an image, or re-running an approval, silently makes stock unbuyable,
with no signal to staff and no error anywhere. Enforced at the gate, a product
cannot be published without a photograph in the first place; if one later
disappears the page degrades to a placeholder and the product stays sellable.

Development product 10 (`dev-product-10-no-media`) exists to hold this line: it
is published, priced, in stock and has no media, and it must remain purchasable.
If a future change makes it disappear, the media rule has migrated into the read
path.
