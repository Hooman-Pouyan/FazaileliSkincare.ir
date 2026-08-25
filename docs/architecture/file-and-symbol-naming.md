# File and symbol naming

**Status:** Accepted  
**Accepted:** 2026-08-24

## General rules

- Source filenames use kebab-case.
- React components and exported types use PascalCase.
- Functions, variables, hooks, store actions, and object fields use camelCase.
- Database columns retain the schema's canonical naming; do not add aliases solely to change style.
- Names describe responsibility, not implementation novelty: `list-products.ts` is useful; `advanced-query-manager.ts` is not.

## Feature files

| Responsibility                 | Pattern                                              | Example                           |
| ------------------------------ | ---------------------------------------------------- | --------------------------------- |
| Route composition              | `*.screen.tsx`                                       | `product-listing.screen.tsx`      |
| Presentational/smart component | `*.tsx`                                              | `product-gallery.tsx`             |
| Zustand store                  | `<module>.store.ts`                                  | `commerce.store.ts`               |
| Server read surface            | `<module>.reads.ts` or narrow concern file           | `commerce.reads.ts`               |
| Server Actions                 | `<module>.actions.ts` or narrow action file          | `cart.actions.ts`                 |
| Zod schema                     | `*.schema.ts`                                        | `listing-query.schema.ts`         |
| App-owned type/model           | `*.type.ts` when a standalone type file is justified | `storefront-outcome.type.ts`      |
| Defaults                       | `*.default.ts`                                       | `booking-form.default.ts`         |
| Pure utility                   | name the transformation                              | `serialize-listing-query.ts`      |
| Unit/component test            | `*.test.ts(x)` beside unit                           | `serialize-listing-query.test.ts` |
| Browser journey                | `*.e2e.ts` in module/global tests                    | `shop-filter-history.e2e.ts`      |

Avoid generic `helpers.ts`, `common.ts`, `types.ts`, `api.ts`, or `hooks.ts` buckets as modules grow. Split by named responsibility before the file becomes a miscellaneous dependency surface.

## Next.js route files

Use framework filenames exactly: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`, and `proxy.ts`. Dynamic segment names express domain identity: `[slug]`, `[category]`, `[locale]`, not `[id]` when the public contract is specifically a slug.

Route folders own URL grammar, not feature implementation names. Route files import module screens/reads rather than duplicating the route path in component filenames.

## Symbols and discriminants

- Boolean names begin with `is`, `has`, `can`, or `should` and describe truth precisely.
- Event callbacks begin with `on`; imperative store actions use verbs such as `open`, `close`, `toggle`, `set`, `reset`, `apply`, or `reconcile`.
- Async server reads use domain verbs (`getShopHub`, `listProducts`, `getProduct`).
- Discriminated unions use `status` or `kind` consistently within one contract and stable kebab-case/lowercase values where serialized.
- Currency values include the unit: `amountRials`, never `amount` or `priceToman`.
- Time values state semantics: `expiresAt`, `reservedUntil`, `createdAt`; all are UTC instants unless a type explicitly represents a local schedule.
- Identifiers name their entity: `variantId`, `cartId`, `reservationId`; avoid unqualified `id` at boundaries containing several entities.

## URL query names

The discovery research gate approves public parameter names and encoding. Once public, names are compatibility contracts. Parser, serializer, generated links, tests, and documentation change together. Internal Zustand field names may be clearer than compact URL names but map through one canonical adapter.

## Generated and derived files

- Migrations, Drizzle snapshots/journals, route-generated output, and generated design tokens are never hand-edited unless their owning tool explicitly requires it.
- Modify the canonical schema/token/source and regenerate through the recorded command.
- Generated files carry an ownership comment when the format supports it.
- Do not wrap generated/schema-derived types in compatibility DTOs merely to shield code from regeneration; fix the canonical consumer or document a real boundary.

## i18n names

Message keys use semantic namespaces such as `cart.actions.remove` or `product.offer.onRequest`; they do not use display copy as keys. Persian, English, and Arabic catalogues maintain the same key shape even when commerce publication for a locale remains unavailable.

## Review checklist

- Filename reveals responsibility and layer.
- Public names include money/time/entity semantics.
- No generic bucket or speculative abstraction was introduced.
- URL names match the accepted public grammar.
- Generated artifacts were changed only through their owner.
- Tests follow the unit/module/browser placement contract.
