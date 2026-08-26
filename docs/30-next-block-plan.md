# The next block — closing commerce, then density, then Booking

**Date:** 2026-08-26 · **Covers:** packets 9/10 (in flight) and the block after them
**Parent:** [`17-execution-ledger.md`](17-execution-ledger.md) — that file stays the queue; this one says what the next three pieces of work actually are
**Read first:** [`29-handoff.md`](29-handoff.md), then `AGENTS.md`

---

## The one guardrail that applies to every phase below

**A content-depth pass is being designed separately with the maintainer, and it
is not in this block.**

He has said the pages read as deserted for a commercial storefront — too little
copy, too few sections, too thin on product detail. He is right, and the answer
is being planned deliberately rather than improvised: which sections exist on
each surface, what data model carries them, what copy each needs and who writes
it.

So, for every phase in this document:

- **Do not add new page sections**, new content kinds, new taxonomy or new
  editorial surfaces. `R-8` is scoped to _composing what already exists_ on the
  PLP, and that is the only compositional change authorised here.
- **Do not extend the content spine** beyond the four tables it has.
- If a phase feels thin because the page is thin, that is the observation
  landing where it should — record it in the review log and carry on. Filling it
  in ahead of the plan produces exactly the sections the plan then has to
  unpick.

Everything else in `AGENTS.md` and the decision docs continues to apply
unchanged. Nothing below authorises a departure from any of it.

---

## Phase A · Land the cart, and close the active block

**Status:** the work exists, uncommitted — 19 files under `src/modules/cart/`,
migration `0007` (correction `C5`), TanStack Query and Zustand installed.

**This is packets 9 and 10 together**, which the ledger separates. The merge is
accepted rather than unpicked, because the hard half is evidently done: the
service takes `FOR UPDATE` on the inventory row, and the integration suite
already asserts concurrent carts cannot oversell, an absolute quantity change
makes a retry idempotent, removing an already-removed line is success, an
expired reservation stops counting, and one cart cannot touch another's line.
That is `COM1`'s exit gate.

### A1 — Close the TanStack Query first-consumer gate

`architecture/data-and-state-ownership.md` pre-approves Query _conditionally_.
All five parts, recorded — not as code comments:

- [ ] name the route and user journey that requires browser refetching;
- [ ] demonstrate why Server Component navigation or refresh alone is
      insufficient;
- [ ] record query keys, cache lifetime, retry, invalidation, hydration, error
      and offline behaviour;
- [ ] focused integration **and browser** evidence;
- [ ] confirm no server-owned commerce state was duplicated into Zustand.

The natural home is a short `docs/31-cart-state-decisions.md`, or a section in
the packet's review entry. It lands **with** the cart commit.

### A2 — Write the review-log section before committing, not after

`8.10` is the whole reason this line exists. Every judgement call in the cart —
the reservation TTL, guest-cookie hashing, what a merge does on conflict, what
happens to a hold when a product is withdrawn mid-session — belongs in
`20-packet-review-log.md`, and anything needing the maintainer must reach the
generated register.

