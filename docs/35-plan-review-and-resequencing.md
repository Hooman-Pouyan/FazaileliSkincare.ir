# Plan review and resequencing

**Date:** 2026-08-29
**Reviews:** `system-design/booking.md`, `academy.md`, `back-office.md`, `studio.md`,
`content-operations.md`, `storefront/public-surfaces.md`,
`storefront/shop-experience-iteration.md`, and `34-decisions-needed.md`
**Status:** Findings and a proposed sequence. Authorises no implementation.

The seven documents are strong. `BOOK-D3` (step timing, worth 75% of capacity),
`BOOK-D2` (exclusion constraints on both axes), `ACAD-D9` (packages as a manifest,
never a cross-context join) and `BO-D2` (one application, two origins) are all
correct and non-obvious. This document does not re-argue them.

It records what is wrong, what is more machinery than the business needs, what is
missing entirely, and a sequence that reflects two facts established with the
maintainer on 2026-08-29:

1. **The site is local only.** Nothing is deployed and no customer has ordered.
2. **Priority is clinic and bookings first, then product sales, then academy** —
   with the hope that the site raises the product share.
3. **The business is not yet registered**, and this must not gate progress.

---

## 1. Corrections — claims checked against the migrations

Most "already exists" claims in the seven documents are **correct**.
`content_block`, `content_item`, `effective_from` / `effective_until` (`0004`),
`product_pair` (`0006`), `order_access_token`, `return_request`, `shipping_rate`,
`iran_province`, `refund`, `return_line`, `shipment_line` (`0008`) are all really
there. Three claims are not.

| # | Claim | Reality |
|---|---|---|
| **C-1** | `back-office.md` §5.4: "The schema already carries the shape" for the price batch | `price_adjustment_batch` has `label`, `status`, `request_hash`, `created_by`, `committed_by`, timestamps. **No scope, no percentage, no rounding rule, and no batch-item table.** BO2's core requirement — "preview and commit must run the same calculation over the same scope snapshot" — has nothing to snapshot into. This is an unscheduled migration. |
| **C-2** | `back-office.md` §5.6: the `draft → verified → approved` state "on each" locale | `reviewState` is on `product`, not `product_translation` (`src/lib/db/schema/catalog.ts:48`). Per-locale review state is an unscheduled migration. |
| **C-3** | `studio.md` §1: "It has no migrations" | Its flagship "Your protocol" panel needs `person_protocol`, which does not exist. `protocol` and `protocol_phase` are catalogue taxonomy with no person link and no start date, so "weeks elapsed" has no source. |

---

## 2. Findings register

### Blocking — nothing downstream is real without these

**F-1 · `notification_outbox` has no drain, no channel and no provider.**
Nothing in `src/` or `scripts/` consumes it. Checkout and payment shipped in
packets 14 and 15, so an order can be placed and the customer told nothing.
`person` is keyed on phone and there is no email column, so the channel is SMS —
and no provider is named anywhere. **None of the 73 questions asks which one.**
This blocks Commerce confirmations, `BOOK-D12` reminders and `ACAD2` enrolment.
See §3 for why registration does not have to gate it.

**F-2 · There is no Content-Security-Policy.** `back-office.md` §3.2 identifies
this correctly and even ranks it above co-location — then schedules it inside
`BO0`, behind an admin hostname that needs DNS and middleware. A CSP is a
configuration change. It should not wait for the back office.

**F-3 · Legal pages are absent from the document that enumerates public
surfaces.** `public-surfaces.md` lists nine Landing sections and three hubs and
never mentions terms, privacy, returns policy, shipping policy, or contact with a
physical address. No real order can be placed in front of a real customer
without them.

### Wrong, not merely incomplete

**F-4 · Consent revocation does not revoke.** `D18` promises "a single write that
removes the material from every surface at once." Hiding a row does not take down
an image: an unguessable object key keeps working after `consent_revoked_at` for
anyone who saved the URL and for any CDN or ISR cache. For identifiable faces
attached to medical-adjacent treatment this is the difference between a promise
and a liability. Needs signed short-TTL URLs or an authorising route, plus cache
invalidation. Neither is specified. **`before_after_case` must not ship until
this is designed.**

