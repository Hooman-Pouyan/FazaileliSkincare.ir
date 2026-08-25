# fazaieli.ir — decision map & build plan

**Updated:** 2026-08-24 (round 3 — stack finalised, brand palette sampled) · **Read this first**

---

## What this project is

One Persian-first (English and Arabic secondary, RTL-first) platform for the Mahdieh Fazaieli institute, with four surfaces that must feel decoupled but coherent:

- **Landing** — personal brand, credentials, official representation of Forlle'd / Storyderm
- **Shop** — skincare catalogue browsed **by concern first** → cart → order → rial payment
- **Booking** — facial and skin-therapy appointments across multiple practitioners and beds
- **Academy** — courses, in-person cohorts, packages, mentorship, certification

Based in **Mashhad**. Hosted inside Iran, paid in rials, built and maintained by one developer.

Confirmed from the account and the space: official representative of **Forlle'd** (Japan); also carries **Storyderm** (Korea) and **Thalgo** (France). Current funnel is Instagram (@fazaieli_skincare, ~7.4k followers) → WhatsApp — which is the queue this site is meant to replace.

---

## Decisions made

| # | Decision | Rationale | Reversibility |
|---|---|---|---|
| D1 | **Next.js 16.3 App Router** — final | Liara publishes a dedicated `nextjs` platform with its own docs tree; TanStack Start would deploy as a generic Node app with no Iranian documentation or support familiarity. **16.3 (Aug 2026), not 15** — `next/root-params` solves bilingual locale access with no prop-drilling, and Turbopack is default. | Medium — 2-year commitment |
| D2 | **Hard wall between fazaieli and coordeck** — separate repo, no shared package, no shared design language | Different company, different product, different universe. Coordeck was read once as a case study; six practices were carried over as *ideas* re-implemented from scratch (see ADR-001). Nothing else crosses. **fazaieli.ir is a storefront, not an admin dashboard.** | Absolute |
| D3 | **Drizzle ORM**, not TypeORM | TypeORM is a 2026 legacy pick. Your hard problems (money, double-booking) are solved in readable SQL. **Neon/Supabase are Postgres *hosts*, not ORM alternatives — and all are out: US-owned, no region near Iran.** | Cheap, before Phase 2 |
| D4 | **PostgreSQL 16 in Iran**, single instance | Range types + exclusion constraints solve multi-resource double-booking in the database | Low churn |
| D5 | **Trial Liara and ParsPack, then commit** | Both are correct answers; the app is a portable Docker container against Postgres, so a hello-world race settles it with evidence in one afternoon | Cheap by construction |
| D6 | **ZarinPal first**, behind a `PaymentGateway` interface | Fastest onboarding. **You have a registered company**, so a direct bank PSP (lower fees) is available later — the interface makes that a one-file change | Cheap |
| D7 | ⚠️ **Server-owned sessions in httpOnly cookies**; customers use phone/OTP only in v1; staff use provisioned email/password plus mandatory TOTP | The existing dashboard keeps JWTs in `localStorage`. Acceptable there; **not acceptable for a public storefront handling payments** — XSS becomes account takeover with money attached. Customer passwords add reset and recovery risk without improving the Iranian purchase path; privileged staff credentials earn that complexity and require a second factor. | Expensive later |
| D8 | **Integer rials** stored, Toman at the view layer | The most common money bug in Iranian ecommerce | Expensive later |
| D9 | **UTC storage, Jalali rendering** | Booking must be Shamsi; storing Shamsi is a trap | Expensive later |
| D10 | **Persian first; English and Arabic secondary** | Full i18n and RTL infrastructure from day one. Persian remains the source text; English and Arabic are maintained translations. | By design |
| D11 | **Browse by concern first** — acne, brightening, hydration, barrier repair | Type and brand become filters. Matches how a skincare customer actually thinks | Content-level |
| D12 | **Skincare only at launch**, schema open for healthcare | Catalogue models attributes flexibly so new categories need no migration | By design |
| D13 | **Vertical rail + command palette**, no cross-room/marketplace mega-menu, no card grid | Your brief; makes three spaces read as decoupled-yet-one. A separately approved, post-core **Shop-only Relay** may deepen Shop navigation without replacing the rail, PHP, or command palette. | Iterate freely |
| D16 | **Palette sampled from the institute, not from the Instagram templates** | The building is more elegant than the post graphics. Measured: lapis `#161B4A`/`#2D389A`, antique gold `#A27F34`, firouzeh `#2BB8D4`, deep teal `#24403E`, cool white `#F7F8F8`. The blue is Persian ultramarine, not navy; the green is teal, not bamboo sage | Design-level |
| D17 | **Gold, turquoise and champagne are dark-field colours** | Measured contrast: gold is 3.51:1 on white (fails) but 6.17:1 on lapis. The site alternates ink-on-white with deep lapis sections — the rhythm is derived, not imposed | Structural |
| D21 | **Direct bank transfer as a first-class payment method** | Decouples launch from eNamad/ZarinPal approval entirely. A matching remainder is allowed only when it is an explicit invoice adjustment included in the order total; claim expected amount is derived from the payment. ⚠️ Only a staff member seeing the real statement confirms; a customer receipt image is a claim, not proof. | Structural |
| D22 | **Customer-group pricing** — public · student · professional | Cheap now, expensive to retrofit. Groups with no row fall back to public, so only exceptions are entered. | By design |
| D23 | **Per-product price visibility** — `public` or `on_request` | Some products show «استعلام قیمت» routing to WhatsApp instead of a price. Never silently addable to a cart. | By design |
| D24 | **Bulk price tooling from the first admin build** | Rial pricing on imported stock moves with the exchange rate. Percentage adjustment by brand or category, previewed, committed as one audited batch, with price history. | By design |
| D25 | **Product copy: I draft from brand catalogues, you approve the claims** | Content is the real launch bottleneck, not code. Mahdieh stays the authority on anything clinical. | Process |
| D19 | **shadcn/ui, not Ant Design** | Ant *is* a look — an enterprise admin look, exactly the dashboard trap to avoid. shadcn is code you own, so the elegance comes from your own token layer. Accepted cost: manual updates. | Medium |
| D20 | **No component gallery** — deferred at your request | RTL verification happens page-by-page as screens are built instead. Revisit if RTL bugs start reaching production. | Deferred |
| D18 | ⚠️ **Before/after photos require per-case consent records, default-deny** | Identifiable faces on medical-adjacent treatment. A missing consent row hides the case; revocation is one admin action | Non-negotiable |
| D14 | **Flexible role-based permissions from the start** | Staff will appear later; retrofitting authorisation is expensive | By design |
| D15 | **Fulfilment: nationwide post/courier + pickup at the institute** | Modelled as pluggable rate strategies so Tehran peyk can switch on later | Cheap |

