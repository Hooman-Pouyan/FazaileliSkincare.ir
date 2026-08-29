# Back office - screens, panels, and the isolation decision

**Amended by [`../../35-plan-review-and-resequencing.md`](../../35-plan-review-and-resequencing.md)** (2026-08-29): the CSP ships independently of `BO0` and before it (F-2); `price_adjustment_batch` does not carry the shape §5.4 assumes - no scope, percentage, rounding rule or item table (C-1); `review_state` is on `product`, not per locale, so §5.6's per-locale state needs a migration (C-2); the bulk copy-approval screen is the one that matters and is not designed (F-12); `BO6` merges into Booking's `BOOK5`; the delivery order is revised in §4 of the review.

**Status:** Review-ready; no runtime implementation is authorized by this document
**Updated:** 2026-08-27
**Scope:** Every staff-facing screen - orders, transfers, prices, inventory, products, content, bookings, academy, customers, settings - and the security boundary around them
**Depends on:** [`authentication-and-account-security.md`](authentication-and-account-security.md) (`AUTH-D2`), [`content-operations.md`](content-operations.md), [`../00-decision-map.md`](../00-decision-map.md) `D18`, `D24`, [`../06-site-map.md`](../06-site-map.md)
**Trigger:** the maintainer, 2026-08-27 - _"we have worked through the APIs and the database tables way more than we've worked on the screens"_, and a direct question about whether admin belongs in the same application

---

## 1. Why this document is screen-first

The maintainer is right. Six planning documents so far specify tables, constraints,
transactions and exit gates in detail, and describe screens in a line each. For
the storefront that imbalance is survivable because the storefront's screens are
designed elsewhere. For the back office it is not, because **the back office
_is_ screens** - there is no separate design pass coming, and a badly laid out
admin costs Mahdieh time every single day.

So this document inverts the usual order. Section 5 is the substance: what is on
each screen, what it does, and what must not go wrong on it. The data model is
already specified in the documents above and is not repeated.

---

## 2. Who uses this, and what that implies

Two or three people. Mahdieh daily; one or two staff; the developer occasionally.
Nobody is a casual visitor, everybody returns constantly, and all of them will
learn the interface within a week.

That inverts every storefront instinct:

| Storefront                            | Back office                                  |
| ------------------------------------- | -------------------------------------------- |
| First-time visitor, must be obvious   | Daily user, must be **fast**                 |
| Generous whitespace, editorial rhythm | **Dense** - more rows visible is more useful |
| Delight and persuasion                | **Boring**, predictable, no surprises        |
| Discovery through browsing            | **Search and filters** first                 |
| Hides complexity                      | **Shows state**, including bad state         |

### BO-D1 - The back office may look like an admin dashboard

`D2` says _"fazaieli.ir is a storefront, not an admin dashboard"_, and that has
been correctly protective of the public surfaces. It is **about the storefront.**

`/admin` is a tool. It should be dense, tabular, keyboard-friendly and dull, and
the density decisions in `33-density-decisions.md` apply here at their most
compact. Applying editorial spacing to a queue of forty orders would be a mistake
made out of misplaced consistency.

---

## 3. The isolation question, answered

The maintainer asked whether the admin belongs in a separate application. It is
the right instinct and the answer is **partly**.

### 3.1 What the actual threat is

The concern worth having is: **a cross-site scripting flaw in the public
storefront riding a staff member's admin session.** Sessions are `httpOnly`
(`D7`), so script cannot read the cookie - but on the _same origin_ it can make
authenticated requests with it. A staff member browsing the shop in one tab while
signed into admin in another is not an unusual state.

Everything else usually offered as a reason to split - "don't ship admin
JavaScript publicly" - **does not apply here.** With React Server Components an
admin page's code never reaches a public visitor's browser regardless of where it
lives in the repository.

### 3.2 What defends against it, in order of value

| Defence                                      | Status                     | Value                                                           |
| -------------------------------------------- | -------------------------- | --------------------------------------------------------------- |
| **A real Content-Security-Policy**           | **Missing entirely**       | Highest - it prevents the XSS rather than containing it         |
| **Origin isolation** for admin cookies       | Not yet                    | High - a storefront XSS cannot make admin requests cross-origin |
| Mandatory TOTP for staff                     | Decided in `AUTH-D2`       | High                                                            |
| Roles read from the database per request     | Done in `payment.authz.ts` | High                                                            |
| Authorization re-checked inside every action | Done                       | High                                                            |
| Re-authentication for dangerous actions      | Not yet                    | Medium                                                          |
| A second application                         | -                          | **Low, relative to its cost**                                   |