**F-5 · The polymorphic `consent_record` removes the one guarantee that matters.**
A `(kind, id)` reference means no foreign key, no cascade, no database-enforced
integrity — on the highest-consequence data on the site, in a codebase whose
stated virtue everywhere else is invariants enforced in Postgres. It has exactly
two consumers. Two real FK columns plus a partial unique index for "one active
consent" gives actual referential integrity and costs nothing.

**F-6 · Booking cannot honour its own cancellation policy.** `BOOK-D8` refunds a
deposit inside the window; refunds are not built and no gateway is live, so a
bank-transfer deposit refund is the maintainer making a manual transfer. See §4
for the proposed change.

**F-7 · Two documents give opposite rules for the same problem.** `STU-D3`: "an
empty panel is omitted." `back-office.md` §5.1: "a missing panel reads as broken,
an empty one reads as done." The back office is right. Worse, omitting a panel
whose read *failed* tells a customer she has no appointment when she does — which
`STU-D5` ("Studio never invents a fact") forbids.

### Missing entirely

**F-8 · VAT.** Zero mentions across seven documents. Whether prices include
مالیات بر ارزش افزوده and whether the invoice states it separately is a
correctness question on every price on the site.

**F-9 · The rial/toman display rule is unstated**, and
`shop-experience-iteration.md` quotes a figure in toman inside a system whose
stated unit is integer rials. One rule, written once, including rounding.

**F-10 · Arabic content is undefined.** The spine can hold `ar`, but nobody is
assigned to write it and `back-office.md` §5.6 shows only "Persian and English
side by side." So `/ar` has a defined interface and undefined content. Decide it
or drop the locale to a later phase; the present state is the worst of both.

**F-11 · نماد اعتماد الکترونیکی is not in the paperwork playbook.** Worth
verifying against current rules, but eNamad generally requires specific published
pages, a verified landline and business registration, and it interacts with
obtaining a payment gateway. It has long lead time and nobody has costed it.

**F-12 · No bulk copy-approval path.** Fifty products × five copy fields × three
locales is 750 fields, presented one product at a time in tabs. Even at twenty
seconds a field this will not finish, and `product_published_state_check` keeps
every unapproved product invisible. **The single most valuable back-office screen
is the one that approves a hundred fields in ten minutes, and it is not
designed.**

**F-13 · `LocalBusiness` structured data is absent** while `PUB5` schedules
`Person`, `Course` and `Service` markup as its own phase. For one clinic in
Mashhad, `LocalBusiness` is the only one that earns traffic.

**F-14 · The expired reservation has no design.** A customer reads a PDP for six
minutes while held stock lapses. Frequent, user-visible, and `SHOP-D5` — which
designs empty and error states deliberately — does not list it.

### Over-built for this business at this stage

**F-15 · `curated_list` + `curated_list_item`.** `product.merchandising_rank`
already exists and is already the sort key of `product_public_catalog_idx`. And
`back-office.md` §5.6 specifies the same feature as a **toggle**. Two mechanisms
for one feature, one of which is already built. A boolean plus the existing rank
is the whole thing.

**F-16 · The `milestone` table**, with translations, `review_state`, `as_of` and
`source_note`, to render four numbers that change yearly — when `CO-D2` already
routes them to seed data reviewed in a pull request.

**F-17 · `space` duplicates `room`.** Two tables for one physical thing, joined
by a nullable FK, with no constraint that the names agree. `room_media` on the
existing table does it.

**F-18 · Persian typo tolerance and synonyms as the `SHOPX2` exit gate.** Fifty
products, `pg_trgm` already installed in `0003`, and a real Persian synonym layer
(ی/ي, ک/ك, ZWNJ, transliterations) is a linguistics project. The gate is also
untestable as written — right for *which* query?

**F-19 · Replenishment prediction appears in two documents** (`STU3`,
`shop-experience-iteration.md` §3.5) for a shop with no order history and no
prospect of one for a year.

