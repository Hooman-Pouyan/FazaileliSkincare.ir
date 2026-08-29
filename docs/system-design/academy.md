# Academy - phased implementation plan

**Amended by [`../../35-plan-review-and-resequencing.md`](../../35-plan-review-and-resequencing.md)** (2026-08-29): `ACAD4` (recorded lessons, VOD, watermarking) is deferred until a provider is chosen and demand is demonstrated; instalments remain here, at the payment layer, and are cut from shop v1 (F-20).

**Status:** Review-ready; no runtime implementation is authorized by this document
**Updated:** 2026-08-27
**Scope:** Courses, in-person cohorts, recorded lessons, enrolment and instalments, attendance, certification, packages, and mentorship
**Depends on:** [`../03-domain-model.md`](../03-domain-model.md) §4, [`booking.md`](booking.md) (mentorship reuses its scheduler), [`cart-checkout-payment-fulfilment-and-returns.md`](cart-checkout-payment-fulfilment-and-returns.md) (the payment path)
**Decision inputs:** [`../00-decision-map.md`](../00-decision-map.md); the institute's real course posters, which already carry venue, sponsoring brand and co-instructors

---

## 1. Goal and stopping boundary

**The job.** Turn the teaching that already happens into a product with
enrolment, payment, attendance and a certificate that means something - and
close the loop where a graduate becomes a practitioner-tier customer.

**Why it matters more than its revenue.** Academy sits at the top of the
relationship ladder. A student pays tuition once and then buys professionally for
years, at a customer-acquisition cost of zero. The `practitioner` role,
`is_professional_only`, `price_visibility` and `customer_group` already exist in
the catalogue schema. Academy is what fills them.

**In scope.** Course catalogue; dated in-person cohorts with venue, capacity,
waitlist, sponsoring brand and multiple instructors; recorded modules and
lessons; enrolment with instalments; attendance; certificates verifiable at a
public URL; packages that bundle across contexts; mentorship booked through
`booking.md`.

**Out of scope, deliberately.**

- **A second scheduler.** Mentorship is `service.kind = 'mentorship'` in Booking.
  This is stated in `../03-domain-model.md` §4 and repeated here because it is
  the most tempting mistake in this context.
- **A learning-management system.** No quizzes, no forums, no grading rubric.
  Attendance and completion are the assessment; Mahdieh is the teacher.
- **Video hosting.** `ACAD-D5` makes this a vendor boundary, not something built.
- **Public student directories.** Certificate verification is by code, not by
  browsable list - see `ACAD-D8`.

**Stopping boundary.** No runtime implementation is authorized. `§10` lists what
the maintainer must answer first.

---

## 2. Launch decisions

### ACAD-D1 - In-person cohorts ship before recorded courses

A dated run with a capacity, a venue and instructors is **simpler** than video,
monetises higher, cannot be pirated, and is what the institute already
advertises. Recorded courses need a VOD vendor, a piracy posture and a refund
policy that a downloadable asset makes awkward.

Building the cohort first also means the certificate, attendance and enrolment
machinery is exercised by a real event before video is added on top of it.

### ACAD-D2 - Cohort capacity is enforced with the same rigour as booking overlap

Two people paying for the last seat is the same class of bug as two carts buying
the last bottle. A count-then-insert does not survive concurrency.

Enforcement is a `held` enrolment row plus a partial unique count check inside a
transaction that locks the cohort row:

```sql
SELECT capacity FROM cohort WHERE id = $1 FOR UPDATE;
-- count enrolments in ('held','confirmed'); reject if >= capacity
```

Row-locking the cohort is sufficient here and simpler than an exclusion
constraint, because capacity is a scalar rather than an interval. The lock is
what makes it true, and the integration test proves it by removing the lock.

### ACAD-D3 - A cohort has many instructors and may have a sponsoring brand

Both are on the real posters today - the O2White workshop is a Storyderm event
with co-teachers. Modelling one instructor and adding a second later is a
migration plus a rewrite of every screen that assumed a single name.

`cohort_instructor` is a join table from the first migration.
`cohort.sponsor_brand_id` is nullable and references the existing `brand`.

### ACAD-D4 - Enrolment supports instalments from the first migration

