# Booking — the implementation plan

**Date:** 2026-08-29
**Status:** Buildable. This document authorises implementation of `BOOK0`–`BOOK7`.
**Specifies:** foundations, routes, screens, components, flows, states, behaviours,
tests and exit gates
**Companions:** [`system-design/booking.md`](system-design/booking.md) — the decisions
(`BOOK-D1`…`BOOK-D20`); [`36-booking-in-plain-english.md`](36-booking-in-plain-english.md) —
what it is, for reading
**Governs:** `35-plan-review-and-resequencing.md` §9.4 block 2

---

## 0. Scope, and what is deliberately not in it

**In:** the workspace, its routes, its screens, its components, every customer and
staff flow, every state a screen can be in, the availability engine, the
concurrency guarantees, the staff day, and the tests that prove each.

**Deliberately deferred to a later data pass**, on the maintainer's instruction:
the real treatment list, per-treatment durations, `service_step` timings, series
session counts, `min_days_between_sessions`, deposit amounts, consultation prices,
and the intake question wording. **The columns and the behaviour ship in this
block; the values arrive after.** Every packet is therefore exercised against
development fixtures, fenced to the demo profile and labelled so an escaped row is
obvious — the same fencing `shipping_rate` uses.

This is the correct order. A screen built against three plausible fixtures and a
screen built against the real list are the same screen; waiting for the list to
start is a month of nothing.

---

## 1. What already exists, and must be reused

Reading this section is not optional. Everything named here is built, tested and
governed by an existing decision. Re-implementing any of it is the drift the
project's conventions exist to prevent.

### 1.1 Primitives — `src/components/ui/`

`accordion` · `badge` · `button` · `checkbox` · `collapsible` · `command` ·
`dialog` · `input` · `label` · `scroll-area` · `separator` · `sheet` ·
`skeleton` · `slider` · `sonner`

### 1.2 Layout and behaviour — `src/components/layout/`

`container` · `page-header` · `breadcrumbs` · `empty-state` · `density` ·
`storefront-shell` · `rail` · `bottom-navigation` · `command-palette` ·
`carousel` (Swiper, per `M-3`) · `reveal` · `parallax` · `scroll-scene` ·
`route-state` · `site-footer` · `locale-switch`

`empty-state` and `density` matter most here. Booking has more empty states than
any surface built so far, and the staff screens are the most compact surface in
the system.

### 1.3 Libraries and utilities

| What | Where | Note |
|---|---|---|
| Jalali dates | `src/lib/jalali.ts` | Already exists. **No new date library.** See `§3.1` |
| Money | `src/lib/money.ts` | Integer rials in, display out |
| Idempotency | `src/lib/idempotency.ts` | Keys are **derived**, never generated |
| Media URLs | `src/lib/media/url.ts` | `mediaUrl()` / `mediaUrlOrNull()`. Never pass an object key to `src` |
| Navigation | `src/lib/navigation/` | `localeUrl()`, the manifest. Never hand-build `/fa/` |
| Preview | `src/lib/preview.ts` | `resolveDraftPreview()`, `PUBLIC_ONLY` |
| Query | `src/lib/query/` | TanStack Query, established by the cart |
| Motion | `src/lib/motion/choreography.ts` | anime.js, choreography only, per `M-4` |

### 1.4 Module shape — copy it exactly

```
src/modules/<name>/
  <name>.reads.ts        server-only reads, ownership scoped in the where
  <name>.service.ts      the domain operations, transactional
  <name>.actions.ts      Server Actions, Zod-parsed at the boundary
  <name>.ownership.ts    who is asking
  models/                view models and schemas
  components/            surface-specific components
  screens/               one file per screen, colocated .test.tsx
  utils/                 pure helpers
```

`src/modules/commerce`, `cart` and `checkout` are the reference implementations.

### 1.5 Route groups

`[locale]/(storefront)/…` public · `(account)/…` signed-in · `(admin)/…` staff ·
`(auth)/…`. Slug routes follow `/shop/p/[slug]`.

---

## 2. The primitives Booking must add

Six, all from shadcn on radix-ui, none hand-rolled. Each lands in `BOOK-UI`
(§5.1) with the class-compilation gate green, before any screen consumes it.