**F-20 · Instalments in shop v1.** Academy needs them; the shop does not, and
§6 item 6 admits it is not decided whether they are offered at all. A launch item
one unanswered question away from being a second payments integration.

**F-21 · `space_media` and the new `*_object_key` columns fork `product_media`,**
which already carries checksum, mime, dimensions, derivatives, provenance, rights
and translated alt text. Generalise the existing pattern or justify the fork.

### Sequencing

**F-22 · `SHOPX4` — the outbox drain — is scheduled fourth**, behind Persian typo
tolerance, in a document that calls it "the largest single hole in the
experience." See F-1.

**F-23 · `PUB0` is not startable as written.** It creates FKs to `room`,
`service` and `practitioner` — all Booking's schema, none of which exists. Either
those columns are explicitly nullable and backfilled, or `PUB0` sits behind all
of Booking.

**F-24 · `PUB0` authorises staff screens `content-operations.md` §5 decided not
to build.** The correction was pasted into §3 and the phase list was never
updated. A reader following §7 builds the wrong plan.

**F-25 · `studio.md` `STU0` and `30-next-block-plan.md` Phase D own the same
screen** under two names with two phase ladders. `back-office.md` §5.10 notes a
third overlap with `/admin/customers`.

**F-26 · Three build orders for the same eight screens.**
`content-operations.md` §7, `content-operations.md` §9 and `back-office.md` §6
already disagree — §6 adds `BO0`, which §7 omits. Delete §7 and §9; point at
`BO0…BO8`.

**F-27 · Every `*-D*` identifier is written in decided voice, and several are
proposals.** `SHOP-D1` is Q39 "suggested: yes". `SHOP-D4` is Q44, unanswered.
`PUB-D6` is Q58/Q59, marked BLOCKING. Add a status to each heading —
`decided` or `proposed, pending Q39` — before any of them is cited in a commit
message.

---

## 3. Making registration a non-blocker

The maintainer's constraint is that SMS, eNamad and gateway paperwork progress in
parallel and must not gate the build. Two moves achieve that, and both follow a
pattern the codebase already uses.

### M-A · Build the worker, not the provider

`COM-D9` already puts ZarinPal behind a `PaymentGateway` interface. Do the same
for notifications:

- A `NotificationChannel` interface with `send(message, locale)`.
- A **console adapter** for development and a **recording adapter** for tests.
- The worker itself — drain, ordering, retry with backoff, dead-lettering,
  once-only delivery keyed on the outbox row, and per-locale templates for fa/en/ar.
- The `/admin/settings` outbox panel with failures and a retry action.

All of that is buildable and testable today. Only the Kavenegar or SMS.ir adapter
waits on registration, and it is one file. **F-1 stops being blocked.**

### M-B · Make the booking deposit optional at launch

Deposits are the only part of Booking that touches money, and money is the part
that waits on paperwork. Two changes, both cheap:

1. **`deposit_rials = 0` means confirm immediately** rather than hold-for-payment.
   The `held` state and both exclusion constraints stay exactly as `BOOK-D2` and
   `BOOK-D4` specify — only the transition trigger differs. Reversible by editing
   one number per service.
2. **When deposits do switch on, they are credit, not a refundable payment.**
   Non-refundable, but transferable to a rescheduled appointment. This removes
   Booking's dependency on `COM7` refunds entirely (F-6), is easier to explain to
   a customer, and is ordinary practice in Iran.

**Booking can then ship end to end with no registration, no gateway and no
refunds.** Given that bookings are the stated first priority, this is the single
highest-value change in this document.

---

## 4. Proposed sequence

> **Revised 2026-08-29 after the maintainer confirmed the site is local only and
> has taken no orders.** `M1` and `M2` swap partially: the back-office
> *foundation* still comes first, but the first screen built on it is Booking's
> day view, not the order queue. See §8. The rest of the sequence stands.

Ordered by the maintainer's stated priority — clinic and bookings, then product
sales, then academy — and by what can proceed without registration.

### M0 · Foundations — nothing else is honest without them

