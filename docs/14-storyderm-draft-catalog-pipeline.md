# Storyderm draft catalogue and shop data pipeline

**Status:** Accepted Phase 2 working plan. Database foundation and reference seed implemented in `7f212b7`; Storyderm ingestion, catalogue reads, APIs, and Server Actions remain pending.
**Date:** 2026-08-24 · Companion to [`03-domain-model.md`](03-domain-model.md), [`10-design-playbook.md`](10-design-playbook.md), and [`12-implementation-plan.md`](12-implementation-plan.md).

---

## Decision

The Storyderm files currently under `public/images/brands/storyderm/` are a useful **temporary draft-catalogue source**. They may be used locally to give product lists, product cards, search, filters, editorial rails, carousels, and product-detail pages realistic density while the shop is built.

They are **not commercial source of truth**. A folder or filename may suggest a range, English display name, pack size, or image grouping, but it does not prove:

- the exact sellable product and variant boundary;
- an official SKU, barcode, price, stock level, ingredients, usage, claim, indication, or professional-only rule;
- Persian wording or legal product copy;
- current distribution status or permission to publish or alter the supplier image.

Every imported record therefore starts as `draft`, stays unpublished, and must be reviewed against an owner- or supplier-approved product sheet before it can become a live product. Replacing an image later must not require renaming the product, changing its URL, or recreating its database identity.

Personalising these images with Fazaieli marks is also a review step, not an automatic transform. Supplier artwork must not be edited in a way that implies private-label manufacture, certification, exclusivity, or an official relationship that has not been confirmed.

---

## Observed source inventory

Snapshot taken from the repository on **2026-08-24**:

- `106` files and about `164.7 MiB` exist under `public/images/` in total.
- `104` entries and about `161.5 MiB` are in the Storyderm branch.
- After excluding `13` Windows `Thumbs.db` files and one `.DS_Store`, there are **90 usable Storyderm image files**.
- The two Mahdieh hero images at `public/images/mahdieh-fazaieli-hero*.png` are not catalogue inputs.
- The largest source image is about `14.1 MiB`; shipping the originals as card thumbnails would make the storefront unnecessarily heavy.

| Source range/folder | Usable image files | Important interpretation note                                                      |
| ------------------- | -----------------: | ---------------------------------------------------------------------------------- |
| Ultra Lift          |                  9 | Repeated powder packshots and multiple sizes mean file count is not product count. |
| Princess Shine      |                 16 | Ten `Princess Peel_IMG` photographs appear to be a gallery for one subject.        |
| O2 White            |                  7 | Names and sizes need human pairing with the correct product.                       |
| TimeMachine Calming |                  8 | Repeated sizes and peel artwork need grouping review.                              |
| Clinic-A            |                  7 | Filename evidence alone is insufficient for claims or treatment assignment.        |
| Anti Wrinkle Care   |                  5 | Includes patch/package imagery, not necessarily five products.                     |
| Personal Care       |                 15 | Multiple sizes and package assets need variant-versus-gallery review.              |
| Protection          |                  2 | Korean filenames require an approved identification before naming.                 |
| Anti-Red            |                  2 | English names and sizes are draft observations only.                               |
| 72 Capsule Mask     |                 10 | Colour/pouch/bulk-pack images may represent variants, packaging, or gallery views. |
| Gelato Mask         |                  3 | Candidate product names still require review.                                      |
| Sheet Mask          |                  6 | Candidate names are useful for draft PLP/PDP density.                              |

This inventory counts **files**, not products. The importer must never create one sellable product per file.

### Repository hygiene for the source set

Before the first import:

1. Exclude `Thumbs.db` and `.DS_Store` from every manifest; keep the existing `.DS_Store` ignore and add `Thumbs.db` to the repository ignore policy when asset cleanup is implemented.
2. Preserve each original filename and relative path for traceability, including non-Latin names.
3. Compute a SHA-256 checksum, MIME type, byte size, width, and height for each source image.
4. Do not rename or destructively optimise the only copy. The curated manifest supplies clean slugs and display names separately.
5. Record image-rights status as `unknown`, `approved_supplier`, or `brand_owned`. Only the latter two may be published.

---

## Catalogue truth model

The existing schema already establishes the correct commercial hierarchy:

```text
Brand → ProductLine → Product → Variant → Price + Inventory
                         ├── Category
                         └── many-to-many Concern
```

Use those terms consistently:

