# fazaieli.ir

The website for the **Mahdieh Fazaieli** skincare institute in Mashhad — a Persian-first (English later) platform with four surfaces that stay decoupled but coherent:

| Surface | What it does |
|---|---|
| **Landing** | Personal brand, credentials, official representation of Forlle'd Japan |
| **Shop** | Skincare catalogue browsed **by concern first** → cart → order → rial payment |
| **Booking** | Facial and skin-therapy appointments across practitioners and treatment beds |
| **Academy** | Courses, dated in-person workshops, packages, mentorship, certification |

Built and maintained by one developer, hosted inside Iran, paid in rials.

---

## Status

**Pre-implementation.** The decisions are made and written down; no application code exists yet.

- ✅ Stack, infrastructure, domain model, information architecture and design language decided
- ✅ Paperwork track documented and ready to run in parallel
- 🔄 Design mockups drafted — **not yet approved**, awaiting references and a feature list
- ⬜ Repository scaffold
- ⬜ Phase 1 — foundation and landing page

---

## Read in this order

| Doc | What it settles |
|---|---|
| [`docs/00-decision-map.md`](docs/00-decision-map.md) | **Start here.** Every decision, what's deferred, what's still open, and the phased plan |
| [`docs/01-adr-001-stack.md`](docs/01-adr-001-stack.md) | Next.js 16.3, Drizzle, shadcn — and honestly why each alternative lost |
| [`docs/02-adr-002-infrastructure.md`](docs/02-adr-002-infrastructure.md) | Iranian hosting, ZarinPal, bank transfer, sanctions-safe builds, ops floor |
| [`docs/03-domain-model.md`](docs/03-domain-model.md) | Bounded contexts, entities, invariants, EN/FA ubiquitous language |
| [`docs/04-information-architecture.md`](docs/04-information-architecture.md) | The rail-and-rooms model, five surfaces, the measured palette, RTL rules |
| [`docs/05-paperwork-playbook.md`](docs/05-paperwork-playbook.md) | eNamad, ZarinPal, business licence, tax e-invoicing — the non-technical track |
| [`docs/06-site-map.md`](docs/06-site-map.md) | Every page across all four spaces and the admin · PHP/PLP/PDP · why the account area is not a separate app |

`AGENTS.md` carries the working conventions. Read it before changing anything.

---

## The stack, in one table

| | |
|---|---|
| Framework | Next.js 16.3 App Router, `output: "standalone"` |
| Data | Drizzle ORM + PostgreSQL 16, hosted in Iran |
| UI | shadcn/ui installed fresh on the sampled brand tokens |
| i18n | `next-intl`, `fa` base locale, `next/root-params`, RTL throughout |
| Auth | Better Auth, phone/OTP, **httpOnly server-owned sessions** |
| Payments | Direct bank transfer at launch; ZarinPal behind a `PaymentGateway` interface |
| Hosting | Liara or ParsPack — raced empirically, both are Iranian PaaS with a named Next.js platform |

## Designs

- [`designs/design-language/index.html`](designs/design-language/index.html) — the palette, sampled from photographs of the institute and contrast-measured
- [`designs/storefront-canvas/`](designs/storefront-canvas/) — landing, shop, product, checkout and mobile artboards

## Not in this repository

**coordeck-dashboard-frontoffice is a different company, a different product, and a different universe.** It was read once as a case study; six practices were carried over as ideas and re-implemented from scratch. No code, no components, no styling, and no shared package cross over. See ADR-001.