| Primitive | Needed by | Note |
|---|---|---|
| `form` | Intake, staff forms | The shadcn wrapper over react-hook-form. `@hookform/resolvers` and `zod` are already installed |
| `radio-group` | Slot choice, single-answer intake | Radio, not a select — the options are few and visible |
| `select` | Staff filters, practitioner assignment | Only where options exceed roughly seven |
| `popover` | Staff quick actions on the day grid | |
| `tabs` | Staff day / week | |
| `table` | Staff lists | The dense variant, per `D-2` |

**Not added:** a calendar or date-picker component. See `§3.1`.

---

## 3. Two design decisions this plan makes

### 3.1 The slot picker is a day strip and a time list, not a calendar

`booking.md` §BOOK4 says "the slot picker in Jalali" in one line. It is the
hardest interface in the project and the line hides three problems: no shadcn
calendar exists here; `react-day-picker` has no Jalali calendar; and every
Persian date-picker library on npm brings its own styling, its own RTL
assumptions and its own opinions about tokens — which is a drift surface, not a
component.

**So there is no calendar.** A booking picker is not a date picker. What a person
needs is:

- A **horizontal strip of the next N days**, each a button showing the Jalali
  weekday and day number, with a dot or a count when that day has availability
  and a visibly disabled state when the clinic is closed. Rendered with the
  existing `src/lib/jalali.ts` helpers. It scrolls, using `scroll-area`.
- A **list of times** for the selected day, as a `radio-group` of buttons.
- A **"more dates"** affordance that extends the strip rather than opening a
  modal calendar.

This is what every booking product that works actually does — the calendar-grid
metaphor is for choosing an arbitrary date, and nobody choosing an appointment
wants an arbitrary date. It costs no dependency, introduces no new styling
surface, and reuses primitives already present.

**The day strip is a `GET` navigation** (`?date=…`), so the whole picker works
with JavaScript disabled. Progressive enhancement swaps the day and refreshes the
time list in place, which is the same pattern `SHOP-D1` specifies for the variant
selector.

### 3.2 The customer flow is three screens, and the hold is a URL

Mirroring checkout, which already proves this shape.

```
/book                       choose a treatment
/book/s/[slug]              the treatment, and its times      ─┐ POST holdSlot
/book/confirm/[id]          intake, summary, confirm          ←┘ redirect
/account/appointments/[id]  done                              ← redirect
```

The hold being a route rather than client state means: refresh survives, back
works, the ten-minute timer has somewhere to live, an abandoned hold is visibly
abandoned, and none of it needs JavaScript.

---

## 4. Route map

| Route | Group | Who | Screen |
|---|---|---|---|
| `/book` | storefront | anyone | Treatment list |
| `/book/s/[slug]` | storefront | anyone | Treatment detail and times |
| `/book/confirm/[id]` | storefront | holder of the hold | Intake, summary, confirm |
| `/book/waitlist/[slug]` | storefront | signed in | Join the waiting list |
| `/book/claim/[token]` | storefront | offered | Claim a released slot |
| `/account/appointments` | account | owner | Upcoming and past |
| `/account/appointments/[id]` | account | owner | One appointment; reschedule, cancel |
| `/account/appointments/[id]/reschedule` | account | owner | Pick a new time |
| `/account/series/[id]` | account | owner | A course of treatment: balance, sessions, book next |
| `/admin/bookings` | admin | staff | The day |
| `/admin/bookings/week` | admin | staff | The week |
| `/admin/bookings/new` | admin | staff | Book for a customer |
| `/admin/bookings/holidays` | admin | staff | Closed days |

`/book` is the treatment list in this block. The marketing hub described in
`public-surfaces.md` §6.2 replaces it later and is **not** in scope here.

---

## 5. The packets

Each ends with a review-log section in `docs/20-packet-review-log.md` and a row in
`docs/17-execution-ledger.md`, per `8.10`. No packet is complete without both.

---

### BOOK-UI · The six primitives

**Files:** `src/components/ui/{form,radio-group,select,popover,tabs,table}.tsx`

- [ ] Added through the project's shadcn workflow, not written by hand.
- [ ] Each renders correctly in RTL, and in the compact density scope.
- [ ] `tailwind-candidates.test.ts` green — every class in each primitive compiles.

**Exit gate:** each primitive rendered in a throwaway story at 390 and 1440, in
Persian, in both density scopes, with no invented token names.

