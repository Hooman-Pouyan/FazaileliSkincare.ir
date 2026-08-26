# Technical implementation plan

**Date:** 2026-08-24 · Companion to `00-decision-map.md` (what) and `06-site-map.md` (which pages). This is **how**, phase by phase, with the technical decisions already made.

---

## Repository layout

```
fazaieli/
├── AGENTS.md                     house rules — read before changing anything
├── docs/                         decisions, model, IA, research, this plan
├── designs/
│   ├── tokens.json               ← source of truth for the design system
│   ├── tokens.css                generated: CSS vars + Tailwind @theme
│   ├── design-language/          the palette reference page
│   └── storefront-canvas/        .dc.html artboards
├── design-system/                bundle for Claude Design (foundations)
├── drizzle/                      generated SQL migrations — committed
├── public/fonts/                 Vazirmatn + Bodoni Moda, self-hosted
└── src/
    ├── proxy.ts                  locale routing (Next 16 renamed middleware)
    ├── i18n/                     routing · navigation · request
    ├── messages/                 fa.json (source) · en.json
    ├── app/
    │   ├── globals.css           tailwind + tokens + shadcn token binding
    │   └── [locale]/
    │       ├── (storefront)/     rail shell, editorial layout
    │       ├── (account)/        quieter sidebar, denser
    │       └── (admin)/          a real dashboard — exempt from the no-dashboard rule
    ├── components/
    │   ├── ui/                   shadcn primitives, restyled through tokens
    │   └── …                     shell pieces: rail, command palette
    ├── modules/<module>/         screens/ components/ models/ utils/ store.ts
    └── lib/
        ├── db/                   client + schema/{identity,catalog,commerce,…}
        ├── money.ts              integer rials; toman is a view transform
        ├── jalali.ts             the ONLY module touching calendar conversion
        ├── auth/                 Better Auth: customer phone/OTP, staff password+TOTP, httpOnly sessions
        ├── payments/             PaymentGateway interface + bank transfer
        └── notifications/        Notifier interface (SMS first)
```

**The module contract, no exceptions:** every folder in `src/modules/` has `screens/ components/ models/ utils/ <module>.store.ts`. Uniformity is what stops a solo codebase drifting into mud by month six. Modules never import each other's types — Commerce, Booking and Academy meet only at the shared payment abstraction and the `/studio` read model, which owns no writes.

---

**The state contract:** Server Components/Drizzle own server truth; the URL owns applied shareable search/filter/sort/page state; module-scoped Zustand owns coordinated client interaction; React Hook Form owns form buffers. TanStack Query is introduced only for a named browser-refetched server read and its data is never copied into Zustand. The complete cross-cutting contracts are indexed in [`architecture/README.md`](architecture/README.md).

## Phase 0 — running in parallel, not by me

`05-paperwork-playbook.md`. eNamad, ZarinPal, the business licence, the tax question, the company bank account. **This is the critical path to taking money, and no amount of code shortens it.**

---

## Phase 1 — Foundation ✅ _scaffolded_

**Status: built and verified.** `next build` passes on Next 16.3.2 with TypeScript 6.0.3, all three locales prerendering.

| Delivered                  | Detail                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `package.json`             | Every version pinned exactly, verified against the registry (`07-dependency-audit.md`). The production build copies `public/` and `.next/static/` into Next's standalone artifact before `pnpm start`. |
| `next.config.ts`           | `output: "standalone"` for the Iranian container. Cache Components and Partial Prefetching present but **commented off** — Phase 2 polish.                                                             |
| `pnpm-workspace.yaml`      | `allowBuilds` explicitly approves the native build scripts required by Next and the toolchain.                                                                                                         |
| `.npmrc`                   | Registry-mirror note for when the public registry is unreachable from an Iranian IP.                                                                                                                   |
| `src/proxy.ts`             | Locale routing. Next 16 renamed `middleware.ts` → `proxy.ts`, Node runtime.                                                                                                                            |
| `src/i18n/*`               | `next-intl` 4.13, `fa` base with `en` and `ar`, `localePrefix: "always"`.                                                                                                                              |
| `globals.css`              | Tailwind v4 → `designs/tokens.css` → shadcn semantic names bound to our tokens in one place.                                                                                                           |
| `src/lib/money.ts`         | Integer rials, `formatToman`, Persian digits, the `٬` separator, **and `transferAmountFor()`** — the deterministic per-order remainder that makes bank-statement matching a glance.                    |
| `src/lib/jalali.ts`        | `Intl.DateTimeFormat('fa-IR-u-ca-persian')` for formatting + `jalaali-js` for arithmetic.                                                                                                              |
| `src/lib/db/schema/`       | identity · catalog · commerce, with the invariants encoded as constraints.                                                                                                                             |
| `components/ui/button.tsx` | cva variants. Primary is **ink on sand**, 2px radius, 44px min height.                                                                                                                                 |
| `components/rail.tsx`      | The 56px rail, logical properties throughout, mirrors for free.                                                                                                                                        |
| Landing page               | Hero → three doors → lapis band. No cards, no shadows.                                                                                                                                                 |

