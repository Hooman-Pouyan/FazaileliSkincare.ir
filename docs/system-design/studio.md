# Studio - phased implementation plan

**Status:** Review-ready; no runtime implementation is authorized by this document
**Updated:** 2026-08-27
**Scope:** The customer's unified view across Commerce, Booking and Academy - a read model that owns no writes
**Depends on:** [`booking.md`](booking.md), [`academy.md`](academy.md), [`cart-checkout-payment-fulfilment-and-returns.md`](cart-checkout-payment-fulfilment-and-returns.md)
**Decision inputs:** [`../03-domain-model.md`](../03-domain-model.md) §1, [`../19-navigation-decisions.md`](../19-navigation-decisions.md) `N-2`

---

## 1. Goal and stopping boundary

**The job.** Answer one question in one screen: _where am I with her?_

A customer of this institute is not three separate customers. They have a
protocol from a consultation, products arriving, an appointment next week and
perhaps a course in the autumn. Today those live in three places that do not know
about each other. Studio is where they become one relationship.

**The defining constraint.** `../03-domain-model.md` §1 states that Commerce,
Booking and Academy never import each other's types, and meet in exactly two
places: the shared **Payment** abstraction, and this view. Studio is **a read
model that owns no writes.**

That is what makes it safe and cheap. It has no migrations, no transactions and
no invariants of its own. It cannot corrupt anything. It can ship the day the
second context exists, and improve as the third arrives.

**In scope.** A composed dashboard; deep links into each context for anything
actionable; the settings that `/account` holds today.

**Out of scope.** Any mutation. If Studio needs a button, that button posts to
the owning context's Server Action - it does not grow a service of its own. The
moment Studio writes, it stops being a read model and becomes a fourth context
with three sets of invariants to honour.

---

## 2. Decisions

### STU-D1 - Studio absorbs `/account` rather than sitting beside it

`N-2` deferred this until Booking and Academy existed, with the gap recorded as
_"whether a customer eventually wants one door or two."_

**One door.** Two rail entries both meaning "your things" makes a customer choose
between them before they know the difference, and every wrong guess is a
navigation they did not need. `/studio` becomes the destination; the current
`/account` content becomes its settings section, and `/account` redirects there
permanently.

This is a `N-2` re-review outcome and should be recorded as such in
`19-navigation-decisions.md` when it lands.

### STU-D2 - Every panel is owner-scoped in its own query, not filtered afterwards

Studio reads three contexts, so it is three chances to leak somebody else's data.
Each read takes the viewer and puts them in the `where`, exactly as
`account.reads.ts` already does. There is no "fetch then filter" anywhere in this
module.

### STU-D3 - A missing context degrades to absence, never to an error

Studio is composed of panels that come from modules which may not exist yet, may
be empty for this customer, or may fail. A failing Booking read must not blank
the page for somebody who came to look at their order.

Each panel resolves independently. An empty panel is omitted; a failing panel
renders its own quiet fallback. The page has no single query it cannot survive.

### STU-D4 - Panels are ordered by urgency, not by module

The order is what is happening soonest, not Commerce-then-Booking-then-Academy.
An appointment tomorrow outranks a course starting in Mehr, which outranks an
order that arrived last week.

Ordering by module would be organising the page around how the software is
built, which is exactly what `AGENTS.md` warns against when it says a screen
should not read like an admin dashboard.

### STU-D5 - Studio never invents a fact

If replenishment timing is uncertain, it says nothing rather than guessing a
date. A dashboard that is confidently wrong about when someone runs out of a
serum is worse than one that stays quiet, because the customer stops trusting the
rest of the page too.

---

## 3. Panels

