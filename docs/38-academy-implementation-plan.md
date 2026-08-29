# Academy — the implementation plan

**Date:** 2026-08-29
**Status:** Buildable. Authorises implementation of `ACAD0`–`ACAD5`.
**Specifies:** foundations, routes, screens, components, flows, states, behaviours,
tests and exit gates
**Companions:** [`system-design/academy.md`](system-design/academy.md) — the decisions
(`ACAD-D1`…`ACAD-D13`); [`37-booking-implementation-plan.md`](37-booking-implementation-plan.md) —
the same shape for Booking, and the source of the six shared primitives
**Governs:** `35-plan-review-and-resequencing.md` §9.4 block 3

---

## 0. Scope, and one revision to an earlier judgement

**In:** the course catalogue, dated cohorts with capacity and a waiting list,
enrolment paid through the **existing bank-transfer path**, certification with
public verification, the staff screens that run a cohort, and the practitioner
role grant that is the strategic reason this context exists.

**Deferred, and each for its own reason:**

| Deferred | Why |
|---|---|
| Recorded lessons, VOD, watermarking (`ACAD4` in the design doc) | Largest build in Academy, least validated, and blocked on a provider decision that has no answer |
| Attendance screens | One consumer — the completion rule — and a paper register does it for the first cohort |
| Instalment screens | Substantial payment-layer work. **Their tables ship anyway**, per `ACAD-D13` |
| Packages and mentorship | Cross-context redemption. Nothing is waiting on it |

**Deferred to the later data pass**, as with Booking: the real course list,
syllabi, prices, dates, capacities, prerequisites, certificate wording and
graduate outcomes. **Columns and behaviour ship here; values arrive after.**

### 0.1 The revision

`35-plan-review-and-resequencing.md` §9.3 deferred attendance, certificates **and**
instalments together as "operational machinery". That was one judgement applied
to three unlike things, and it was wrong about the middle one.

The certificate is not machinery — **it is the product**. In this market the
certificate is frequently the reason somebody enrols at all. Selling a course on
the promise of one and then producing it by hand in Word makes the site a
catalogue with a claim attached. And it is a small build: a table, a random code,
a staff action, one public route. It stays. `ACAD-D13` records this.

---

## 1. What already exists, and must be reused

`37-booking-implementation-plan.md` §1 is the full inventory and is not repeated.
Academy specifically leans on:

| What | Where | Note |
|---|---|---|
| The six primitives | `BOOK-UI` | `form`, `radio-group`, `select`, `popover`, `tabs`, `table`. **Academy adds none.** If Academy runs first, `BOOK-UI` runs first |
| Bank transfer, end to end | `src/modules/payment/bank-transfer.service.ts` | `submitClaim`, settlement, rejection. Built and working since packet 15 |
| Jalali | `src/lib/jalali.ts` | Cohort dates are date ranges, not time slots — simpler than Booking's |
| Money, idempotency, media, navigation, preview | `src/lib/…` | As `37` §1.3 |
| Professional pricing | `product.isProfessionalOnly`, `priceVisibility`, `customerGroup` | **Already in the catalogue schema.** `ACAD-D10`'s role grant is what fills them |
| Module shape | `src/modules/commerce`, `cart`, `checkout` | Copy exactly |

### 1.1 The thing that makes Academy different from Booking

**Academy can take real money today.** Bank transfer with staff verification is
built and proven. Booking launches with `deposit_rials = 0` because deposits were
its only money path; Academy has no such constraint — a student can enrol, pay by
transfer, upload a receipt, and be confirmed, with no gateway and no registration.

That makes Academy the first context on this site that completes a real
commercial transaction end to end.

---

## 2. Three decisions this plan makes

### 2.1 A seat is held for 48 hours, not ten minutes

`ACAD-D2` says "a `held` enrolment with a TTL", by analogy with the cart. The
analogy breaks. A cart hold covers a payment that settles in seconds; a cohort
seat covers a bank transfer that a person reconciles against a statement the next
morning. Ten minutes releases every seat before anyone can pay for one.

