# ADR-001 — Application stack

**Status:** **Accepted (final).** Supersedes draft 1 (Next.js) and draft 2 (TanStack Start).
**Date:** 2026-08-24

---

## Decision

**Next.js 16.3 (App Router) + Drizzle + PostgreSQL 16**, in a **brand-new repository** that shares nothing with any other project.

> **Correction:** earlier drafts of this ADR said "Next.js 15". That was stale — Next.js 16 shipped in **October 2025** and **16.3 on 3 August 2026**, three weeks ago. There is no reason to start a greenfield project on a superseded major, and 16.3 carries one feature built for exactly our shape of problem (see below). Pinning 15 would have been an unforced error.

---

## How this decision moved, and why that isn't flip-flopping

It went Next.js → TanStack Start → Next.js, and that deserves an honest accounting rather than a quiet edit.

Draft 2 reversed to TanStack Start on **exactly one load-bearing premise**: that fazaieli would reuse `@coordeck/shared` — a 226-component kit, a form factory, and a working i18n pipeline. That reuse was the entire argument. Everything else in that ADR (thinner ecosystem, no RSC, less prior art) was written as a *cost* to be absorbed in exchange for it.

You have now removed the premise. Coordeck is a different company, a different product, a different universe — separate repos, separate everything, and explicitly not a design source. **With the reuse gone, the cost has nothing left to buy, so the original decision stands.**

And a second, independent reason has since been confirmed, which matters more than the first:

### Iranian PaaS treats Next.js as a first-class platform

Liara publishes a **dedicated `nextjs` platform** with its own documentation tree — quick-start, deployment guides, framework-specific build handling — sitting alongside, and separate from, the generic `nodejs` platform. ParsPack likewise names Next.js explicitly among its supported frameworks.

TanStack Start has no such platform anywhere in Iran. It would deploy as "a Node app": you own the build command, the output path, the start script, and every future breakage. That is workable — Nitro emits a plain `node .output/server/index.mjs` — but consider the actual failure mode. It is 11pm, a deploy is failing, you are one person, and the difference between the two worlds is:

| | Next.js on Liara | TanStack Start on Liara |
|---|---|---|
| Platform | Named, documented, supported | Generic Node; you own the config |
| Docs in Persian | Yes, framework-specific | None |
| Support desk familiarity | High | You are explaining your framework to them |
| Prior art from Iranian devs | Substantial | Effectively zero |

Your instinct was right, and it's the better argument of the two. On AWS, where coordeck lives, this consideration doesn't exist — which is precisely why the same team can correctly make opposite choices for two projects.

> **What we give up, stated plainly:** TanStack Start's routing and type-safety story is genuinely nicer, and it has no vendor lock-in. Neither of those outweighs first-class platform support and a deep well of ecommerce prior art when one person carries the pager.

---

## The hard wall between the two projects

This needs to be unambiguous, because it is easy to erode by accident:

- **Separate repository.** Not a monorepo app, not a workspace package, not a sibling. Its own git history, its own CI, its own deployment.
- **No shared package.** `@coordeck/shared` is not a dependency, not vendored, not copy-pasted wholesale.
- **No shared design language.** Coordeck is a B2B document-management back office. Fazaieli is a feminine editorial skincare brand. Card grids, dense tables, sidebar chrome and dashboard density do not cross. See the IA document — the palette is sampled from the institute, and nothing else.
- **fazaieli.ir is not an admin dashboard.** It is a storefront, a booking flow, and an academy, with a modest `/admin` behind them. If a screen starts looking like a control panel, it has gone wrong.

Coordeck was read **once, as a case study.** What came back is listed below as ideas — not code, not components, not styles.

---

## What was worth taking — as ideas only

Six things from that codebase are good practice and worth re-implementing from scratch, in Next.js idiom, with fazaieli's own content:

| Idea | Why it's worth stealing | How it lands here |
|---|---|---|
| ~~A component gallery route~~ | **Deferred at your request.** Noted here so the option stays visible: the RTL audit still has to happen, it just happens page-by-page as screens are built rather than in a dedicated harness. Revisit if RTL bugs start reaching production. | Deferred |
| **A uniform module contract** | Every feature folder has the same shape, no exceptions, written down. For a solo maintainer this is what stops a codebase drifting into mud by month six. | `src/modules/{catalog,cart,booking,academy,account}/` each with `screens/ components/ models/ utils/ store.ts`. Same rule, same "no exceptions". |
| **Conventions written into the repo** (`AGENTS.md`, `DECISIONS.md`) | Your co-developer is a language model. Written conventions are the highest-leverage file in the repo — they make every future session start correct instead of guessing. | Day one, before the first feature. |
| **"No speculative fallback chains, no compatibility guards"** | A rule from their decisions doc, and a good one: use the canonical source, document a contract gap instead of synthesising data from unrelated state. | Adopted verbatim as a house rule. |
| **Co-located, per-module i18n message files with a sync script** | Message catalogues live next to the feature that uses them, and tooling derives the paths from the filesystem rather than a hand-edited list. | Same shape with `next-intl` (or Paraglide, which also runs on Next.js): `src/modules/<m>/i18n/<locale>.json`. |
| **One form abstraction, not per-form hand-rolling** | They built a form factory over react-hook-form + Zod. Checkout, intake and enrolment forms will otherwise each be written slightly differently. | A much smaller version — one `<Field>` set and one Zod-per-form convention. Don't build their factory; build the discipline. |

