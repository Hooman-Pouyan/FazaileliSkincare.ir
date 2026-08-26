import { inArray, notInArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { normalizeCatalogSearchText } from "../normalize-catalog-search";
import type * as schema from "../schema";
import {
  brand,
  brandTranslation,
  category,
  concern,
  inventory,
  locale,
  price,
  product,
  productConcern,
  productLine,
  productLineTranslation,
  productMedia,
  productMediaTranslation,
  productPair,
  productProtocolPhase,
  productSkinState,
  productTranslation,
  protocolPhase,
  skinState,
  variant,
  variantTranslation,
} from "../schema";
import {
  type StorydermManifest,
  type StorydermMediaLock,
  type StorydermProduct,
  loadStorydermManifest,
  loadStorydermMediaLock,
  resolveMedia,
} from "./storyderm-manifest";

/**
 * The Storyderm catalogue seed — `CAT4`.
 *
 * Two profiles in one module, because they write to the same rows and splitting
 * them across files would only hide that:
 *
 *   `seedStorydermCatalogue`  real identity and real media. Products are
 *                             `reviewState: 'draft'`, unpublished, and carry no
 *                             variant, price or stock. Nothing here is invented.
 *
 *   `seedCommerceDemo`        the invented half: `DEMO-` variants, rial prices
 *                             and stock, so cards, filters, sorting and the cart
 *                             have something to exercise.
 *
 * `C-1`: truth is per field. The brand, the product, its form, its pack size and
 * its photograph are real; the price, the stock and the SKU are not, and every
 * one of them carries a marker a query can see.
 *
 * Neither profile publishes anything. `product_published_state_check` makes
 * published imply approved, and approving an unverified product to make a
 * development page render would be exactly the lie this is built to avoid. The
 * storefront sees them through `resolveCataloguePreview` instead, which is
 * server-owned and off in production.
 */

export class StorydermSeedRefusedError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "StorydermSeedRefusedError";
  }
}

export function assertStorydermSeedAllowed(nodeEnv: string | undefined): void {
  if (nodeEnv === "production") {
    throw new StorydermSeedRefusedError(
      "The Storyderm catalogue carries unverified prices, stock and SKUs and must never run against production.",
    );
  }
}

/**
 * A second guard that does not depend on the first being right: refuse a
 * database that already holds a product this manifest does not describe.
 * Pointing a development command at a real catalogue fails loudly instead of
 * interleaving demo rows with commercial ones.
 */
async function assertNoForeignCatalogue(
  transaction: PostgresJsDatabase<typeof schema>,
  manifest: StorydermManifest,
): Promise<void> {
  const slugs = manifest.products.map((entry) => entry.slug);
  const foreign = await transaction
    .select({ slug: product.slug })
    .from(product)
    .where(notInArray(product.slug, slugs))
    .limit(1);

  const first = foreign[0];
  if (first) {
    throw new StorydermSeedRefusedError(
      `This database already holds a product outside the Storyderm manifest (${first.slug}). ` +
        "Run `pnpm db:reset` first — the catalogue profiles are alternatives, not layers.",
    );
  }
}

async function requireLocales(
  transaction: PostgresJsDatabase<typeof schema>,
): Promise<Set<string>> {
  const rows = await transaction.select({ code: locale.code }).from(locale);
  if (rows.length === 0) {
    throw new StorydermSeedRefusedError(
      "No locales found. Run `pnpm db:seed reference` first.",
    );
  }
  return new Set(rows.map((row) => row.code));
}

/**
 * Persian and English only. Arabic catalogue vocabulary has not been reviewed,
 * and `F-8` records what happens when it is invented instead: the same mistake
 * as fabricating any other unreviewed content. Under the exact-locale rule these
 * products simply do not render on `/ar`.
 */
const SEEDED_LOCALES = ["fa", "en"] as const;
type SeededLocale = (typeof SEEDED_LOCALES)[number];

function altTextFor(
  entry: StorydermProduct,
  role: string,
  ordinal: number,
  localeCode: SeededLocale,
): string {
  const name = entry.names.display[localeCode];
  if (role === "primary") return name;
  if (role === "package") {
    return localeCode === "fa" ? `${name} — بسته‌بندی` : `${name} — packaging`;
  }
  return localeCode === "fa"
    ? `${name} — تصویر ${ordinal}`
    : `${name} — image ${ordinal}`;
}