`cohort.hold_hours`, default 48. The seat counts against capacity while held,
because a seat that does not count is not held. The abuse case — a hold that
never pays, turning away a real student — is handled by people: staff release a
held seat from the cohort screen, the waitlist is offered the instant a hold
lapses, and held seats are listed on the cohort screen rather than buried.

Recorded as `ACAD-D11`.

### 2.2 The payment table gains both aggregates in one migration

Booking adds `appointment_id`; Academy adds `enrolment_id`. Written by two
packets they become two one-aggregate checks that disagree. **Whichever of `BOOK0`
or `ACAD0` lands first owns the whole migration**, including the two existing
objects that assume `order_id` is not null — `payment_id_order_unique` and
`payment_order_time_idx`. Recorded as `ACAD-D12`, with the SQL.

### 2.3 The cohort page is ordered by outcome, not by content

`academy.md` §10b is right that the buying decision here is career-shaped rather
than product-shaped, and the section order has to follow. A course page that opens
with a syllabus is answering a question nobody asked first.

The order is: **what you will be able to do → who it is for and who it is not →
the dates and how many seats are left → what the certificate is worth → the
syllabus → the instructor → where graduates are now → the price and how to pay.**

"Where graduates are now" is the strongest section on the page and the hardest to
fill, which is why it is a named content item in the intake brief rather than a
sentence in a syllabus.

---

## 3. Route map

| Route | Group | Who | Screen |
|---|---|---|---|
| `/academy` | storefront | anyone | Course catalogue and upcoming cohorts |
| `/academy/c/[slug]` | storefront | anyone | Course, with its dated runs |
| `/academy/cohort/[id]` | storefront | anyone | One dated run — the page that sells |
| `/academy/enrol/[cohortId]` | storefront | signed in | Hold a seat, then pay |
| `/academy/enrol/confirm/[id]` | storefront | owner | Transfer details, receipt upload |
| `/academy/waitlist/[cohortId]` | storefront | signed in | Join, with position |
| `/account/learning` | account | owner | My courses |
| `/account/learning/[id]` | account | owner | One enrolment, and its certificate |
| `/verify/[code]` | storefront | **public, no session** | Certificate verification |
| `/admin/academy/cohorts` | admin | staff | Cohorts and their state |
| `/admin/academy/cohorts/[id]` | admin | staff | Roster, held seats, waitlist, sessions |
| `/admin/academy/enrolments` | admin | staff | Across cohorts, by payment state |
| `/admin/academy/certificates` | admin | staff | Issue, list, supersede |

`/academy` is the catalogue in this block. The marketing hub in
`public-surfaces.md` §6.3 replaces it later and is not in scope.

---

## 4. The packets

Each ends with a review-log section and a ledger row, per `8.10`.

---

### ACAD0 · Schema, capacity, and the payment migration

**Files:** `src/lib/db/schema/academy.ts`, a migration, seeds, schema contract test

- [ ] `course`, `course_translation`, `cohort`, `cohort_instructor`,
      `cohort_session`, `enrolment`, `certificate`, `cohort_waitlist`.
- [ ] `instalment_plan` and `instalment` **created and left unused**, per
      `ACAD-D13`. Adding them after enrolments exist is a migration over live
      money.
- [ ] `cohort.hold_hours`, default 48 (`ACAD-D11`).
- [ ] The three-way payment aggregate (`ACAD-D12`) — **or a check that `BOOK0`
      already did it**, never a second attempt.
- [ ] `module` and `lesson` are **not** created. They exist only for video, which
      is deferred, and an unused table with no decision behind it is clutter.
- [ ] Development fixtures: two courses, one certifying with a prerequisite and
      one not; two cohorts, one with seats and one full; two instructors on one
      cohort with a sponsoring brand, because `ACAD-D3` says the real posters
      already look like that. **Fenced to the demo profile and labelled.**

**Exit gate:** migrated from zero, seeded twice. Every foreign key indexed, proved
by query. The one-aggregate check proved by three inserts that succeed and one
that names two aggregates and is refused.

