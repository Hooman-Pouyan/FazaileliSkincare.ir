# Booking - phased implementation plan

**Status:** Review-ready; no runtime implementation is authorized by this document
**Updated:** 2026-08-27
**Scope:** Services, practitioners, rooms and beds, availability, appointment lifecycle, deposits, intake, cancellation, rescheduling, waitlists, reminders, and the staff day view
**Depends on:** [`../03-domain-model.md`](../03-domain-model.md) §3, [`cart-checkout-payment-fulfilment-and-returns.md`](cart-checkout-payment-fulfilment-and-returns.md) (the payment path), [`authentication-and-account-security.md`](authentication-and-account-security.md), [`database-foundation.md`](database-foundation.md)
**Decision inputs:** [`../00-decision-map.md`](../00-decision-map.md) `D4`, `D9`; [`../19-navigation-decisions.md`](../19-navigation-decisions.md) `N-2`

---

## 1. Goal and stopping boundary

**The job.** The institute's current booking queue is Instagram → WhatsApp → Mahdieh
answering messages in the evening. This context exists to remove that human
bottleneck, not to add a calendar feature. Every decision below is measured
against one question: _does this let somebody book the right slot without a
message?_

**In scope.** Service catalogue with per-service protocols and step timing;
practitioners, rooms and beds as separately constrained resources; recurring
availability with exceptions and Iranian public holidays; slot search; hold,
deposit, confirm, expire; intake before the visit; cancellation and rescheduling
under an encoded policy; waitlists; reminders through the existing outbox; and a
staff day view.

**Out of scope, deliberately.**

- **Mentorship sessions.** Academy reuses this scheduler with a different
  `service.kind` (`../03-domain-model.md` §4). **Do not build a second
  scheduler** - this document is the only one.
- **Multi-branch.** One location. `room` exists so privacy rules have a home, not
  because a second building is planned.
- **Practitioner payroll, commission and shift bidding.** Operational HR, not
  booking.
- **In-person point of sale.** A walk-in paying at the desk is a staff-created
  appointment plus the existing order path, not a new till.
- **Public practitioner profiles as a marketing surface.** `BOOK-D7` decides
  whether a customer may pick a name; a profile page is a Landing concern.

**Stopping boundary.** This document authorizes no runtime implementation. It
becomes buildable when the maintainer approves it and answers `§10`.

---

## 2. Launch decisions

### BOOK-D1 - A booking consumes a practitioner **and** a bed, and beds are the capacity unit

Capacity is up to 3 practitioners, 2 rooms containing **3 beds**, services around
two hours. Practitioner count and bed count differ, so the binding constraint
changes day to day: with two practitioners on shift the beds are spare, with
three the beds bind.

**A scheduler that models only staff availability will happily double-book a
bed.** Rooms matter for privacy rules; beds matter for capacity. Both are
`resource` rows; the room is the parent.

### BOOK-D2 - Double-booking is prevented by the database, on both axes

A `SELECT` for conflicts followed by an `INSERT` does not survive two people
tapping "book" in the same second. Both axes get an exclusion constraint:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointment ADD CONSTRAINT no_practitioner_overlap
  EXCLUDE USING gist (practitioner_id WITH =, time_range WITH &&)
  WHERE (status IN ('held', 'confirmed'));

ALTER TABLE appointment ADD CONSTRAINT no_resource_overlap
  EXCLUDE USING gist (resource_id WITH =, time_range WITH &&)
  WHERE (status IN ('held', 'confirmed'));
