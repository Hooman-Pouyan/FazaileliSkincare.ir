# Gaps, opportunities, and open judgements

**Date:** 2026-08-29
**Scope:** a second review pass over `37`, `38`, `39` and `40` looking for what is
missing rather than what is wrong
**Status:** findings and recommendations. Nothing here is decided.

`41.x` numbering. Anything adopted becomes a decision in the relevant design
document.

---

## 1. The one that would have hurt at launch

### 41.1 · The consultation gate turns every existing client into a new one

`BOOK-D19` requires a person the clinic has never seen to consult first. The
system's idea of "never seen" is **no completed appointment in this database** —
and on launch day the database is empty.

So every woman who has been going to Ms. Fazaieli for three years, booking online
for the first time, is told she must have a consultation before she can book the
treatment she has had eleven times.

That is not a small annoyance. It is the exact moment the site has to prove it is
easier than WhatsApp, and it fails in front of the most loyal customers there are.

**Three ways out, and they are not exclusive:**

1. **Import the existing client list**, if one exists in a usable form, with a
   `known_since` marker that satisfies the gate. Depends entirely on what she
   actually has — see `41.14`.
2. **A staff action: "this client is known to us"**, one tap from the customer
   screen, audited. Needed regardless of the import, because somebody will always
   have been missed.
3. **Do not enforce the gate for the first N months**, as a dated switch rather
   than a code change.

**Recommendation:** build 2 unconditionally — it is small and it is the permanent
answer — and decide between 1 and 3 once `41.14` is answered.

---

## 2. Standard features that are missing

### 41.2 · Booking requires an account, and commerce does not

Commerce has guest checkout with `order_access_token`. Booking, as planned,
requires signing in before a slot can be held.

This is backwards. The person most likely to abandon is a first-time client, and
forcing account creation in front of a two-hour appointment is precisely the
friction that sends somebody back to Instagram — which is the queue this whole
context exists to remove.

**Recommendation:** mirror commerce exactly. Book with a phone number and a
one-time code, `order_access_token`'s sibling for appointments, and offer the
account afterwards rather than before. The `person` row is created either way;
the password is what becomes optional.

**Cost:** an access-token table for appointments, phone verification on the
confirm step, and a merge path when a guest later signs up — all three of which
commerce has already solved and can be copied.

### 41.3 · Nobody can book for somebody else

`appointment.person_id` is the account holder. A mother booking for her daughter,
a husband booking a gift treatment, a friend booking a pair — all common, and all
impossible.

It also has a real consequence for `BOOK-D23`: **the intake answers belong to the
person being treated, not the person who booked.** Storing a daughter's
contraindications under her mother's account is wrong on both privacy and
clinical grounds.

**Recommendation:** `appointment.attendee_name` and `attendee_phone`, nullable,
defaulting to the account holder. Intake attaches to the appointment, which it
already does. The confirmation and reminder go to the booker; the intake link goes
to the attendee.

### 41.4 · No way to put the appointment in a calendar

An `.ics` file generated in-app, downloaded, no foreign host, nothing to violate
hard rule 10. Genuinely a few hours of work, and it measurably reduces no-shows.

I listed this as "deferred" in `36` and I was wrong — it is cheaper than the
reminder and it works even when the notification worker does not exist.

### 41.5 · The reminder has no actions in it

A reminder that says "you have an appointment tomorrow" is worth much less than
one that says "…and here is where to reschedule if you cannot make it."

The whole point of `BOOK-D16`'s cancellation tiers is that a client who cancels at
14 hours is worth far more than one who does not show. Making cancelling easy is
how you get the cancellation instead of the no-show — and then the waitlist fills
the slot.

**Recommendation:** every reminder carries a link to the appointment. With
`41.2`'s access token, that link works without signing in.

### 41.6 · Staff cannot see who has not turned up before

`no_show` is a status; nothing surfaces it. When somebody telephones for a slot,
"this client has missed two appointments this year" is exactly what she needs to
know before giving away a two-hour Saturday slot.

**Recommendation:** a no-show count on the customer, visible on the day view and
in `createAppointmentForCustomer`. It informs a person; it never blocks
automatically.

### 41.7 · Academy sends nothing before a cohort starts

Booking gets a 24-hour reminder; a course that somebody paid a large sum for and
booked three months ago gets nothing. Cohort reminders — a week out, then the day
before, with what to bring and where to come — are standard, cheap, and reuse the
same outbox.

---

## 3. What this system can do that a booking product cannot

This is the section worth arguing about, because these are the things that make
the site the institute's system rather than a Fresha subscription with a Persian
skin. **Every one of them is only possible because the shop, the clinic and the
academy are one database.**

### 41.8 · The treatment record — the strongest of these

She opens an appointment on the day view and sees, in one place: this client's
previous treatments and when; what was done; their intake answers; and **what they
have bought from the shop.**

No standalone booking product can show the last item, because it is not the shop.
No shop can show the first, because it is not the clinic.

For a skincare practice this is the difference between a calendar and a clinical
system. "She had a peel six weeks ago and bought a retinol two weeks ago" changes
what is safe to do today, and today nobody can see it in one place.

**Recommendation:** build it as part of `B5`. It is mostly a read — the data all
exists — and it is the highest-value staff feature in either plan.