| D26 | **Zustand required for shared client interaction state; TanStack Query gated to browser-refetched server state** | URLs remain canonical for applied search/filter/sort/page state and Server Components remain canonical for PHP/PLP/PDP data. Zustand prevents interaction logic scattering across components without becoming a second catalogue/cart database. TanStack Query is introduced only with a named browser-refetching consumer and never copied into Zustand. | Medium — cross-cutting contract |

## Practices borrowed from the coordeck case study — as ideas, not code

| Idea | How it lands here |
|---|---|
| A **uniform module contract**, no exceptions | `src/modules/{catalog,cart,booking,academy,account}/` each with `screens/ components/ models/ utils/ store.ts`. |
| **Conventions written into the repo** (`AGENTS.md`, `DECISIONS.md`) | Day one, before the first feature — your co-developer is a language model, so written conventions are the highest-leverage file in the repo. |
| **"No speculative fallback chains, no compatibility guards"** | Adopted verbatim as a house rule. |
| **Co-located per-module i18n message files** | `src/modules/<m>/i18n/<locale>.json` with `next-intl`. |
| **One form abstraction**, right-sized | Six real forms — checkout, address, booking intake, enrolment, OTP login, admin product. Too few for a factory, too many to hand-roll inconsistently. One `<Field>` set, one Zod schema per form shared client and server. |

**Left behind deliberately:** OpenAPI/Orval codegen (fazaieli owns its own data) · JWT in `localStorage` (wrong for a storefront handling payments) · the zinc dashboard theme · a nightly Nitro pin · a runtime `fonts.googleapis.com` import — that last one was the most useful *finding* of the audit, and the lesson carries even though the code does not: **every font ships from `/public/fonts`**, because from Iranian infrastructure that request hangs and takes the stylesheet with it.

### State ownership adaptation

Server/Drizzle owns domain truth; the URL owns applied shareable query state; module-scoped Zustand owns coordinated UI interaction; React Hook Form owns form buffers; TanStack Query owns only approved browser-refetched server state. The complete contract is [`architecture/data-and-state-ownership.md`](architecture/data-and-state-ownership.md).

## Deliberately deferred

| Question | Until | Why it's safe to wait |
|---|---|---|
| Video hosting (ArvanCloud VOD vs Aparat) | Phase 4 | Lessons store an asset *reference* |
| Bank PSP instead of ZarinPal | Post-launch | Gateway interface absorbs it |
| Tehran-only courier rates | When volume justifies | Pluggable shipping strategy |
| `SkinProfile` (health data) | Phase 3, with Booking | The safest version is the one not built yet |
| Background jobs, search engine, caching layer | When something hurts | Postgres covers all three at your volume |