Course fees are large relative to income and Iranian inflation makes lump sums
painful; instalments are expected rather than generous. `../03-domain-model.md`
§4 already says model it now.

An `instalment_plan` has ordered `instalment` rows, each of which settles through
the **existing** `payment` path. Access is gated on plan state, not on the last
payment: a student who has paid two of three instalments is enrolled and
attending, and a missed instalment is a staff conversation, not an automatic
lockout.

This is the same instalment machinery the shop wants for large baskets, which is
an argument for building it at the payment layer where both can use it.

### ACAD-D5 - Video is a vendor boundary, and never served from this origin

The invariant from the domain model stands: signed URLs with a short TTL, never a
file on this server. Practically, in Iran this means an Iranian VOD provider -
foreign platforms are unreliable or unreachable, and a course that will not play
is a refund.

`lesson.asset_ref` holds a provider key, never a URL and never a file. The
provider sits behind a `VideoProvider` interface the way `PaymentGateway` does in
`COM-D9`, so switching vendors is one adapter.

### ACAD-D6 - Recorded courses will be pirated; the posture is deterrence, not prevention

Telegram resale of paid Iranian courses is routine. Watermarking each stream with
the student's name and phone, limiting concurrent sessions and issuing short-TTL
URLs raise the cost and make leaks traceable. None of them are complete, and
pretending otherwise would set the price and the roadmap wrongly.

**This is the strongest argument for `ACAD-D1`.** In-person teaching is the
product; video is a supplement that raises the value of a cohort rather than
replacing it.

### ACAD-D7 - Attendance is recorded per session, on a phone, possibly offline

It feeds certification, so it has to be accurate; it happens in a classroom, so
it has to be fast and forgiving. The screen is a list of names with large tap
targets, it works on a phone, and it tolerates being submitted late.

### ACAD-D8 - Certificates are immutable, numbered, and verifiable by code at a public URL

A graduate shows a client or an employer a code that resolves on fazaieli.ir.
That is what makes certification worth paying for rather than a PDF anyone could
produce.

Immutable once issued: a correction is a **re-issue with a new number** and the
old one marked superseded. The public verification page shows the holder's name,
the course, the date and the status - and nothing else, because it is a page
anyone can load with a guessed code. Codes are therefore random and long, not
sequential.

### ACAD-D9 - A package prices independently of its parts and never imports another context's types

A package may bundle a course, a product kit and mentorship hours. The bounded
context rule in `../03-domain-model.md` §1 says Commerce, Booking and Academy
never import each other's types.

So `package_item` stores `kind` (`course` / `cohort` / `product_variant` /
`service`) plus an id and a **snapshotted title and price at the time of
bundling**. Redemption dispatches through a thin resolver that each context
registers with. A package is a manifest, not a join across three schemas.

### ACAD-D10 - Enrolment grants a role, and that is the point

Completing a certifying course grants the `practitioner` role, which switches on
professional pricing and `is_professional_only` products.

**Granting is explicit and staff-confirmed**, never automatic on the last
attendance tick: the role changes what somebody may buy and at what price, and
that decision belongs to a person.

### ACAD-D11 - A cohort seat is held for days, not minutes, because bank transfer is asynchronous

`ACAD-D2` specifies a `held` enrolment "with a TTL", by analogy with the cart and
with `BOOK-D4`. Both of those hold for ten minutes, and **ten minutes is wrong
here.**

A cart hold covers a card payment that settles in seconds. A cohort seat covers
an Iranian bank transfer: the student transfers, uploads a receipt, and a person
reconciles it against a statement - hours later, or the next morning. A
ten-minute TTL would release every seat before anybody could pay for one.

`cohort.hold_hours`, defaulting to **48**. The seat counts against capacity while
held, because a seat that does not count is not held.

The risk this creates is real and is handled by people rather than by a timer: a
student holds a seat and never pays, and a genuine student is turned away. So
staff can release a held seat from the admin at any time, the waitlist is offered
the moment a hold expires or is released, and the held-seat list is visible on
the cohort screen rather than buried.

### ACAD-D12 - The payment aggregate becomes three-way, in one migration, done once

`BOOK-D5` adds `appointment_id` to `payment`. Academy needs `enrolment_id` on the
same table. Done as two migrations by two packets, the one-aggregate check is
written twice and will disagree.