### Remaining in Phase 1

_Status as of 2026-08-25. The ordered queue lives in [`17-execution-ledger.md`](17-execution-ledger.md)._

- [x] **Auth, customer half** — `AUTH0`–`AUTH2` delivered: Better Auth schema contract, phone normalization, per-phone and per-IP PostgreSQL rate limits, phone-OTP runtime, httpOnly server-owned sessions, and Persian `/[locale]/login` and `/verify` screens. Its verification checkpoint is parked by the maintainer.
- [x] **`Notifier`** — one interface with a fake adapter and a Kavenegar adapter behind it. Templates in the database remain outstanding; the provider is configuration, not a code change.
- [ ] **Auth, staff half** — `AUTH3`–`AUTH6`: centralized authorization, provisioned staff password plus mandatory TOTP, security page and account closure, production hardening. Deferred out of the current block.
- [ ] **Fonts** — Vazirmatn is self-hosted in `public/fonts/`. Bodoni Moda is still missing, so display type falls back.
- [ ] **Legal pages** — terms, privacy, returns. ⚠️ **eNamad will not certify the domain without them**, and they are commitments the owner makes, not text a developer invents.
- [ ] `/api/health` touching the DB · backups verified by an actual restore · first deploy to Liara and ParsPack, raced. Moved to `DB7` by review correction C8: a health endpoint with nothing deployed to watch it is ceremony.

**Done when:** the landing page is live at fazaieli.ir in Persian and you can log in with your phone.

---

## Phase 1B — Database foundation ✅ _implemented and verified_

**Status:** migration `0000` is committed with its Drizzle journal and snapshot. The 48-table, 20-enum identity/catalogue/commerce schema migrated successfully from zero on PostgreSQL 16.9; deterministic Persian reference seeds, foreign-key index coverage, and critical database constraints were verified against the real database.

Delivered:

- locale-table ownership for `fa`, `en`, and `ar` rather than a fixed language enum;
- Better Auth-compatible identity, account, session, verification, and rate-limit tables, pending runtime adapter verification;
- translation-owned catalogue copy, product review/media provenance, variants, group prices, price history, and inventory movements;
- explicit reservation rows, versioned carts/orders/payments, immutable order-line snapshots, bank-transfer claims, payment events, one settlement per payment, audit log, and notification outbox;
- Persian/Arabic character, digit, whitespace, and half-space search normalization;
- reference-only seed data with no invented Storyderm products, SKUs, prices, or stock.

Still required before the shop is database-backed:

1. reproducible local/CI PostgreSQL;
2. Better Auth runtime mapping with customer phone OTP and staff email/password+TOTP;
3. catalogue hub/list/detail Drizzle read models;
4. server-rendered PLP/search/PDP routes;
5. transactional cart, reservation, checkout, and settlement services with concurrency tests;
6. Liara staging/production PostgreSQL, backups, restore drill, and deploy migration role.

The authoritative schema, ERD, API-readiness matrix, and phased continuation plan are in [`system-design/database-foundation.md`](system-design/database-foundation.md).

---

## Phase 2 — Shop · _this is what "live" means_ (~4 weeks)

### Data

`drizzle-kit generate` → review the SQL → commit → `migrate`. Migrations are **read before they run**; that is the point of choosing Drizzle.