export async function seedStorydermCatalogue(
  database: PostgresJsDatabase<typeof schema>,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): Promise<void> {
  assertStorydermSeedAllowed(nodeEnv);

  const manifest = loadStorydermManifest();
  const lock = loadStorydermMediaLock();

  await database.transaction(async (transaction) => {
    await assertNoForeignCatalogue(transaction, manifest);
    const knownLocales = await requireLocales(transaction);

    const categoryIdBySlug = new Map(
      (
        await transaction
          .select({ id: category.id, slug: category.slug })
          .from(category)
      ).map((row) => [row.slug, row.id]),
    );
    if (categoryIdBySlug.size === 0) {
      throw new StorydermSeedRefusedError(
        "No categories found. Run `pnpm db:seed reference` first.",
      );
    }

    const concernIdBySlug = new Map(
      (
        await transaction
          .select({ id: concern.id, slug: concern.slug })
          .from(concern)
      ).map((row) => [row.slug, row.id]),
    );
    const skinStateIdBySlug = new Map(
      (
        await transaction
          .select({ id: skinState.id, slug: skinState.slug })
          .from(skinState)
      ).map((row) => [row.slug, row.id]),
    );
    const phaseIdBySlug = new Map(
      (
        await transaction
          .select({ id: protocolPhase.id, slug: protocolPhase.slug })
          .from(protocolPhase)
      ).map((row) => [row.slug, row.id]),
    );

    // ── brand and lines ─────────────────────────────────────────────────────
    const [brandRow] = await transaction
      .insert(brand)
      .values({
        slug: manifest.brand.slug,
        countryCode: manifest.brand.countryCode,
        isOfficialRepresentative: manifest.brand.isOfficialRepresentative,
        sortOrder: 10,
      })
      .onConflictDoUpdate({
        target: brand.slug,
        set: {
          countryCode: manifest.brand.countryCode,
          isOfficialRepresentative: manifest.brand.isOfficialRepresentative,
          updatedAt: new Date(),
        },
      })
      .returning({ id: brand.id });
    if (!brandRow) {
      throw new StorydermSeedRefusedError("Brand upsert returned nothing.");
    }

    for (const localeCode of SEEDED_LOCALES) {
      if (!knownLocales.has(localeCode)) continue;
      const name = manifest.brand.names[localeCode];
      await transaction
        .insert(brandTranslation)
        .values({
          brandId: brandRow.id,
          localeCode,
          name,
          normalizedName: normalizeCatalogSearchText(name),
        })
        .onConflictDoUpdate({
          target: [brandTranslation.brandId, brandTranslation.localeCode],
          set: { name, normalizedName: normalizeCatalogSearchText(name) },
        });
    }

    const lineIdBySlug = new Map<string, string>();
    for (const line of manifest.lines) {
      const [row] = await transaction
        .insert(productLine)
        .values({
          brandId: brandRow.id,
          slug: line.slug,
          sortOrder: line.sortOrder,
        })
        .onConflictDoUpdate({
          target: [productLine.brandId, productLine.slug],
          set: { sortOrder: line.sortOrder, updatedAt: new Date() },
        })
        .returning({ id: productLine.id });
      if (!row) {
        throw new StorydermSeedRefusedError(`Line upsert failed: ${line.slug}`);
      }
      lineIdBySlug.set(line.slug, row.id);

      for (const localeCode of SEEDED_LOCALES) {
        if (!knownLocales.has(localeCode)) continue;
        const name = line.names[localeCode];
        await transaction
          .insert(productLineTranslation)
          .values({
            productLineId: row.id,
            localeCode,
            name,
            normalizedName: normalizeCatalogSearchText(name),
          })
          .onConflictDoUpdate({
            target: [
              productLineTranslation.productLineId,
              productLineTranslation.localeCode,
            ],
            set: { name, normalizedName: normalizeCatalogSearchText(name) },
          });
      }
    }

    // ── products ────────────────────────────────────────────────────────────
    for (const entry of manifest.products) {
      const lineId = lineIdBySlug.get(entry.line);
      const categoryId = categoryIdBySlug.get(entry.category);
      if (!lineId) {
        throw new StorydermSeedRefusedError(`Unknown line: ${entry.line}`);
      }
      if (!categoryId) {
        throw new StorydermSeedRefusedError(
          `Unknown category: ${entry.category}. Run \`pnpm db:seed reference\` first.`,
        );
      }

      const [row] = await transaction
        .insert(product)
        .values({
          slug: entry.slug,
          brandId: brandRow.id,
          lineId,
          categoryId,
          isProfessionalOnly: entry.audience === "professional",
          priceVisibility: entry.priceVisibility,
          // Draft and unpublished, always. Nothing in a development seed
          // approves a product — C-1, C-4.
          reviewState: "draft",
          isPublished: false,
          publishedAt: null,
          merchandisingRank: entry.merchandisingRank,
        })
        .onConflictDoUpdate({
          target: product.slug,
          set: {
            brandId: brandRow.id,
            lineId,
            categoryId,
            isProfessionalOnly: entry.audience === "professional",
            priceVisibility: entry.priceVisibility,
            reviewState: "draft",
            isPublished: false,
            publishedAt: null,
            merchandisingRank: entry.merchandisingRank,
            updatedAt: new Date(),
          },
        })
        .returning({ id: product.id });
      if (!row) {
        throw new StorydermSeedRefusedError(
          `Product upsert failed: ${entry.slug}`,
        );
      }

      for (const localeCode of SEEDED_LOCALES) {
        if (!knownLocales.has(localeCode)) continue;
        const name = entry.names.display[localeCode];
        // `promise` and `description` stay null. A claim, an indication or a
        // usage instruction is the maintainer's to supply from a product sheet
        // — docs/14 P0, D25. The search text is therefore the name alone.
        const values = {
          productId: row.id,
          localeCode,
          name,
          promise: null,
          description: null,
          normalizedSearchText: normalizeCatalogSearchText(name),
        };
        await transaction
          .insert(productTranslation)
          .values(values)
          .onConflictDoUpdate({
            target: [
              productTranslation.productId,
              productTranslation.localeCode,
            ],
            set: {
              name: values.name,
              promise: values.promise,
              description: values.description,
              normalizedSearchText: values.normalizedSearchText,
            },
          });
      }

      for (const slug of entry.taxonomy.concerns) {
        const concernId = concernIdBySlug.get(slug);
        if (!concernId) {
          throw new StorydermSeedRefusedError(`Unknown concern: ${slug}`);
        }
        await transaction
          .insert(productConcern)
          .values({ productId: row.id, concernId })
          .onConflictDoNothing();
      }

      for (const slug of entry.taxonomy.skinStates) {
        const skinStateId = skinStateIdBySlug.get(slug);
        if (!skinStateId) {
          throw new StorydermSeedRefusedError(`Unknown skin state: ${slug}`);
        }
        await transaction
          .insert(productSkinState)
          .values({ productId: row.id, skinStateId })
          .onConflictDoNothing();
      }

      for (const slug of entry.taxonomy.phases) {
        const protocolPhaseId = phaseIdBySlug.get(slug);
        if (!protocolPhaseId) {
          throw new StorydermSeedRefusedError(`Unknown phase: ${slug}`);
        }
        await transaction
          .insert(productProtocolPhase)
          .values({ productId: row.id, protocolPhaseId })
          .onConflictDoNothing();
      }

      // ── media ─────────────────────────────────────────────────────────────
      const media = resolveMedia(manifest, entry, lock);
      for (const [index, item] of media.entries()) {
        const source = entry.media[index];
        if (!source) continue;

        const [mediaRow] = await transaction
          .insert(productMedia)
          .values({
            productId: row.id,
            role: item.role,
            sortOrder: item.sortOrder,
            sourcePath: item.sourcePath,
            sourceFilename: item.sourceFilename,
            checksumSha256: item.checksumSha256,
            mimeType: item.mimeType,
            byteSize: BigInt(item.byteSize),
            width: item.width,
            height: item.height,
            // Null until an original has actually been uploaded — C-9. The key
            // it will get is derivable; recording it now would point at nothing.
            originalObjectKey: item.originalObjectKey,
            cardObjectKey: item.cardObjectKey,
            detailObjectKey: item.detailObjectKey,
            // Supplier packshots, rights unconfirmed. `docs/14` permits
            // publication only at `approved_supplier` or `brand_owned`, and
            // nothing here publishes.
            provenance: "supplier_draft",
            rights: "unknown",
          })
          .onConflictDoUpdate({
            target: productMedia.sourcePath,
            set: {
              productId: row.id,
              role: item.role,
              sortOrder: item.sortOrder,
              cardObjectKey: item.cardObjectKey,
              detailObjectKey: item.detailObjectKey,
              updatedAt: new Date(),
            },
          })
          .returning({ id: productMedia.id });
        if (!mediaRow) continue;

        for (const localeCode of SEEDED_LOCALES) {
          if (!knownLocales.has(localeCode)) continue;
          const altText = altTextFor(
            entry,
            source.role,
            source.ordinal,
            localeCode,
          );
          await transaction
            .insert(productMediaTranslation)
            .values({ productMediaId: mediaRow.id, localeCode, altText })
            .onConflictDoUpdate({
              target: [
                productMediaTranslation.productMediaId,
                productMediaTranslation.localeCode,
              ],
              set: { altText },
            });
        }
      }
    }
  });
}