```

`btree_gist` is **required** - the `=` operator on a uuid is not GiST-indexable
without it, and its absence produces a confusing failure at migration time. It
belongs in the first booking migration.

The `WHERE` clause is what lets a cancelled appointment keep its time range
without blocking the slot it released.

### BOOK-D3 - Step timing is modelled from the first migration, because it is worth 75% of capacity

`service_step` splits a protocol into ordered steps, each marked as occupying the
practitioner or only the bed. During a mask or a peel the bed is held and **the
practitioner is free**.

| Model                                      | Practitioner minutes | Bed minutes | Clients/day/practitioner |
| ------------------------------------------ | -------------------- | ----------- | ------------------------ |
| Practitioner blocked for the whole service | 135                  | 135         | 4                        |
| Practitioner released during passive steps | ~75                  | 135         | **7**                    |

Same three beds, no extra hire, no discount. This cannot be retrofitted: it
changes the shape of `appointment` (which becomes a set of practitioner
intervals, not one), the availability query, and every appointment already taken.

**It is switchable per service.** Whether a practitioner may step away
mid-treatment is a judgement about how the clinic feels to be in, and belongs to
the maintainer, not to this document. `service.allows_interleaving` defaults to
false so the safe behaviour is the default.

### BOOK-D4 - A slot is held, not booked, until the deposit settles

> **Amended by `BOOK-D14`.** When `deposit_rials` is 0 the hold confirms
> immediately; the held state and both exclusion constraints are unchanged.

Mirrors `COM-D3` exactly. A `held` appointment is a real row with a real time
range that participates in both exclusion constraints, carrying `expires_at`
10 minutes out. If the deposit does not settle, a sweeper releases it.

Holding rather than reserving-in-memory is what makes the guarantee true under
concurrency, and it is the same shape the cart already proves.

### BOOK-D5 - Deposits reuse the commerce payment path; there is no second payment system

`payment` already models method, status, idempotency, request hash and
settlement, with bank transfer and staff verification working end to end. A
deposit is a `payment` whose aggregate is an appointment rather than an order.

This requires one schema change: `payment` currently references
`customer_order`. It gains a nullable `appointment_id` and a check that exactly
one aggregate is set. **Not a second payments table** - a second money path is
how two ledgers disagree.

Refunding a deposit therefore inherits `COM7`'s refund work. Booking cannot
honour its own cancellation policy until that exists.

### BOOK-D6 - UTC is stored, Jalali is rendered, and holidays are data

`tstzrange` in UTC. Iran no longer observes DST, which removes one class of bug -
store UTC anyway, because the alternative traps every future decision.

**Iranian public holidays are announced, not computed.** Nowruz alone is roughly
two weeks; religious dates move with the lunar calendar; some are declared days
in advance. There is no dependable API. `public_holiday` is a maintained table
with a staff screen, and it is a permanent small operational chore. Confirming
appointments on days the clinic is shut is the failure this prevents.

### BOOK-D7 - Choosing a practitioner by name is a per-service policy

> **Superseded by `BOOK-D15`.** Retained for its reasoning, which still applies
> if the institute grows. No `practitioner_choice` column is built in v1.

If every customer may request Ms. Fazaieli, she becomes the bottleneck this
context exists to remove, and two colleagues sit idle.

`service.practitioner_choice` was to be one of `any` (pooled), `named` (customer
picks), or `named_surcharge`. Consultations would default to `named` - the
relationship is the product. Routine treatments would default to `any`.

**This is not built.** See `BOOK-D15`.

### BOOK-D8 - The cancellation policy is encoded, not re-argued per customer

> **Amended by `BOOK-D16`.** The window and the tiers are settled; a deposit is
> credit rather than a refundable payment, so cancellation never calls `COM7`.

`service.free_cancellation_hours` and `service.deposit_rials`. Inside the window,
cancelling refunds the deposit; outside it, the deposit is forfeit and the
appointment is released for the waitlist. The customer is shown the rule
**before** paying, not after cancelling.

### BOOK-D9 - Rescheduling is one operation, not a cancellation followed by a booking

Modelled as two operations there is a moment where the customer holds neither the
old slot nor the new one, and if the new booking fails they have lost both their
place and, under `BOOK-D8`, possibly their deposit.

`rescheduleAppointment` moves the time range on the existing row inside one
transaction. The exclusion constraints validate the new range; on violation
nothing moves. The deposit and the appointment id survive.

### BOOK-D10 - Intake is collected before the visit, can block a booking, and is never sufficient on its own

`intake_response` captures contraindications against a versioned
`intake_question` set. A hard contraindication **blocks confirmation** rather
than merely recording a note that nobody reads.

Two constraints follow from this being medical-adjacent. The question wording is
the maintainer's, not this document's. And the answers are health data about a
named person: they are visible to the practitioner and the customer and to
nobody else, they are never sent to a third party, and they never appear in a
notification body.

### BOOK-D11 - Appointments are never hard-deleted

Cancellation, no-show and completion are states. An appointment is the record of
a commitment between two people and, once a deposit exists, of money. Deleting
one destroys the audit trail that a dispute needs.

### BOOK-D12 - Reminders go through the outbox, never inline

A reminder sent inside the confirming transaction is either a message about an
appointment that rolled back, or a failed booking because an SMS gateway was
down. `notification_outbox` already exists for exactly this.

**This makes Booking depend on the outbox worker**, which is not yet built. No-show
rates drop sharply with a 24-hour reminder, so this is not optional polish.

### BOOK-D13 - A cancellation offers the slot to a waitlist before it offers it to nobody

Cancellations are frequent and currently wasted entirely. `waitlist_entry`
records who wants what service in which window; releasing a slot notifies matches
in order, through the outbox, with a short claim window so one released slot is
not promised to five people at once.

### BOOK-D14 - A service with no deposit confirms immediately

Deposits are the only part of Booking that touches money, and money is the part
that waits on merchant paperwork. `deposit_rials = 0` therefore means the hold
transitions straight to `confirmed` rather than waiting for a settlement that
will never arrive.

Nothing else changes. The `held` state, `expires_at`, both exclusion constraints
and the sweeper are exactly as `BOOK-D2` and `BOOK-D4` specify - only the trigger
for the transition differs. Switching deposits on later is editing one number per
service, not a migration.

**This is what lets Booking ship end to end with no gateway, no SMS account and
no business registration.**

### BOOK-D15 - There is no practitioner-choice feature in v1

> **Amended by `../39-confirmation-pass.md` §2.1.** No picker, but the
> confirmation page and the reminder message **name who they will be seeing**.
> Warmer at no cost, and the sentence changes rather than a new concept appearing
> when a second practitioner joins.

Superseding `BOOK-D7`. The institute's clients come for Ms. Fazaieli, and there
are not enough other practitioners for a choice to be meaningful. A picker that
offers one real answer is a control that only ever disappoints.

So: no `practitioner_choice` column, no enum, no picker. `practitioner_id` stays
on `appointment` because the exclusion constraint needs it, and
`practitioner_skill` stays because it is what makes availability correct when a
second practitioner is added. Assignment is by the system from
`practitioner_skill`, and where Ms. Fazaieli is the only skilled practitioner the
availability grid is simply her calendar.

Adding a picker later is additive - a column, an enum and a control - and touches
no appointment already taken. This is a deletion that costs nothing to reverse.

**One consequence worth stating plainly.** If she is effectively the only
practitioner, her hours are the entire capacity of the business, which makes
`BOOK-D3`'s interleaving question **more** important rather than less. It is the
only lever that raises capacity without hiring.

**A second.** With one practitioner and three beds the bed axis does not bind
today. `BOOK-D1` and the second exclusion constraint stay anyway: they cost one
constraint, and they are the part that cannot be retrofitted once appointments
exist.

### BOOK-D16 - The cancellation policy, settled

Amending `BOOK-D8`, which specified the mechanism and left the numbers open.

| When the client cancels | What happens |
| --- | --- |
| More than 24 hours before | Free. Any deposit is released back as credit, usable on any future booking |
| 12 to 24 hours before | Free once. A second late cancellation inside 90 days moves the client to the tier below |
| Under 12 hours, or no-show | The deposit is retained as credit against a future booking, valid 90 days. It is not returned as money |

Three properties this has that a refund policy does not. **It never calls
`COM7`** - no refund path is required for Booking to launch, which removes its
last dependency on unbuilt commerce work. **It is not a punishment** - the client
keeps their money, they simply keep it here, which is easier to say on the phone
and easier to defend. And **it costs the clinic nothing to be generous with**,
because credit is only redeemed against capacity that would otherwise sit idle.

The rule is shown before the client pays, per `BOOK-D8`, never after they cancel.
`service.free_cancellation_hours` stays as the encoded window; the tiers above are
its defaults.

**Until deposits are switched on** (`BOOK-D14`), cancellation carries no money at
all and the policy exists only as a stated expectation and a no-show count on the
customer record.

### BOOK-D17 - The assistant is a practitioner row, and exclusivity is a service property

Answering `§10` question 2, 2026-08-29. The clinic today is **one practitioner
and one assistant**. The assistant does not perform services alone; she covers a
client during a passive step so Ms. Fazaieli can be with a second client. That is
`BOOK-D3`'s interleaving, arrived at by a different route: the practitioner is
released because somebody else is present, not because nobody is.

Two rules follow, and both are expressed in data rather than in code.

**The assistant is a `practitioner` row** whose `practitioner_skill` covers only
the steps she may cover. The concurrency ceiling then falls out of the exclusion
constraint for free: two clients can overlap because two practitioners exist, and
a third cannot, because there is no third. Nothing needs a
`max_concurrent_clients` number, and the ceiling rises by itself the day somebody
is hired.

**Consultations and teaching are exclusive.** While Ms. Fazaieli is giving a
treatment she is not available for a consultation, and while she is teaching she
is not available at all. A consultation is therefore a service whose every
`service_step` sets `occupies_practitioner = true` and whose
`allows_interleaving` is false.

**The model is not shaped by today's headcount.** `BOOK-D1`'s two axes,
`practitioner_skill`, `service_step` and both exclusion constraints stay exactly
as specified. One practitioner and one assistant is a *seed*, not a design. When
there are four practitioners and the beds begin to bind, no migration is
required - which is the whole reason the bed axis is kept even though it does not
bind today.

### BOOK-D18 - A teaching session blocks the practitioner's booking calendar

Falling directly out of `BOOK-D17`, and a gap in the plans as they stood:
`cohort_session` carries `starts_at` and `ends_at` in Academy, and
`availability_exception` is per practitioner in Booking, and **nothing connects
them.** As specified, the scheduler would happily confirm a facial in the middle
of a workshop.

Confirming a cohort session writes an `availability_exception` for every
instructor on that cohort - **extended by `cohort.buffer_minutes`, default 30,
before and after** (`../39-confirmation-pass.md` §2.5; sixty either side of every
teaching day is an hour of bookable time that does not exist, and she is the
entire capacity of the business) - through a narrow published function - Academy calling
into Booking, never writing Booking's tables, per the bounded-context rule.
Cancelling or moving a session withdraws or moves it.

This is a real dependency between the two contexts and it belongs in `ACAD1`'s
exit gate: a cohort session, once confirmed, makes its instructors unbookable for
that window.

### BOOK-D19 - Consultations are three services, and the gate is once per person

**Three, not a tier per duration.** Tiers by length multiply into options a
client cannot choose between and somebody has to maintain. What actually differs
is intent:

| Service | Intent | Note |
| --- | --- | --- |
| **Choosing a treatment** | Short. Which treatment is right for me | Free or near-free. Its job is conversion, not revenue - charged properly, people skip it and book the wrong three-hour treatment |
| **Skin assessment** | The consultation *is* the product. Assessment and a plan | Paid. A longer "VIP" hour is a **price tier of this**, not a fourth service |
| **Course advice** | Should I take this course | A different audience asking a career question. Lives on Academy's surface, not in the treatment list |

**The gate.** `service.requires_prior_visit`, a boolean, default true for
treatments and false for consultations. Booking a service that requires it, as a
person with no completed appointment, is rejected as `consultation-required` and
the short consultation is offered in its place.

Read as: **a person the clinic has never seen must be seen once.** After one
completed appointment they book anything directly. The flag is per service, so if
a particular treatment should always require assessment - or should never require
it - that is data, not a rewrite.

**The drop-off this avoids.** A client who consults and must then return to the
site to book the treatment is a second visit and a place to lose them. She books
it for them at the end of the consultation from the day view, using
`createAppointmentForCustomer`, which exists already for telephone bookings. The
client books once.

### BOOK-D20 - A series is one integer, sold once and scheduled a session at a time

Both shapes exist: a single appointment made of stages, and a course of sessions
across weeks sold as one thing. `§11` listed the second as "deliberately later";
it moves into v1.

**One column carries the difference.** `service.session_count`, default 1.
`service_step` continues to describe the stages *inside* one session, unchanged -
so a 1-session service is exactly what is specified today and needs no new
concept.

Where `session_count > 1`:

- **`treatment_series`** records the purchase and the balance: person, service,
  sessions bought, sessions used, `expires_on`.
- **Sessions are ordinary appointments** carrying a `series_id`. They participate
  in both exclusion constraints like any other. Nothing about availability
  changes.
- **Paid once, at purchase**, never per session. Until deposits are switched on
  (`BOOK-D14`) the series is created by staff after payment in person, which is
  how it already works.
- **Sessions are booked one at a time, not six up front.** Two reasons, and both
  matter: peels and similar treatments need clinical spacing, enforced as
  `service.min_days_between_sessions`; and with one practitioner, six appointments
  claimed months ahead is capacity the clinic cannot get back when the client
  drifts.
- **Cancelling a session returns it to the balance** rather than consuming it. A
  cancelled session is not a lost session.
- **`expires_on`** exists because an open-ended balance is a liability that never
  closes. Twelve months is the usual answer; it is hers to set.

**This is not Academy's `package`.** That bundles across contexts by snapshot
(`ACAD-D9`). A series is N sessions of one treatment inside Booking. Two
different things that would be worse merged.

---

## 3. Database contract

### 3.1 Correction to an existing table

`payment.order_id` becomes nullable, gains `appointment_id`, and gains:

```sql
ALTER TABLE payment ADD CONSTRAINT payment_one_aggregate_check
  CHECK ((order_id IS NULL) <> (appointment_id IS NULL));