| Term                   | Meaning in this pipeline                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| Source asset           | One original file received from a supplier or owner. It is evidence, not automatically a product.            |
| Draft catalogue record | Human-curated interpretation of one or more source assets. It may be incomplete and is never public.         |
| Product                | The stable PDP identity and slug. Copy and imagery can change without changing this identity.                |
| Variant                | A verified sellable size/shade/package with a real SKU. It owns price and inventory.                         |
| Product media          | An ordered relationship between a product and approved image derivatives, with role and accessible alt text. |
| Verified               | Checked against an approved product sheet or owner confirmation.                                             |
| Published              | Deliberately visible to customers. Verification and publication are separate decisions.                      |

### Curated manifest, not filename automation

Create a checked-in draft manifest before seeding. One entry groups source files into a candidate product and explicitly records what is known versus pending. The future implementation should live beside the database seed data, for example:

```text
src/lib/db/
  seed.ts
  seeds/
    reference.ts
    storyderm-draft.ts
```

Each draft entry needs at least:

- a stable internal draft key and proposed product slug;
- exact source paths and image roles (`primary`, `gallery`, `package`, `texture`, `unknown`);
- proposed English name and separately reviewed Persian name;
- brand, range/line, category, and concern assignments;
- observed pack-size text, explicitly marked unverified until matched to a variant;
- rights status and catalogue review status;
- a source note saying whether the value came from a filename, packaging image, product sheet, or owner confirmation.

Do not infer medical or cosmetic claims from range names. Leave `promise`, description, ingredients, usage, suitability, IRC code, price, and stock empty until a canonical source supplies them.

### Minimal schema addition before import

The catalogue schema currently has no image/media ownership. Add a focused `product_media` model before the first seed. It should hold:

- `productId`, role, sort order, and Persian/English alt text;
- the original source filename/path and checksum for provenance;
- storage keys for the original and generated card/detail derivatives;
- original dimensions, MIME type, and byte size;
- provenance (`supplier_draft` or `brand_owned`) and rights status;
- created/updated UTC timestamps.

Also add an explicit catalogue review state to `product` (`draft`, `verified`, `approved`). Keep `isPublished` as a separate switch. This prevents an incomplete row from becoming live merely because it exists.

The source manifest retains unmapped files; the database only receives a media row after a human has mapped it to a candidate product. A separate generic digital-asset-management system is not needed for Phase 2.

---

## Current database readiness

The repository now has a **verified schema foundation, but not a database-backed shop**.

| Implemented now                                                                                      | Still missing before integration                                                              |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| PostgreSQL Drizzle client and canonical 48-table schema                                              | Reproducible local/CI PostgreSQL provisioner and hosted staging/production instances          |
| Reviewed migration `0000`, journal, and snapshot committed under `drizzle/`                          | Deployment migration role, automated backup policy, and restore drill                         |
| Successful empty-database migration on PostgreSQL 16.9 with UTF-8                                    | Continuous migration/invariant checks in CI                                                   |
| Product review, media provenance/rights, variants, prices, inventory movements, and reservation rows | Curated Storyderm manifest, verified product truth, image derivatives, and object storage     |
| Deterministic `reference` seed for `fa`/`en`/`ar` and reviewed concerns                              | Guarded `storyderm-draft` and `commerce-demo` seed profiles                                   |
| Persian/Arabic search normalization and catalogue filter relationships                               | Catalogue hub/list/detail queries, measured search plans, and live facet counts               |
| Cart, order, payment, claim, event, settlement, audit, and outbox persistence primitives             | Transaction services, concurrency/failure tests, Server Actions, callbacks, and authorization |

There are still no catalogue Server Actions or API route handlers. The existing commerce components accept view models; they are not proof of a database-backed shop. See [`system-design/database-foundation.md`](system-design/database-foundation.md) for the ERD, implemented invariants, API status, and phased continuation plan.

---

## Recommended implementation pipeline

### P0 · Establish catalogue provenance and review rules

**Goal:** prevent temporary assets from silently becoming fake commercial truth.

1. Inventory and checksum the source files.
2. Build the curated Storyderm manifest and group galleries/sizes manually.
3. Confirm image usage/alteration rights with the owner or supplier.
4. Review proposed English names and write Persian names; leave unverified fields empty.

**Gate:** every usable file is mapped, deliberately excluded, or marked unresolved; no file count is presented as product count.

### P1 · Make PostgreSQL reproducible

**Goal:** any developer can create the same local schema from the repository.