**There is no CSP on this site today.** That is a larger gap than co-location,
and it is a configuration change rather than an architecture.

### BO-D2 - One application, two origins

**Recommendation: keep one Next.js application, and serve the back office from
its own hostname** - `admin.fazaieli.ir` - with session cookies scoped to that
host.

This buys the isolation that motivates the question:

- A storefront XSS **cannot** issue authenticated admin requests, because the
  admin cookie is not sent to the storefront origin.
- Middleware refuses `/admin/*` on the public hostname and refuses storefront
  routes on the admin hostname, so each origin serves one thing.
- The admin origin can additionally be IP-restricted or put behind a VPN later
  without touching the storefront.

And it avoids what a second application actually costs **one developer**: two
deployments, two dependency trees to patch, two security surfaces, and either a
duplicated schema or a shared package that has to stay in step. A second
application that is not maintained as carefully as the first is a larger risk
than the co-location it was meant to remove.

**The escape hatch is kept open.** Admin lives in its own route group with no
shared client components and no imports from storefront modules, so if it is ever
extracted the seam already exists.

### BO-D3 - Dangerous actions require re-authentication

Settling money, revoking consent, committing a price batch, granting a role and
deleting anything all re-prompt for TOTP if the session is older than a short
window. This is the mitigation that survives a stolen laptop, which is a more
likely threat here than a targeted XSS.

### BO-D4 - Every mutation writes to `audit_log`

The table exists and nothing writes to it outside settlement. Every admin action
records actor, action, entity and before/after state. Two people share this
system; "who changed that price" must be answerable.

---

## 4. Shared patterns

Specified once so eleven screens do not each invent their own.

### 4.1 The list screen

Every list uses one component with the same anatomy, top to bottom:

1. **Title and count** - "Orders · 47", the count reflecting active filters.
2. **Search** - focused by `/`, matching the identifiers that screen is about.
3. **Filter chips** - status, date range, the one or two dimensions that matter.
   Filters live in the URL, so a filtered view is a link that can be shared.
4. **Bulk selection** where bulk actions exist, with the count of selected rows
   stated in the action button.
5. **The table** - dense rows, tabular numerals for money and dates, status as a
   coloured chip rather than a word, the primary identifier first and
   left-aligned in the reading direction.
6. **Pagination** with a total, not infinite scroll. Staff need "page 3 of 9".

### 4.2 Status is shape as well as colour

A status chip carries colour _and_ a distinct label. Colour alone fails for the
one in twelve men with colour-vision deficiency and prints badly, and Mahdieh may
well print an order.

### 4.3 Destructive and irreversible actions