```

Existing rows all carry `order_id`, so the migration is additive. `COM-D8`'s
settlement path branches on which aggregate is present.

### 3.2 New tables

| Table                            | Purpose and notable columns                                                                                                                                                                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `service`                        | `slug`, `kind` (`treatment`/`consultation`/`mentorship`), `duration_minutes`, `buffer_minutes`, `price_rials`, `deposit_rials`, `free_cancellation_hours`, `allows_interleaving`, `required_resource_kind`, `requires_prior_visit`, `session_count`, `min_days_between_sessions`, `is_published`, `review_state` |
| `treatment_series`               | `person_id`, `service_id`, `sessions_purchased`, `sessions_used`, `expires_on`, `payment_id`, `status` - `BOOK-D20`. Appointments in the series carry `series_id`                                                                                                                                              |
| `service_translation`            | `locale_code`, `name`, `summary`, `description`, `preparation`, `aftercare`                                                                                                                                                                                                         |
| `service_step`                   | `service_id`, `sort_order`, `minutes`, `occupies_practitioner` (bool), `label` - the `BOOK-D3` model                                                                                                                                                                                |
| `practitioner`                   | `person_id`, `display_name`, `is_bookable`, `sort_order`. A practitioner is a `person` with the `practitioner` role; this row carries scheduling attributes                                                                                                                         |
| `practitioner_skill`             | `practitioner_id`, `service_id` - who may perform what                                                                                                                                                                                                                              |
| `room`                           | `slug`, `name`, `is_private`                                                                                                                                                                                                                                                        |
| `resource`                       | `room_id`, `kind` (`bed`/`device`), `label`, `is_active`                                                                                                                                                                                                                            |
| `availability_rule`              | `practitioner_id`, `weekday`, `starts_at`, `ends_at` - recurring hours                                                                                                                                                                                                              |
| `availability_exception`         | `practitioner_id`, `date`, `starts_at`, `ends_at`, `is_closed` - leave and one-off changes                                                                                                                                                                                          |
| `public_holiday`                 | `date`, `name_fa`, `is_closed` - maintained, per `BOOK-D6`                                                                                                                                                                                                                          |
| `appointment`                    | `person_id`, `service_id`, `practitioner_id`, `resource_id`, `time_range` (`tstzrange`), `status`, `expires_at`, `deposit_payment_id`, `customer_note`, `staff_note`, `idempotency_key`, `request_hash`, plus `cancelled_at`, `cancelled_by`, `cancellation_reason`, `completed_at` |
| `appointment_practitioner_block` | The practitioner-occupied sub-intervals from `service_step`, so the exclusion constraint can hold a _set_ of intervals per appointment when `allows_interleaving` is on                                                                                                             |
| `intake_question`                | `version`, `sort_order`, `kind`, `is_blocking`, translations                                                                                                                                                                                                                        |
| `intake_response`                | `appointment_id`, `question_version`, `answers` (jsonb), `submitted_at`                                                                                                                                                                                                             |
| `waitlist_entry`                 | `person_id`, `service_id`, `window_start`, `window_end`, `status`, `notified_at`, `claim_expires_at`                                                                                                                                                                                |

**Enums.** `appointment_status`: `held`, `confirmed`, `completed`, `cancelled`,
`no_show`, `expired`. `resource_kind`: `bed`, `device`. No
`practitioner_choice` enum, per `BOOK-D15`.

**Every foreign key is indexed**, and the exit gate for `BOOK1` proves it by
query rather than by reading, as `packet 12` did.

---

## 4. Module and file boundaries

```
src/modules/booking/
  booking.ownership.ts      who is asking; staff vs customer
  booking.reads.ts          catalogue, availability, my appointments
  booking.availability.ts   the two-resource intersection, pure where possible
  booking.service.ts        hold, confirm, cancel, reschedule, complete
  booking.actions.ts        Server Actions, Zod-parsed
  models/                   view models and schemas
  components/               slot picker, service card, intake form
  screens/                  service list, service detail, booking flow, my appointments
  utils/                    slot generation, jalali helpers reused from @/lib/jalali
