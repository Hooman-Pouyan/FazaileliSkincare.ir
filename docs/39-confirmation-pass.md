# The confirmation pass — Booking and Academy

**Date:** 2026-08-29
**What this is:** every product, flow and interface decision in
[`37-booking-implementation-plan.md`](37-booking-implementation-plan.md) and
[`38-academy-implementation-plan.md`](38-academy-implementation-plan.md) put to the
maintainer one at a time and either confirmed or changed
**Status:** binding. Where this document and a plan disagree, this document wins.

Twenty-four decisions. **Fifteen confirmed as planned, nine changed.** The changes
are all in §2 and each carries what it costs.

---

## 1. Confirmed as planned

| # | Decision | Where |
|---|---|---|
| 1 | **No calendar.** A horizontal strip of days plus a list of times | `37` §3.1 |
| 2 | **Three screens**, the held slot living in the URL rather than in browser state | `37` §3.2 |
| 3 | **Consultation gate is once per person, ever** — after one completed appointment they book anything directly | `BOOK-D19` |
| 4 | **Cancellation tiers**: over 24h free; 12–24h free once, a second inside 90 days drops a tier; under 12h becomes 90-day credit | `BOOK-D16` |
| 5 | **A series is booked a session at a time**, spacing enforced, balance expires, a cancelled session returns to the balance | `BOOK-D20` |
| 6 | **No deposits at launch.** Booking ships with no gateway and no registration | `BOOK-D14` |
| 7 | **No slots → alternatives, then the waiting list.** Never an empty grid | `37` §5.3.2 |
| 8 | **Some intake answers block a booking**, versioned, never in a notification body | `BOOK-D10` |
| 9 | **The staff day view is phone-first**, beds as a second band, reschedule by form not drag | `37` §5.BOOK5 |
| 10 | **Losing the race is a normal outcome**, not an error page. Answers preserved when a hold expires | `37` §6.3, §6.4 |
| 11 | **The whole flow works with JavaScript disabled** — kept as a hard exit gate | `37` §5.BOOK3 |
| 12 | **A reminder 24 hours before**, through the outbox, never inline | `BOOK-D12` |
| 13 | **48-hour cohort seat hold**, not the ten minutes the design doc had inherited from the cart | `ACAD-D11` |
| 14 | **Enrolment takes real money at launch** through the existing bank-transfer path | `38` §1.1 |
| 15 | **Course pages lead with outcomes**, syllabus fifth; **cohort waitlist with position**; **the practitioner role is granted deliberately by her**, never automatically | `38` §2.3, `ACAD-D10` |

---

## 2. Changed

### 2.1 · The practitioner is named, even though there is no picker

**Confirmed no picker. Changed:** the confirmation page and the reminder message
say who they will be seeing.

Warmer at no cost, and it sets the expectation correctly for the day a second
practitioner joins — at which point the sentence changes rather than a new concept
appearing. `BOOK-D15` amended.

**Cost:** one line of copy per surface.

### 2.2 · The treatment list has two ways in

**Confirmed grouping by concern. Added:** a second entry point browsing by
treatment type — facials, peels, needling.

Two visitors, two intents: one knows their problem, one knows the treatment they
want. Serving only the first loses the second.

**Cost:** a second listing route and its navigation, and a decision about which is
canonical for search engines. The concern grouping stays canonical; the type
listing carries a canonical link to it, exactly as `/shop/brand/[slug]` relates to
the catalogue today.

### 2.3 · Attendance screens are in

**Reverses `ACAD-D13`, which had deferred them.**

Per-session attendance on a phone, large tap targets, three states, submitted in
one action, tolerant of being filled in afterwards.

**Consequence, and it is a good one:** `issueCertificate` can now check a real
attendance threshold rather than taking a staff-confirmed completion on trust.
That makes the certificate mean something measurable.

**It creates one dependency on her:** *what proportion of sessions must a student
attend to earn the certificate?* Question 21, and it is now on the critical path
of `ACAD3` rather than optional.

### 2.4 · A missing prerequisite holds the enrolment for her review

**Was:** refused outright, with the prerequisite course named and linked.
**Now:** the enrolment is created in a **pending review** state and she decides.