---

### ACAD1 · Catalogue, and the collision with Booking

**Files:** `academy.reads.ts`, `screens/`, `components/`

- [ ] `listCourses`, `getCourse`, `listCohorts`, `getCohort` — published and
      review-approved only, through `resolveDraftPreview()`.
- [ ] `/academy`, `/academy/c/[slug]`, `/academy/cohort/[id]`, at Phase B's
      density, dates in Jalali.
- [ ] Multiple instructors and the sponsoring brand rendered **from the first
      version**, per `ACAD-D3` — not added later, which is a migration plus every
      screen that assumed one name.
- [ ] Seats remaining shown, computed from confirmed **plus held** enrolments.
- [ ] The section order from §2.3.
- [ ] **`BOOK-D18`:** confirming a cohort session writes an
      `availability_exception` for every instructor, through a narrow published
      Booking function — Academy never writes Booking's tables. Moving or
      cancelling a session withdraws it.

**States:** loading · no cohorts scheduled (offer the waiting list, do not show an
empty page) · cohort full · cohort finished · read failed.

**Exit gate:** a real course from a real poster renders with its co-instructors
and sponsor. **And** a confirmed cohort session makes its instructors unbookable
for that window — the collision that would otherwise have booked a facial in the
middle of a workshop.

---

### ACAD2 · Enrolment, capacity, waitlist, payment

**Files:** `academy.service.ts`, `academy.actions.ts`, integration tests

- [ ] `holdSeat` — `SELECT capacity FROM cohort FOR UPDATE`, count held and
      confirmed, reject if full, insert `held` with `expires_at` from
      `hold_hours`. **The lock is what makes it true.**
- [ ] `confirmEnrolment` — idempotent on a derived key, on settlement of a
      `payment` whose aggregate is the enrolment.
- [ ] **Payment through the existing bank-transfer path**: expected amount,
      reference, receipt upload, staff settlement. No new money code.
- [ ] `prerequisite-missing` enforced for certifying courses.
- [ ] `joinCohortWaitlist`, with position; offered on expiry or release.
- [ ] `withdraw`.
- [ ] `expireHeldSeats` sweeper.
- [ ] Every rejection is a value: `cohort-full`, `already-enrolled` (returns the
      existing enrolment), `prerequisite-missing`, `hold-expired`.

**Exit gate:** two simultaneous holds on the last seat produce **exactly one**
held enrolment against real PostgreSQL, and removing the `FOR UPDATE` makes the
test fail. A student enrols, transfers, uploads a receipt, is settled by staff and
reaches `confirmed` — **the first complete commercial transaction on this site.**

---

### ACAD3 · Certification and public verification

**Files:** `certificate` service, `/verify/[code]`

- [ ] `issueCertificate` from a **staff-confirmed** completion (`ACAD-D13`) — not
      a computed attendance threshold, which does not exist in this block.
- [ ] Codes **random and long**, never sequential. Anybody can load this page with
      a guess.
- [ ] `holder_name_snapshot` and `course_name_snapshot` written at issue. A
      certificate is a historical document and a later rename must not silently
      rewrite it — the same reasoning as `order_line`.
- [ ] Immutable. A correction is `supersedeCertificate` — a **new number**, the
      old one marked superseded. Never an edit.
- [ ] `/verify/[code]`: no session, holder name and course and date and status and
      **nothing else**, aggressively rate-limited, `noindex`.
- [ ] `certificate-not-found` is **indistinguishable from a malformed code**, so
      the page cannot be used to probe which codes exist.

**Exit gate:** a certificate issued from a real enrolment verifies at a public
URL; a superseded one says so rather than disappearing; and a thousand guessed
codes are rate-limited rather than answered.

---

### ACAD4 · The staff screens, and the practitioner loop

**Files:** `(admin)/admin/academy/…`, absorbing `back-office.md`'s `BO7`

- [ ] **Cohorts:** list with course, dates, capacity, enrolled, held, waitlisted.
      Detail with roster, sessions, instructors, sponsor.
