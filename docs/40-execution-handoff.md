# Execution handoff — Booking, then Academy

**Date:** 2026-08-29
**For:** the implementing agent
**Status:** authorises implementation of everything below, in this order

`37` and `38` are the plans. **This is the work board.** Where `37`/`38` state a
packet's intent, this states its tasks — one line each, one sitting each, in the
order they are done. Where any document disagrees with
[`39-confirmation-pass.md`](39-confirmation-pass.md), `39` wins.

---

## 0 · Before writing a single line

Read, in this order. Not optional — most of the drift this project has suffered
came from starting at the code.

1. `AGENTS.md` — the hard rules, especially rule 10 (no foreign hosts)
2. `39-confirmation-pass.md` — **binding**, 24 decisions, 9 of them changed
3. `system-design/booking.md` — `BOOK-D1`…`BOOK-D20`
4. `37-booking-implementation-plan.md` — routes, screens, states, flows
5. `33-density-decisions.md` — `D-2` and `D-4`, the density scope
6. `20-packet-review-log.md` — the last three packets, for the house style
7. `src/modules/cart` and `src/modules/checkout` — **the reference implementations.** Copy their shape

Then, for Academy only: `system-design/academy.md`, `38`.

### 0.1 · Rules that do not bend

- **No architectural drift.** A genuine improvement gets broadcast and written into `docs/` *before* any code moves.
- **No hand-rolled UI.** Check `src/components/ui/` and `src/components/layout/` first, every time. If a primitive is missing it is added through the shadcn workflow, never written by hand.
- **Never invent a business fact.** Prices, durations, credentials, claims, wording — all the maintainer's. Anything you need goes in the packet review log.
- **Integer rials in the database.** Toman is a display transform only.
- **Reads are server-only** and owner-scoped **in the `where`**. A foreign id is 404, never 403.
- **Every rejection is a value, never a throw.**
- **Idempotency keys are derived**, never generated — `src/lib/idempotency.ts`.
- **Never pass an object key to an image `src`.** `mediaUrl()` / `mediaUrlOrNull()`.
- **Never hand-build a locale path.** `localeUrl()`.
- **Logical properties only** — `ms-`/`me-`/`ps-`/`pe-`. Never `ml-`/`mr-`.
- **No screen adds its own `ms-14`.** The shell owns the offset.
- **Motion only through** `src/lib/motion/choreography.ts`.
- **Swiper is the only carousel. anime.js is choreography only.**

### 0.2 · The five gates, green before every packet closes

`tailwind-candidates.test.ts` · `locale-prefix.test.ts` · `url.guard.test.ts` ·
`shell-offset.test.ts` · `route-status.test.ts`

### 0.3 · A packet is not done until

Its exit gate passes **and** a review-log section exists in
`docs/20-packet-review-log.md` **and** a row exists in `docs/17-execution-ledger.md`.
Per `8.10`. No exceptions.

### 0.35 · Do not start at Booking

**Part Zero comes first.** It is four things that are either cheap now and
expensive later, or that something downstream cannot work without. See below.

### 0.4 · Stop and ask — never guess these

| Blocked on | Do this |
|---|---|
| Intake question wording | Build the versioned machinery against 3 placeholder questions, clearly labelled as fixtures. Do **not** write clinical questions |
| Treatment names, durations, prices, stages | Use the fixtures in `B0.12`. Never invent a treatment |
| Attendance threshold for a certificate | `A3` blocks. Log it and continue with the rest of `A3` |
| Credit validity period | Default 12 months, marked as a placeholder in the review log |
| Anything about her credentials or claims | Never generate. Leave empty |
| Intake retention period | Default to the relationship plus 2 years, marked placeholder, logged |
| Persian SMS and notification copy | `B6` needs fa/en/ar templates. Draft structure, leave wording to her, log it |

### 0.5 · Notation

`‖` = may run in parallel with the task above it. Everything else is sequential.
Task order **is** priority.

---

# PART ZERO · FOUNDATIONS

**Start here, not at Booking.** Four packets. None is large, and each is either
impossible to retrofit cheaply or is blocking something already shipped.