---

### BOOK0 · Schema, constraints, and the payment correction

**Files:** `src/lib/db/schema/booking.ts`, a migration, seeds, schema contract test

- [ ] `CREATE EXTENSION btree_gist` in the first booking migration. Its absence
      fails confusingly at migration time.
- [ ] Every table from `booking.md` §3.2, plus `treatment_series` (`BOOK-D20`)
      and the `service` columns from `BOOK-D19` and `BOOK-D20`.
- [ ] Both exclusion constraints, with the `WHERE status IN ('held','confirmed')`
      clause so a cancelled appointment stops blocking its slot.
- [ ] `payment.order_id` becomes nullable, gains `appointment_id`, gains
      `payment_one_aggregate_check`.
- [ ] Development fixtures: three treatments of different shapes (one short
      consultation, one two-hour treatment with passive steps, one series), one
      practitioner, one assistant with a narrow `practitioner_skill`, one room,
      three beds. **Fenced to the demo profile and labelled.**
- [ ] Iranian public holidays for the current year — **sourced and recorded, not
      invented**, with the source noted in the seed.

**Exit gate:** migrated from zero and seeded twice with no error. Every new
foreign key indexed, **proved by query** rather than by reading, as packet 12 did.
Both exclusion constraints proved by a live overlapping insert that the database
refuses.

---

### BOOK1 · Availability, as a pure read

**Files:** `booking.availability.ts`, `booking.reads.ts`, their tests

The one piece where the design either works or quietly does not.

- [ ] **One query**, not a TypeScript loop issuing a query per candidate slot.
      That is how a month view takes eight seconds.
- [ ] Candidate starts generated on a 15-minute grid, then eliminated by
      constraint: a practitioner skilled in this service and inside working
      hours; a bed of the required kind; no overlapping `held` or `confirmed`
      appointment on either axis; not a closed holiday or exception; and room for
      `duration + buffer`.
- [ ] When `allows_interleaving` is on, the practitioner check runs against
      `appointment_practitioner_block`, **not** the appointment range. That is the
      entire payoff of `BOOK-D3`.
- [ ] It takes **no locks** and may be stale. The authority is the exclusion
      constraint at insert time; this query's job is to show plausible slots.
- [ ] `listServices`, `getService`, `listMyAppointments`, `getAppointment`,
      `listDay` — all owner-scoped **in the `where`**, and a foreign id is
      not-found, never forbidden.

**Tests:** pooled availability; bed contention with a free practitioner;
practitioner contention with a free bed; the assistant covering a passive step
yielding a second concurrent client; a holiday; a one-off exception; a buffer
that eliminates the last slot; a service longer than the remaining day; and a day
with nothing free.

**Exit gate:** a month of availability for one treatment renders in **one**
query, and the interleaving case demonstrably yields more slots than the naive
one — asserted as a number, not observed.

---

### BOOK2 · Hold, confirm, expire

**Files:** `booking.service.ts`, `booking.actions.ts`, integration tests

- [ ] `holdSlot` — inserts a `held` appointment with `expires_at` ten minutes out.
      A constraint violation is **caught and returned as `slot-taken`**, never
      thrown.
- [ ] `confirmAppointment` — idempotent on a derived key. Where
      `deposit_rials = 0`, confirms immediately (`BOOK-D14`); otherwise waits on a
      settled deposit `payment`.
- [ ] `requires_prior_visit` enforced, returning `consultation-required`
      (`BOOK-D19`).
- [ ] `expireHeldSlots` sweeper.
- [ ] **Every rejection is a value, never a throw.** The full table is
      `booking.md` §8.

**Exit gate:** two simultaneous holds on the last slot produce **exactly one**
`held` appointment, proved against real PostgreSQL — and removing the constraint
makes the test fail. Modelled on the cart's oversell proof.

---

### BOOK3 · Customer surfaces

**Files:** `screens/`, `components/`, the routes in §4

The block's largest packet, and the reason it exists.

#### 3.1 `/book` — the treatment list

Grouped by concern, not by clinical name. Each card: name, duration, price,
one-line summary. Consultations are a distinguished group, not mixed in.

**States:** loading (`skeleton`) · nothing published (`empty-state`) · read failed.

#### 3.2 `/book/s/[slug]` — the treatment, and its times

