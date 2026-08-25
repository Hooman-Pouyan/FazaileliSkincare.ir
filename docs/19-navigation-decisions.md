# Navigation decisions — NAV1

**Date:** 2026-08-25 · **Closes:** the four prerequisites `shell-and-product-hub.md` §2 leaves open before `NAV1`
**Pattern:** interim decisions with re-review triggers, as used for research gates 4–6

---

## Why these are decided here

`SHELL-00` requires one canonical navigation definition before any shell composition
begins, and §2 blocks `NAV1` on four answers that decision-map tickets #4 and #5
were meant to supply. Those tickets are deferred, so the answers are recorded
here with the same discipline: an interim rule that ships and is honoured
everywhere, the gap it knowingly leaves, and what forces a re-review.

## N-1 · Mobile bottom navigation holds four items

**Decision.** Landing, Shop, Search, Account — in Persian reading order.

**Why these four.** A bottom bar is repeat-navigation furniture, and only the
commerce path is travelled repeatedly. Booking and Academy are destination
visits: a customer arrives at them deliberately, from the Landing's three room
doors or from command search, and rarely bounces between them. Putting five or
six rooms in the bar would spend the most valuable space on the least-used
movement and shrink every target below the 44px floor.

Cart is deliberately absent until its gate opens — `SHELL-04` forbids a
misleading production control, and an inert basket icon in the bottom bar is
exactly that.

**Re-review trigger.** Once real traffic exists, if Booking or Academy prove to
be repeat destinations rather than one-off visits.

**Gap carried.** No usage evidence exists. This is reasoned from the IA, not
measured.

## N-2 · `/[locale]/account` is where a signed-in customer lands; `/studio` stays planned

**Decision.** The shell's identity entry points at `/[locale]/account`. `/studio`
remains the planned cross-room aggregate room from the information architecture
and is not built.

**Why.** Phone-OTP sign-in works and currently lands nowhere. `/account` is the
customer's own settings and session surface — a real destination with an owner.
`/studio` is something else: a read model that unifies orders, bookings and
enrolments across rooms, which cannot exist before Booking and Academy do.
Naming one of them after the other now would guarantee a rename later.

**Re-review trigger.** When `/studio` is built in Phase 5, decide whether it
absorbs `/account` or sits beside it in the rail.

**Gap carried.** Whether a customer eventually wants one door or two.

## N-3 · Switching locale keeps the customer's place, and says so when content is missing

**Decision.** The locale switch navigates to the same path under the new locale.
If that route has no approved content it renders the `locale-unavailable`
composition, which explains that the Shop is not published in that language and
offers the Persian route.

**Why.** The alternatives are worse. Silently redirecting to Persian pretends the
switch did not happen. Redirecting to the locale's home page loses the product
someone was reading. Falling back to Persian copy under an English URL is the
fallback chain the exact-locale policy exists to forbid. An honest empty state
that keeps the URL is the only option that neither lies nor loses their place.

**Re-review trigger.** When English or Arabic catalogue content actually exists.

**Gap carried.** Whether to disable the switch entirely on pages known to be
untranslated, which needs a per-route availability read the shell does not have.

## N-4 · Command search lists rooms and the five canonical concerns, and nothing else

**Decision.** The command palette contains the four room destinations and the
five concerns from the reference seed, labelled from
`concern_translation.name` in the active locale, plus a search field.

**Why.** Concerns are the accepted browse axis and there are exactly five of
them, canonical and translated. Brands and categories are neither bounded nor
settled — the hub has not yet shown which are used, and a palette listing every
brand becomes a directory rather than a shortcut. Adding them later is additive;
removing them after people learn them is not.

**Re-review trigger.** After the hub ships and shows which axes people use.

**Gap carried.** No live product autocomplete. `SHELL-03` requires an amendment
to this plan and a rate-limited transport before that is built, precisely so it
cannot appear by accident.

---

## What this does not decide

The Shop Relay mega-menu stays deferred under `RELAY-01`, and the rejection of a
cross-room marketplace mega-menu recorded in `SHELL-00` stands. Cart placement
follows its own gate. None of these deferrals permit a second navigation array:
whatever is shown, it is rendered from the one manifest.