`F1` and `F2` can be done in any order. `F3` is independent of both. `F4` should
land before the first staff screen (`B5`).

---

## F1 · The test database

`R-9` in `27-storefront-refinement-backlog.md`: the integration suite writes to
the development database. Booking and Academy together add **more integration
tests than every previous packet combined** — concurrency proofs, sweepers,
capacity races. Left alone this goes from an annoyance to a daily obstruction.

| # | Task | Done when |
|---|---|---|
| F1.1 | Integration tests run against an isolated database | A per-run schema or a separate database. Never the development one |
| F1.2 | The suite creates and tears down its own state | Two consecutive runs from a dirty tree both pass |
| F1.3 | Prove it | Seed the dev database, run the whole integration suite, dev data **unchanged** |

**Exit:** `pnpm test:integration` twice in a row, dev database untouched.

---

## F2 · A Content-Security-Policy

There is none today, on a site that takes payments. `back-office.md` §3.2 ranks
this above co-location and then schedules it inside `BO0`; it is a configuration
change and it should not wait for a hostname.

Hard rule 10 already forbids foreign hosts, so the policy can be **tight from the
first attempt** — that is unusual and worth exploiting.

| # | Task | Done when |
|---|---|---|
| F2.1 | CSP in report-only mode on the storefront | Header present, violations logged |
| F2.2 | Fix what it reports | Expect very little, given hard rule 10 |
| F2.3 | Enforce | `default-src 'self'`, no `unsafe-inline` in `script-src` |
| F2.4 | A test asserting the header is present and enforcing | Regression protection |

**Exit:** enforcing CSP on every route, no console violations, every page still works.

---

## F3 · The notification worker

`35` finding F-1, and **the highest-leverage unbuilt thing in the repository.**
`notification_outbox` exists and nothing drains it, so today an order is placed,
a receipt is uploaded, and the customer is told **nothing, ever**.

This is not a Booking prerequisite. It is a **Commerce defect** that Booking and
Academy also depend on. Build it now and three contexts stop being silent.

**Build the worker, not the provider** (`35` §M-A). No SMS account is required.

| # | Task | Done when |
|---|---|---|
| F3.1 | `NotificationChannel` interface — `send(message, locale)` | One method, no provider concepts leaking through it |
| F3.2 | Console adapter for development | Prints what would be sent |
| F3.3 ‖ | Recording adapter for tests | Assertable |
| F3.4 | The drain: ordered, with backoff | Claims rows so two workers cannot send the same message |
| F3.5 | Dead-lettering after N attempts | Failures visible, not silently dropped |
| F3.6 | **Once-only delivery, keyed on the outbox row** | Survives a worker restart mid-send |
| F3.7 | Templates for fa, en and ar | **Structure only.** The Persian wording is the maintainer's — log it |
| F3.8 | Wire the existing Commerce events | Order placed, payment settled, transfer rejected. **This is the part that is currently silent** |
| F3.9 | Outbox panel with failures and a retry action | Minimal route now; folds into `/admin/settings` at `F4` |

**Exit gate:** an order placed in development produces **exactly one** recorded
notification; a forced failure retries and then dead-letters; a worker killed
mid-send does not double-send on restart. **No provider account exists.**

---

## F4 · `BO0` — the substrate every staff screen needs

Not a back office. It is what the first staff screen requires, and three of its
five parts cannot be retrofitted cheaply.

| # | Task | Done when |
|---|---|---|
| F4.1 | The admin origin and middleware | `/admin/*` refused on the public host; storefront routes refused on the admin host. **`admin.localhost` in development** — nothing is deployed yet |
| F4.2 | Session cookies scoped to the admin host | A storefront XSS cannot issue authenticated admin requests. **Scoping cookies after sessions exist in the wild is the expensive version of this task** |
| F4.3 | The audit wrapper | One function every admin mutation passes through, writing actor, action, entity, before and after. If the first staff mutation does not write a row, no later one will |
| F4.4 | TOTP re-authentication for dangerous actions | Settling money, committing prices, granting a role, revoking consent |
| F4.5 | **The shared list component** | Title and count · `/`-focused search · filter chips **in the URL** · optional bulk select · dense table with tabular numerals · numbered pagination. Built on the **shadcn data table** plus the **command** primitive, in the compact density scope. Not hand-rolled — this is the single most likely drift in the back office |
| F4.6 | Its three designed states | Nothing yet · nothing matching the filters, with a clear-filters action · the read failed |
| F4.7 | `/admin` day screen | Each panel a count and a link. **An empty queue says so rather than disappearing** — a missing panel reads as broken |
| F4.8 | Confirm a privacy policy page is scheduled | `B3.14` collects health data; `35` finding F-3 stops being a commerce concern the moment intake ships (`BOOK-D23`) |