/**
 * The invented half — `commerce-demo`.
 *
 * Every SKU begins `DEMO-`, so one predicate answers "which of these commercial
 * figures were ever real" for the life of the project: `sku not like 'DEMO-%'`.
 *
 * A held product's variants are seeded **inactive**. That is what keeps it out
 * of every listing in both preview and public modes: draft preview relaxes
 * publication, deliberately, but it never relaxes the active-variant
 * requirement — `C-17`.
 */
export async function seedCommerceDemo(
  database: PostgresJsDatabase<typeof schema>,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): Promise<void> {
  assertStorydermSeedAllowed(nodeEnv);

  const manifest = loadStorydermManifest();

  await database.transaction(async (transaction) => {
    const knownLocales = await requireLocales(transaction);
    const productIdBySlug = new Map(
      (
        await transaction
          .select({ id: product.id, slug: product.slug })
          .from(product)
      ).map((row) => [row.slug, row.id]),
    );

    for (const entry of manifest.products) {
      const productId = productIdBySlug.get(entry.slug);
      if (!productId) {
        throw new StorydermSeedRefusedError(
          `No product row for ${entry.slug}. Run \`pnpm db:seed storyderm\` first.`,
        );
      }

      const isActive = entry.disposition === "seed";

      for (const item of entry.variants) {
        const [variantRow] = await transaction
          .insert(variant)
          .values({
            productId,
            sku: item.sku,
            sizeValue: item.sizeValue.toFixed(2),
            sizeUnit: item.sizeUnit,
            isActive,
          })
          .onConflictDoUpdate({
            target: variant.sku,
            set: {
              sizeValue: item.sizeValue.toFixed(2),
              sizeUnit: item.sizeUnit,
              isActive,
              updatedAt: new Date(),
            },
          })
          .returning({ id: variant.id });
        if (!variantRow) {
          throw new StorydermSeedRefusedError(
            `Variant upsert failed: ${item.sku}`,
          );
        }

        for (const localeCode of SEEDED_LOCALES) {
          if (!knownLocales.has(localeCode)) continue;
          const sizeLabel = item.labels[localeCode];
          await transaction
            .insert(variantTranslation)
            .values({
              variantId: variantRow.id,
              localeCode,
              displayName: null,
              sizeLabel,
            })
            .onConflictDoUpdate({
              target: [
                variantTranslation.variantId,
                variantTranslation.localeCode,
              ],
              set: { sizeLabel },
            });
        }

        // An on-request product gets no price row at all. A hidden zero is a
        // number waiting to be displayed by mistake.
        if (item.demoPriceRials !== null) {
          const amountRials = BigInt(item.demoPriceRials);
          await transaction
            .insert(price)
            .values({
              variantId: variantRow.id,
              customerGroup: "public",
              amountRials,
            })
            .onConflictDoUpdate({
              target: [price.variantId, price.customerGroup],
              set: { amountRials, updatedAt: new Date() },
            });
        }

        // Stock is set directly rather than through a movement: this is fixture
        // data, not a transaction. Inventing an `initial_load` would put
        // fictional rows in a ledger real operations will read.
        await transaction
          .insert(inventory)
          .values({ variantId: variantRow.id, onHand: item.demoStock })
          .onConflictDoUpdate({
            target: inventory.variantId,
            set: { onHand: item.demoStock, updatedAt: new Date() },
          });
      }
    }

    await seedProductPairs(transaction, manifest, productIdBySlug);
  });
}