### And what was deliberately left behind

- **Orval / OpenAPI codegen** — coordeck is a client of someone else's backend. Fazaieli owns its own data, through server actions and Drizzle. Not applicable.
- **JWT in `localStorage` via persisted Zustand** — defensible behind a corporate login, wrong for a public storefront taking payments, where XSS becomes account takeover with money attached. Fazaieli uses **httpOnly server-owned sessions**.
- **The `radix-nova` / zinc dashboard theme** — replaced entirely by the sampled brand palette.
- **A `nitro-nightly` pin** — never under a payment flow.
- **`@import url(fonts.googleapis.com)` in the stylesheet** — this was the most useful *finding* in the whole audit, and it is a lesson rather than an inheritance: from Iranian infrastructure that request hangs or fails and takes the stylesheet with it. **Every font ships from `/public/fonts`.** (Coordeck sits on AWS, so it isn't bitten by this — but it would be the moment anyone loads it from Iran.)

---

## What Next.js 16.3 changes for this project

Not a version bump for its own sake — four of these land directly on problems we already have:

| Feature | Why it matters here |
|---|---|
| **`next/root-params`** (16.3) | `import { lang } from 'next/root-params'` reads a root-level `[lang]` segment from **any** Server Component, with no prop-drilling. This exists for exactly our situation: a bilingual site where dozens of nested components and utilities need the current locale. On 15 you thread it through props. |
| **Turbopack as the default bundler** | 2–5× faster production builds, and 16.3 added build-time disk caching (up to 5.5× on repeat builds). Build speed is not vanity when your CI may be fighting a blocked package registry — every rebuild is a risk window. |
| **`updateTag()`** in Server Actions | Read-your-writes semantics: you edit a product price in `/admin` and see it immediately, rather than staring at a stale cached page wondering if the save worked. `revalidateTag()` now takes a `cacheLife` profile as a second argument. |
| **Versioned docs for AI agents** | `next dev` writes and maintains a version-matched `AGENTS.md` block pointing at the docs bundled in your own `node_modules`. Given that your `AGENTS.md` convention is a deliberate choice (below), the framework now maintains part of that file for you — and stops the assistant inventing APIs from an older major. |

**Migration facts to know going in**, since these bite people who learned Next on 14/15:

- `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` are all **async** — `await params`.
- `middleware.ts` is now **`proxy.ts`**, running on the Node runtime. Locale routing lives there.
- `next lint` is **removed**; run ESLint or Biome directly.
- `next/image` defaults tightened: `qualities` now `[75]`, `minimumCacheTTL` 4 hours, redirects capped at 3, local IPs blocked. Sensible for us.
- Node **20.9+**, TypeScript **5.1+**. TypeScript 7 is supported and ~10× faster at type checking — worth taking.

**Two things to leave off at first, then adopt deliberately:**

- **Cache Components (`cacheComponents: true`)** — the new explicit `'use cache'` model. Excellent for a product catalogue, but it is opt-in and dynamic-by-default is the safer starting posture. Turn it on in Phase 2 polish, once orders are correct, not while you're still shaping the schema.
- **Instant Navigations (`partialPrefetching`)** — genuinely valuable for browsing a catalogue, and it becomes default in a future major. Adopt alongside Cache Components, not before.

One experimental flag worth watching for your market specifically: **`experimental.useOffline`** keeps a navigation, fetch or Server Action pending and retries when the connection returns, instead of throwing. Iranian mobile connectivity being what it is, that is not a toy — but it is experimental, so it belongs in Phase 5, behind a real test.

---

## Decision — UI: shadcn/ui, not Ant Design

You framed this as "shadcn is more robust and comprehensive, but our brand is feminine and might benefit from something minimal and elegant." I think that framing has the two libraries the wrong way round, and the reason matters more than the answer.

**Ant Design *is* a look.** It was built by Alibaba for enterprise consoles and data-dense B2B applications, and its entire vocabulary — the blue primary, the 2px radii, the dense tables, the form-first layouts, `Cascader` and `Transfer` and `Descriptions` — is the visual language of an admin panel. You can retheme it through its token system, and it will still be recognisable as Ant at a glance. Choosing it for a skincare brand is walking straight into the "organizational dashboard" trap you explicitly said you wanted to avoid.

**shadcn is not a look at all.** It is Radix/Base UI behaviour plus Tailwind classes, **copied into your repository as code you own**. Its default neutral appearance is a starting point, not an identity — nobody ships shadcn's defaults. The minimal, smooth, delicate result you want does not come from a library that has an opinion; it comes from owning the CSS, and that is precisely what shadcn gives you.

On "comprehensive": Ant ships more components, but most of the surplus is enterprise data widgets a storefront will never render. What this site actually needs — button, input, select, dialog, drawer, calendar, combobox, carousel, accordion, tabs, OTP input, phone input — shadcn covers completely.

| | shadcn/ui | Ant Design |
|---|---|---|
| What you get | Source code in your repo | An npm dependency with a design opinion |
| Restyling to a bespoke brand | The point of it | Fighting the token system, still recognisable |
| Component count | Enough, and all relevant | More, mostly enterprise widgets |
| RTL | Radix `DirectionProvider` + Tailwind logical properties | `ConfigProvider direction="rtl"` — arguably more battle-tested |
| Persian typography | Set a font token | Override a global font stack |
| Bundle | Only what you import | Heavier |
| **Cost** | **You own maintenance — updates are manual** | Upgrades come from npm |

Ant's one genuine advantage is more mature RTL. That is real, and it is outweighed by everything else — Tailwind's logical properties handle RTL cleanly, and you would be overriding Ant's styling so aggressively that its maintenance advantage evaporates too.

The honest cost of shadcn: **you own the code, so you own the maintenance.** For ~25 storefront components that is a small, bounded cost. For a 200-component enterprise app it would not be.

> If elegance out of the box is what tempts you about Ant, the answer isn't a different library — it's that the elegance here comes from the token layer, the type scale and the spacing, all of which are already specified in the IA document from colours sampled out of your own building. The library only has to stay out of the way.

---

## Decision — ORM: Drizzle, not TypeORM

Unchanged across all three drafts. TypeORM in 2026 is a legacy pick: slowed development cadence, hand-written migrations, decorator-derived typing that leaks on partially-hydrated relations. Current guidance is to choose it only for existing codebases or exotic databases.

**Drizzle**, because your two hardest correctness problems are money and double-booking, and both are solved in SQL you want to be able to read:

```sql
EXCLUDE USING gist (practitioner_id WITH =, time_range WITH &&)
```

That constraint is what actually prevents two customers booking the same bed in the same second. Drizzle lets you write and read it. Prisma is an acceptable substitute if you prefer a generated client. TypeORM is not on the table.

**On Neon / Supabase / PlanetScale:** these are Postgres *hosts*, not ORM alternatives — Drizzle talks to all of them. They're out for a different reason: US-owned, no region near Iran, every query crossing to Frankfurt. Fatal for a checkout. Your Postgres lives in Iran, beside your app.

---

## The full stack

| Concern | Choice | Note |
|---|---|---|
| Framework | **Next.js 16.3 App Router**, `output: "standalone"` | Turbopack is the default bundler; Node 20.9+ and TypeScript 5.1+ required |
| Data | **Drizzle + drizzle-kit + PostgreSQL 16** | Managed Postgres on the same provider |
| Auth | **Better Auth**, phone/OTP primary, **httpOnly server-owned sessions** | Iranian users log in by SMS, not email |
| i18n | **next-intl**, locale-prefixed routes, `fa` base | Per-module message files, and **`next/root-params`** so `lang` is readable in any Server Component without prop-drilling |
| RTL | CSS logical properties throughout + a `dir`-aware component pass | Grep for `left`/`right` as a pre-commit check |
| UI | **shadcn/ui installed fresh** — `rsc: true`, fazaieli's own tokens | Not Ant Design — see the decision below |
| Dates | UTC `timestamptz` stored, **Jalali** rendered via `date-fns-jalali` | Iranian holidays get their own table |
| Money | **Integer rials**, Toman at the view layer only | Never floats, never mixed units |
| Forms | react-hook-form + **Zod schemas shared client/server** | Server always re-validates |
| Payments | ZarinPal behind a `PaymentGateway` interface | See ADR-002 |
| SMS | Kavenegar / SMS.ir behind one `Notifier` | Foreign providers won't serve you |
| Errors | Self-hosted GlitchTip | Sentry SaaS may be unreachable from Iran |
| Testing | Vitest for domain logic; Playwright for checkout, booking, enrolment | Cover where a bug costs money |

---

## Consequences

**Good:** first-class platform support on the infrastructure you're actually deploying to; the deepest ecommerce and i18n prior art of any React framework; RSC available and usable because the component library is installed fresh rather than inherited as client-only; one repo, one deploy, one database.

**Accepted costs:** the component kit is built from scratch — real work, mitigated by shadcn plus the `/design` gallery route. Server Actions make it easy to trust client input by accident, so the house rule is absolute: **every server action opens with a Zod parse and an authorisation check.** Next's image optimiser is CPU-hungry on a small instance; push media to object storage and a CDN early.

**Explicitly deferred:** job queue, search engine, caching layer beyond Next's own. Postgres covers all three at your volume.