**Exit gate:** a storefront page cannot reach an admin route on the public
hostname; an admin session cookie is not sent to the storefront origin; the CSP is
enforced; and **every mutation under `/admin` writes an audit row, proved by
test.**

---

# PART ONE · BOOKING

Nothing in Part One needs a payment gateway, an SMS account, or business
registration. `B6` needs `F3`; `B5` needs `F4`.

---

## U · The six primitives

Blocks everything. Academy adds none — if Academy somehow runs first, this still
runs first.

| # | Task | Done when |
|---|---|---|
| U.1 | Add `form` via the shadcn workflow | Renders; `@hookform/resolvers` + `zod` wired |
| U.2 ‖ | Add `radio-group` | Renders |
| U.3 ‖ | Add `select` | Renders |
| U.4 ‖ | Add `popover` | Renders |
| U.5 ‖ | Add `tabs` | Renders |
| U.6 ‖ | Add `table`, dense variant per `D-2` | Renders inside the compact density scope |
| U.7 | One throwaway route rendering all six | Correct at 390 and 1440, in Persian, in both density scopes |
| U.8 | Run the class-compilation gate | `tailwind-candidates.test.ts` green — **no invented token names** |

**Exit:** all six render in RTL with no bespoke CSS. Delete the throwaway route.

---

## B0 · Schema, constraints, and the shared payment migration

| # | Task | Done when |
|---|---|---|
| B0.1 | Enums: `appointment_status`, `resource_kind` | In `schema/enums.ts`. **No `practitioner_choice`** (`BOOK-D15`) |
| B0.2 | `service` + `service_translation` | Includes `requires_prior_visit`, `session_count`, `min_days_between_sessions`, `allows_interleaving`, `free_cancellation_hours`, `deposit_rials` |
| B0.3 | `service_step` | `occupies_practitioner` boolean — the `BOOK-D3` model |
| B0.4 ‖ | `practitioner`, `practitioner_skill`, `room`, `resource` | Assistant is a `practitioner` row with narrow skills (`BOOK-D17`) |
| B0.5 ‖ | `availability_rule`, `availability_exception`, `public_holiday` | |
| B0.6 | `appointment` | `time_range` is `tstzrange`, UTC. `practitioner_id` is the **lead, for display only** — it carries no constraint (`BOOK-D21`) |
| B0.6a | `appointment_practitioner_block` | Own `practitioner_id`, `time_range`, denormalised `status`. **Always populated** — one row for a non-interleaving service |
| B0.6b | `duration_minutes` derived from `service_step` | Contract test asserts they agree for every seeded service (`BOOK-D22`) |
| B0.7 ‖ | `intake_question`, `intake_response` | Versioned |
| B0.8 ‖ | `waitlist_entry` | |
| B0.9 | `treatment_series`, and `appointment.series_id` | `BOOK-D20` |
| B0.10 | **The shared payment migration** — `ACAD-D12` | `order_id` nullable; `appointment_id` **and** `enrolment_id` added; three-way check. **Do this once for both contexts** |
| B0.11 | Revisit `payment_id_order_unique` and `payment_order_time_idx` | Partial `WHERE order_id IS NOT NULL`, in the same migration |
| B0.12 | `CREATE EXTENSION btree_gist` | Before either constraint, or migration fails confusingly |
| B0.12a | `no_resource_overlap` **on `appointment`** | Correct as `BOOK-D2` wrote it. `WHERE status IN ('held','confirmed')` |
| B0.12b | `no_practitioner_overlap` **on `appointment_practitioner_block`** | **NOT on `appointment`** — `BOOK-D2` is wrong and `BOOK-D21` corrects it. Putting it on `appointment` makes interleaving impossible and destroys the 75% capacity gain |
| B0.13 | FK index audit | Every new FK indexed, **proved by query**, as packet 12 did |
| B0.14 | Dev fixtures | One short consultation, one 2-hour treatment with passive steps, one series; one practitioner, one assistant, one room, three beds. **Demo-profile fenced and labelled** |
| B0.15 | Iranian public holidays, current year | **Sourced and recorded, not invented.** Source noted in the seed |
| B0.16 | Schema contract test | |