### A3 — Verify, then close

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test:unit`, `pnpm test:integration`
- [ ] re-seed after the integration run (`R-10`)
- [ ] browser pass: add, change quantity, remove, drawer, `/cart`, at
      390/768/1440, in Persian, **with JavaScript disabled** — a cart that only
      works with JS is a cart half this site's readers cannot use
- [ ] a guest cart survives a reload; signing in merges it once and not twice
- [ ] ledger rows 9 and 10 to done, with evidence
- [ ] `pnpm docs:open-items`

**Exit gate.** The vertical slice is walkable end to end on real data: browse →
filter → product → cart, server-rendered, in Persian, correct without
JavaScript. No checkout code exists.

---

## Phase B · Packet 11 — density, `R-3`

**Why first among the visual work:** `R-4`, `R-5` and `R-8` all render against
the tokens this changes. Doing them before it means doing them twice.

**The conflict is real and must be resolved rather than split the difference.**
`10-design-playbook.md` says 96px minimum between sections, hairlines not
shadows, no card grid — and _"if a screen starts looking like an admin
dashboard, it has gone wrong."_ The maintainer wants something tighter, nearer
Ant Design. `R-3` resolves it by surface: Landing stays editorial, the shop
surfaces go compact.

### B1 — Decide and document the density model

- [ ] A second spacing scale in `designs/tokens.css`, exposed through
      `@theme inline` — or a `data-density` scope on the shop routes. **One
      mechanism, chosen and written down**, not both.
- [ ] Amend `10-design-playbook.md`: the 96px rule becomes surface-conditional.
- [ ] Amend `25-design-system-adherence.md`: the room table gains a density
      column.
- [ ] Broadcast before building. This changes every shop screen.

### B2 — Apply it through tokens and component variants

- [ ] PLP, hub, PDP and cart pick up the compact scale. **No per-page
      `className` overrides** — that is the drift `AGENTS.md` exists to prevent,
      and one page tightened by hand is one page that drifts back.
- [ ] Hairlines survive the compaction. Compact means _less air between things_,
      never _more chrome around things_.
- [ ] The class-compilation gate stays green — a new spacing token that compiles
      to nothing is exactly what it catches.

### B3 — Then the cheap wins that were waiting on it

- [ ] `R-4` — the product tile: `object-contain` is already applied on the PDP
      (`8.3`); bring the listing tile with it, plus the brand marks and the size
      ladder.
- [ ] `R-7` — sticky facet rail, desktop breakpoint only (mobile puts the rail
      _below_ results by decision `7.8`), inner scroll using logical properties.
- [ ] `R-6` — the price filter's Apply button. Recommended resolution is
      _everything live_, with the `GET` form retained underneath as the no-JS
      path.
- [ ] `R-8` — compose the top of the PLP. **Composition only** — see the
      guardrail. No new sections.
- [ ] `R-2` — hold scroll position across a filter change, and give a keyboard
      or screen-reader user something that says it happened.

**Exit gate.** The shop surfaces are visibly tighter, the Landing is untouched,
every change came from a token or a variant, and a browser pass at
390/768/1440 in Persian confirms no overflow and no lost hairlines.
`R-1` (infinite scroll) is **not** in this packet — it is coupled to `R-2` and
wants its own pass.

---

## Phase C · Packet 12 — Booking

**Why this and not checkout.** Checkout writes permanent financial records under
policy the owner has not settled, and it is gated behind Phase 0 paperwork that
no code shortens. Booking is not gated on anything except being built — and the
queue this whole site exists to replace is Instagram → WhatsApp, most of which
is people asking for **appointments**.

**It does not start with code.** There are no booking tables, and there is no
plan document. `03-domain-model.md` §3 has the bounded context and `D4` records
the design intent — PostgreSQL range types and exclusion constraints for
multi-resource double-booking — and nothing has been built against it.

### C1 — Write `docs/system-design/booking.md` first

Following the shape of the storefront plans: outcome and journeys, routes and
ownership, the schema, the invariants, a phased task list, test scenarios, an
exit gate. It must settle at least:

- the resource model — `03-domain-model.md` §7 records **3 practitioners, 2
  rooms, 3 beds**, and a service that needs a practitioner _and_ a bed is the
  reason exclusion constraints are the design;
- how a slot is offered, held and confirmed, and what expires;
- Jalali rendering over `timestamptz` storage (hard rule 2), and what a
  displayed slot means across a DST-free but Jalali-calendared year;
- what the customer sees when nothing is available — absence is a designed
  state here too;
- whether a booking takes payment or a deposit. **If it does, it inherits every
  checkout gate** and stops being unblocked. Decide this explicitly and early.

### C2 — Schema and migration

- [ ] Tables, then `pnpm db:generate`, **read the SQL**, commit, `db:migrate`.
- [ ] The double-booking invariant enforced **in the database**, not in
      application code, and proved by a concurrent integration test the way the
      cart's oversell test does it.

### C3 — Reads, routes, screens

Server-rendered, exact-locale, correct without JavaScript, using the existing
component library. `resolveCartOwner`'s pattern is the precedent for identifying
a guest.

### C4 — Verify and close

Integration suite, browser pass, review-log section, ledger row.

**Exit gate.** A customer can see genuinely free slots and hold one, the
database refuses a double-booking under concurrency, and nothing about money has
been invented.

---

## What is deliberately not in this block

| Work                                   | Why                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| Checkout, payment, settlement, returns | Gated on Phase 0 paperwork and the owner's policy decisions. `ticket 7`               |
| `R-1` infinite scroll                  | Coupled to `R-2`; wants its own pass once density has settled                         |
| `R-4a` three.js product spin           | Off the PLP for a stated reason. PDP-only, post-launch, and only when an asset exists |
| The content-depth pass                 | Being designed with the maintainer. See the guardrail at the top                      |
| Academy, Studio, Shop Relay            | After the commerce and booking verticals                                              |
| Forlle'd and Thalgo catalogues         | No usable imagery. The manifest format takes them when assets arrive                  |

---

## Running in parallel, and not by an agent

Phase 0 is the real critical path to taking money: eNamad, ZarinPal, business
licence, and the terms/privacy/returns pages. So are the items in the ledger's
register — **43 of them** — of which the ones that block the most are Storyderm
image rights, real prices and product sheets, the WhatsApp number, and the
`LocalBusiness` address and telephone.

No packet below shortens any of them.