Seed: brands (Forlle'd/Storyderm/Thalgo with `countryOfOrigin`), concerns (لک · جوش و آکنه · آبرسانی · ترمیم سد پوستی · ضدپیری), then the verified product list.

The temporary Storyderm image set is a **draft input, not catalogue truth**. Its manifest, idempotent seed profiles, image-derivative pipeline, database gaps, and draft-to-production gates are specified in [`14-storyderm-draft-catalog-pipeline.md`](14-storyderm-draft-catalog-pipeline.md). Do not infer prices, stock, SKUs, claims, or sellable product boundaries from filenames.

**Phase 2A — catalogue truth and the content spine.** Added 2026-08-26, ahead of Phase 2B. Two plans: [`system-design/catalogue/storyderm-catalogue.md`](system-design/catalogue/storyderm-catalogue.md) turns the Storyderm image set into a curated manifest, real brand and line reference rows, a media-derivative pipeline and three seed profiles; [`system-design/content/content-spine.md`](system-design/content/content-spine.md) adds the four content tables every surface reads editorial copy from — the PLP's FAQ and bands first, the Landing's beats next. Decisions: [`26-content-and-catalogue-decisions.md`](26-content-and-catalogue-decisions.md) `C-1`–`C-17`. The rule that governs both: **truth is per field, not per row** — real brand, product, form, size and imagery; price, stock, SKU and every claim invented and marked as such *in the row*. Phase 2B's `LANDING0` is superseded by `CONTENT0`–`CONTENT3`: the Landing consumes this spine rather than building a second content store.

### Routes

`/shop` (PHP hub) · `/shop/concern/[slug]` · `/shop/brand/[slug]` · `/shop/c/[category]` · `/shop/p/[slug]` · `/cart` · `/checkout` · `/checkout/transfer/[orderId]` · `/order/[orderNumber]` · `/order/[orderNumber]/invoice`

The authoritative staged storefront route hierarchy, Landing/PHP/PLP/PDP compositions, primary/secondary navigation manifest, and current Cart stopping boundary are in [`system-design/storefront.md`](system-design/storefront.md) and its linked page plans. The core storefront program implements locale-prefixed Landing integration, PHP, concern/brand/category/search PLPs, PDP, and the approved Cart slice only. Checkout, transfer, order, invoice, payment, settlement, fulfilment, returns, and refunds are a separate review/implementation program in [`system-design/cart-checkout-payment-fulfilment-and-returns.md`](system-design/cart-checkout-payment-fulfilment-and-returns.md); that plan does not authorize implementation until the maintainer's second review and its product/legal gates pass.

**Server-render the concern PLPs.** Every competitor studied — ZO and Khanoumi included — renders their concern pages client-side and returns empty grids to crawlers. This is a cheap, decisive Persian-SEO advantage (`08-competitive-research.md`).

### Server actions — the shape every one of them takes

```ts
"use server";
export async function addToCart(input: unknown) {
  const data = addToCartSchema.parse(input); // 1. Zod parse, always first
  const session = await requireSession(); // 2. authorisation, always second
  // 3. only now touch the database
}
```

No exceptions. Server Actions make trusting client input the path of least resistance, and this is the guardrail.

### The two hard problems

**Money.** Totals are recomputed server-side from the cart at payment time; the client's number is a hint. All arithmetic on `bigint` rials.

**Payment settlement — one path, two entrances.**

```
bank transfer ─┐
               ├─→ settleOrder(tx)  → decrement stock · order → paid · SMS · audit
gateway ───────┘
```

`settleOrder` runs inside one transaction and is idempotent on `payment.authority` (unique). A refreshed callback must not verify twice or decrement twice.

⚠️ **A customer-uploaded receipt is a claim, not proof.** Nothing auto-confirms from it. Only a staff member who has matched the real bank statement calls `settleOrder`. This is the one place the site could be defrauded at scale.

Stock is **reserved** for 24 hours while awaiting transfer and **decremented** only inside `settleOrder`. Expired rows do not count toward availability, or abandoned orders would quietly make bestsellers unbuyable.

The transaction plan fixes the exact launch durations at 20 minutes for Cart, 15 minutes for gateway checkout, and 24 hours for bank-transfer orders. Availability always filters `status='active' AND expires_at > now()`; cleanup is not correctness. It also defines the order/payment/refund state machines, shipping baseline, immutable snapshots, composite settlement FK, late-transfer recovery, fulfilment, and return workflow.

### Admin

`/admin/transfers` first. Once launch happens on bank transfer, **that screen is the daily operation** — a queue showing each order's unique expected amount, matched and confirmed in one click. It will be used more than any storefront page. Then orders, products, `/admin/prices` (percentage adjustment by brand or category, previewed, committed as one audited batch with `price_history`).

### Tests

Vitest on `money.ts`, `jalali.ts`, and settlement idempotency. Playwright on one path: browse → cart → checkout → transfer claim → admin confirm → paid.

---

## Phase 2B — Landing composition and brand storytelling

Written after the first-page direction pass; it did not exist when this plan was
first drafted. Full plan: [`system-design/storefront/landing.md`](system-design/storefront/landing.md).
Binding decisions: [`21-landing-composition-decisions.md`](21-landing-composition-decisions.md) `L-1`–`L-15`.

### What it adds

- The Landing's five beats carried by **one growth spine** — a blossom branch
  that advances state per beat, each stage adjacent to a fact that is
  independently true. Not a values row.
- An **original in-repo SVG ornament set** (branch segments, bud, blossom, petal,
  slash), token-bound, on lapis and teal bands only.
- **One motion primitive**: reveal-once, existing duration and easing,
  reduced-motion and no-JS paths verified. Sticky band pinning replaces parallax.
  Parallax, autoplay carousels and looping rails are refused.
- A reader-paced RTL **testimonial rail** and a **before/after** comparison, both
  built as structure ahead of their content.
- **Absence as a designed state** — every content-blocked beat disappears
  entirely rather than rendering an empty frame.

### Source content

**Storage is settled by Phase 2A.** These batches land in the same four content
tables the PLP uses ([`system-design/content/content-spine.md`](system-design/content/content-spine.md)),
not in a Landing-specific store. `LANDING0` is re-scoped accordingly.

The three `content/` batches (42 testimonials, 13 brands, 10 academy offerings)
are transcriptions from Instagram highlights and are all unpublished drafts.
They reach the application **only through the seed path** — never a runtime JSON
import — as tables with idempotent importers keyed on a stable identity. Missing
fields are completed with clearly marked fictional development values so flows
are walkable now; the real values overwrite them through the same importer later.

Real testimonials are imported and **never rendered**: consent is `unknown` on
all 42, and development previews use a separate fictional set.

### Deferred out of this phase

3D/WebGL brand storytelling (a lazy-loaded brand-story route, Phase 5 at the
earliest), the bounded petal-reveal motion (awaiting approval), and every content
gate — testimonial consent, academy prices, brand image rights, real before/after
imagery, the two claim figures, and the `LocalBusiness` contact facts.

---

## Phase 3 — Booking (~3 weeks)

The capacity model is the whole phase: **3 practitioners, 2 rooms, 3 beds.** A booking consumes a practitioner _and_ a bed, and which one binds changes day to day.

```sql
ALTER TABLE appointment ADD CONSTRAINT no_practitioner_overlap
  EXCLUDE USING gist (practitioner_id WITH =, time_range WITH &&)
  WHERE (status IN ('held','confirmed'));

ALTER TABLE appointment ADD CONSTRAINT no_resource_overlap
  EXCLUDE USING gist (resource_id WITH =, time_range WITH &&)
  WHERE (status IN ('held','confirmed'));
```

Two constraints, not one. Availability search is a **two-resource intersection**: free practitioner ∩ free bed ∩ working hours ∩ not a holiday. Write it once, as one query, and test it hard.

`ServiceStep` from the start: with 2-hour protocols, modelling dwell time where the bed is held but the practitioner is free is the difference between three clients a day and five.

Jalali week strip; 10-minute holds; deposits through the same `settleOrder`; Iranian public holidays in their own table.

---

## Phase 4 — Academy (~4 weeks)

Cohorts carry **venue, city, sponsoring brand and multiple instructors** — the real posters have all four. Instalments (`03-domain-model.md`). Video via ArvanCloud VOD with short-TTL signed URLs, never from the app origin. `/learn/*` is a different surface with no marketing on it. Certificates verifiable at a public `/certificate/[code]`.

Mentorship reuses the Phase 3 scheduler. **Do not build a second one.**

---

## Phase 5 — Studio, polish, growth

`/studio` read model · Cache Components + Partial Prefetching · Persian SEO and structured data · self-hosted analytics and GlitchTip · English locale switched on · `experimental.useOffline` trialled behind a real test (Iranian mobile connectivity makes it more than a toy).

---

## Standing engineering rules

1. **Zod parse + authorisation check open every server action.**
2. **Integer rials.** Toman is a view transform. No floats.
3. **UTC stored, Jalali rendered.** One module owns conversion.
4. **httpOnly server-owned sessions.** Never a JWT in `localStorage`.
5. **No raw hex in `src/`.** Tokens only.
6. **Logical properties only** — enforced by an ESLint rule already in `eslint.config.mjs`.
7. **Every screen gets a Persian RTL pass before it is called done.**
8. **No webfont, script or stylesheet fetched from a foreign host at runtime.**
9. **Migrations are read before they run.**
10. **Check the registry before adding any dependency**, and record it in `07-dependency-audit.md`.

## Deployment

Build the **Docker image**; never build on the server — the registry may be unreachable from an Iranian IP at the worst moment. `output: "standalone"` → `node .output/standalone/server.js`. Liara publishes a dedicated `nextjs` platform; ParsPack supports Next.js too. Race them with a hello-world and commit on TTFB from Mashhad.
