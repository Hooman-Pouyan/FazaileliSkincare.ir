# Documentation index

Written before code, deliberately. Every decision here has a stated reason and a stated cost — where a choice was later reversed, the reversal and its trigger are recorded rather than quietly edited out.

| Doc | What it settles |
|---|---|
| [`17-execution-ledger.md`](17-execution-ledger.md) | **What is next.** The ordered queue, what is settled, what is deliberately deferred, and the decoder for the five numbering schemes |
| [`19-navigation-decisions.md`](19-navigation-decisions.md) | Mobile bottom-navigation items · `/account` versus `/studio` · locale switching without content · what command search lists |
| [`18-storefront-direction-decisions.md`](18-storefront-direction-decisions.md) | Design authority and where invention is allowed · professional-only products · the per-route SEO contract |
| [`00-decision-map.md`](00-decision-map.md) | **Start here.** Decisions, deferrals, open questions, phased plan, and the three things most likely to go wrong |
| [`01-adr-001-stack.md`](01-adr-001-stack.md) | Next.js 16.3 vs TanStack Start · Drizzle vs TypeORM vs Prisma · shadcn vs Ant Design · the wall between this project and coordeck |
| [`02-adr-002-infrastructure.md`](02-adr-002-infrastructure.md) | Liara vs ParsPack vs Darkube vs ArvanCloud · bank transfer and ZarinPal · sanctions-safe builds · backups, TLS, secrets, logging |
| [`03-domain-model.md`](03-domain-model.md) | Bounded contexts and their boundaries · entities and invariants · the EN/FA ubiquitous language |
| [`04-information-architecture.md`](04-information-architecture.md) | The rail-and-rooms shell · the five surfaces · the palette sampled from the institute, with measured contrast · RTL rules |
| [`05-paperwork-playbook.md`](05-paperwork-playbook.md) | The non-technical track: company file, business licence, eNamad, ZarinPal, tax e-invoicing — in sequence, runnable in parallel |
| [`14-storyderm-draft-catalog-pipeline.md`](14-storyderm-draft-catalog-pipeline.md) | Temporary Storyderm asset policy · current database readiness · deterministic seeds · thumbnails/media · PLP/PDP query boundaries · production promotion gates |
| [`architecture/README.md`](architecture/README.md) | Cross-cutting module, state, routing, error/action, testing, i18n/RTL, and naming contracts |
| [`system-design/database-foundation.md`](system-design/database-foundation.md) | Implemented PostgreSQL schema · ERD · invariants · API readiness · environment topology · phased database and transaction plan |
| [`system-design/storefront.md`](system-design/storefront.md) | Storefront master plan and links to component foundation, PHP, PLP/search, PDP/cart, verification, and rollout plans |
| [`system-design/authentication-and-account-security.md`](system-design/authentication-and-account-security.md) | Customer phone OTP · staff password/TOTP · sessions · authorization · phone change · account closure · phased security rollout |
| [`system-design/cart-checkout-payment-fulfilment-and-returns.md`](system-design/cart-checkout-payment-fulfilment-and-returns.md) | Cart continuation · Iranian checkout/shipping · bank transfer/ZarinPal · settlement · fulfilment · returns/refunds · phased transaction rollout |
| [`evidence/c3-trgm-search.md`](evidence/c3-trgm-search.md) | Migrations applied from zero · C1 and C2 proven behaviourally · where the trigram index actually earns its place |
| [`runbooks/local-development.md`](runbooks/local-development.md) | Running and exercising the app locally: env files, port configuration, signing in without SMS, and which suites need a database |
| [`research/shop-research-gate-deferrals.md`](research/shop-research-gate-deferrals.md) | Storefront gates 4, 5 and 6: what is deferred, the interim rule each carries, and what forces re-review |
| [`ui/forms.md`](ui/forms.md) | Shared Field/Form, React Hook Form, Zod, Server Action, accessibility, RTL, and error contract |

## The three decisions most expensive to reverse

1. **Integer rials stored, Toman displayed** — the most common money bug in Iranian ecommerce.
2. **UTC stored, Jalali rendered** — storing Shamsi is a trap.
3. **httpOnly server-owned sessions** — a storefront handling payments cannot keep tokens in `localStorage`.

## Still open

Listed at the end of `00-decision-map.md` and `03-domain-model.md`. The two with the longest lead time are the **product and price list** and the **terms / privacy / returns** decisions — both are the owner's to make, not the developer's to invent.
