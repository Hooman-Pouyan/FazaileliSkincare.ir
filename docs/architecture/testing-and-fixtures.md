# Testing and fixture contracts

**Status:** Accepted  
**Accepted:** 2026-08-24  
**Scope:** Test placement, canonical fixtures, database integration, browser journeys, and verification evidence

## Test layers and placement

| Layer                       | Location                                                                 | Purpose                                                                                             |
| --------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Pure unit                   | Beside the model/utility, `*.test.ts`                                    | Parsers, serializers, money/date policy, discriminated states, pure domain helpers                  |
| Isolated component          | Beside the component, `*.test.tsx`                                       | Rendering, keyboard behavior, accessible names/states, callbacks                                    |
| Module integration          | `src/modules/<module>/tests/`                                            | Screen + store + action/read boundary with realistic data                                           |
| Database integration        | Owning module tests or shared DB test harness                            | Drizzle queries, constraints, transactions, publication, prices, inventory/reservations             |
| Browser journey             | Module `tests/*.e2e.ts` or repository `tests/` for cross-module journeys | Real Persian UI, URL/history, responsive behavior, focus, failures                                  |
| Production-equivalent smoke | Release evidence named by slice                                          | Built artifact, database connectivity, network origins, canonical URLs, core mobile/desktop journey |

Do not place isolated component tests in a module's root `tests/`; that folder demonstrates a module-level journey rather than merely collecting files.

## Canonical fixture ownership

Each canonical entity/dataset has one fixture owner. Other fixtures reference its identifiers or import its builder; they do not create competing versions of the same entity.

Examples:

- catalog-reference fixtures own concerns, brands, categories, locale/reference IDs;
- catalogue fixtures own products, translations, media, and variants;
- pricing/inventory fixtures own group prices, movements, reservations, and availability scenarios;
- cart fixtures own ownership, lines, expiry/recovery, and action history while referencing catalogue variants.

Duplicated hand-written representations hide schema drift. Fixture builders use the canonical Drizzle/inferred types or boundary schemas and fail when required fields change.

## Real PostgreSQL contract

Commerce read-interface and transactional cart tests run against real PostgreSQL fixtures, not an in-memory SQL substitute. Required scenarios include:

- exact-locale publication and no fallback;
- public/group price precedence and missing-price integrity failures;
- `on_request` and professional restriction states;
- active/inactive variants;
- inventory minus active unexpired reservations;
- stable pagination and live facet semantics;
- concurrent cart mutations, TTL renewal/release, and retry/idempotency;
- database outage or deliberately broken integrity reaching the error boundary.

Tests own transaction/database cleanup explicitly and must be safe to run repeatedly. Do not depend on developer-local production-like data.

## External-service mocks

Mock at a real external boundary: SMS, payment gateway, object storage, webhook provider, or other network service. Do not create an internal HTTP API or MSW layer merely so the same Next.js application can mock its own Drizzle reads.

External mocks must:

- follow the documented provider/interface contract;
- be deterministic unless a test explicitly controls randomness;
- cover timeout, malformed response, duplicate callback, and provider-declared error behavior relevant to the journey;
- never add behavior the real interface does not support;
- have one handler/fixture owner per endpoint.

## Zustand and URL testing

- Store factories create isolated instances per test.
- Initial server/URL state hydrates without mismatch.
- Selectors update only intended subscribers where behavior is material.
- Draft filters apply to one canonical URL.
- back/forward restores the accepted controls and results.
- No product result, price, stock, or error is copied into the store.

## TanStack Query testing

When the first Query consumer is approved:

- create a new QueryClient per test with retry disabled unless retry is under test;
- assert canonical query keys, stale/refetch behavior, invalidation after mutation, and hydration;
- exercise loading, success, valid-empty, expected rejection, and thrown operational failure;
- prove query data is not mirrored into Zustand;
- use production-shaped handlers or server functions rather than arbitrary promise fixtures.

## Persian-first browser matrix

Every customer-facing slice is exercised at:

- 390x844 mobile;
- 768x1024 tablet;
- 1440x900 desktop.

Journeys cover RTL mirroring, mixed Persian/Latin strings, Persian and Latin numerals, rial/toman display, long Persian copy, keyboard navigation, visible focus, accessible names/states, 44px targets, reduced motion, contrast, dialog/sheet focus, history restoration, and route failure states.

English and Arabic commerce receive only the expected locale-unavailable behavior until exact approved content exists.

## Evidence vocabulary

Report every check as one of:

- **Passed:** command/scenario ran successfully against the changed artifact.
- **Failed:** task-owned behavior is incorrect and remains blocking.
- **Blocked:** a named prerequisite prevents the check.
- **Baseline:** failure is verified outside task-owned changes and was preserved.
- **Unverified:** relevant but not executed; name why and the next best check.

Never present a partial, bounded, mocked, or static check as complete system coverage.

## Slice exit gate

A route slice is complete only when its plan checklist, implementation, automated checks, Persian browser evidence, accessibility/RTL review, performance/network evidence, and production-equivalent smoke agree. See `docs/system-design/storefront/verification-and-rollout.md` for the storefront-specific matrix.