A settlement, a consent revocation, a price commit. These get a confirmation that
**states the consequence in words**, names the scope ("this will change 34
prices"), and requires a deliberate action - never a lone red button that a
mis-tap reaches.

### 4.4 Empty, loading and failure

Every list has three designed states beyond its data: nothing yet, nothing
matching the filters (with a clear-filters action), and the read failed. The
middle one is the most common and the most often forgotten.

### 4.5 Mobile

Most screens are desktop-first. **Two are not:** attendance is taken standing up
in a classroom, and the booking day view is consulted at the front desk. Those
two are designed for a phone first and a desktop second.

---

## 5. The screens

### 5.1 `/admin` - the day

The landing screen answers "what needs me today" and nothing else. Not a chart
dashboard - a to-do list built from real queues.

| Panel                         | Content                                         | Links to                       |
| ----------------------------- | ----------------------------------------------- | ------------------------------ |
| **Transfers awaiting review** | Count, and the oldest waiting time              | `/admin/transfers`             |
| **Orders to prepare**         | Paid, not yet shipped                           | `/admin/orders?status=paid`    |
| **Today's appointments**      | Count, next one, any gap                        | `/admin/bookings`              |
| **Low stock**                 | Variants under threshold                        | `/admin/inventory?low=1`       |
| **Content awaiting approval** | Draft product copy, unreviewed testimonials     | `/admin/products?review=draft` |
| **Anything failing**          | Outbox messages stuck, settlements that errored | The relevant queue             |

Each panel is a count and a link. If a queue is empty the panel says so in one
line rather than disappearing - a missing panel reads as broken, an empty one
reads as done.

### 5.2 `/admin/transfers` - built, and the pattern to follow

Already implemented. Each row carries order number, customer, **expected amount**
(unique per order by construction), the reference the customer gave, last four
digits, and when they said they sent it. Two actions: confirm and settle, or
reject with a required reason.

**Refinements worth making:** a copy-to-clipboard on the expected amount, since
the matching task is against a bank statement; a filter for claims older than 24
hours; and the customer's other orders visible, because a repeat customer's claim
carries different weight.

### 5.3 `/admin/orders` and `/admin/orders/[id]`

**The list.** Order number, customer, date, status chip, total, payment state,
fulfilment state. Filters: status, date range, payment method, unfulfilled.
Search by order number or customer phone.

**The detail** is the operational counterpart to the customer's invoice, with
four regions: the lines as snapshotted, the money (subtotal, shipping, total,
payments, settlements, refunds), the destination as frozen at order time, and a
**timeline** of every state change with actor and time.

Actions: mark preparing, create a shipment with a tracking number, mark
delivered, cancel with a reason, initiate a refund.

**What must not go wrong:** the address shown here is the order's snapshot, never
a join to the customer's current address book. A courier reading a changed
address a week later is a parcel delivered to the wrong place.

### 5.4 `/admin/prices` - `D24`, the second most valuable screen

The schema already carries the shape: `price_adjustment_batch` with `status`,
`created_by`, `committed_by`, `committed_at`, beside `price_history`.

**A four-step wizard on one screen**, because it is one task:

1. **Scope** - all products, a brand, a category, or a hand-picked set.
2. **Adjustment** - a percentage, or a fixed amount, with rounding rules stated
   ("round to the nearest 10,000 rials").
3. **Preview** - a table of **every affected variant**: current price, new price,
   the difference, and the percentage. This is the whole point of the screen, and
   it must be scrollable, sortable and exportable.
4. **Commit** - one audited batch, with a label, behind the `BO-D3`
   re-authentication.

**What must not go wrong:** a preview that does not match what commits. The
preview and the commit must run the same calculation over the same scope
snapshot, or the screen is worse than editing prices by hand.

A history list of past batches sits beside it, each showing scope, adjustment,
who committed it and when - and each openable to see exactly what it changed.

### 5.5 `/admin/inventory`

**The list.** Variant, SKU, on hand, reserved, available, and a low-stock flag.
Filter by brand, by low stock, by zero. Sort by available ascending, which is the
default because that is the question being asked.

**Actions:** adjust one variant with a required reason (which becomes an
`inventory_movement`), and a bulk receipt for a delivery arriving.

**One panel that must exist:** a **reconciliation check** confirming that
`inventory_movement` sums to `on_hand` for every variant. It is cheap, it catches
an entire class of silent corruption, and without a screen nobody ever runs it.

### 5.6 `/admin/products` and `/admin/products/[id]`

**The list.** Name, brand, SKU count, price range, stock, published state, review
state. Filters: brand, category, concern, unpublished, **awaiting copy approval**.

**The detail**, in tabs, because a product carries a lot:

| Tab          | Contents                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Basics**   | Name, slug, brand, category, IRC code, professional-only, price visibility                                                                  |
| **Copy**     | Description, promise, usage, ingredients, suitable-for — **per locale, side by side**, with the `draft → verified → approved` state on each |
| **Variants** | Size, SKU, barcode, price, stock                                                                                                            |
| **Taxonomy** | Concerns, skin states, protocol phases, pairings                                                                                            |
| **Media**    | Ordered images with alt text and rights                                                                                                     |

**The copy tab is where the 250 empty fields get filled**, so it is the tab that
deserves the most care: Persian and English visible together, a clear approve
action, and a diff when copy is edited after approval.

**Curation lives here too** - a "recommended by Ms. Fazaieli" toggle, feeding the
curated list on the shop hub.

### 5.7 `/admin/content`

Three sections behind one route, because they share a shape and an editor.

**Testimonials.** List with audience chip (client / customer / student), subject,
excerpt, consent state, published state. The form captures body, display name,
display role, audience, subject, optional photo, and **the consent record**.
Nothing publishes without an active consent row.

**Before-and-after cases.** The highest-consequence screen on the site (`D18`).
List with thumbnail, service, practitioner, sessions, elapsed time, consent
state. The form captures both images, the service, the practitioner, session
count, elapsed weeks, skin state, and the **consent document**.

**Revocation is one action from the list.** Not inside an edit form, not two
confirmations deep. `D18` says one admin action, and a screen that buries it has
failed the requirement regardless of what the service layer supports.

**Campaign blocks.** Heading, body, call to action, surface, scope, and
`effective_from` / `effective_until`. A preview of where it will appear, and a
clear indication when a block is scheduled but not yet live - the most confusing
state in any scheduled-content system.

### 5.8 `/admin/bookings`

**Day view, phone-first.** A column per practitioner, time down the side,
appointments as blocks showing client, service and status. Beds shown as a second
band, because `BOOK-D1` makes them a separate constraint and a day can be
practitioner-free but bed-bound.

**Actions:** create for a customer (the phone booking that will still happen),
mark completed, mark no-show, block time, reschedule by dragging or by form -
form first, since drag on a phone is unreliable.

**A week view** for planning, and a **holidays screen** for `BOOK-D6`'s maintained
table, because confirming appointments on a closed day is the failure that
matters most.

### 5.9 `/admin/academy`

**Cohorts.** List with course, dates, city, capacity, enrolled, waitlisted. The
detail carries sessions, instructors, the sponsoring brand, and the roster.

**Attendance, phone-first.** A list of names for one session with large tap
targets, three states (present / absent / late), submitted in one action, and
tolerant of being filled in afterwards.

**Certificates.** Issue from a completed enrolment; the list shows number, holder,
course, issue date and status; re-issue supersedes rather than edits.

**Enrolments.** Including instalment plans - which are paid, which are due, which
are overdue - remembering that `ACAD-D4` makes an overdue instalment a
conversation rather than an automatic lockout, so the screen surfaces it without
revoking anything.

### 5.10 `/admin/customers`

Search by phone, name or order number. The detail shows orders, appointments,
enrolments, addresses and roles in one place - which is the staff-side mirror of
the customer's Studio, and is what someone needs when that person is on the phone.

**Role management** lives here: granting `practitioner` after certification is an
explicit action (`ACAD-D10`), behind re-authentication, and audited.

**What must not go wrong:** this screen shows one person's whole relationship
with the business. It is the screen most worth restricting to `admin` rather
than `staff`, and the one whose audit trail matters most.

### 5.11 `/admin/settings`

Staff accounts and roles; TOTP enrolment state; shipping rates (`12.5`); bank
details (`15.10`); clinic hours; holidays; and the outbox queue with its failures
and a retry action.

---

## 6. Phased delivery

Sequenced by what stops the business without it, matching
`content-operations.md` §7.

| #       | Packet                 | Contents                                                                                                                                                         |
| ------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BO0** | Foundation             | The admin origin and middleware (`BO-D2`), a CSP, the shared list component, re-authentication (`BO-D3`), audit on every mutation (`BO-D4`), `/admin` day screen |
| **BO1** | Orders                 | List, detail, fulfilment states, shipment creation, refund initiation                                                                                            |
| **BO2** | Prices                 | `D24` end to end: scope, adjustment, preview, commit, history                                                                                                    |
| **BO3** | Inventory              | List, adjustment with reason, bulk receipt, reconciliation panel                                                                                                 |
| **BO4** | Products               | List, detail tabs, **copy approval**, curation                                                                                                                   |
| **BO5** | Content                | Testimonials, before-and-after with one-action revocation, campaigns                                                                                             |
| **BO6** | Bookings               | Day view, week view, create-for-customer, holidays                                                                                                               |
| **BO7** | Academy                | Cohorts, attendance, certificates, enrolments                                                                                                                    |
| **BO8** | Customers and settings | Customer 360, roles, rates, bank details, outbox                                                                                                                 |

**Exit gate for BO0:** a storefront page cannot reach an admin route on the public
hostname; an admin session cookie is not sent to the storefront origin; a CSP is
enforced; and every mutation in `/admin` writes an audit row, proved by test.

---

## 7. What the maintainer must decide

1. **Is `admin.fazaieli.ir` acceptable**, or does he want a genuinely separate
   deployment despite the cost? `BO-D2` recommends the former.
2. **Who besides Mahdieh gets access**, and does anyone need `staff` without
   `admin`? That decides how much the two roles must diverge.
3. **Should the admin be Persian, English, or both?** It is an internal tool;
   English would be faster to build and Persian would be easier for staff. This
   has never been asked.
4. **Is an IP restriction or VPN acceptable** on the admin origin, or must it be
   reachable from anywhere?
5. **How long may a staff session last** before re-authentication?
