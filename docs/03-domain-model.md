# Domain model — fazaieli.ir

**Date:** 2026-08-24 · **Status:** Draft for review

The three spaces you described are not three websites. They're **four bounded contexts sharing one identity**, and getting that boundary right is what will keep the codebase from turning into mud.

---

## Context map

```
                        ┌───────────────────────────┐
                        │   IDENTITY & MEMBERSHIP   │   ← the only shared kernel
                        │   Person · Account · Role │      that all three depend on
                        └─────────────┬─────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
┌───────▼────────┐          ┌─────────▼────────┐         ┌──────────▼────────┐
│    COMMERCE    │          │     BOOKING      │         │      ACADEMY      │
│ Catalog·Cart   │          │ Service·Slot     │         │ Course·Cohort     │
│ Order·Payment  │          │ Appointment      │         │ Enrolment·Lesson  │
│ Shipment       │          │ Intake·Deposit   │         │ Certificate       │
└───────┬────────┘          └─────────┬────────┘         └──────────┬────────┘
        │                             │                             │
        └──────────────┬──────────────┴──────────────┬──────────────┘
                       │                             │
             ┌─────────▼─────────┐        ┌──────────▼─────────┐
             │  PAYMENT (shared) │        │ NOTIFICATION (SMS) │
             │ one gateway iface │        │  one Notifier iface│
             └───────────────────┘        └────────────────────┘

             ┌────────────────────────────────────────────────┐
             │  CONTENT & BRAND — landing, bio, articles,     │
             │  testimonials. Depends on nothing.             │
             └────────────────────────────────────────────────┘
```

**The rule that matters:** Commerce, Booking and Academy never import each other's types. They meet in exactly two places — the shared **Payment** abstraction and the customer's unified **My Studio** view, which is a read model that queries all three and owns no writes.

That's the "decoupled yet coherent" property you asked for, expressed in code rather than in navigation.

---

## 1 · Identity & Membership · هویت و عضویت

| Entity          | Notes                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Person**      | Phone number is the natural key (E.164, normalised `+98…`). Email optional. `firstName`, `lastName`, `displayName`, `locale` (`fa`/`en`/`ar`).                     |
| **Account**     | Better Auth credentials, OTP/TOTP state, and sessions. Customers use phone OTP; provisioned staff use email/password plus mandatory TOTP. One identity per Person. |
| **Role**        | `customer` · `student` · `practitioner` · `staff` · `admin`. A Person can hold several — a student who also buys serums.                                           |
| **Address**     | Iranian shape: province → city → postal code (10 digits) → line. Not a US address form.                                                                            |
| **SkinProfile** | Type, concerns, allergies, current routine, contraindications.                                                                                                     |

> ⚠️ **SkinProfile is health data.** It drives both product recommendations and treatment safety, and it is the most sensitive thing in your database. Store it in its own table, restrict reads to the owner and to `practitioner` role, never log it, never include it in analytics events, and exclude it from any export you build for convenience. Decide before you build it whether you truly need it in Phase 1 — the answer is probably no.

**Invariants**

- One verified phone number ⇒ one Person. Merging duplicates later is painful; enforce it now.
- Customer OTP codes: 6 digits, single use, 2-minute TTL, 3 verification attempts per code, maximum 5 sends per phone per hour, and additional IP limits. SMS costs money and is a favourite abuse target. The exact limits and session policy live in [`system-design/authentication-and-account-security.md`](system-design/authentication-and-account-security.md).

---

## 2 · Commerce · فروشگاه