**One migration owns this**, in whichever of `BOOK0` or `ACAD0` lands first, and
it does the whole job:

```sql
ALTER TABLE payment ALTER COLUMN order_id DROP NOT NULL;
ALTER TABLE payment ADD COLUMN appointment_id uuid REFERENCES appointment(id);
ALTER TABLE payment ADD COLUMN enrolment_id  uuid REFERENCES enrolment(id);
ALTER TABLE payment ADD CONSTRAINT payment_one_aggregate_check CHECK (
  (order_id IS NOT NULL)::int
+ (appointment_id IS NOT NULL)::int
+ (enrolment_id IS NOT NULL)::int = 1);
```

Two existing objects assume `order_id` is not null and must be revisited in the
same migration rather than discovered later: the unique index
`payment_id_order_unique` on `(id, order_id)`, and `payment_order_time_idx`.
Postgres does not treat two nulls as conflicting, so the unique index will not
break - but it stops meaning what it says, and a partial index `WHERE order_id IS
NOT NULL` is what was intended.

`settleOrder` in `bank-transfer.service.ts` is order-shaped today. It gains a
sibling per aggregate, or a branch - **not a second settlement path**, per
`COM-D8`.

### ACAD-D13 - Certification stays in the first block; attendance and instalments do not

Revising `35-plan-review-and-resequencing.md` §9.3, which deferred all three
together. That was one judgement applied to three different things.

**Certification stays.** `ACAD-D8` is right that a code resolving on fazaieli.ir
is what makes certification worth paying for. A course sold on the promise of a
certificate, whose certificate is then produced by hand in Word, is a catalogue
with a claim attached. And the build is genuinely small: a table, a random code,
a staff action and one public route.

**Attendance goes.** Its only consumer is the completion rule, and for one cohort
a register on paper is sufficient. `issueCertificate` therefore takes a
staff-confirmed completion rather than a computed attendance threshold - which
`ACAD-D8` already permits, since issuing is a person's decision.

**Instalments go, but their tables stay.** `ACAD-D4` is right that retrofitting
them is painful, so `instalment_plan` and `instalment` are created in `ACAD0` and
left unused. Schema now, screens later. The cost of the empty tables is nothing;
the cost of adding them after enrolments exist is a migration over live money.

---

## 3. Database contract

### 3.1 New tables

| Table                | Purpose and notable columns                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `course`             | `slug`, `kind` (`in_person`/`online`/`hybrid`), `level`, `is_certifying`, `is_published`, `review_state`                                    |
| `course_translation` | `locale_code`, `name`, `summary`, `outcomes`, `prerequisites`, `audience`                                                                   |
| `cohort`             | `course_id`, `starts_on`, `ends_on`, `city`, `venue`, `capacity`, `price_rials`, `deposit_rials`, `sponsor_brand_id`, `status`              |
| `cohort_instructor`  | `cohort_id`, `person_id`, `role` (`lead`/`assistant`) - `ACAD-D3`                                                                           |
| `cohort_session`     | `cohort_id`, `sort_order`, `starts_at`, `ends_at`, `topic` - the individual class days                                                      |
| `module`             | `course_id`, `sort_order`, translations                                                                                                     |
| `lesson`             | `module_id`, `sort_order`, `minutes`, `asset_ref`, `is_preview` - `ACAD-D5`                                                                 |
| `enrolment`          | `person_id`, `course_id`, `cohort_id` (nullable for self-paced), `status`, `enrolled_at`, `completed_at`, `idempotency_key`, `request_hash` |
| `instalment_plan`    | `enrolment_id`, `total_rials`, `instalment_count`, `status`                                                                                 |
| `instalment`         | `plan_id`, `sort_order`, `due_on`, `amount_rials`, `payment_id`, `status`                                                                   |
| `attendance`         | `cohort_session_id`, `enrolment_id`, `state` (`present`/`absent`/`late`/`excused`), `recorded_by`, `recorded_at`                            |
| `certificate`        | `enrolment_id`, `number`, `verification_code`, `issued_on`, `issued_by`, `superseded_by`, `holder_name_snapshot`, `course_name_snapshot`    |
| `lesson_progress`    | `enrolment_id`, `lesson_id`, `seconds_watched`, `completed_at`                                                                              |
| `package`            | `slug`, `price_rials`, `is_published`, translations                                                                                         |
| `package_item`       | `package_id`, `kind`, `target_id`, `title_snapshot`, `price_snapshot`, `quantity` - `ACAD-D9`                                               |
| `package_purchase`   | `person_id`, `package_id`, `payment_id`, `redeemed_items` (jsonb)                                                                           |
| `cohort_waitlist`    | `cohort_id`, `person_id`, `position`, `notified_at`                                                                                         |