**Progress:** schema changes, reviewed migration `0000`, journal/snapshot, and fresh PostgreSQL 16 migration proof are complete. Checked-in local/CI provisioning and the database-backed health endpoint remain open, so the full P1 gate is not yet complete.

1. Add a local PostgreSQL 16 Compose service with a named volume and health check, or document an equivalent existing local Postgres 16 instance.
2. Copy `.env.example` to an untracked `.env` and set a local-only `DATABASE_URL`; the current `drizzle.config.ts` loads `.env` through `dotenv/config`.
3. Add the product review/media schema changes.
4. Run `pnpm db:generate`, read the generated SQL, and commit the `drizzle/` migration and journal.
5. Run `pnpm db:migrate`; reserve `drizzle-kit push` for throwaway local experiments only.
6. Add `/api/health` only when it can execute a real database query.

The accepted Drizzle workflow is **generate → review committed SQL → migrate**. Production migration is a release step against a backed-up database, not something the web process improvises on startup.

**Gate:** a fresh database reaches the exact schema using only committed migrations, and the health check fails when the database is unavailable.

### P2 · Add deterministic seed profiles

**Goal:** repeatable realistic catalogue data without contaminating production.

**Progress:** the transactional, idempotent `reference` profile is implemented and verified by two consecutive runs. `storyderm-draft` and `commerce-demo` are deliberately still pending because verified product grouping, rights, SKU, price, and stock truth are unavailable.

Implement `src/lib/db/seed.ts` with explicit profiles:

- `reference`: safe shared rows such as Storyderm, reviewed concerns, and reviewed categories;
- `storyderm-draft`: local/staging products and mapped media, always unpublished;
- `commerce-demo`: clearly synthetic variants, rial prices, and inventory used only to exercise cart/checkout behavior.

Rules:

- wrap each profile in a transaction;
- upsert by canonical unique keys such as brand/product slugs and source checksums;
- query generated UUIDs after upserts instead of hardcoding random IDs;
- make a second run produce the same rows and relationships, with no duplicates;
- refuse draft/demo profiles against a production environment or production database host;
- never pass an invented supplier SKU as real data. Synthetic commerce records use an unmistakable `DEMO-` identity and never publish;
- store all money as integer rial `bigint`; use UTC `timestamptz` for seed timestamps.

Storyderm draft products can populate PLP/PDP content and media without prices. Use `priceVisibility = on_request`, no sellable active variant, and `isPublished = false` until real commercial fields arrive. The separate commerce-demo profile exists to test priced cards, cart, reservations, and checkout.

Local and staging catalogue queries may expose those rows only through an explicit server-owned draft-preview mode. Production customer queries always require both an approved review state and `isPublished = true`; a client search parameter must never bypass that predicate.

**Gate:** seed twice, compare row counts/checksums, and prove that no duplicate brand, product, relationship, or media row appears.

### P3 · Generate and store image derivatives

**Goal:** fast, replaceable images without making the application container the media archive.

For the current local draft, database paths may point to `/images/brands/storyderm/...`. During ingestion, record width and height so PDP galleries and other non-`fill` dynamic `next/image` uses can prevent layout shift. The current product tile already uses a 4:5 container with `fill` and supplies a responsive `sizes` rule; the data layer must supply the URL and media metadata.

Before production:

1. Auto-orient each approved source and convert it to sRGB.
2. Strip unnecessary EXIF/private metadata.
3. Preserve the original in private/source object storage.
4. Generate deterministic WebP card and PDP derivatives rather than serving 5–15 MiB originals.
5. Use a non-destructive `contain` treatment on a 4:5 brand-token background for packshots; never crop packaging text merely to fill a tile.
6. Upload derivatives to Iranian S3-compatible storage (Liara or ArvanCloud) and serve them through the selected Iranian CDN.
7. Allow only the selected media hostname through an exact Next.js image `remotePatterns` entry.
8. Store object keys, not vendor-specific URLs, so moving providers does not rewrite catalogue rows.

Start with four tested widths: `320` and `640` for cards/rails, `960` and `1440` for PDP galleries. Adjust only after measuring the actual layout and Lighthouse payload. Generate derivatives at ingestion time; do not make the first customer request pay the transformation cost.

When the source later becomes Fazaieli-owned photography, create new media rows or replace the product-media mapping, keep the product slug/ID stable, then retire the supplier draft. This is the replacement lifecycle the temporary catalogue is designed for.

**Gate:** a PLP never downloads an original source file, dimensions prevent layout shift, and replacing a primary image does not change the product URL.