/**
 * The order a routine is actually performed in.
 *
 * This is the sequence on the back of the boxes — cleanse, tone, treat,
 * moisturise, then the weekly things — not a judgement about anyone's skin. It
 * exists so a companion list reads as a routine rather than as an arbitrary
 * three, and so the ordering is reproducible instead of depending on insertion
 * order.
 */
const ROUTINE_STEP: readonly string[] = [
  "cleanser",
  "toner",
  "essence",
  "ampoule",
  "serum",
  "gel",
  "cream",
  "balm",
  "eye-care",
  "patch",
  "mask",
  "peel",
  "powder",
];

function routineRank(category: string): number {
  const index = ROUTINE_STEP.indexOf(category);
  // An unlisted category sorts last rather than first, so a category added to
  // the manifest later cannot silently take over the head of every list.
  return index === -1 ? ROUTINE_STEP.length : index;
}

/**
 * «مکمل این محصول» — development pairings, marked as such.
 *
 * **Every row is `source: "development"`.** Which products belong together is
 * product knowledge that belongs to the maintainer, and `C-1` is truth per
 * field: the relationship is invented, so the row says so and one predicate
 * finds all of them on the day the real ones arrive.
 *
 * The rule is deliberately mechanical rather than clinical: **the same
 * Storyderm range, in routine order, bounded to three.** That two products are
 * in the `ultra-lift` range is a fact the manifest already states from the
 * packshots; that two products suit a particular face is advice, and advice is
 * not something a seeder is entitled to invent. `PDP-08` refuses concern and
 * category inference at read time for the same reason — this does not
 * reintroduce it, because the rows are explicit and replaceable.
 *
 * Held products (`C-17`) are excluded on both sides. The read would hide them
 * anyway through `visibleInLocale`, but seeding a pairing that can never render
 * would leave rows nothing explains.
 */