| Entity                         | Notes                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Brand**                      | **Forlle'd** (Japan — official representative, confirmed from the Instagram bio), **Storyderm** (Korea), **Thalgo** (France, seen in the treatment room). Carries the official-representative status that is central to your positioning. A brand also owns **product lines** — Forlle'd → **Hyalogy** — so `Brand → Line → Product` is three levels, not two. |
| **Category**                   | Nested (Skincare → Serums → Vitamin C). Category _and_ concern-based browsing — "for pigmentation" matters more to your customer than "serums".                                                                                                                                                                                                                |
| **Product**                    | Bilingual name/description/ingredients. Volume, usage instructions, `isProfessionalOnly` (some clinical products should only be sellable to graduates — a real rule in your business).                                                                                                                                                                         |
| **Variant**                    | Size/shade. **The unit that carries price and stock**, not Product.                                                                                                                                                                                                                                                                                            |
| **Price**                      | Per variant **per customer group** — `public`, `student`, `professional`. A group with no row falls back to public, so you only enter the exceptions. Every change writes a `price_history` row: rial pricing on imported stock moves, and you will be asked "why is this more than last month".                                                               |
| **PriceVisibility**            | Per product: `public` or `on_request`. An `on_request` product shows a "استعلام قیمت" action instead of a price and a cart button — routing to WhatsApp or a short lead form. **It is never silently addable to a cart**, or you will take an order at a price nobody agreed.                                                                                  |
| **InventoryItem**              | `onHand`, `reserved`. Never a bare `stock` integer.                                                                                                                                                                                                                                                                                                            |
| **Cart**                       | Guest carts keyed by cookie, merged into the Person's cart on login.                                                                                                                                                                                                                                                                                           |
| **Order**                      | `orderNumber` (human-readable, not the UUID), immutable **line snapshots** — name, price and tax copied at purchase time so a later price change never rewrites history.                                                                                                                                                                                       |
| **Payment**                    | `method` (`gateway` · `bank_transfer` · `cash_on_pickup`), `status`, `amountRials`. Gateway payments carry `authority` + `refId`, unique on `authority`.                                                                                                                                                                                                       |
| **BankTransferClaim**          | For `bank_transfer`: `expectedAmountRials`, customer-submitted `trackingNumber`, `last4OfCard`, `transferredAt`, optional receipt image, plus `confirmedBy` and `confirmedAt`.                                                                                                                                                                                 |
| **Shipment**                   | Post/Tipax/courier, tracking code, delivered-at.                                                                                                                                                                                                                                                                                                               |
| **ReturnRequest / ReturnLine** | A customer claim and per-order-line quantities; approval, receipt, inspection, refund, and restock remain separate audited decisions.                                                                                                                                                                                                                          |
| **Refund**                     | An idempotent partial/full refund ledger attached to the original payment and order. Successful refunds can never exceed settled funds.                                                                                                                                                                                                                        |
| **Coupon**                     | Percentage or fixed, scoped to categories or to students.                                                                                                                                                                                                                                                                                                      |

**Invariants**

- **Money is an integer count of rials.** Toman is a display transform (`÷10`) and appears nowhere in the database. Every column is `bigint`. No floats, ever.
- Order totals are recomputed server-side at payment-request time from current cart + prices. The client's number is a hint, never an input.
- `onHand` decrements in the same transaction that records a successful gateway verify. Cart reservations expire on a TTL.
- An Order in `paid` never returns to `pending`. State machine: `draft → awaiting_payment | awaiting_transfer → paid → fulfilled → completed`, with `cancelled` / `refunded` as terminal branches.
- Admin needs **bulk price adjustment** — select by brand or category, apply a percentage, preview, commit as one audited batch. Editing 120 products one at a time after an exchange-rate move is how price lists go stale.

The complete transaction states, shipping baseline, settlement boundary, late-transfer behavior, fulfilment, returns, and refund rules are in [`system-design/cart-checkout-payment-fulfilment-and-returns.md`](system-design/cart-checkout-payment-fulfilment-and-returns.md).

---

## 3 · Booking · رزرو خدمات

**Your actual capacity, as described:** up to 3 practitioners (Ms. Fazaieli plus 2, extensible by hire), **2 rooms containing 3 beds**, services running around 2 hours, and packages/protocols whose steps differ per service.

That combination has one important consequence: **beds, not rooms, are the unit of capacity, and a booking consumes a practitioner _and_ a bed simultaneously.** Three beds with two practitioners means the practitioner is the binding constraint on some days and the bed on others. A scheduler that models only "staff availability" will happily double-book a bed.