**Enums.** `enrolment_status`: `held`, `confirmed`, `active`, `completed`,
`withdrawn`, `cancelled`. `course_kind`, `attendance_state`, `instalment_status`,
`package_item_kind` as above.

**Snapshots are deliberate.** `certificate` carries the holder and course name as
they were at issue, because a certificate is a historical document and a later
rename must not silently rewrite it - the same reasoning as `order_line`.

---

## 4. Module and file boundaries

```
src/modules/academy/
  academy.ownership.ts    student, instructor, staff
  academy.reads.ts        catalogue, cohort detail, my learning
  academy.service.ts      enrol, hold seat, record attendance, issue certificate
  academy.actions.ts      Server Actions, Zod-parsed
  packages.service.ts     bundling and redemption dispatch
  video/                  the VideoProvider interface and its adapter
  models/ components/ screens/ utils/
```

Academy imports nothing from Commerce or Booking. Mentorship enrolment calls the
Booking module through a narrow published function, not by reaching into its
tables.

---

## 5. Reads, mutations, and routes

### 5.1 Reads

`listCourses`, `getCourse`, `listCohorts`, `getCohort`, `listMyLearning(viewer)`,
`getLessonPlayback(viewer, lessonId)` - which mints a short-TTL signed URL and is
the only place that touches the provider - and `verifyCertificate(code)`, the one
public unauthenticated read in this context.

### 5.2 Student actions

`holdSeat`, `confirmEnrolment`, `payInstalment`, `markLessonProgress`,
`joinCohortWaitlist`, `withdraw`.

### 5.3 Staff and instructor actions

Role re-checked inside every action. `recordAttendance` (bulk, per session),
`issueCertificate`, `supersedeCertificate`, `openCohort`, `closeCohort`,
`grantPractitionerRole` - explicit, per `ACAD-D10`.

### 5.4 Public route

`/verify/[code]` - certificate verification. No session, no personal data beyond
holder name and course, aggressively rate-limited, `noindex`.

---

## 6. Transaction boundaries

### Hold a seat

Begin → `SELECT capacity FROM cohort FOR UPDATE` → count held and confirmed →
reject if full → insert `held` enrolment with a TTL → commit. `ACAD-D2`.

### Confirm enrolment

Begin → load enrolment `FOR UPDATE` → verify first instalment or full payment
settled → status `confirmed` → audit → outbox `enrolment.confirmed` → commit.

### Issue a certificate

Begin → verify attendance threshold and completion → insert `certificate` with a
random verification code → audit → outbox → commit. Immutable thereafter.

**Lock order is cohort → enrolment → payment**, consistent with
`order → payment` and `appointment → payment`.

---

## 7. Error and retry contract

| Rejection               | Meaning                                                                         |
| ----------------------- | ------------------------------------------------------------------------------- |
| `cohort-full`           | Lost the race for the last seat; offer the waitlist                             |
| `already-enrolled`      | Idempotent replay returns the existing enrolment                                |
| `prerequisite-missing`  | A certifying course requires a prior one                                        |
| `instalment-overdue`    | Informational; does **not** revoke access, per `ACAD-D4`                        |
| `not-entitled`          | Playback requested without a confirmed enrolment                                |
| `certificate-not-found` | Verification code unknown - deliberately indistinguishable from a malformed one |

---

## 8. Phased delivery

### ACAD0 - Schema and migration

- [ ] All tables from `§3.1`; every FK indexed and proved by query.
- [ ] Capacity enforcement proved by a live concurrent test.
- [ ] Development fixtures fenced to the demo profile, labelled as such.

**Exit gate:** migrated from zero, seeded twice, capacity race demonstrably lost
by exactly one of two callers.

### ACAD1 - Course and cohort catalogue

