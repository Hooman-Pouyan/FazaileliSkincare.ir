# The content spine — phased implementation plan

**Parent:** [`../../26-content-and-catalogue-decisions.md`](../../26-content-and-catalogue-decisions.md)
**Decisions implemented:** C-11 · C-12 · C-13 · C-14 · C-15
**Serves:** PLP FAQ and editorial bands · Landing beats · PDP disclosure · Booking and Academy later
**Depends on:** the reference seed (locales, concerns, brands, categories)
**Primary acceptance locale:** `fa`
**Cross-cutting:** [`../../architecture/data-and-state-ownership.md`](../../architecture/data-and-state-ownership.md) · [`../../21-landing-composition-decisions.md`](../../21-landing-composition-decisions.md) · [`../../24-facet-manifest.md`](../../24-facet-manifest.md)

---

## 1. Why this plan exists

`F-5` decided the PLP would carry an FAQ block with `FAQPage` markup, and built
it — _"as structure, absent until content exists."_ `L-4` decided unapproved
Landing content cannot render. `CONTENT-01` decided Landing reads come from
PostgreSQL, always.

All three decisions assume a content store. None of them created one. The result
is `questions: []` hardcoded at `commerce.reads.ts:1035`, a `ScopeQuestions`
component that has never rendered a row, and a Landing packet about to make the
same discovery from scratch.

This plan builds that store **once**, on the PLP, where it is small enough to
get right and immediately testable — then the Landing consumes it rather than
inventing a parallel one.

---

## 2. The model

Four tables. Two hold structure, two hold language.

### `content_block`

| Column           | Type                     | Meaning                                                                  |
| ---------------- | ------------------------ | ------------------------------------------------------------------------ |
| `id`             | `uuid` pk                |                                                                          |
| `key`            | `text` unique            | Stable upsert key, e.g. `shop.listing.concern.lak.faq`                    |
| `kind`           | `content_block_kind`     | `faq` · `editorial` · `gallery` · `campaign`                             |
| `surface`        | `content_surface`        | `shop.hub` · `shop.listing` · `pdp` · `landing` · `booking` · `academy`  |
| `scopeKind`      | `content_scope_kind`     | nullable — `concern` · `brand` · `category`                              |
| `scopeSlug`      | `text`                   | nullable — the taxonomy slug, checked against the taxonomy by the seeder |
| `sortOrder`      | `integer`                | Order among sibling blocks on one surface                                |
| `reviewState`    | `content_review_state`   | `draft` · `reviewed` · `approved` — C-14                                 |
| `isPublished`    | `boolean`                | Deliberate visibility, separate from review — mirrors `product`          |
| `effectiveFrom`  | `timestamptz` nullable   | C-13                                                                     |
| `effectiveUntil` | `timestamptz` nullable   | C-13                                                                     |
| `authorNote`     | `text` nullable          | Where the copy came from; `unreviewed_draft` for seeded voice            |
| `createdAt` / `updatedAt` | `timestamptz`   |                                                                          |

Constraints: `scopeKind` and `scopeSlug` are both null or both set;
`effectiveUntil > effectiveFrom` when both are set; unique on `key`; index on
`(surface, scopeKind, scopeSlug, sortOrder)`.

### `content_block_translation`

`(blockId, localeCode)` primary key · `heading` · `body` · `ctaLabel` ·
`ctaHref`. All nullable except the key columns — an FAQ block needs no body, a
gallery needs no CTA.

### `content_item`

`id` · `blockId` · `sortOrder` · `mediaObjectKey` nullable (C-8 key, resolved
through `mediaUrl`) · `mediaAlt` handled per locale in the translation.

### `content_item_translation`

`(itemId, localeCode)` primary key · `title` · `body` · `mediaAlt`.

**Why one item shape for questions, slides and points.** An FAQ pair is a title
and a body. A gallery slide is a caption and an image. A benefit point is a
heading and a sentence. Three tables would differ only in column names, and each
would need its own translation table, its own read, and its own migration the
first time a surface wanted a hybrid. One shape, and `kind` on the parent tells
the renderer what it is looking at.

---

## 3. Resolution — the one rule

```
resolveBlocks(surface, scope, locale, now) →
  1. candidates = blocks where surface matches
                    and reviewState = 'approved'      (production)
                    and isPublished
                    and now within [effectiveFrom, effectiveUntil]
  2. specific  = candidates where scopeKind/scopeSlug match the request
  3. if specific is non-empty → return specific
     else                     → return candidates where scopeKind is null
  4. translations are exact-locale; a block with no row for the
     requested locale is dropped, never falls back to Persian
```

Step 3 is C-12: **replace, do not merge.**

Step 4 restates the exact-locale rule the catalogue already follows — the same
reason `F-8` gives for Arabic facets being absent rather than Persian. A Persian
answer rendered on `/en` is worse than no answer.

In development the review predicate relaxes to `reviewState in (draft, reviewed,
approved)` through a server-owned flag. **Never a search parameter** — the same
prohibition `docs/14` P2 sets for draft products.

---

## 4. Reads and ownership