| Packet | Contents |
|---|---|
| **F0.1** | Content-Security-Policy, shipped independently of the admin origin (F-2) |
| **F0.2** | The notification worker per M-A: interface, console adapter, retry, dead-letter, fa/en/ar templates (F-1) |
| **F0.3** | Decide and record: VAT treatment, the rial/toman display rule, the Arabic content policy (F-8, F-9, F-10) |
| **F0.4** | Reconcile the documents: delete `content-operations.md` §7 and §9, mark every `*-D*` with `decided` or `proposed`, resolve `STU-D3` against `back-office.md` §5.1 in the back office's favour (F-7, F-26, F-27) |

**Exit gate:** an order placed in development produces exactly one recorded
notification, retried on failure and dead-lettered after N attempts, with no
provider account in existence.

### M1 · Back office minimum — because you are currently the back office

| Packet | Contents |
|---|---|
| **BO0** | Admin origin and middleware, the shared list component, re-authentication, audit on every mutation, the `/admin` day screen |
| **BO1** | Orders: list, detail, fulfilment states, shipment creation |
| **BO1b** | Transfer refinements: copy-to-clipboard on the expected amount, an over-24-hours filter, the customer's other orders |

**Deferred from M1:** `BO2` prices, until C-1's missing schema is built or the
screen is descoped to per-variant editing.

**Exit gate:** a full order lifecycle is run from the screens with no database
client, and every mutation writes an audit row.

### M2 · Booking — the actual daily bottleneck

`BOOK0` … `BOOK6` as written in `booking.md`, with two amendments:

- `BOOK0` adopts M-B: `deposit_rials = 0` confirms immediately.
- `BOOK5` and `back-office.md` `BO6` are **one packet**, not two. The staff day
  view is an admin screen.

`BOOK6` reminders are unblocked by `F0.2`.

**Exit gate:** unchanged from `booking.md` — plus a booking completed end to end
with no payment provider in existence.

### M3 · Content — parallel from day one, never a phase

Runs alongside M0–M2. It is the longest-lead item and it is not on the critical
path of any code.

| Packet | Contents |
|---|---|
| **CON1** | Storyderm catalogue extraction into a coverage matrix (product × field, each cell filled-with-page-reference, empty, or conflicted) |
| **CON2** | The intake brief answers — concern list first, then the practice surface |
| **CON3** | **The bulk approval screen** (F-12) — approve by brand, keyboard-driven, a hundred fields in ten minutes. This is the `BO4` subset that actually matters |

**Never generated, under any circumstance:** `ingredients`, `irc_code`, and
anything contraindication-shaped. Extract verbatim or leave empty.

### M4 · Make the shop sellable

| Packet | Contents |
|---|---|
| **SELL1** | Legal pages: terms, privacy, returns, shipping, contact with address (F-3) |
| **SELL2** | Shipping rates and bank details entered; `LocalBusiness` structured data (F-13) |
| **SHOPX0** | Variant selection in page, with the no-JS `GET` form path stated explicitly |
| **SHOPX1** | PDP structure — but only against products CON1 and CON3 have actually filled |
| **SHOPX4** | Order confirmation live, once a provider adapter exists |

**Cut from the shop iteration:** `SHOPX2` synonym work (F-18), the replenishment
prompt (F-19), instalments (F-20). Move photography out of `SHOPX5` "polish" and
into M3, where it belongs — it is content with the longest lead time in the plan.

### M5 · Public surfaces, reduced

| Packet | Contents |
|---|---|
| **PUB-a** | Her story, credentials and brand relationships **as seed data**, per `CO-D2` — no `milestone` table, no `space` table (F-16, F-17) |
| **PUB-b** | Testimonials, with two real FK consent columns rather than the polymorphic table (F-5) |
| **PUB-c** | Before-and-after — **only after F-4 is designed and built** |

`PUB4` (Academy surfaces) is removed from this plan and becomes a follow-on to
M6. `PUB5` structured data is folded into SELL2.

### M6 · Academy

`ACAD0` … `ACAD3` only — catalogue, cohorts, enrolment, instalments, attendance,
certification. Instalments are built here, at the payment layer, where the shop
can later reuse them.