Above the fold: name, duration, price, one-line summary, and the day strip.
Below: what it is, what to expect, preparation, aftercare, and the cancellation
rule **stated before booking, not after cancelling** (`BOOK-D8`).

The picker per §3.1: day strip → time list → a submit that holds the slot.

**States, all designed rather than defaulted:**

| State | What is shown |
|---|---|
| Day has times | The list |
| Day is closed | The day disabled in the strip with the reason — a holiday names itself |
| Day is open, nothing free | Not an empty box. The next three days that do have times, plus the waiting list |
| Nothing free for weeks | The waiting list, prominently, with the earliest real date |
| First-time client, gated treatment | The short consultation offered in place of the picker (`BOOK-D19`) |
| Series, too soon for the next session | The earliest permitted date, with the reason (`BOOK-D20`) |

#### 3.3 `/book/confirm/[id]` — intake, summary, confirm

- [ ] The intake form, from the versioned question set, `form` + `radio-group` +
      `checkbox`, Zod-parsed against the question version.
- [ ] A **blocking answer blocks confirmation**, explains why, and offers a
      consultation instead of the treatment (`BOOK-D10`).
- [ ] The ten-minute timer, visible, with what happens at zero said in words.
- [ ] Expiry while the form is open is a designed state, not a crash: the hold is
      gone, the slot is re-offered if still free.
- [ ] Health answers never appear in a notification body (`BOOK-D10`).

#### 3.4 `/account/appointments` and `/account/appointments/[id]`

Upcoming and past. Each upcoming one offers reschedule and cancel, with the
policy restated.

- [ ] **Reschedule is one operation** (`BOOK-D9`). A failed reschedule leaves the
      original intact — proved by test, because the failure mode is a customer
      holding neither slot.
- [ ] Cancel shows the consequence **before** confirming, per `BOOK-D16`'s tiers.

#### 3.5 `/account/series/[id]`

Sessions bought, used, remaining, expiry date, and a book-the-next action that
respects `min_days_between_sessions`.

#### Contract for every screen in BOOK3

- **Works with JavaScript disabled.** Day selection is a `GET`; every mutation is
  a form `POST` to a Server Action. Enhancement is enhancement.
- **RTL first.** Logical properties only — `ms-`/`me-`/`ps-`/`pe-`, never
  `ml-`/`mr-`. The day strip scrolls right-to-left in Persian.
- **Jalali throughout**, from `src/lib/jalali.ts`. No second date library.
- **The shell offset**, per `shell-offset.test.ts`. No screen adds its own `ms-14`.
- **Motion** only through `src/lib/motion/choreography.ts`, per `M-4`.

**Exit gate:** a booking completed in a browser at 390, 768 and 1440, in Persian,
**with JavaScript disabled**, from list to confirmation — with no payment provider
in existence.

---

### BOOK4 · Intake, cancellation, rescheduling, waitlist

**Files:** `booking.service.ts` extensions, `intake` models, tests

- [ ] Versioned intake; a response records the version it answered.
- [ ] Cancellation under `BOOK-D16`: over 24h free; 12–24h free once, with a
      second inside 90 days moving the client down a tier; under 12h retained as
      90-day credit. **No refund path is called.**
- [ ] Reschedule in one transaction, constraints adjudicating the new range.
- [ ] `waitlist_entry`, the offer on release, and a claim window short enough that
      one slot is not promised to five people.
- [ ] `expireWaitlistClaims`.

**Exit gate:** a cancellation inside the window releases the slot and offers it to
the first matching waitlist entry; outside the window the same happens and the
deposit — when one exists — becomes credit rather than a refund.

---

### BOOK5 · The staff day

**Files:** `(admin)/admin/bookings/…`, absorbing `back-office.md`'s `BO6`

**Phone first.** This screen is read standing at the front desk. It is the second
of the two screens in the whole system that is designed for a phone before a
desktop.

- [ ] A column per working person, time down the side, appointments as blocks
      carrying client, treatment and status. **Beds as a second band**, because a
      day can be practitioner-free and bed-bound (`BOOK-D1`).
- [ ] Actions: `createAppointmentForCustomer` (the telephone booking that will
      not stop happening, and the mechanism by which a consultation converts to a
      treatment without the client booking twice — `BOOK-D19`), `markCompleted`,
      `markNoShow`, `blockTime`.