`src/modules/content/` — a module in the standard shape, owning:

```
src/modules/content/
  content.reads.ts        resolveBlocks, the only public surface
  models/content-block.ts the view model the components consume
  components/
    faq-block.tsx         Accordion, forceMount, SSR-visible closed content
    editorial-band.tsx    heading + body + optional CTA
    gallery-band.tsx      Swiper, per M-3
```

`commerce.reads.ts` calls `resolveBlocks` and maps the result into the existing
`questions` field plus new `bands`. **Commerce does not import content's types**
— `AGENTS.md` module rule — it receives a mapped view model, exactly as
`listProducts` already receives `Translate`.

**Why the FAQ accordion already exists elsewhere.** `scope-questions.tsx` in
commerce is the current renderer and moves to `src/modules/content/components/`
so the Landing can use the same one. Its `forceMount` + `data-[state=closed]:hidden`
behaviour — the fix that keeps closed answers in the SSR HTML — moves with it and
is asserted by a test, because it is the whole reason the markup is worth having.

---

## 5. Phased task list

### CONTENT0 — Schema and migration

- Add the four tables and four enums to `src/lib/db/schema/content.ts`.
- Export from `schema/index.ts`; extend `schema.test.ts`'s invariants.
- `pnpm db:generate`, **read the generated SQL**, commit `drizzle/` migration
  and journal. Never `drizzle-kit push`.

### CONTENT1 — The module and the resolution rule

- `src/modules/content/content.reads.ts` with `resolveBlocks`.
- Unit tests for the rule with no database: specific replaces generic, missing
  locale drops the block, an expired window excludes, a future window excludes,
  a draft excludes in production mode and includes in development mode.

### CONTENT2 — Components

- Move `scope-questions.tsx` into the content module, keep the SSR behaviour.
- `editorial-band.tsx` and `gallery-band.tsx`, built from the design system's
  own components — `Accordion`, `Divider`, `ProductGrid`'s rhythm — per DS-1.
  Read the `.prompt.md` before writing either.
- `Divider` between bands where a separation is needed, max twice per page
  (DS-4).

### CONTENT3 — The seed

- `src/lib/db/seeds/content-data.ts` and `content.ts`, matching the shape of
  `reference-data.ts` / `reference.ts`.
- FAQ sets: one generic `shop.listing` set, one per seeded concern, one per
  seeded brand. Persian and English. All `reviewState: draft`, all
  `authorNote: 'unreviewed_draft'`.
- One `editorial` band for `shop.listing` generic.
- One `campaign` band with a real `effectiveUntil`, to prove the window.
- One `gallery` band referencing manifest media by object key.
- Production refusal, transaction, idempotence — same as every other profile.

### CONTENT4 — Wiring

- `listProducts` returns `questions` and `bands` from `resolveBlocks`.
- PLP renders bands below the breadcrumb and the FAQ below the results.
- `FAQPage` JSON-LD emits from the same array the accordion renders (C-15).

### CONTENT5 — Verification

- Integration tests against PostgreSQL, §6.
- Browser pass at 390/768/1440 in Persian.
- Packet 8 section in `docs/20-packet-review-log.md`.

---

## 6. Test scenarios

1. A concern with its own questions shows exactly those, not the generic set.
2. A concern with no questions shows the generic set.
3. A block whose window has closed does not render, and the page reads correctly
   without it.
4. A block with no translation for the requested locale is absent on that locale
   and present on Persian.
5. A `draft` block renders in development mode and is absent in production mode.
6. No search parameter can make a draft block render.
7. Zero questions on a page emits **no** `FAQPage` markup at all.
8. `FAQPage` question count equals the rendered accordion item count.
9. Every accordion answer is present in the SSR HTML with JavaScript disabled.
10. Re-running the content seed changes no rows.
11. The content seed refuses under `NODE_ENV=production`.
12. Persian RTL at 390/768/1440, no horizontal overflow, no physical inset
    properties.

---

## 7. Exit gate

`/fa/shop/all` and `/fa/shop/concern/<slug>` render an editorial band below the
breadcrumb and an FAQ accordion below the results, both from PostgreSQL rows.
The concern page's questions differ from the hub's. `FAQPage` markup matches the
rendered questions exactly and is absent when there are none. Every answer is in
the SSR HTML. The campaign band disappears when its window closes. Draft content
cannot reach production through any path. The seed is idempotent and refuses
production. The review log is written.

---

## 8. Open and deferred

- **Authoring UI** — deferred to Phase 5 `/studio`. C-11.
- **Arabic content** — no reviewed vocabulary; blocks simply do not render on
  `/ar`, per §3 step 4.
- **Rich text** — `body` is plain text with paragraph breaks. Markdown or a
  block editor is a decision to make when an author exists, not before.
- **Per-block media beyond one key** — `content_item.mediaObjectKey` covers the
  gallery. A block-level hero image is added when a surface needs one.
- **Landing beats** — consume this spine in packet 9; `LANDING0` is superseded
  by `CONTENT0`–`CONTENT3` and should be re-scoped to Landing-specific blocks
  rather than a second content store.