**`ACAD4` (recorded lessons, VOD, watermarking, concurrent-session limits) is
deferred** until a provider is chosen and demand is demonstrated. It is the
largest build in the Academy plan and the least validated.

---

## 5. The question list, reduced

73 questions queued in front of one person who does not have time to write
product copy is a stall, not a plan. Most of the STRUCTURAL questions have a
defensible default that the maintainer should take himself, recording the
reversal cost.

**These eight genuinely need a human answer before code:**

| Q | Question | Why it cannot be defaulted |
|---|---|---|
| Q5 | Does a practitioner leave a client mid-treatment? | `BOOK-D3`; doubles capacity; cannot be retrofitted |
| Q14 | The intake questions, and which block a booking | Medical wording; hers alone |
| Q45 | Shipping rates | No order completes without at least one |
| Q47 | Bank account details | Same |
| Q49 | Does she accept AI-drafted copy she approves? | The critical path of the entire content problem |
| Q58 | The exact relationship to each brand | A legal claim; flattening these is a real exposure |
| Q61 | Before-and-after consent documents | Cannot be worked around, and gates PUB-c |
| Q20/21 | Which courses certify, and the attendance threshold | Defines what a certificate means |

**Not asked, and should be:** which SMS provider (F-1), the VAT treatment (F-8),
and the Arabic content policy (F-10).

**Everything else** should be decided by the maintainer with a one-line default
and a stated reversal cost, and revisited only if she objects.

---

## 6. What this document does not change

The bounded-context rule, the exclusion-constraint approach, `ACAD-D9`'s package
manifest, `BO-D2`'s one-application-two-origins, the seed-data-over-CMS posture of
`CO-D4`, and every existing decision identifier in the shipped packets. Where this
document disagrees with a design document it says so by finding number; where it
is silent, the design document stands.


---

## 7. Decisions taken, 2026-08-29

Recorded here and reflected in the amended documents.

| # | Decision | Effect |
|---|---|---|
| **7.1** | The notification worker is built behind a `NotificationChannel` interface with a console adapter, before anything else | F-1 closed without a provider account. The Kavenegar or SMS.ir adapter is one file, added when registration completes |
| **7.2** | `deposit_rials = 0` confirms a booking immediately (`BOOK-D14`) | Booking ships with no gateway, no SMS account and no registration |
| **7.3** | Deposits, when switched on, are credit rather than refundable money (`BOOK-D16`) | Booking never calls `COM7`; F-6 closed |
| **7.4** | The cancellation policy is settled at 24h free / 12-24h free once / under 12h retained as 90-day credit (`BOOK-D16`) | Q13 and Q16 answered |
| **7.5** | **No practitioner-choice feature in v1** (`BOOK-D15`) | `practitioner_choice` column, enum and picker deleted. Q3 and Q9-Q11 answered |
| **7.6** | Before-and-after does not ship until consent revocation actually revokes | F-4; signed short-TTL URLs plus cache invalidation must be designed first |
| **7.7** | `PUB0`-`PUB5` moves behind the back office and Booking; `milestone` and `space` are cut | F-16, F-17, F-23 |
| **7.8** | `curated_list` cut; `merchandising_rank` plus a toggle does the job | F-15 |
| **7.9** | `ACAD4` (VOD, watermarking) deferred; instalments stay in Academy and leave shop v1 | F-20 |

### 7.5a - What `BOOK-D15` costs later, stated honestly

Reversing this is additive: one column, one enum, one control, and no
appointment already taken is touched. That is why it is a safe deletion.

Two consequences follow from it that are **not** deletions:

- If Ms. Fazaieli is effectively the only practitioner, her hours are the entire
  capacity of the business. `BOOK-D3`'s interleaving question - does a
  practitioner leave a client during a mask or a peel - becomes the **only** lever
  that raises capacity without hiring. It moves from important to critical.
- With one practitioner and three beds, the bed axis does not bind today.
  `BOOK-D1`'s second exclusion constraint stays regardless: it costs one
  constraint, and it is the part that cannot be retrofitted once appointments
  exist.

---

## 8. The back office - what it is, and what you have once it exists