**Exit gate:** migrates from zero; seeds twice cleanly; a live overlapping insert
is refused **on both axes**; every FK index proved by query.

---

## B1 · Availability

The packet where the design either works or quietly does not.

| # | Task | Done when |
|---|---|---|
| B1.1 | Audit `src/lib/jalali.ts`; add day-strip helpers | Weekday label, day number, range generation. **No new date library** |
| B1.2 | Pure 15-minute candidate-slot generator | Unit tested, no database |
| B1.3 | Query layer 1 — practitioner skilled and inside working hours | |
| B1.4 | Query layer 2 — a free bed of the required kind | |
| B1.5 | Query layer 3 — exclude overlapping `held`/`confirmed` **on both axes** | |
| B1.6 | Query layer 4 — holidays and exceptions | |
| B1.7 | Query layer 5 — `duration + buffer` fits | |
| B1.8 | The interleaving branch | Checks `appointment_practitioner_block`, **not** the appointment range |
| B1.9 | Assemble as **one** query | Not a TypeScript loop issuing a query per slot |
| B1.10 ‖ | `listServices`, `getService` | Through `resolveDraftPreview()` |
| B1.11 ‖ | `listMyAppointments`, `getAppointment` | Owner-scoped **in the `where`**; foreign id 404 |
| B1.12 ‖ | `listDay(staffViewer, date)` | |
| B1.13 | The nine tests | Pooled; bed contention with free practitioner; practitioner contention with free bed; assistant covering a passive step yielding a second client; holiday; exception; buffer eliminating the last slot; service longer than the day; nothing free |

**Exit gate:** a month of availability renders in **one** query, and the
interleaving case yields more slots than the naive one — **asserted as a number**,
not observed.

---

## B2 · Hold, confirm, expire

| # | Task | Done when |
|---|---|---|
| B2.1 | `holdSlot` | Constraint violation **caught and returned** as `slot-taken` |
| B2.2 | Practitioner blocks written when interleaving is on | |
| B2.3 | `requires_prior_visit` check | Returns `consultation-required` (`BOOK-D19`) |
| B2.4 | `confirmAppointment` | Idempotent on a derived key; `deposit_rials = 0` confirms immediately (`BOOK-D14`) |
| B2.5 | `min_days_between_sessions` check | Returns `too-soon-in-series` with the earliest date |
| B2.6 | `expireHeldSlots` sweeper | |
| B2.7 | The rejection table from `booking.md` §8 | Every one a value; none thrown |
| B2.8 | **The concurrency proof** | Two simultaneous holds → exactly one `held`, against real PostgreSQL |
| B2.9 | The negative control | Removing the constraint makes B2.8 **fail** |

**Exit gate:** B2.8 and B2.9 both true.

---

## B3 · Customer screens

The largest packet. Every screen: JS-off, RTL, Jalali, shell offset respected.

### Treatment list — `/book`

| # | Task | Done when |
|---|---|---|
| B3.1 | Route + screen, grouped by concern | Consultations a distinguished group |
| B3.2 | Second entry point: browse by treatment type (`39` §2.2) | Concern grouping stays **canonical**; the type listing carries a canonical link to it |
| B3.3 | States: loading, none published, read failed | Uses `empty-state`, not an ad-hoc div |

### Treatment page — `/book/s/[slug]`

