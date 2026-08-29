# Decisions needed - the consolidated question list

**Amended by [`35-plan-review-and-resequencing.md`](35-plan-review-and-resequencing.md)** (2026-08-29): questions 1, 3, 13 and 16 are answered by `BOOK-D14`, `BOOK-D15` and `BOOK-D16`; the list is reduced to the eight that genuinely need a human answer, and three missing questions are added - SMS provider, VAT treatment, and the Arabic content policy.

**Date:** 2026-08-27
**Purpose:** Every question across Booking, Academy, Shop, the public surfaces, content operations and the back office that must be answered before the work is unambiguous
**Sources:** the `§10` sections of [`system-design/booking.md`](system-design/booking.md), [`system-design/academy.md`](system-design/academy.md), [`system-design/studio.md`](system-design/studio.md), [`system-design/storefront/public-surfaces.md`](system-design/storefront/public-surfaces.md), [`system-design/storefront/shop-experience-iteration.md`](system-design/storefront/shop-experience-iteration.md), [`system-design/content-operations.md`](system-design/content-operations.md), [`system-design/back-office.md`](system-design/back-office.md)

---

## How to read this

Questions are grouped by area and marked by consequence:

| Mark           | Meaning                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------- |
| **BLOCKING**   | Nothing in that area can start until it is answered                                      |
| **STRUCTURAL** | Answerable later, but changing the answer later is expensive - a migration, or a rewrite |
| **TUNING**     | A number or a preference; changing it later is cheap                                     |
| **MATERIAL**   | Not a decision at all - a photograph, a document, or words only she can write            |

A question with a **suggested answer** means the documents already recommend one;
saying "yes, as recommended" is a complete answer.

---

## A · Booking

### A1 · Deposits **BLOCKING**

1. **Does booking take a deposit?** _Suggested: yes._ It reuses the payment path
   already built, and makes the cancellation policy self-enforcing rather than an
   argument over WhatsApp.
2. **How much, per service?** A consultation and a two-hour facial probably
   differ. Low enough not to deter a first-time client.
3. **Is the deposit credited against the treatment price**, or is it a separate
   booking fee?
4. **What happens to a no-show's deposit?** Forfeit, credited to a future
   booking, or discretionary? This is customer relations, not engineering.

### A2 · Capacity and the dwell-time model **STRUCTURAL**

5. **Does a practitioner ever leave a client mid-treatment** - during a mask or a
   peel - to begin or continue work on another client? _This is the single
   highest-value question in the whole booking context._ Yes roughly doubles
   effective capacity; no is entirely legitimate and must be honoured.
6. If yes, **does it depend on the room?** Two clients in the same room versus
   across two rooms may feel very different.
7. **Which services have passive steps, and how long are they?** For each
   service: total duration, and which minutes are hands-on.
8. **How long is the turnover buffer** between clients - cleaning, changing,
   resetting the bed?

### A3 · Practitioners and choice **STRUCTURAL**

9. **May a customer choose a practitioner by name?** _Suggested: per-service._
   Consultations by name, routine treatments pooled - otherwise Mahdieh becomes
   the bottleneck the site exists to remove.
10. If named booking is offered, **does it cost more?**
11. **Which practitioners perform which services?**
12. **What are each practitioner's working hours**, and how is leave normally
    requested and recorded?

### A4 · Policy and intake **BLOCKING for BOOK3**

13. **How many hours before an appointment may a client cancel for free?**
14. **What are the intake questions?** Only she can write these.
15. **Which intake answers should block a booking outright** rather than being
    recorded as a note?
16. **May a client reschedule freely**, or only within the free-cancellation
    window?

### A5 · Services **MATERIAL**

17. **The service list**: name, duration, price, deposit, description, what to
    expect, preparation, aftercare.
18. **Photographs of the treatment rooms**, including the **Forlle'd room**.
19. **Which room is which**, and does any service require a specific room?

---

## B · Academy

### B1 · Structure **BLOCKING**

20. **Which courses exist today**, and which are certifying?
21. **What attendance threshold earns a certificate?**
22. **Are there prerequisites** between courses?
23. **Are cohorts always in Mashhad**, or do they travel?

### B2 · Money **STRUCTURAL**

24. **Are instalments offered?** _Suggested: yes_ - expected in Iran and painful
    to retrofit.
25. If yes, **how many, over what period, and how much up front?**
26. **What happens when an instalment is missed?** _Suggested: a conversation, not
    an automatic lockout._
27. **What is the refund policy** - before the cohort starts, after the first
    session, after the last?
28. **Is a deposit required to hold a seat?**

### B3 · Certification and the practitioner loop **STRUCTURAL**

29. **Does certification grant professional pricing automatically, or on her
    confirmation?** _Suggested: her confirmation_ - it changes what somebody may
    buy and at what price.
30. **What does the certificate say**, and what should the public verification
    page show?
31. **Should past students be back-filled** with enrolments and certificates?
    That is data entry with a real cost, and worth deciding before rather than
    during.

### B4 · Video **BLOCKING for ACAD4**

32. **Which Iranian VOD provider?** Nothing about recorded lessons can be built
    against nothing.