### 8.1 What is true today

To see an order you need a database client. To confirm a bank transfer you need a
database client. To change a price you need a database client. Mahdieh can see
**nothing**, and the business therefore has exactly one operator, who is the
developer.

That is the constraint the back office removes. It is not a feature; it is the
difference between a system and a demonstration.

### 8.2 What `BO0` actually is - mostly not screens

`BO0` is four pieces of plumbing and one component. Get them right and every
screen after it is roughly a day's work. Get them wrong and eleven screens each
invent their own table.

| Piece | What it is | Why it is in the foundation |
|---|---|---|
| **The origin split** | `admin.fazaieli.ir`, middleware refusing `/admin/*` on the public host and storefront routes on the admin host, session cookies scoped to the admin host | `BO-D2`. It is the security boundary, and retrofitting cookie scope after sessions exist is painful. In development this is `admin.localhost`, since nothing is deployed yet |
| **The CSP** | A real Content-Security-Policy on both origins | F-2. It is a configuration change and it should not wait for the rest of `BO0` |
| **The audit wrapper** | One function every admin mutation passes through, writing actor, action, entity and before/after to `audit_log` | `BO-D4`. If it is not there from the first action it is never retrofitted, and "who changed that price" becomes unanswerable |
| **Re-authentication** | TOTP re-prompt for settling money, committing a price batch, granting a role, revoking consent | `BO-D3`. The mitigation that survives a stolen laptop, which is the likelier threat here |
| **The list component** | Title and count, `/`-focused search, filter chips in the URL, optional bulk selection, a dense table with tabular numerals and status chips, numbered pagination | **This is the entire cost of the back office.** Eleven screens reuse it |

**The list component is where the no-hand-rolled-UI rule bites hardest.**
`back-office.md` §4.1 describes it as a bespoke component and names no primitive.
It should be built on the existing shadcn data table, the command primitive for
`/`-search, and the density tokens from packet 11 - not from scratch. This is
worth stating in the packet, because it is the most likely drift in the whole
back office.

### 8.3 The revised order, and why it changed

`back-office.md` §6 puts orders at `BO1`. That was written before it was
established that **the site is local only and has taken zero orders.**

Building an order queue first means building an administration screen for an
empty table, while real appointments are being taken by hand over WhatsApp every
day. So:

| Order | Packet | What it gives |
|---|---|---|
| 1 | **`BO0`** | The foundation above, plus the `/admin` day screen |
| 2 | **`BOOK0`-`BOOK5`** | Booking, including its staff day view - `back-office.md`'s `BO6` merges into `BOOK5` rather than existing twice |
| 3 | **`BO1`** | Orders and transfers - built when the shop is about to go live, not before |
| 4 | **`BO4` subset** | The bulk copy-approval screen (F-12), alongside the content track |
| 5 | Everything else | `BO2` prices (after C-1's migration), `BO3` inventory, `BO5` content, `BO7` academy, `BO8` customers |

`content-operations.md` §8 already states the right rule - *"nothing gets a screen
until someone has needed it twice"* - and its own phase list ignores it. The
order above applies the rule.

### 8.4 What you have when steps 1 and 2 are done

Mahdieh opens `admin.fazaieli.ir` on her phone, signs in with a code from her
authenticator, and sees one screen that says what needs her today - each panel a
count and a link, and each saying "nothing" rather than disappearing when a queue
is empty.

She taps through to today's schedule: a column per practitioner, time down the
side, appointments as blocks carrying client, service and status. She can take a
booking from someone who telephoned, mark a client completed, mark a no-show,
block an hour for a delivery, and set the clinic's closed days so nothing is ever
confirmed on a holiday.

Every one of those actions is recorded with who did it and when.

**That is the WhatsApp queue closed**, which is the thing this project exists to
remove, and it happens without a payment gateway, an SMS account or a business
registration.

### 8.5 What it is still not

No orders (there are none yet), no price tooling (C-1's migration is owed), no
content approval (that arrives with the content track), and no customer 360.
Those are steps 3 to 5, and each should wait until someone has asked for it
twice.
