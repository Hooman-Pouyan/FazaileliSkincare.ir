# Booking, in plain English

**Date:** 2026-08-29
**Purpose:** What Booking is when it is finished — every screen, everything a
person can do on it, and what it deliberately does not do
**Companion to:** [`system-design/booking.md`](system-design/booking.md), which
says how. This says what.

Written for reading rather than for building. No table names, no decision
identifiers except where one genuinely explains a limit.

---

## 1. What it replaces

Today somebody sees a post on Instagram, sends a message on WhatsApp, and waits
for Ms. Fazaieli to answer in the evening. She then holds the whole schedule in
her head and in that thread.

When this is finished, that person picks a treatment, sees real times, chooses
one, answers a few health questions, and is booked — without a message being
sent. And Ms. Fazaieli opens one screen in the morning that tells her the day.

That is the whole point. Everything below serves it.

---

## 2. What a customer sees

### 2.1 The treatments page

A list of what the clinic does, grouped by the concern it addresses rather than
by a clinical name — so somebody who knows they have pigmentation finds the
answer without knowing what it is called.

Each entry shows the name, roughly how long it takes, and the price.

### 2.2 A treatment's own page

What it is, in her words. How long it takes. What it costs. What to expect during
it. How to prepare beforehand. What to do afterwards. And a button that says
choose a time.

### 2.3 Choosing a time

A Persian calendar. Days the clinic is closed are visibly closed — public
holidays, Nowruz, her leave — rather than being days you click and get refused.

Pick a day and you see the times that are genuinely free. Pick one and it is held
for you for ten minutes while you finish.

If a day has nothing, you are not shown an empty grid: you are shown the next few
days that do have something, and offered the waiting list.

### 2.4 The health questions

A short form before the booking is confirmed — the questions Ms. Fazaieli decides
are necessary, in her wording.

Most answers are simply recorded for her to read. A few are serious enough that
they stop the booking rather than being noted, and when that happens the person
is told why and offered a consultation instead of a treatment.

These answers are visible to her and to the person who gave them, and to nobody
else. They never appear in a reminder message.

### 2.5 The confirmation

What was booked, when, where, and the cancellation rule — shown at the point of
booking, not discovered at the point of cancelling.

### 2.6 My appointments

Everything upcoming and everything past. For each upcoming one: reschedule, or
cancel.

**Reschedule** moves the existing booking to a new time in a single step. There is
never a moment where the person holds neither the old slot nor the new one — if
the new time is taken, nothing moves and the original is still theirs.

**Cancel** applies the policy that was shown up front.

### 2.7 The waiting list

If nothing suits, a person says which treatment they want and roughly when. When
somebody cancels, the freed slot is offered to the people waiting, in order, with
a short window to claim it — so one cancellation is not promised to five people
at once.

Cancellations are frequent and today they are wasted entirely.

### 2.8 Reminders

A message twenty-four hours before the appointment. No-show rates fall sharply
with one, which is why it is not treated as polish.

---

## 3. What the staff see

### 3.1 The day — the screen that matters

Built for a phone first, because it is read standing at the front desk.

A column for each person working, time running down the side, appointments as
blocks showing who, what, and what state it is in. Beds appear as a second band,
because a day can have a free practitioner and no free bed.

From this screen: take a booking for somebody who telephoned, mark a client
finished, mark a no-show, and block out an hour for a delivery or a break.

### 3.2 The week

The same thing wider, for planning.

### 3.3 Closed days

A screen for public holidays and clinic closures. Iranian holidays are announced
rather than calculated — religious dates move, and some are declared days in
advance — so this is a list somebody maintains a few times a year.

It exists because confirming an appointment on a day the clinic is shut is the
failure that costs the most trust.

---

## 4. What happens without anyone seeing it

- **Two people cannot book the same slot.** Not "unlikely" — the database refuses
  it, on both the person and the bed. If two people tap at the same instant, one
  is booked and the other is told the slot went, and offered alternatives.
- **Abandoned bookings release themselves** after ten minutes rather than holding
  a slot nobody claimed.
- **Reminders and waiting-list offers are queued**, never sent inside the booking
  itself — so a message is never sent about a booking that failed, and a booking
  never fails because a message could not be sent.
- **Nothing is ever deleted.** A cancellation, a no-show and a completion are
  states. The record of what was agreed survives, because that is what a dispute
  needs.

---

## 5. How the clinic's actual shape is handled

One practitioner and one assistant, per `BOOK-D17`.

The assistant covers a client during a passive step — a mask, a peel — so
Ms. Fazaieli can be with a second client. The system knows which minutes of a
treatment need her personally and which do not, and fills the gaps.

That is worth roughly seventy-five per cent more appointments a day from the same
people and the same rooms.

Consultations and teaching are different: while she is consulting or teaching she
is not available for anything else, and the calendar reflects that. A confirmed
teaching session automatically closes her booking calendar for that window
(`BOOK-D18`).

**None of this is hard-coded to today's staffing.** One practitioner and one
assistant is data. The day a third person is hired, they are added and capacity
rises — no rebuild.

---

## 6. What it deliberately does not do

| Not in it | Why |
|---|---|
| Choosing a practitioner by name | Clients come for Ms. Fazaieli, and a chooser with one real answer only disappoints (`BOOK-D15`). Adding it later touches nothing already booked |
| Taking a deposit at launch | Deposits are the only part that touches money, and money waits on merchant paperwork. Switched on later by changing one number per treatment (`BOOK-D14`) |
| Refunds | Not needed — a deposit, when it exists, is credit toward a future booking rather than money returned (`BOOK-D16`) |
| A map of the clinic | Every usable map provider is a foreign host. Address and directions in words instead |
| A course of six treatments booked as one series | Real, and later. Each is booked individually first |
| Adding it to your phone's calendar | Later |
| Booking by SMS | Recreates the queue this replaces |
| Customer ratings of practitioners | Three colleagues in one clinic; it creates a ranking nobody wants to manage |
| "Request any time" free text | That is WhatsApp with extra steps |

---

## 7. What has to exist first

| Needed | Status |
|---|---|
| The message queue actually sending | **Not built.** Reminders and waiting-list offers depend on it. First item in the plan |
| The staff sign-in boundary and audit trail | **Not built.** `BO0`. The day view is a staff screen and needs it |
| Her health questions, in her wording | **Owed by her.** Nothing else blocks on it, but the intake form cannot ship without it |
| The treatment list — names, durations, prices, what to expect, preparation, aftercare | **Owed by her** |
| Photographs of the rooms | Owed, and only for the public page — not for booking to work |

Nothing here needs a payment gateway, an SMS account, or business registration.
Booking can be finished and used before any of those exist.