| # | Task | Done when |
|---|---|---|
| B3.4 | Detail content, plus the cancellation rule **shown before booking** | `BOOK-D8` |
| B3.5 | **Day strip component** | `scroll-area`; per-day availability dot; closed days visibly disabled with the reason |
| B3.6 | Day selection as a `GET` (`?date=`) | **Works with JS off** |
| B3.7 | Time list as a `radio-group` | |
| B3.8 | Progressive enhancement: swap day, refresh times in place | Same pattern as `SHOP-D1`'s variant selector |
| B3.9 | "More dates" extends the strip | **Never opens a modal calendar** |
| B3.10 | Empty-day state | Next three days that do have times, plus the waiting list |
| B3.11 | Nothing-for-weeks state | Waiting list prominent, earliest real date named |
| B3.12 | First-time-client state | Short consultation offered in place of the picker |
| B3.13 | Series too-soon state | Earliest permitted date, with the reason |

### Confirm — `/book/confirm/[id]`

| # | Task | Done when |
|---|---|---|
| B3.14 | Intake form from the versioned question set | `form` + `radio-group` + `checkbox`, Zod-parsed against the version |
| B3.15 | Blocking answer handling | Explains, offers a consultation, **releases the hold** |
| B3.16 | The ten-minute timer | Visible; what happens at zero said in words |
| B3.17 | Expiry-while-open state | Slot re-offered if free; **intake answers preserved** |
| B3.18 | Confirmation shows the practitioner's name | `39` §2.1 |
| B3.19 | Assert: health answers never enter a notification body | Test |

### Account

| # | Task | Done when |
|---|---|---|
| B3.20 | `/account/appointments` — upcoming and past | |
| B3.21 | `/account/appointments/[id]` | Policy restated |
| B3.22 | Reschedule screen | |
| B3.23 | `/account/series/[id]` | Bought, used, remaining, expiry, book-next |
| B3.24 | JS-off pass over every B3 screen | Booking completed with scripts disabled |

**Exit gate:** a booking completed in a browser at 390, 768 and 1440, in Persian,
**with JavaScript disabled**, list to confirmation.

---

## B4 · Intake, cancellation, rescheduling, waitlist

| # | Task | Done when |
|---|---|---|
| B4.1 | Intake versioning | A response records the version it answered |
| B4.2 | Cancellation tiers per `BOOK-D16` | 24h / 12–24h free once / under 12h credit. **No refund path called** |
| B4.3 | The 90-day repeat-late-cancellation rule | |
| B4.4 | `rescheduleAppointment` in **one** transaction | |
| B4.5 | Test: a failed reschedule leaves the original intact | The failure mode is a customer holding neither slot |
| B4.6 | `joinWaitlist`, matching on service and window | |
| B4.7 | Offer-on-release with a claim window | One slot never promised to five people |
| B4.8 | `claimWaitlistOffer`, `expireWaitlistClaims` | |
| B4.9 | Intake retention sweep; `person.closedAt` **deletes** intake responses | `BOOK-D23`. The appointment survives; its answers do not |
| B4.10 | Test: no intake answer reaches a notification body | |

**Exit gate:** a cancellation inside the window releases and offers onward;
outside it, the same, with the deposit becoming credit rather than a refund.

---

## B5 · The staff day (absorbs `BO6`)

Depends on `BO0`'s admin origin, audit wrapper and re-authentication.

| # | Task | Done when |
|---|---|---|
| B5.1 | `/admin/bookings` day grid, **phone-first** | Column per person, time down the side |
| B5.2 | Beds as a second band | `BOOK-D1` — a day can be practitioner-free and bed-bound |
| B5.3 | `createAppointmentForCustomer` | The telephone booking, **and** the consultation→treatment conversion (`BOOK-D19`) |
| B5.4 ‖ | `markCompleted`, `markNoShow` | |
| B5.5 ‖ | `blockTime` | |
| B5.6 | Reschedule **by form** | Drag is a desktop enhancement or it is nothing |
| B5.7 | Week view | `tabs` |
| B5.8 | `/admin/bookings/holidays` | `upsertHoliday` — `BOOK-D6` |
| B5.9 | Status chips carry **shape as well as colour** | `back-office.md` §4.2 |
| B5.10 | Role re-checked **inside** every action | Never inferred from the page rendering |
| B5.11 | Every mutation writes `audit_log` | Proved by test |