```

**Booking does not import from Commerce or Academy**, per the bounded-context
rule in `../03-domain-model.md` §1. It reaches the payment path through the
shared `payment` abstraction only.

---

## 5. Reads, mutations, and routes

### 5.1 Server-only reads

- `listServices(locale)` - published, review-approved services.
- `getService(slug, locale)` - detail with steps, preparation and aftercare.
- `findAvailability(serviceId, from, to, practitionerId?)` - **the hard one**;
  see `§6`.
- `listMyAppointments(viewer, locale)` - owner-scoped in the `where`.
- `getAppointment(viewer, id, locale)` - owner-scoped; a foreign id is not-found,
  never forbidden.
- `listDay(staffViewer, date)` - the staff day view across practitioners and beds.

### 5.2 Customer Server Actions

- `holdSlot` - creates a `held` appointment, returns it or a typed rejection.
- `confirmAppointment` - after deposit settlement; idempotent.
- `cancelAppointment` - applies `BOOK-D8`, releases to the waitlist.
- `rescheduleAppointment` - one transaction, per `BOOK-D9`.
- `submitIntake` - Zod-parsed against the question version.
- `joinWaitlist` / `claimWaitlistOffer`.

### 5.3 Staff Server Actions

All re-check the `staff` role inside the action, never inferring it from the page
having rendered.

- `createAppointmentForCustomer` - the phone booking that still happens.
- `markCompleted`, `markNoShow`.
- `blockTime` - leave, cleaning, a delivery.
- `upsertHoliday`.

### 5.4 Scheduled work

- `expireHeldSlots` - releases holds past `expires_at`.
- `sendAppointmentReminders` - 24 hours out, through the outbox.
- `expireWaitlistClaims`.

All three need the worker that does not yet exist.

---

## 6. The availability query

The one piece of this context that deserves its own section, because it is where
the design either works or quietly does not.

**Availability is an intersection of five things:** a practitioner who may
perform this service and is inside working hours; a bed of the required kind; no
overlapping `held` or `confirmed` appointment on either; not a closed holiday or
exception; and enough room for `duration + buffer`.

Rules for building it:

1. **One query, written once, tested hard.** Not a loop in TypeScript over
   candidate slots issuing a query each - that is how a month view takes eight
   seconds.
2. **Generate candidate starts from a grid** (15-minute granularity is enough for
   two-hour services), then eliminate by constraint.
3. **When `allows_interleaving` is on**, the practitioner check runs against
   `appointment_practitioner_block`, not the appointment range. This is the whole
   payoff of `BOOK-D3`.
4. **It is a read and it can be stale.** The authoritative answer is the
   exclusion constraint at insert time. The query's job is to show plausible
   slots, not to guarantee them - so it never takes locks, and `holdSlot`
   returning `slot-taken` is a normal outcome the UI handles gracefully.

---

## 7. Transaction boundaries and lock order

### Hold a slot

Begin → insert `appointment` as `held` (both exclusion constraints adjudicate) →
insert practitioner blocks if interleaving → commit. A constraint violation is
caught and returned as `slot-taken`, not thrown.

### Confirm after deposit

Begin → load appointment `FOR UPDATE` → verify a settled deposit `payment` →
status `confirmed`, clear `expires_at` → audit → outbox `appointment.confirmed` →
commit.

### Cancel

Begin → load `FOR UPDATE` → apply `BOOK-D8` → status `cancelled` → refund
decision recorded → outbox `appointment.cancelled` and a waitlist offer →
commit.

### Reschedule

Begin → load `FOR UPDATE` → update `time_range` (constraints adjudicate) → move
practitioner blocks → audit → outbox → commit. One transaction, per `BOOK-D9`.

**Lock order across contexts is always appointment → payment**, matching
`order → payment` in Commerce, so the two paths cannot deadlock against each
other.

---

## 8. Error and retry contract

| Rejection                  | Meaning                         | What the customer sees                                                 |
| -------------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| `slot-taken`               | Lost the race to the constraint | The slot greys out, the grid refreshes, three alternatives are offered |
| `outside-hours`            | Requested range is not bookable | Never reachable from the UI; a guard for direct posts                  |
| `holiday-closed`           | Clinic shut that day            | Day is disabled in the picker                                          |
| `practitioner-unavailable` | Named practitioner not free     | Offer the pooled option if the service allows it                       |
| `contraindicated`          | A blocking intake answer        | Explain, and offer a consultation instead of a treatment               |
| `deposit-unsettled`        | Hold expired before payment     | The hold is gone; re-offer the slot if it is still free                |
| `too-late-to-cancel`       | Outside the free window         | Show the policy that was shown before booking                          |
| `consultation-required`    | First-time client, gated service | Offer the short consultation instead, per `BOOK-D19`                   |
| `too-soon-in-series`       | Inside the clinical spacing      | Show the earliest date the next session may be booked, per `BOOK-D20`  |
| `not-yours`                | Never returned                  | Not-found instead, per `§5.1`                                          |

Every rejection is a value, never a throw. Retries are safe: `holdSlot` and
`confirmAppointment` are idempotent on `idempotency_key`, derived rather than
generated, per `src/lib/idempotency.ts`.

---

## 9. Phased delivery

Each packet ends with a review-log section and a ledger row, as
`docs/20-packet-review-log.md` and `docs/17-execution-ledger.md` require.

### BOOK0 - Schema, constraints, and the payment correction

**Files:** schema, migration, seeds, schema contract test.

- [ ] `btree_gist`, all tables from `§3.2`, both exclusion constraints.
- [ ] `payment` gains `appointment_id` and the one-aggregate check.
- [ ] Seed services, practitioners, rooms and beds as **development fixtures**,
      fenced the way `shipping_rate` is - demo profile only, labelled so an
      escaped row is obvious.
- [ ] Iranian holidays for the current year, sourced and recorded, not invented.

**Exit gate:** migrated from zero, seeded twice; every new FK indexed, proved by
query; both exclusion constraints proved by a live overlapping insert.

### BOOK1 - Availability, as a read

**Files:** `booking.availability.ts`, its tests.

- [ ] The intersection query from `§6`, including the interleaving branch.
- [ ] Tests: pooled vs named practitioner, bed contention with a free
      practitioner, practitioner contention with a free bed, holidays, exceptions,
      buffers, a service longer than the remaining day, and a day with nothing
      free.

**Exit gate:** a month of availability for one service renders in one query, and
the interleaving case demonstrably yields more slots than the naive one.

### BOOK2 - Hold, confirm, expire

**Files:** `booking.service.ts`, integration tests.

- [ ] Hold with a 10-minute TTL; deposit through the existing payment path;
      confirm; sweeper expiry.
- [ ] **A concurrent double-booking test modelled on the cart's oversell proof**:
      two holds for one slot, one wins, and removing the constraint makes it fail.

**Exit gate:** two simultaneous bookings of the last slot produce exactly one
`held` appointment, proved against real PostgreSQL.

### BOOK3 - Intake, cancellation, rescheduling, waitlist

- [ ] Versioned intake, blocking answers, health-data handling per `BOOK-D10`.
- [ ] Cancellation under `BOOK-D8`, including the deposit decision.
- [ ] Reschedule as one operation, with a test proving a failed reschedule leaves
      the original intact.
- [ ] Waitlist offer with a claim window.

**Exit gate:** a cancelled appointment inside the window refunds and offers the
slot onward; outside it, forfeits and offers the slot onward.

### BOOK4 - Customer surfaces

- [ ] Service list and detail; the slot picker in Jalali; the booking flow; my
      appointments; reschedule and cancel.
- [ ] The empty-calendar case designed, not defaulted: next real slots plus the
      waitlist.

**Exit gate:** a booking completed in a browser at 390, 768 and 1440 in Persian,
with the deposit paid through the existing transfer path.

### BOOK5 - Staff day view and operations

- [ ] Day view across practitioners and beds; create-for-customer; complete;
      no-show; block time; holiday management.

**Exit gate:** a day can be run from the screen without a database client.

### BOOK6 - Reminders and drills

- [ ] Reminder scheduling through the outbox; no-show tracking; failure drills
      (expired holds, unsettled deposits, a practitioner calling in sick).

**Exit gate:** a 24-hour reminder sends exactly once per appointment, and
cancelling a practitioner's day re-offers every affected slot.

---

## 10. What the maintainer must answer before BOOK0

1. ~~Deposit amount and free-cancellation window per service.~~ **Answered
   2026-08-29:** launch with `deposit_rials = 0` per `BOOK-D14`; the cancellation
   tiers are settled in `BOOK-D16`. Deposit amounts are needed only when deposits
   are switched on.
2. ~~Does a practitioner ever leave a client mid-treatment?~~ **Answered
   2026-08-29: yes, covered by an assistant.** See `BOOK-D17` and `BOOK-D18`.
3. ~~May customers pick a practitioner by name?~~ **Answered 2026-08-29: no
   picker in v1.** `BOOK-D15`.
4. **The intake questions**, and which are blocking. `BOOK-D10`.
5. **Working hours per practitioner**, and how leave is normally requested.
6. **What happens to a no-show's deposit**, which is a policy question with a
   customer-relations answer, not a technical one.

---

## 10b. The `/book` hub page

The booking hub is a **public marketing surface**, not part of the appointment
lifecycle, so its composition is specified in
[`storefront/public-surfaces.md`](storefront/public-surfaces.md) §6.2 rather than
here. In summary it carries: what we treat, grouped by concern; the treatment
rooms including the dedicated **Forlle'd room**; consented before-and-after
cases; the practitioners and their credentials; what a visit is like; and
testimonials from **clients** specifically - `PUB-D1` keeps client, customer and
student proof on their own surfaces.

Booking supplies two reads to that page and owns nothing else about it:
`listServices` and `listPractitioners`. The rooms, cases and testimonials are
content entities, per `PUB-D4` and `PUB-D5`.

---

## 11. Capability catalogue

**In v1** - service catalogue, availability search, hold/deposit/confirm,
intake, cancel, reschedule, waitlist, reminders, staff day view, holidays.

**Deliberately later** - package redemption against bookings; practitioner-facing mobile
view; SMS-initiated booking; calendar export; multi-branch; resource-specific
device booking beyond beds.

**Rejected for now** - customer-visible practitioner ratings (three colleagues
in one clinic; it creates a ranking nobody wants to manage); open-ended
"request a time" free text, which recreates the WhatsApp queue this replaces.