## Still open

1. Are you the official representative for **Storyderm** and **Thalgo** as well, or only **Forlle'd**?
2. Are any products **professional-only** (sellable only to trained graduates)?
3. **Instalments** on academy packages? (Assumed yes.)
4. Do students get **product discounts**? (Couples Commerce and Academy — kept separate for now.)
5. Product list and price list — you have them at the office; send when convenient.
6. ~~Institute photography~~ — the Instagram material was enough to derive the palette. Proper product photography is still the gap for the shop.
7. Do you run workshops outside **Mashhad**?
8. Is there signed consent for the existing before/after photographs?

---

## Phased plan

### Phase 0 · This week — the things that gate everything
> None of this is code, and all of it takes longer than code.

- [ ] Start **eNamad** — you have a registered company, which makes this the business track (faster and more credible than individual).
- [ ] Start **ZarinPal** onboarding in parallel; ask about direct-PSP terms given the company registration.
- [ ] Confirm `fazaieli.ir` registration and DNS control at an Iranian registrar.
- [ ] **Race Liara vs ParsPack**: deploy a hello-world Next.js app to both — Liara's `nextjs` platform, ParsPack's Next.js support — compare deploy friction and TTFB from Mashhad, then commit.
- [ ] Resolve the **npm / Docker registry access** question and write it down as a runbook before you need it.
- [ ] Collect brand assets: institute and product photography, logo, certificates.

### Phase 1 · Foundation (~2 weeks)
A **new repository** · Next.js 16.3 App Router · Drizzle + Postgres · `next-intl` with `fa` base · shadcn installed fresh with the sampled brand tokens · self-hosted fonts · the rail + command palette shell · phone/OTP auth on httpOnly sessions · `AGENTS.md` and `DECISIONS.md` written before the first feature · landing page · `/api/health` · backups verified by an actual restore.
**Done when:** the landing page is live at fazaieli.ir in Persian and you can log in by phone.

### Phase 2 · Shop — *this is "live"* (~4 weeks)
Catalogue with concern-first browsing · brand and type filters · product pages · cart drawer · guest checkout · Iranian address capture · post/courier rates and pickup option · ZarinPal request/verify with idempotency and a `payment_events` log · order states · tracking codes · order-status SMS · admin for products, stock and orders.
**Done when:** you can take a real rial order from a real customer and ship it.

### Phase 3 · Booking (~3 weeks)
Services with variable duration and multi-step protocols · **3 practitioners** (Ms. Fazaieli + 2, extensible) · **2 rooms / 3 beds as separate capacity** · availability rules + Iranian holidays · Jalali week strip · `EXCLUDE USING gist` on both practitioner and bed · 10-minute holds · deposits through the same gateway · intake forms · cancellation policy · reminder SMS · practitioner day view.
**Done when:** a customer books and pays a deposit without you touching anything.

### Phase 4 · Academy (~4 weeks)
Courses · cohorts with capacity and waitlist · enrolment · instalments · VOD with signed URLs · student player · attendance · verifiable certificates · packages · mentorship reusing the Phase 3 scheduler.

### Phase 5 · My Studio, polish, growth
The unified `/studio` read model · Persian SEO and structured data · self-hosted analytics · performance pass · English locale switched on · personal-branding depth on the landing page.

---

## The three things most likely to go wrong

1. **Paperwork, not code.** eNamad and the PSP will take longer than you expect. A finished site that can't take money is this project's default failure mode. Start Phase 0 today.
2. **Money and time units.** Rials-vs-Toman and Gregorian-vs-Jalali are cheap on day one and brutal after live orders exist. D8 and D9 are not stylistic.
3. **Carrying the dashboard's habits into a storefront.** Two specific traps: `localStorage` auth (D7) and the dashboard's card-and-table visual language. Reuse the primitives, not the posture.

---

## Companion documents

| Doc | Contents |
|---|---|
| `05-paperwork-playbook.md` | **New.** The non-technical track — company file, business licence, eNamad, ZarinPal, tax e-invoicing — in sequence, runnable in parallel |
| `01-adr-001-stack.md` | **Final.** Why Next.js wins on Iranian PaaS, the hard wall between fazaieli and coordeck, and the six practices borrowed as ideas |
| `02-adr-002-infrastructure.md` | Liara vs ParsPack vs Darkube vs ArvanCloud, ZarinPal integration rules, sanctions-safe builds, ops floor |
| `03-domain-model.md` | Bounded contexts, entities, invariants, EN/FA ubiquitous language |
| `04-information-architecture.md` | The rail-and-rooms model, five surfaces, palette with measured contrast, RTL rules |