**Exit gate:** a full day run from the screen at 390 wide — walk-in booked, client
completed, no-show marked, hour blocked — with no database client.

---

## B6 · Reminders and drills

**Blocked on the notification worker** (`35` §7.1). Everything above ships without it.

| # | Task | Done when |
|---|---|---|
| B6.1 | `sendAppointmentReminders`, 24h out, **through the outbox** | Never inline (`BOOK-D12`) |
| B6.2 | Reminder names the practitioner | `39` §2.1 |
| B6.3 | Waitlist offers through the same path | |
| B6.4 | Drill: expired hold | Recorded in the review log |
| B6.5 | Drill: deposit that never settles | |
| B6.6 | Drill: practitioner calls in sick, whole day released | Every affected slot re-offered |

**Exit gate:** a reminder sends **exactly once** per appointment across a worker
restart.

---

## B7 · Verification

| # | Task |
|---|---|
| B7.1 | Five gates green |
| B7.2 | Foreign appointment id returns **404, not 403** |
| B7.3 | **SSR verified** — list and detail carry content in the served HTML, not only after hydration (`R-10` regresses easily) |
| B7.4 | Structured data via `localeUrl()` |
| B7.5 | Axe pass, all customer screens |
| B7.6 | Keyboard-only booking completed end to end |
| B7.7 | Browser pass at 390 / 768 / 1440 in fa, en, ar |
| B7.8 | **`36-booking-in-plain-english.md` is true of the running application** |

---

# PART TWO · ACADEMY

Split per `ACAD-D16`. `A0`–`A5` leaves the public product critique-ready; `A6`–`A8`
follow without holding it up.

**Academy takes real money** through the existing bank-transfer path — no gateway,
no registration.

---

## A0 · Schema

| # | Task | Done when |
|---|---|---|
| A0.1 | Enums: `enrolment_status` (**including `pending_review`**, `ACAD-D14`), `course_kind`, `attendance_state`, `instalment_status`, `package_item_kind` | |
| A0.2 | `course`, `course_translation` | |
| A0.3 | `cohort` | Includes `hold_hours` default 48 (`ACAD-D11`) and `buffer_minutes` default 30 (`39` §2.5) |
| A0.4 ‖ | `cohort_instructor`, `cohort_session` | Many instructors **from the first migration** (`ACAD-D3`) |
| A0.5 | `enrolment` | |
| A0.6 ‖ | `attendance` | Back in scope (`39` §2.3) |
| A0.7 ‖ | `certificate` | With `holder_name_snapshot`, `course_name_snapshot` |
| A0.8 ‖ | `cohort_waitlist` | |
| A0.9 | `instalment_plan`, `instalment` | Now used, per `ACAD-D16` |
| A0.10 | `package`, `package_item`, `package_purchase` | Snapshotted title and price (`ACAD-D9`) |
| A0.11 | **Verify B0.10 already did the payment migration** | If Academy runs first, do it here — **never twice** |
| A0.12 | **Do not create `module` or `lesson`** | Video is deferred; an unused table with no decision behind it is clutter |
| A0.13 | FK index audit, proved by query | |
| A0.14 | Dev fixtures | Two courses (one certifying with a prerequisite), two cohorts (one full), two instructors on one cohort with a sponsor brand. Demo-fenced, labelled |
| A0.15 | Schema contract test | |

**Exit gate:** migrates from zero, seeds twice; the three-way aggregate proved by
three inserts that succeed and one naming two aggregates that is refused.

---

## A1 · Catalogue, and the Booking collision

