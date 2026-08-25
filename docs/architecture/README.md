# Architecture contract index

**Status:** Accepted cross-cutting repository contract  
**Accepted:** 2026-08-24  
**Scope:** Application structure and engineering ownership across Storefront, Booking, Academy, Account, Admin, and Studio

This directory records how implementation is organised. It adapts useful contract-writing practices from the Coordeck case study to this repository's Next.js App Router, Server Component, Drizzle/PostgreSQL, Persian-first ecommerce architecture. It does not import Coordeck code, packages, browser-authentication model, API generation, design language, or SPA data flow.

## Authority and precedence

Use the narrowest authoritative source for the decision being made:

1. `AGENTS.md` owns non-negotiable safety, money, time, session, inventory, consent, module, RTL, and runtime-dependency rules.
2. Accepted ADRs, `00-decision-map.md`, and `03-domain-model.md` own irreversible platform and domain decisions.
3. Approved research outputs own customer, market, legal, content, and operational facts. A technical plan cannot close a research gap.
4. This directory owns cross-cutting implementation contracts.
5. `docs/system-design/` owns program- and route-specific implementation requirements, gates, and rollout evidence.
6. `docs/ui/` owns individual UI primitive and form contracts.
7. Code, migrations, generated artifacts, and tests describe the implemented state. If they disagree with an accepted decision, stop and reconcile the conflict rather than inventing a compatibility path.

Historical plans explain why a decision moved but do not override a newer accepted contract. A document that is still marked draft or research-blocked is not implementation authority for its unresolved sections.

## Contracts

| Contract                                                                   | Owns                                                                                                         |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`module-contracts.md`](module-contracts.md)                               | Feature-unit shape, route/screen/component boundaries, imports, public surfaces, and Zustand store ownership |
| [`data-and-state-ownership.md`](data-and-state-ownership.md)               | Server state, URL state, Zustand, local state, forms, TanStack Query, caching, and synchronization           |
| [`routing-navigation-and-outcomes.md`](routing-navigation-and-outcomes.md) | Locale-prefixed routes, thin route files, canonical URL state, navigation, and typed outcomes                |
| [`errors-and-actions.md`](errors-and-actions.md)                           | Error taxonomy, responsibility, Server Action sequencing, feedback, logging, retry, and idempotency          |
| [`testing-and-fixtures.md`](testing-and-fixtures.md)                       | Test placement, real-Postgres fixtures, deterministic fixture ownership, browser journeys, and evidence      |
| [`i18n-and-direction.md`](i18n-and-direction.md)                           | Exact-locale content, message ownership, RTL/LTR, mixed-direction text, numbers, money, and Jalali dates     |
| [`file-and-symbol-naming.md`](file-and-symbol-naming.md)                   | File suffixes, symbols, routes, schemas, tests, migrations, and generated-file ownership                     |

## Change rule

A contract change that affects multiple modules requires:

1. a dated decision and rationale in the owning document;
2. named consequences and migrations for existing modules;
3. links from affected system-design plans;
4. maintainer approval before implementation;
5. verification that examples and repository instructions still agree.

Do not create a second decisions register, dependency register, module convention, or page plan. Extend the current authority and link to it.
