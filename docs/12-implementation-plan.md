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
        ├── auth/                 Better Auth, phone/OTP, httpOnly sessions
        ├── payments/             PaymentGateway interface + bank transfer
        └── notifications/        Notifier interface (SMS first)
```

**The module contract, no exceptions:** every folder in `src/modules/` has `screens/ components/ models/ utils/ <module>.store.ts`. Uniformity is what stops a solo codebase drifting into mud by month six. Modules never import each other's types — Commerce, Booking and Academy meet only at the shared payment abstraction and the `/studio` read model, which owns no writes.

---

## Phase 0 — running in parallel, not by me

`05-paperwork-playbook.md`. eNamad, ZarinPal, the business licence, the tax question, the company bank account. **This is the critical path to taking money, and no amount of code shortens it.**

---

## Phase 1 — Foundation ✅ *scaffolded*

**Status: built and verified.** `next build` passes on Next 16.3.2 with TypeScript 6.0.3, both locales prerendering.

| Delivered | Detail |
|---|---|
| `package.json` | Every version pinned exactly, verified against the registry (`07-dependency-audit.md`). The production build copies `public/` and `.next/static/` into Next's standalone artifact before `pnpm start`. |
| `next.config.ts` | `output: "standalone"` for the Iranian container. Cache Components and Partial Prefetching present but **commented off** — Phase 2 polish. |
| `pnpm-workspace.yaml` | `allowBuilds` explicitly approves the native build scripts required by Next and the toolchain. |
| `.npmrc` | Registry-mirror note for when the public registry is unreachable from an Iranian IP. |
| `src/proxy.ts` | Locale routing. Next 16 renamed `middleware.ts` → `proxy.ts`, Node runtime. |
| `src/i18n/*` | `next-intl` 4.13, `fa` base, `localePrefix: "always"`. |
| `globals.css` | Tailwind v4 → `designs/tokens.css` → shadcn semantic names bound to our tokens in one place. |
| `src/lib/money.ts` | Integer rials, `formatToman`, Persian digits, the `٬` separator, **and `transferAmountFor()`** — the deterministic per-order remainder that makes bank-statement matching a glance. |
| `src/lib/jalali.ts` | `Intl.DateTimeFormat('fa-IR-u-ca-persian')` for formatting + `jalaali-js` for arithmetic. |
| `src/lib/db/schema/` | identity · catalog · commerce, with the invariants encoded as constraints. |
| `components/ui/button.tsx` | cva variants. Primary is **ink on sand**, 2px radius, 44px min height. |
| `components/rail.tsx` | The 56px rail, logical properties throughout, mirrors for free. |
| Landing page | Hero → three doors → lapis band. No cards, no shadows. |

### Remaining in Phase 1

- [ ] **Fonts** — drop the two `.woff2` files into `public/fonts/` (see its README). The app builds without them; it just doesn't look like the brand.
- [ ] **Auth** — Better Auth with the `phoneNumber` plugin, Drizzle adapter, **httpOnly server-owned sessions**. Rate-limit OTP by phone *and* IP; Better Auth's 3-attempt limit protects one code, not your SMS budget.
- [ ] **`Notifier`** — one interface, Kavenegar/SMS.ir behind it. Templates in the database so a typo is not a deploy.
- [ ] **Legal pages** — terms, privacy, returns. ⚠️ **eNamad will not certify the domain without them**, and they are commitments the owner makes, not text a developer invents.
- [ ] `/api/health` touching the DB · backups verified by an actual restore · first deploy to Liara and ParsPack, raced.

**Done when:** the landing page is live at fazaieli.ir in Persian and you can log in with your phone.

---

## Phase 2 — Shop · *this is what "live" means* (~4 weeks)

### Data
`drizzle-kit generate` → review the SQL → commit → `migrate`. Migrations are **read before they run**; that is the point of choosing Drizzle.

Seed: brands (Forlle'd/Storyderm/Thalgo with `countryOfOrigin`), concerns (لک · جوش و آکنه · آبرسانی · ترمیم سد پوستی · ضدپیری), the real product list.

### Routes
`/shop` (PHP hub) · `/shop/concern/[slug]` · `/shop/brand/[slug]` · `/shop/c/[category]` · `/shop/p/[slug]` · `/cart` · `/checkout` · `/checkout/transfer/[orderId]` · `/order/[orderNumber]` · `/order/[orderNumber]/invoice`

**Server-render the concern PLPs.** Every competitor studied — ZO and Khanoumi included — renders their concern pages client-side and returns empty grids to crawlers. This is a cheap, decisive Persian-SEO advantage (`08-competitive-research.md`).

### Server actions — the shape every one of them takes

```ts
"use server";
export async function addToCart(input: unknown) {
  const data = addToCartSchema.parse(input);   // 1. Zod parse, always first
  const session = await requireSession();      // 2. authorisation, always second
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

Stock is **reserved** while awaiting transfer (24–48h TTL, expiring — or abandoned orders quietly make bestsellers unbuyable), and **decremented** only inside `settleOrder`.

### Admin
`/admin/transfers` first. Once launch happens on bank transfer, **that screen is the daily operation** — a queue showing each order's unique expected amount, matched and confirmed in one click. It will be used more than any storefront page. Then orders, products, `/admin/prices` (percentage adjustment by brand or category, previewed, committed as one audited batch with `price_history`).

### Tests
Vitest on `money.ts`, `jalali.ts`, and settlement idempotency. Playwright on one path: browse → cart → checkout → transfer claim → admin confirm → paid.

---

## Phase 3 — Booking (~3 weeks)

The capacity model is the whole phase: **3 practitioners, 2 rooms, 3 beds.** A booking consumes a practitioner *and* a bed, and which one binds changes day to day.

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