### P4 · Build the server-rendered catalogue read path

**Goal:** one canonical query layer supplies every catalogue surface.

Feature code belongs under `src/modules/catalog/`; route files stay thin. The existing `src/components/commerce/` placement is scaffold debt, not the destination for new data ownership. Component-scoped authored styles use `*.module.scss`; `globals.css` and `designs/tokens.css` remain plain CSS for Tailwind v4.

The scaffold does not yet declare `sass`. Add a pinned, dependency-audited `sass` package when the first catalogue `*.module.scss` file lands; do not route Tailwind's global `@theme` entrypoints through Sass.

Create three locale-aware read models:

- `CatalogListItem` for product cards, sliders, recommendations, and search results;
- `CatalogDetail` for the PDP, gallery, verified copy, variants, price, and stock;
- `CatalogFacetSet` for brand, line, category, concern, availability, and price counts.

Server Components call server-only Drizzle queries directly. Do **not** create an internal HTTP API merely for the same Next.js application to call itself. Add Route Handlers only for a real external consumer, a webhook, or a client interaction that cannot use the server-rendered path.

PLP state lives in URL search parameters so filters, search, sort, and pagination are linkable and server-rendered. PostgreSQL is the Phase 2 search engine: normalize Persian `ی/ي` and `ک/ك`, whitespace, and half-space consistently; search only approved fields; add trigram/full-text indexes after query shapes and `EXPLAIN` prove the need. Return live facet counts from the filtered query so users do not reach dead ends.

The list query computes:

- requested-locale display fields from the canonical locale columns;
- primary approved media derivative;
- current customer-group price from `price`, never from a client value;
- availability as `onHand - reserved > 0`;
- concern/category/brand filters and stable pagination.

Use one query/read-model contract for grids, rails, and carousels. A carousel is a presentation of catalogue results, not a second mock-data source. Do not autoplay it, per the design rules.

**Gate:** `/fa/shop`, a filtered PLP, search results, and a PDP all render from PostgreSQL with JavaScript disabled; empty and missing-image states are deliberate.

### P5 · Add mutations and production promotion

**Goal:** make catalogue maintenance safe, auditable, and ready for real stock.

Server Actions are for mutations: admin product edits, media ordering, draft verification, publication, and cart changes. Every action follows the repository rule:

1. parse the unknown input with the form's shared Zod schema;
2. require the session and the exact role;
3. only then touch the database;
4. perform related writes in a transaction;
5. revalidate the affected shop path after success.

Reads remain server-only queries. Cart totals, prices, reservations, and payment totals remain server-owned. Publishing must reject missing rights, missing Persian name, missing primary media, unverified variants, or invalid price/inventory state.

Promote data in this order: approved identity/copy → approved media → real variant/SKU → integer-rial price → verified inventory → publish. Never copy a development database wholesale into production.

**Gate:** one reviewed Storyderm product can move from draft to published through an authorized workflow, appears on PLP/PDP, and can be replaced or unpublished without losing auditability.

---

## Recommended first implementation slice

The highest-value next slice is deliberately smaller than “build the shop”:

1. local PostgreSQL 16 + first reviewed migration;
2. `product` review state + `product_media` schema;
3. curated manifest for one small, unambiguous range such as Anti-Red;
4. idempotent `reference` and `storyderm-draft` seeds;
5. generated card/PDP derivatives for those two source images;
6. one server-rendered Persian PLP and one PDP using `CatalogListItem`/`CatalogDetail`;
7. a Persian RTL and payload-size pass.

Once that vertical slice works, expand the manifest range by range. Starting with all 90 files at once would hide grouping and rights mistakes inside a large import; the two-file slice proves the pipeline while changes are still cheap.

---

## Production checklist for each product

- [ ] Product/variant grouping confirmed by an approved source
- [ ] English and Persian names reviewed
- [ ] Category, concern, and line assignments reviewed
- [ ] Claims, ingredients, usage, suitability, and professional-only status sourced
- [ ] Real SKU/barcode and package size confirmed
- [ ] Integer-rial price and customer-group visibility confirmed
- [ ] Inventory count confirmed; no draft reservation data carried over
- [ ] Image publication and alteration rights confirmed
- [ ] Primary/gallery roles and Persian alt text reviewed
- [ ] Generated derivatives visually checked on light and lapis surfaces
- [ ] Persian PLP/PDP checked in RTL at mobile and desktop sizes
- [ ] Product explicitly published by an authorized staff member