| Entity                 | Notes                                                                                                                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Service**            | Name, `durationMinutes` (yours are long — ~120), buffer-after for turnover and cleaning, price, deposit amount, required practitioner skill, required resource kind.                                                                      |
| **ServiceStep**        | Ordered steps within a protocol. Some steps occupy the practitioner, others are dwell time where the bed is held but the practitioner is free. **Model this from the start** — it's the difference between fitting 3 clients a day and 5. |
| **Practitioner**       | Ms. Fazaieli + staff. Skills, working hours, whether customers may choose them by name.                                                                                                                                                   |
| **Resource**           | A **bed** (3) or a device. Belongs to a **Room** (2). Rooms matter for privacy rules, beds for capacity.                                                                                                                                  |
| **AvailabilityRule**   | Recurring hours + exceptions + **Iranian public holidays** in their own table (Nowruz alone is two weeks).                                                                                                                                |
| **Appointment**        | Person, Service, Practitioner, Resource, `timeRange`, status, deposit payment, notes.                                                                                                                                                     |
| **IntakeForm**         | Contraindications answered before the visit; links to SkinProfile.                                                                                                                                                                        |
| **CancellationPolicy** | Free until N hours before, deposit forfeit after. Encode it — don't re-argue it per customer.                                                                                                                                             |

**Invariants**

- **No double-booking, enforced in the database on _both_ axes.** A `SELECT`-then-`INSERT` check will not save you when two people tap "book" in the same second:

  ```sql
  ALTER TABLE appointment ADD CONSTRAINT no_practitioner_overlap
    EXCLUDE USING gist (practitioner_id WITH =, time_range WITH &&)
    WHERE (status IN ('held','confirmed'));

  ALTER TABLE appointment ADD CONSTRAINT no_resource_overlap
    EXCLUDE USING gist (resource_id WITH =, time_range WITH &&)
    WHERE (status IN ('held','confirmed'));
  ```

- Availability search is a **two-resource intersection**: free practitioner ∩ free bed ∩ inside working hours ∩ not a holiday. Write it once, as one query, and test it hard.
- Times are `tstzrange` in UTC. Jalali is a rendering concern. Iran no longer observes DST, which removes one class of bug — store UTC anyway.
- A slot is `held` for 10 minutes while the deposit is paid, then auto-released.
- Appointments are never hard-deleted. Cancellation is a state.
- A 2-hour service with a 15-minute buffer blocks 135 minutes of bed time. Buffers belong in the constraint, not in the practitioner's head.

## 4 · Academy · آموزشگاه

| Entity                | Notes                                                                                                                                                                                                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Course**            | In-person, online (recorded), or hybrid. Level, prerequisites, outcomes.                                                                                                                                                                                                                                            |
| **Cohort**            | A dated run of an in-person course: capacity, **venue and city** (Mashhad today, other cities plausible), sessions, waitlist, **sponsoring brand** (the O2White workshop is a Storyderm event) and **multiple instructors** (workshops are sometimes co-taught). Your real posters carry all five — model them now. |
| **Module / Lesson**   | Ordered. Lesson holds a VOD asset reference, not a file.                                                                                                                                                                                                                                                            |
| **Enrolment**         | Person ↔ Course/Cohort. Status, payment, progress, **instalment plan** (common and expected in Iran — model it now, not later).                                                                                                                                                                                    |
| **Package**           | Bundle of courses, or course + product kit + mentorship hours. Priced independently of its parts.                                                                                                                                                                                                                   |
| **MentorshipBooking** | Reuses the Booking context's slot machinery with `Service.kind = mentorship`. **Do not build a second scheduler.**                                                                                                                                                                                                  |
| **Attendance**        | Per session, per student. Feeds certification.                                                                                                                                                                                                                                                                      |
| **Certificate**       | Issued on completion, verifiable by code at a public URL.                                                                                                                                                                                                                                                           |

**Invariants**

- Enrolment count ≤ cohort capacity, enforced with the same rigour as booking overlap.
- Video is never served from your app's origin — signed URLs from the VOD platform, short TTL.
- Certificates are immutable once issued; corrections are re-issues with a new number.

---

## 4b · Proof & content · محتوا