| # | Task | Done when |
|---|---|---|
| A1.1 | `listCourses`, `getCourse`, `listCohorts`, `getCohort` | Through `resolveDraftPreview()` |
| A1.2 | `/academy` catalogue | |
| A1.3 | `/academy/c/[slug]` | |
| A1.4 | `/academy/cohort/[id]` — **section order per `38` §2.3** | Outcomes → who it's for → dates and seats → certificate worth → syllabus → instructor → graduates → price |
| A1.5 | Seats remaining | Counts confirmed **and held** |
| A1.6 | Multiple instructors and sponsor brand rendered | From the first version, not retrofitted |
| A1.7 | Jalali cohort dates | |
| A1.8 | **`BOOK-D18`** — confirming a session writes an `availability_exception` per instructor | Through a **narrow published Booking function**. Academy never writes Booking's tables |
| A1.9 | Buffer applied | 30 minutes either side (`39` §2.5) |
| A1.10 | Moving or cancelling a session withdraws the exception | |
| A1.11 | States: no cohorts scheduled, full, finished, read failed | |

**Exit gate:** a real course renders with co-instructors and sponsor **and** a
confirmed session makes its instructors unbookable for that window plus buffer.

---

## A2 · Enrolment, capacity, waitlist, payment

| # | Task | Done when |
|---|---|---|
| A2.1 | `holdSeat` with `SELECT … FOR UPDATE` on the cohort | The lock is what makes it true |
| A2.2 | TTL from `cohort.hold_hours` | 48 by default |
| A2.3 | Prerequisite check → **`pending_review`**, seat stays held | `ACAD-D14` |
| A2.4 | Staff queue for pending enrolments, approve/decline with a reason | |
| A2.5 | Hold clock applies to **her** too | An unreviewed pending enrolment releases its seat |
| A2.6 | Enrolment payment through **existing** bank transfer | Expected amount, reference, receipt upload. **No new money code** |
| A2.7 | `confirmEnrolment` on settlement | Idempotent, derived key |
| A2.8 ‖ | `joinCohortWaitlist` with position | |
| A2.9 | Offer on expiry or withdrawal | |
| A2.10 | `withdraw` → **credit, never cash** | `ACAD-D15`, 12 months (placeholder — log it) |
| A2.11 | `expireHeldSeats` sweeper | Takes the **earlier** of `expires_at` and `cohort.starts_on` (`ACAD-D17`) |
| A2.11a | Partial unique index: one live enrolment per person per cohort | `ACAD-D17`. `already-enrolled` is a rejection with nothing enforcing it today |
| A2.11b | Consent checkbox at enrolment for public name display | `ACAD-D17` |
| A2.12 | **Capacity proof** | Two simultaneous holds → exactly one; removing `FOR UPDATE` makes it fail |

**Exit gate:** A2.12 passes, **and** a student enrols → transfers → uploads a
receipt → staff settle → `confirmed`. **The first complete commercial transaction
on this site.**

---

## A3 · Attendance and certification

| # | Task | Done when |
|---|---|---|
| A3.1 | Attendance screen, **phone-first**, large tap targets | Three states, one submit, tolerant of late entry |
| A3.2 | Attendance feeds the completion rule | |
| A3.3 | **Threshold is maintainer-owed** | Build against a placeholder, **log it**, do not invent a number |
| A3.4 | `issueCertificate` | Random **long** code, never sequential |
| A3.5 | Snapshots written at issue | Holder and course name |
| A3.6 | `supersedeCertificate` | New number; old marked superseded. **Never an edit** |
| A3.7 | `/verify/[code]` | No session; name, course, date, status, **nothing else**; `noindex` |
| A3.8 | Rate limiting | A thousand guesses are limited, not answered |
| A3.9 | Unknown code indistinguishable from malformed | The page cannot probe which codes exist |
| A3.10 | No consent → verify by **course, date and status only** | Still proves the certificate is genuine, which is the page's job (`ACAD-D17`) |

**Exit gate:** a certificate issued from real attendance verifies at a public URL;
a superseded one says so rather than vanishing.

---

## A4 · Staff screens and the practitioner loop (absorbs `BO7`)