async function seedProductPairs(
  transaction: PostgresJsDatabase<typeof schema>,
  manifest: StorydermManifest,
  productIdBySlug: ReadonlyMap<string, string>,
): Promise<void> {
  const seedable = manifest.products.filter(
    (entry) => entry.disposition === "seed",
  );

  const byLine = new Map<string, typeof seedable>();
  for (const entry of seedable) {
    const bucket = byLine.get(entry.line) ?? [];
    bucket.push(entry);
    byLine.set(entry.line, bucket);
  }

  for (const entry of seedable) {
    const productId = productIdBySlug.get(entry.slug);
    if (!productId) continue;

    const companions = (byLine.get(entry.line) ?? [])
      .filter((candidate) => candidate.slug !== entry.slug)
      .sort(
        (a, b) =>
          routineRank(a.category) - routineRank(b.category) ||
          a.slug.localeCompare(b.slug),
      )
      .slice(0, PAIRS_PER_PRODUCT);

    for (const [index, companion] of companions.entries()) {
      const pairedProductId = productIdBySlug.get(companion.slug);
      if (!pairedProductId || pairedProductId === productId) continue;

      await transaction
        .insert(productPair)
        .values({
          productId,
          pairedProductId,
          sortOrder: index,
          source: "development",
        })
        .onConflictDoUpdate({
          target: [productPair.productId, productPair.pairedProductId],
          set: {
            sortOrder: index,
            source: "development",
            updatedAt: new Date(),
          },
        });
    }
  }
}

/** Matches `PAIRS_WITH_LIMIT` in the read — three is what `PDP-08` fixes. */
const PAIRS_PER_PRODUCT = 3;

/** Removes only what these two profiles create, in foreign-key order. */
export async function clearStorydermCatalogue(
  database: PostgresJsDatabase<typeof schema>,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): Promise<void> {
  assertStorydermSeedAllowed(nodeEnv);
  const manifest: StorydermManifest = loadStorydermManifest();
  const slugs = manifest.products.map((entry) => entry.slug);

  await database.transaction(async (transaction) => {
    const products = await transaction
      .select({ id: product.id })
      .from(product)
      .where(inArray(product.slug, slugs));
    const productIds = products.map((row) => row.id);

    if (productIds.length > 0) {
      const variants = await transaction
        .select({ id: variant.id })
        .from(variant)
        .where(inArray(variant.productId, productIds));
      const variantIds = variants.map((row) => row.id);

      if (variantIds.length > 0) {
        await transaction
          .delete(price)
          .where(inArray(price.variantId, variantIds));
        await transaction
          .delete(inventory)
          .where(inArray(inventory.variantId, variantIds));
        await transaction
          .delete(variant)
          .where(inArray(variant.id, variantIds));
      }

      await transaction.delete(product).where(inArray(product.id, productIds));
    }

    await transaction.delete(productLine).where(
      inArray(
        productLine.slug,
        manifest.lines.map((line) => line.slug),
      ),
    );
    await transaction
      .delete(brand)
      .where(inArray(brand.slug, [manifest.brand.slug]));
  });
}

export type { StorydermMediaLock, StorydermManifest };