### 41.9 · Post-treatment recommendations, as a prepared basket

At the end of a visit she taps the products she recommended. The client receives a
link to a basket already containing them, with a note in her words.

This is the clinical trust that already exists, converted into the product sales
you said you hope the website increases. Nobody else can build it: it needs the
practitioner, the appointment and the catalogue in one system, and it needs her
name on the recommendation to mean anything.

**It also solves a real problem**, which is that a client leaves with advice they
half-remember and buys the wrong thing from Digikala a week later.

**Recommendation:** worth a packet of its own after `B5`. I would rank it above
most of the shop iteration backlog on commercial value.

### 41.10 · The review request that produces consented testimonials

The content problem — that the pages read as deserted and nobody has time to write
— has a structural fix hiding in Booking.

After a completed appointment, ask the client how it went. If they answer well and
tick the consent box, that is a testimonial with attribution and consent **captured
at source**, in a client's own words, arriving continuously and for free.

Compare that to harvesting Instagram captions and chasing consent afterwards. This
is the permanent answer to a problem currently treated as a one-off content
project. `consent_record` and `testimonial` already exist in the public-surfaces
design; this fills them.

**Recommendation:** adopt it, and treat it as content infrastructure rather than a
Booking feature.

### 41.11 · Progress photographs on the appointment

A skincare practice takes before-and-after photographs anyway. Attached to the
appointment they become clinical progress tracking for her, and — with the consent
already modelled in `PUB-D3` — the marketing before-and-after cases the landing
page needs, sourced from real treatment rather than assembled later.

**Caveat, and it is serious.** This is identifiable facial imagery of named people
attached to medical-adjacent treatment. It must not ship until `35`'s finding F-4
is fixed: signed short-TTL URLs and cache invalidation, so revocation actually
revokes. **The clinical use and the marketing use are different consents** and must
be captured separately — a client may well agree to her photographs being kept in
her record and refuse to have them on a website.

### 41.12 · Rebooking at the clinically right moment

The system knows the treatment, the date, and the spacing rules `BOOK-D20` already
encodes. "It has been six weeks since your last facial" is a message it can
compose without anybody deciding to send it.

For a practice whose capacity is one person's hours, filling gaps from existing
clients is worth more than acquiring new ones.

---

## 4. Where I am uncertain, and what I would ask

### 41.13 · Is the 30-minute teaching buffer enough?

Thirty minutes to clear a workshop, reset a treatment room and be ready for a
client is my guess, not knowledge. If a workshop involves equipment it is
optimistic. **She knows; I do not.**

### 41.14 · What client history actually exists?

Never asked, and `41.1` turns on it. Is there a list — a notebook, a spreadsheet,
Instagram threads, a previous booking app? Names and phone numbers alone would be
enough to satisfy the gate and to make launch feel continuous rather than like
starting over.

### 41.15 · Gift vouchers

Standard in this sector, a real revenue line, entirely undiscussed. Somebody buys
a treatment for somebody else, who redeems it later.

It is not free — it is a stored-value instrument with its own expiry, transfer and
accounting questions, and it interacts with `BOOK-D16`'s credit model. I raise it
because it is the most common feature in this market that neither plan mentions,
not because I think it belongs in the first block.

### 41.16 · Does she want progress photographs at all?

`41.11` assumes she does. Some practitioners find a camera changes the room.

---

## 5. Not discussed enough

### 41.17 · How deposits actually get switched on

`BOOK-D14` says it is "one number per treatment". That is true of the data and
false of the experience: turning deposits on changes the booking flow from
confirm-immediately to hold-and-pay, adds a payment step, adds a settlement wait,
and changes what a cancellation means.

**No task anywhere covers that transition.** It should be written down before
launch, while the reasoning is fresh, rather than rediscovered in six months.

### 41.18 · Nothing measures whether any of this worked

Every exit gate is structural — "renders correctly", "refuses the overlap". Not
one asks whether the clinic is better off.

The measures are obvious and nobody has written them down: **the no-show rate,
appointments booked without a message, the number of WhatsApp booking messages she
still receives, and slot utilisation.**

**Recommendation:** record the current values *before* launch — she can estimate
them in ten minutes — or there is no baseline and the question becomes
unanswerable forever.

### 41.19 · Nobody has planned for her learning to use it

The staff day view, attendance, holidays, transfers, certificates. She is not a
software user by trade and this is the system her working day will run on.

A launch plan needs: a fortnight of parallel running where WhatsApp still works,
one printed page for the three things she does daily, and somebody watching the
first week. **This is where systems like this actually fail** — not in the code.

---

## 6. What I would do with all of this

**Adopt now, into the current blocks** — 41.1 (option 2), 41.2, 41.3, 41.4, 41.5,
41.6, 41.7. All small, all standard, and each one is worse to retrofit than to
build.

**Adopt as a packet after `B5`** — 41.8 the treatment record, then 41.10 the review
request. The first is the strongest staff feature in either plan; the second
solves a content problem currently being treated as an unsolvable one.

**Adopt with care and after F-4** — 41.11.

**Decide later, on evidence** — 41.9 (high value, but it wants a real clinic using
the system first), 41.12, 41.15.

**Answer, then plan** — 41.13, 41.14, 41.16, and the baseline in 41.18.