Better, because somebody with equivalent experience from another institute is a
real case that a hard refusal turns away.

**Cost, and it is not small:** a new enrolment state, a staff queue for pending
enrolments, an approve and a decline action with a reason, a notification on each
outcome, and a rule for what happens to the held seat while she decides — it
**holds**, and the 48-hour clock applies to her as well as to the student.

### 2.5 · Teaching blocks her treatment calendar, with 30 minutes either side

**Confirmed automatic. Added:** a 30-minute buffer before and after every confirmed
cohort session.

Thirty rather than sixty was the right call — she is the entire capacity of the
business, and an hour each side of every teaching day is an hour of bookable time
that does not exist.

**Cost:** `cohort.buffer_minutes`, default 30, written into the availability
exception.

### 2.6 · Cohort withdrawals are credit, never cash

**Was:** my proposed default of full refund to 14 days, half to the start, nothing
after the first session. **Now:** no cash refunds. A withdrawal becomes credit
toward a future cohort, valid twelve months.

This is the better answer and it is consistent: **Booking already works this way**
(`BOOK-D16`). One rule across the whole site — *we keep your money here, not from
you* — is easier to say on the phone, easier to defend, and costs the business
nothing, because credit is redeemed against a seat that would otherwise be empty.

It also removes Academy's last dependency on the unbuilt refund path.

**Still owed by her:** the credit's validity period if twelve months is wrong, and
whether credit is transferable to another person. The policy must appear on the
cohort page **before** payment.

### 2.7–2.9 · Scope: only video is deferred

**Was:** video, instalments, cross-context packages and mentorship all deferred.
**Now:** **only recorded video.** Instalments, packages and mentorship are all in.

| Added back | What it means |
|---|---|
| **Instalments** | A plan with ordered instalments, each settling through the existing transfer path. Access gated on plan state, not on the last payment — a student who has paid two of three is enrolled and attending. A missed instalment is a conversation, never an automatic lockout (`ACAD-D4`). Needs an overdue view for staff |
| **Packages** | A bundle across contexts — a course, a product kit, mentorship hours — priced independently and stored as a **manifest with snapshotted titles and prices**, never a join across three schemas (`ACAD-D9`). Redemption dispatches through a thin resolver each context registers with |
| **Mentorship** | Bookable hours, through the **Booking scheduler** with `service.kind = 'mentorship'`. Never a second calendar. Needs pricing, duration and availability rules from her |

#### What this costs, stated plainly

Academy grows by roughly **three packets** and becomes the largest block in the
plan — larger than Booking. That sits against the stated business priority, in
which Academy is third behind the clinic and product sales.

Two things follow, and they are worth deciding rather than discovering:

- **Instalments are payment-layer work, not Academy work.** Built here, the shop
  inherits them for large baskets. That is an argument for building them properly
  rather than quickly.
- **Packages depend on Commerce and Booking both being finished**, since a package
  redeems into all three. It is therefore the **last** packet of the block and
  cannot be pulled forward.

**Recommendation:** keep the scope, but split the block. `ACAD0`–`ACAD5` as
planned, then `ACAD6` instalments, `ACAD7` mentorship, `ACAD8` packages — so the
public product is critique-ready after `ACAD5` and the rest lands without holding
it up. Ordered this way, none of the three additions delays the thing the whole
sequence was arranged around.

---

## 3. What she still owes, after this pass

| # | Owed | Blocks |
|---|---|---|
| 1 | The intake questions, and which are blocking | The intake form — `BOOK3` |
| 2 | The attendance threshold for a certificate | `ACAD3`, newly on the critical path per §2.3 |
| 3 | Credit validity for cohort withdrawals, and whether it transfers to another person | The cohort page, which cannot ship without the policy visible |
| 4 | Mentorship pricing, duration and when she is available for it | `ACAD7` |
| 5 | The treatment list, durations, stages, series spacing, consultation prices | The data pass, as planned |

Items 1 to 3 are short answers. Item 5 is the content brief.

---

## 4. Applying this

`37` and `38` stand except where §2 changes them. The design documents
`booking.md` and `academy.md` carry the amended decisions. Any packet that
contradicts §2 is wrong, and §2 is the reason.
