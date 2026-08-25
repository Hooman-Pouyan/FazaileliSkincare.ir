# Feature module contracts

**Status:** Accepted  
**Accepted:** 2026-08-24  
**Authority:** Cross-cutting feature ownership; `AGENTS.md` remains higher authority

## Purpose

Every feature uses the same visible structure so a route, future maintainer, or coding agent can find orchestration, presentation, schemas, state, translations, and tests without reconstructing the architecture.

## Required feature shape

```text
src/modules/<module>/
  screens/                 route-level compositions, *.screen.tsx
  components/              feature-local UI
  models/                  app-owned types, schemas, defaults, outcomes
  utils/                   pure feature helpers and format adapters
  tests/                   module-level integration and browser journeys
  i18n/
    fa.json
    en.json
    ar.json
  <module>.store.ts        Zustand interaction state
```

Root-level integration files are allowed only when the feature needs the responsibility, for example `<module>.reads.ts`, `<module>.actions.ts`, or `<module>.schema.ts`. Do not create empty placeholder files for a future responsibility. Once a module owns shared client interaction state, its canonical store is `<module>.store.ts`; do not create parallel stores by screen.

## Ownership by directory

### Routes

`src/app/[locale]/...` files own framework policy only:

- await and validate `params` and `searchParams`;
- call the module's public read or render its screen;
- map typed outcomes to redirect, not-found, unavailable, or ready behavior;
- provide `loading.tsx`, `error.tsx`, and metadata integration;
- never construct Drizzle queries, prices, stock decisions, eligibility, or feature workflows.

Trivial static pages may render directly until they acquire feature logic.

### Screens

Screens are route-level Server Component compositions by default. They receive a complete page model or call one approved module read, compose feature components, and establish the smallest client boundaries required for interaction.

A screen may coordinate several concerns; it must not become a repository, generic query layer, or catch-all utility module.

### Components

Components are either:

- **Presentational:** props in, events out; no Drizzle access, server reads, authorization decisions, or direct dependency on another module's model. This is the default.
- **Smart client leaves:** own one coherent browser interaction, may read the module's Zustand store, use form state, update the URL, invoke an approved Server Action, or use an approved TanStack Query read. They do not decide commerce truth.

`src/components/ui` is always generic and presentational. `src/components/layout` owns generic layout/shell primitives. A component used by only one feature stays in that feature even when its visual anatomy looks reusable.

### Models

Models own app-defined contracts not provided by the database schema:

- page models and typed outcomes;
- discriminated offer/action states;
- Zod schemas and inferred form/input types;
- canonical URL query models;
- defaults that are part of a schema or workflow.

Do not re-export or rename Drizzle rows into speculative DTO families. A page model exists because the presentation boundary genuinely differs from storage, not merely to add another layer.

### Utils

Utilities are pure and feature-specific: parsing, serialization, comparison, display adaptation, and deterministic policy functions. They do not open database connections, own React state, or hide network calls.

### Store

The module store owns shared client interaction state and actions. It never owns canonical server records, prices, availability, permissions, reservations, totals, or operational errors. The complete state contract is in [`data-and-state-ownership.md`](data-and-state-ownership.md).

### Tests

The root `tests/` directory owns module-level user journeys that exercise multiple screens/components/state/data seams. Unit and isolated component tests stay beside the unit they protect. See [`testing-and-fixtures.md`](testing-and-fixtures.md).

## Public module surfaces

A module exposes the smallest page- or action-shaped interface required by routes and approved consumers. For Storefront, the Commerce public reads remain exactly `getShopHub`, `listProducts`, and `getProduct`; Cart separately owns `getCart`, `addLine`, `setLineQuantity`, and `removeLine` after its research gate closes.

Do not add:

- public repositories or generic query builders;
- ports/adapters without a current external boundary;
- a module-level API wrapper around same-application Server Components;
- compatibility keys or fallback field-name chains;
- imports of sibling-module internal types.

Modules meet only at an explicitly approved shared abstraction or read model. Cart accepts primitive variant identifiers rather than importing Commerce page-model types.

## Server/client boundary

- Server Components and server-only module reads own initial data.
- Client components begin at the smallest interactive leaf.
- Add `"use client"` because a component needs browser interaction, not because its parent happens to be client-rendered.
- Values crossing a client or JSON boundary must be serializable. Money crosses as branded base-10 `RialString`, never `bigint`, float, or toman.
- Server-only files must not be reachable from a client import graph.

## Review checklist

- Route contains framework policy only.
- Screen owns composition without hiding a second data layer.
- Components default to props/events.
- Store contains interaction state only.
- Public surface is page/action-shaped and minimal.
- No sibling-module type import or duplicated canonical model.
- Persian messages and module journeys are co-located.
- No empty files or speculative abstractions were added for uniformity alone.