The Instagram highlights are already the site's content model — رضایت شما, قبل و بعد, هنرجوها, لحظات خاص من. Two of them are entities, not pages:

| Entity              | Notes                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| **Testimonial**     | Person (or a display name), text, optional photo, the service or course it refers to, published flag. |
| **BeforeAfterCase** | Two or more images, the treatment performed, elapsed time, practitioner, **consent record**.          |

> ⚠️ **BeforeAfterCase is the highest-consequence surface on the site.** These are identifiable photographs of clients' faces attached to a medical-adjacent treatment. Requirements, not suggestions: written consent captured and stored per case; a `consentRevokedAt` that immediately unpublishes; no case visible without an active consent row (default deny, so a missing record hides rather than shows); images served from storage that is not publicly enumerable; and no third-party analytics or embeds on those pages. If a client asks for removal, it must be one admin action, not a code change.

## 5 · Shared kernel

**Money** — `{ rials: bigint }`. One value object. All arithmetic on integers. Formatting (Toman, Persian digits, `٬` separators) happens in one place at the view layer.

**JalaliDate** — one utility module. Nothing else in the codebase touches calendar conversion.

**Notifier** — one interface, SMS and email behind it. Every notification is a template with FA and EN variants. Templates live in the database so you can fix a typo without a deploy.

**AuditLog** — who changed what, when. Non-negotiable for orders, payments, appointments and enrolments.

---

## Ubiquitous language

Fix these words now and use them everywhere — code, admin UI, and conversation with me in future sessions.

| English      | فارسی      | Means                                 |
| ------------ | ---------- | ------------------------------------- |
| Person       | شخص        | A human, regardless of role           |
| Practitioner | متخصص      | Someone who performs services         |
| Student      | هنرجو      | Enrolled in a course _(not «دانشجو»)_ |
| Service      | خدمت       | A bookable treatment                  |
| Appointment  | نوبت       | A booked slot                         |
| Slot         | بازه زمانی | An available window                   |
| Course       | دوره       | Teaching content                      |
| Cohort       | ترم / گروه | A dated run of a course               |
| Enrolment    | ثبت‌نام    | Joining a course                      |
| Order        | سفارش      | A product purchase                    |
| Cart         | سبد خرید   | Pre-purchase basket                   |
| Variant      | تنوع کالا  | The stock-keeping unit                |
| Deposit      | بیعانه     | Partial prepayment to hold a slot     |
| Package      | پکیج       | A bundle                              |
| Certificate  | گواهی‌نامه | Proof of completion                   |

---

## Answered, and now baked in

- **Catalogue axis:** browse by **concern/goal first** (acne, brightening, hydration, barrier repair); brand and product type are filters. `Concern` is therefore a first-class entity with a many-to-many to Product — not a tag.
- **Launch scope:** skincare only; `Product` attributes are modelled flexibly so healthcare lines need no migration.
- **Fulfilment:** nationwide post/courier **and** pickup at the institute. `ShippingMethod` is a strategy with its own rate rules; pickup is a method with zero cost and no address.
- **Booking capacity:** 3 practitioners, 2 rooms, 3 beds, ~2-hour services with per-service protocols.
- **Admin:** role-based permissions from day one, even while you are the only user.
- **Locale:** `fa` is the base locale; `en` and `ar` are secondary. Localized content stays a content task rather than a schema redesign.

## Still open

1. ~~Brand spellings~~ — confirmed: **Forlle'd** (Japan, official rep), **Storyderm**, **Thalgo**. Still open: are you the official representative for Storyderm and Thalgo too, or only Forlle'd?
2. Are any products **professional-only** (sellable only to trained graduates)?
3. **Instalments** on academy packages? (Assumed yes.)
4. Do students get **product discounts**? (Couples Commerce and Academy — kept apart until you say otherwise.)
5. Product and price lists — send when you're back at the office.
6. Do customers choose their practitioner by name, or just a time?
7. Do you run workshops in **cities other than Mashhad**? (The posters are Mashhad-only so far.)
8. Do you hold signed consent for the existing before/after photographs, or does that need collecting before any of them go on the site?