| Panel                      | Source context | Shows                                                                                                        | Actionable via                  |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| **Next appointment**       | Booking        | Date and time in Jalali, service, practitioner, room, preparation notes                                      | Reschedule / cancel, in Booking |
| **Your protocol**          | Commerce       | Current phase, what it contains, weeks elapsed                                                               | The protocol page               |
| **Running low**            | Commerce       | Items approaching depletion, derived from variant size and order history - only when confident, per `STU-D5` | Add to cart                     |
| **Orders in flight**       | Commerce       | Anything not yet delivered, with tracking                                                                    | Order detail                    |
| **Awaiting your transfer** | Commerce       | An order awaiting a bank transfer, with the exact amount                                                     | The transfer panel              |
| **Your course**            | Academy        | Next session, attendance so far, progress                                                                    | Cohort page                     |
| **Certificates**           | Academy        | Issued certificates with their verification links                                                            | Public verify page              |
| **Settings**               | Identity       | Name, phone, language, addresses                                                                             | In place                        |

**Empty state.** For a brand-new customer the page has nothing to compose, so it
is not a dashboard with eight empty boxes. It becomes a single invitation: book a
consultation, or browse the shop. The empty state is the more common state early
on and deserves to be designed first.

---

## 4. Module and file boundaries

```
src/modules/studio/
  studio.reads.ts     composition only; calls each context's published reads
  models/             the composed view model
  components/         one component per panel
  screens/            studio.screen.tsx
```

**Studio imports the other modules' published read functions and nothing else.**
No direct table access, no duplicated queries, no shortcuts into another
context's schema. If a panel needs data a context does not expose, that context
grows a read - Studio does not reach past it.

This is the rule that keeps the bounded contexts real rather than decorative.

---

## 5. Reads

```ts
getStudio(viewer, locale): Promise<StudioView>
```

One function, composing in parallel:

- `listMyAppointments` from Booking, taking the next one
- `getActiveProtocol`, `listOpenOrders`, `getPendingTransfer`, `getReplenishment`
  from Commerce
- `listMyLearning`, `listMyCertificates` from Academy
- `getProfile`, `listAddresses` from Account

Each wrapped so one rejection removes one panel, per `STU-D3`. `Promise.allSettled`,
not `Promise.all` - the difference is the whole decision.

---

## 6. Phased delivery

### STU0 - Compose what exists today

- [ ] `/studio` with the Commerce and Identity panels only: orders in flight,
      awaiting transfer, protocol if present, settings.
- [ ] `/account` redirects permanently, per `STU-D1`.
- [ ] The empty state designed first.

**Exit gate:** every panel owner-scoped and proved by attempting another
customer's data; a deliberately failed panel removes itself without blanking the
page.

### STU1 - Add Booking

- [ ] Next appointment panel, once `BOOK4` exists.

**Exit gate:** an appointment booked in Booking appears in Studio with no Studio
migration.

### STU2 - Add Academy

- [ ] Course progress and certificates, once `ACAD3` exists.

**Exit gate:** as above - a new context appears in Studio by composition alone.

### STU3 - Replenishment

- [ ] Derived depletion timing, shown only when confident, per `STU-D5`.

**Exit gate:** a customer with one order of a known size sees a plausible date; a
customer with ambiguous history sees the panel omitted rather than a guess.

---

## 7. What the maintainer must answer

1. **Is one door right?** `STU-D1` recommends absorbing `/account`; it is a
   navigation decision with his name on it.
2. **What should the first-time empty state offer** - a consultation, the shop,
   or both?
3. **How confident must replenishment be before it speaks?** `STU-D5` sets the
   principle; the threshold is a judgement about how it feels to be told.

---

## 8. Capability catalogue

**In v1** - composed panels, urgency ordering, graceful absence, settings.

**Deliberately later** - a timeline of everything that has happened; before and
after cases attached to the customer's own protocol, under the consent rules in
`../03-domain-model.md` §4b; saved payment preferences; household or gift
recipients; export of one's own data.

**Rejected** - notifications inside Studio, which is a read model and would need
write state to mark them read; anything that mutates, per `§1`.