- [ ] Reads, list and detail screens at Phase B's density, Jalali dates.
- [ ] Sponsoring brand and multiple instructors rendered from the first version.

**Exit gate:** a real course from a real poster renders correctly, including its
co-instructors and sponsor.

### ACAD2 - Enrolment, instalments, waitlist

- [ ] Hold, confirm, pay through the existing payment path, instalment plans.
- [ ] Waitlist with position and notification.

**Exit gate:** an enrolment paid in three instalments reaches `active`, and the
second instalment failing does not revoke access.

### ACAD3 - Attendance and certification

- [ ] Per-session attendance on a phone; completion rules; certificate issue.
- [ ] `/verify/[code]` public page, rate-limited.

**Exit gate:** a certificate issued from real attendance verifies at a public URL,
and a re-issue supersedes rather than edits.

### ACAD4 - Recorded lessons

- [ ] `VideoProvider` interface plus one Iranian adapter; signed short-TTL
      playback; watermarking; concurrent-session limits; progress.

**Exit gate:** a lesson plays for an entitled student and does not play for
anyone else, with the URL expiring.

### ACAD5 - Packages and mentorship

- [ ] Package manifest, purchase, redemption dispatch across contexts.
- [ ] Mentorship as `service.kind = 'mentorship'` **through Booking**.

**Exit gate:** a package containing a course, a product kit and two mentorship
hours redeems into three contexts without any of them importing another's types.

### ACAD6 - The practitioner loop

- [ ] Staff-confirmed role grant on certification; professional pricing becomes
      visible; a graduate's first wholesale order placed end to end.

**Exit gate:** a certified graduate sees professional prices and can buy at them.

---

## 9. Where Academy meets the rest

| Boundary | Mechanism                                                                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payment  | The shared `payment` abstraction only. Enrolments and instalments are payments with an `enrolment_id` aggregate, exactly as deposits are payments with an `appointment_id` |
| Booking  | Mentorship through `service.kind`. One published function, no table access                                                                                                 |
| Commerce | Only through packages, and only by snapshot, per `ACAD-D9`. Plus the role grant in `ACAD-D10`, which is a write to `person_role` and nothing more                          |
| Studio   | Read-only, per [`studio.md`](studio.md)                                                                                                                                    |

---

## 10. What the maintainer must answer before ACAD0

1. **Which courses are certifying**, and what attendance threshold earns the
   certificate.
2. **Instalment terms** - how many, over what period, and what happens when one
   is missed.
3. **Refund policy for cohorts** - before the start, after the first session,
   after the last.
4. **Does certification grant professional pricing automatically or on her
   confirmation?** `ACAD-D10` assumes confirmation.
5. **The VOD provider**, with its cost and its limits. `ACAD-D5` cannot be built
   against nothing.
6. **Prerequisites between courses**, if any.
7. **Whether prior students should be back-filled** with enrolments and
   certificates, which is a data-entry question with a real cost.

---

## 10b. The `/academy` hub page

Specified in [`storefront/public-surfaces.md`](storefront/public-surfaces.md)
§6.3. It carries: upcoming dated cohorts with remaining seats; the course
catalogue; **where graduates are now**, which is the strongest section on the
page; student work under consent; a preview of the classroom; what the
certification is worth and how anyone verifies it; and testimonials from
**students** specifically.

Academy supplies `listCourses`, `listCohorts` and `listGraduateOutcomes`. The
testimonials, student cases and classroom media are content entities.

The buying decision here is career-shaped rather than product-shaped, which is
why evidence of **outcomes** outranks description of **content** in the section
order.

---

## 11. Capability catalogue

**In v1** - course catalogue, in-person cohorts with capacity and waitlist,
enrolment, instalments, attendance, certificates with public verification,
the practitioner role grant.

**Deliberately later** - recorded lessons and progress; packages; mentorship;
alumni-only content; cohort discussion; instructor payouts; multi-city cohorts;
corporate or salon group enrolment; a referral scheme for graduates.

**Rejected for now** - quizzes and grading, which turn a workshop into an LMS
nobody asked for; a public student directory, which publishes a list of names for
no benefit to the students on it; certificates as NFTs or blockchain records,
which solve a verification problem the public URL already solves.