33. **Are recorded courses sold separately**, bundled with in-person cohorts, or
    used only as supporting material?
34. **What is the tolerance for piracy?** The posture is deterrence, not
    prevention, and that affects pricing.

### B5 · Material **MATERIAL**

35. **Course descriptions, outcomes, prerequisites, levels.**
36. **Graduate outcomes** - who is doing what now, and their permission to say so.
37. **Classroom and workshop photographs.**
38. **A sample or preview video**, if there is one.

---

## C · Shop iteration

### C1 · The buy path **STRUCTURAL**

39. **Should size selection happen in-page** rather than as a navigation?
    _Suggested: yes_ - it is the single highest-value flow change.
40. **What happens after adding to cart** - a drawer, a toast, or a page?
    _Suggested: confirmation with two clear paths, continue or check out._

### C2 · Merchandising **TUNING**

41. **Which products does she personally recommend?** The curated section is the
    strongest merchandising unit the shop has.
42. **Should skin type be a browsing axis** alongside concern? _Suggested: yes_ -
    the schema already supports it and nothing reads it.
43. **Are there product bundles or routines** to sell as a unit?
44. **Should stock levels be shown**, and below what threshold?

### C3 · Money **STRUCTURAL**

45. **Shipping rates** - pickup, Mashhad courier, nationwide post. Still
    outstanding; without at least one, no order can be placed.
46. **Is there a free-shipping threshold?**
47. **Bank account details** for transfers - name, bank, card, IBAN.
48. **Are instalments offered on large baskets?** The same machinery Academy
    wants.

### C4 · Content **MATERIAL, and the largest single blocker**

49. **Product copy** - description, promise, usage, ingredients, suitable-for, for
    fifty products. _Suggested: AI drafts, she approves through the workflow that
    already exists._ Is that acceptable to her?
50. **Ingredient explanations** for the actives she considers important.
51. **Product and lifestyle photography** beyond the packshots.

---

## D · Landing and the public surfaces

### D1 · Her **MATERIAL**

52. **The portrait**, and permission to use it prominently.
53. **Her story in her own words**, 120-180 Persian words. Nobody else can write
    this.
54. **The milestone numbers** she will stand behind - years practising, years
    teaching, students trained, certificates held.

### D2 · Credentials **MATERIAL**

55. **The certificates**: scans, issuer, title, year, discipline.
56. **Which may be published**, and **which have lapsed** - showing a lapsed
    certification as current is a claim that is not true.
57. **What each one means** in one line, for a reader who does not know the
    issuer.

### D3 · Brands **BLOCKING for the brand section**

58. **The exact relationship to each brand** - official representative,
    authorised stockist, certified practitioner, training partner. These are
    different claims with different weight and should not be flattened into a
    logo strip.
59. **Since when**, for each.

### D4 · Proof **MATERIAL, and consent-gated**

60. **Testimonials**, sorted into client, customer and student - with attribution
    and consent.
61. **Before-and-after cases** with **written consent documents**. Without
    consent this section cannot ship, and that is not negotiable.
62. **How much identifying detail** may a testimonial carry - first name and
    initial, full name, photograph?

---

## E · Content operations

63. **Is waiting for a deploy acceptable** for her story, certificates, rooms and
    brand relationships? _Suggested: yes_ - they change a few times a year.
64. **Does she want to write product copy, or approve drafted copy?** Both are
    supported; the screens differ.
65. **How are prices actually decided today** - a percentage on cost, a fixed
    markup, per-brand rules? The bulk tooling should match how she already thinks.
66. **How often do prices change in practice?**

---

## F · Back office

67. **Is `admin.fazaieli.ir` acceptable** - one application, separate origin -
    or is a genuinely separate deployment wanted despite the cost? _Suggested:
    the former;_ see `BO-D2`.
68. **Who besides Mahdieh gets access?** Does anyone need `staff` without
    `admin`?
69. **Should the admin be in Persian, English, or both?** It is an internal tool
    and this has never been asked.
70. **Is an IP restriction or VPN acceptable** on the admin origin?
71. **How long may a staff session last** before re-authentication?
72. **Which screen would save her the most time today?** The build order assumes
    orders and prices; she may know better.

---

## G · Sequencing - the one question behind all of them

73. **What is the next block?** The honest dependency is that the notification
    worker and refunds are small, are storefront work already needed, and unblock
    Booking's reminders and deposit returns. The options are:
    - **Finish the money path first** - worker, refunds, fulfilment. Everything
      downstream benefits.
    - **Start Booking** - accept that reminders and deposit refunds land later.
    - **Content and shop iteration first** - fix the pages that exist before
      adding pages that do not.
    - **Back office first** - so Mahdieh can run what already works without a
      developer.

    _Suggested: the first, then the fourth._ The money path is small and
    everything waits on it; the back office is what turns a working system into
    one she can operate.

---

## Answering efficiently

The fastest useful pass is: **A1, A2, B1, B2, C3, D3, F1, and G** - roughly
fifteen questions. Those unblock the largest amount of work. The **MATERIAL**
items can arrive gradually, since each blocks one section rather than a phase -
with the single exception of consent documents, which block the before-and-after
section entirely and cannot be worked around.