| # | Task | Done when |
|---|---|---|
| A4.1 | `/admin/academy/cohorts` list | Course, dates, capacity, enrolled, held, waitlisted |
| A4.2 | Cohort detail: roster, sessions, instructors, sponsor | |
| A4.3 | **Release a held seat — one action from the list** | The mitigation for the only abuse this design permits. Not buried in a form |
| A4.4 | Pending-review queue | From A2.4 |
| A4.5 ‖ | `/admin/academy/enrolments` filterable by payment state | |
| A4.6 ‖ | `/admin/academy/certificates` | Issue, list, supersede |
| A4.7 | `grantPractitionerRole` | Explicit, re-authenticated, audited (`ACAD-D10`) |
| A4.8 | Density at its most compact | `BO-D1` |
| A4.9 | Role re-checked inside every action; every mutation audited | |

**Exit gate:** a cohort run entirely from the screens, **and** a certified
graduate granted the role then buying at professional prices in the shop. That is
`ACAD-D10`'s loop closed.

---

## A5 · Verification

| # | Task |
|---|---|
| A5.1 | Five gates green |
| A5.2 | `/verify/[code]` 404s an unknown code, is `noindex`, is rate-limited |
| A5.3 | Foreign enrolment id 404, not 403 |
| A5.4 | SSR verified on catalogue and cohort pages |
| A5.5 | `Course` structured data via `localeUrl()` |
| A5.6 | Axe pass; keyboard-only enrolment; seats-remaining announced |
| A5.7 | 390 / 768 / 1440, fa / en / ar, **JS disabled** for the enrolment flow |

**→ The public product is critique-ready here. `A6`–`A8` do not block it.**

---

## A6 · Instalments

Payment-layer work — the shop inherits it. Build it properly.

| # | Task |
|---|---|
| A6.1 | `instalment_plan` creation at enrolment |
| A6.2 | Ordered `instalment` rows with due dates |
| A6.3 | Each settles through the **existing** transfer path |
| A6.4 | **Access gated on plan state, not the last payment** (`ACAD-D4`) |
| A6.5 | Overdue view for staff |
| A6.6 | Assert: a missed instalment **never** revokes access |
| A6.7 | Student-facing plan view: paid, due, overdue |

**Exit gate:** an enrolment paid in three instalments reaches `active`, and the
second failing does not revoke access.

---

## A7 · Mentorship

| # | Task |
|---|---|
| A7.1 | `service.kind = 'mentorship'` seeded — **through Booking, no second scheduler** |
| A7.2 | Availability rules for mentorship hours |
| A7.3 | Surfaced on Academy, booked by Booking |
| A7.4 | Pricing and duration **maintainer-owed** — placeholder, logged |

**Exit gate:** a mentorship hour booked through Booking's scheduler, appearing in
Academy's surfaces, with neither context importing the other's types.

---

## A8 · Packages — necessarily last

Redeems into Commerce, Booking **and** Academy. All three must be finished.

| # | Task |
|---|---|
| A8.1 | `package_item` stores `kind` + id + **snapshotted title and price** (`ACAD-D9`) |
| A8.2 | Purchase through the existing payment path |
| A8.3 | A thin resolver each context registers with |
| A8.4 | Redemption dispatch |
| A8.5 | Assert: **no context imports another's types** |

**Exit gate:** a package containing a course, a product kit and two mentorship
hours redeems into three contexts with no cross-imports.

---

## Appendix · The critical path

```
F1 · F2 · F3 · F4                        Part Zero — foundations, any order
                                          F3 also un-silences Commerce today

U → B0 → B1 → B2 → B3 → B4 → B7          Booking, customer-complete
                    B5 ← F4               the staff day
                    B6 ← F3               reminders
A0 → A1 → A2 → A3 → A4 → A5               Academy, critique-ready
                          A6 · A7         either order
                                → A8      last, needs all three contexts
```

**Why Part Zero is not optional.** `F1` gets worse every packet. `F2` is a
configuration change protecting a site that already takes payments. `F3` is
already broken in production code — Commerce is silent today. `F4`'s cookie
scoping and audit wrapper are cheap now and expensive after sessions and
mutations exist. None of the four is large; all four are the wrong thing to do
later.

`B0.10` — the payment migration — is shared. **Whichever context reaches it first
owns it, and the other verifies rather than repeats.** Getting this wrong produces
two one-aggregate checks that disagree, and it is the single most likely
cross-packet mistake in this handoff.