- [ ] **Release a held seat** — one action from the cohort screen, per `ACAD-D11`.
      It is the mitigation for the only abuse this design permits, so it is not
      buried in an edit form.
- [ ] **Enrolments** across cohorts, filterable by payment state.
- [ ] **Certificates:** issue, list, supersede.
- [ ] **`grantPractitionerRole`** — explicit, staff-confirmed, re-authenticated,
      audited (`ACAD-D10`). It changes what somebody may buy and at what price, so
      it is never automatic.
- [ ] Role re-checked **inside every action**. Every mutation writes `audit_log`.
- [ ] Density at its most compact, per `BO-D1`. Status carries shape as well as
      colour.

**Exit gate:** a cohort is run from the screens — enrolments seen, a stale hold
released, the waitlist offered, a certificate issued — with no database client.
**And** a certified graduate is granted the role, then sees professional prices in
the shop and buys at them. That is `ACAD-D10`'s loop closed, and it is the
business reason this context exists.

---

### ACAD5 · Verification and rollout

- [ ] The five gates green.
- [ ] `/verify/[code]` returns 404 for an unknown code, never 403, and is
      `noindex`.
- [ ] A foreign enrolment id is 404, not 403.
- [ ] SSR verified: the catalogue and cohort pages carry their content in the
      **served HTML**. The `R-10` failure is easy to reintroduce.
- [ ] `Course` structured data via `localeUrl()`, never a hand-built `/fa/`.
- [ ] Axe pass; keyboard-only enrolment completed; seats-remaining announced.
- [ ] Browser pass at 390, 768, 1440 in fa, en and ar, **with JavaScript
      disabled** for the enrolment flow.

---

## 5. Flows, in full

### 5.1 Enrolling

Catalogue → course → cohort → seats remaining → **sign in if not** → hold seat
(48 hours) → transfer details with the expected amount → transfer → upload
receipt → staff settle → confirmed → appears in `/account/learning`.

### 5.2 Losing the last seat

Hold attempted → `cohort-full` → the waiting list offered inline with the position
they would take. **Not an error page.**

### 5.3 The hold that never pays

48 hours elapse → seat released → the first waitlist entry is notified → or staff
release it earlier from the cohort screen because the student said they had
changed their mind.

### 5.4 Prerequisite missing

Certifying course, no prior certificate → `prerequisite-missing` → the
prerequisite course named and linked, with its next dates.

### 5.5 Finishing

Cohort ends → staff confirm completion → certificate issued with a code → it
appears in `/account/learning/[id]` → the graduate shows the code to a client or
an employer, who loads `/verify/[code]`.

### 5.6 Becoming a professional customer

Certificate issued → staff grant the `practitioner` role, re-authenticated →
professional prices become visible → the graduate places a wholesale order through
the shop that already exists.

---

## 6. Definition of done

1. Every packet's exit gate met, with evidence in the ledger.
2. Every screen has a designed loading, empty and failure state.
3. The five gates green.
4. An enrolment completed with JavaScript disabled.
5. A cohort run entirely from the staff screens.
6. **A real payment taken** through the existing bank-transfer path — no gateway,
   no SMS account, no registration.
7. The practitioner loop closed: certificate → role → professional price → order.
8. Every judgement needing the maintainer's attention in the packet review log.

---

## 7. The one question that genuinely blocks this

**The refund policy for a cohort** — before it starts, after the first session,
after the last. Question 27, unanswered.

It matters more here than in Booking because the amounts are large and the cohort
is dated: a student who withdraws two days before a course starts is a seat that
cannot be resold in time. It must be stated on the cohort page **before** payment,
in the same way `BOOK-D8` insists the cancellation rule is shown before booking.

A defensible default, if she has no view: full refund up to fourteen days before
the start; half up to the start; nothing after the first session, with the seat
transferable to the next cohort at her discretion. **Hers to set — this is
customer relations, not engineering.**

Everything else — course list, syllabi, prices, dates, capacities,
prerequisites, certificate wording, graduate outcomes — is a value in a column
this block builds, and arrives in the data pass.