- [ ] Reschedule **by form first**. Drag on a phone is unreliable; drag is an
      enhancement on desktop or it is nothing.
- [ ] The week view for planning.
- [ ] `/admin/bookings/holidays` — `upsertHoliday`, per `BOOK-D6`.
- [ ] Status carries **shape as well as colour** (`back-office.md` §4.2).
- [ ] Every staff action re-checks the role **inside the action**, never inferring
      it from the page having rendered.
- [ ] Every mutation writes an `audit_log` row.

**Exit gate:** a full day is run from the screen — a walk-in booked, a client
completed, a no-show marked, an hour blocked — without a database client, on a
390-wide viewport.

---

### BOOK6 · Reminders, and the drills

Depends on the notification worker from `35-plan-review-and-resequencing.md` §7.1.

- [ ] `sendAppointmentReminders`, 24 hours out, through the outbox — **never
      inline** (`BOOK-D12`).
- [ ] Waitlist offers through the same path.
- [ ] Failure drills, run and recorded: an expired hold; a deposit that never
      settles; a practitioner calling in sick, releasing a whole day.

**Exit gate:** a reminder sends **exactly once** per appointment across a worker
restart, and cancelling a practitioner's day re-offers every affected slot to the
waiting list.

---

### BOOK7 · Verification and rollout

- [ ] The five gates green: `tailwind-candidates`, `locale-prefix`, `url.guard`,
      `shell-offset`, `route-status`.
- [ ] Every new route returns the right status — a foreign appointment id is 404,
      not 403.
- [ ] SSR verified: the treatment list and detail carry their content in the
      **served HTML**, not only after hydration. This is the `R-10` failure and it
      is easy to reintroduce.
- [ ] Structured data via `localeUrl()`, never a hand-built `/fa/`.
- [ ] Axe pass on all customer screens; keyboard-only booking completed end to
      end; the time list reachable and announced.
- [ ] Browser pass at 390, 768, 1440 in fa, en and ar.

**Exit gate:** the whole of `36-booking-in-plain-english.md` is true of the
running application.

---

## 6. Flows, in full

### 6.1 New client, gated treatment

Treatment list → detail → `consultation-required` → short consultation offered →
day strip → time → hold → intake → confirm → confirmation → **at the visit, she
books the treatment from the day view**, so the client never books twice.

### 6.2 Returning client

Detail → day → time → hold → intake (pre-filled from the last response, editable)
→ confirm.

### 6.3 Losing the race

Time chosen → `slot-taken` → the slot greys out, the grid refreshes, three
alternatives are offered inline. **Not an error page.** This is a normal outcome
and it must feel like one.

### 6.4 Hold expires mid-form

Timer reaches zero → the state is explained, the slot re-offered if still free,
the intake answers preserved so nothing is retyped.

### 6.5 Blocking contraindication

Intake submitted → `contraindicated` → explained in her words, consultation
offered, the hold released rather than left to rot.

### 6.6 Cancellation and the waitlist

Cancel → the tier and its consequence shown → confirmed → slot released → offered
to matching waitlist entries in order, each with a claim window → first claim
wins, the rest are told plainly.

### 6.7 Reschedule

New time chosen → one transaction → on constraint violation **nothing moves** and
the original is still theirs, said explicitly.

### 6.8 Series

Purchased (by staff, until deposits exist) → balance visible → session booked →
next session refused before `min_days_between_sessions` with the earliest date
given → a cancelled session returns to the balance.

---

## 7. Definition of done for the block

1. Every packet's exit gate met, with its evidence in the ledger.
2. Every screen has a designed loading, empty and failure state — **the "nothing
   matching" state most of all**, which is the most common and the most often
   forgotten.
3. The five gates green.
4. A booking completed with JavaScript disabled.
5. A day run entirely from the staff screen on a phone.
6. No payment provider, no SMS account and no business registration involved
   anywhere.
7. Every judgement needing the maintainer's attention captured in the packet
   review log.

---

## 8. What comes back after this block

The data pass, on the maintainer's instruction: the real treatments, their
durations and stages, which are series and their spacing, deposit amounts,
consultation prices, and the intake questions in her wording. Every one of those
is a value in a column this block will have built — none of them is a schema
change, and none of them is a screen change.

That is the whole reason for building in this order.
