import { createHash } from "node:crypto";
import { inArray, like, notLike } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { normalizeCatalogSearchText } from "../normalize-catalog-search";
import type * as schema from "../schema";
import {
  brand,
  brandTranslation,
  category,
  categoryTranslation,
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
  productProtocolPhase,
  productSkinState,
  productTranslation,
  protocolPhase,
  skinState,
  variant,
  variantTranslation,
} from "../schema";
import {
  DEV_BRANDS,
  DEV_CATEGORIES,
  DEV_PRODUCTS,
  DEV_SLUG_PREFIX,
} from "./dev-data";

export class DevSeedRefusedError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "DevSeedRefusedError";
  }
}

/**
 * Two independent guards, because one is a mistake away from being bypassed.
 *
 * The first refuses the production environment outright. The second refuses any
 * database that already holds a product this seed did not create, so pointing a
 * development command at a real catalogue fails instead of polluting it. Neither
 * depends on the other being correct.
 */
export function assertDevSeedAllowed(nodeEnv: string | undefined): void {
  if (nodeEnv === "production") {
    throw new DevSeedRefusedError(
      "The development catalogue seed is fictional data and must never run against production.",
    );
  }
}

async function assertNoRealCatalogue(
  transaction: PostgresJsDatabase<typeof schema>,
): Promise<void> {
  const foreign = await transaction
    .select({ slug: product.slug })
    .from(product)
    .where(notLike(product.slug, `${DEV_SLUG_PREFIX}%`))
    .limit(1);

  const first = foreign[0];
  if (first) {
    throw new DevSeedRefusedError(
      `This database already holds a product the development seed did not create (${first.slug}). ` +
        "Refusing to add fictional catalogue data beside real records.",
    );
  }
}

/** Deterministic, so re-running the seed does not rewrite every media row. */
function checksumFor(sourcePath: string): string {
  return createHash("sha256").update(sourcePath).digest("hex");
}

function mediaPathFor(productSlug: string, role: string): string {
  return `/images/dev/${productSlug}-${role}.svg`;
}

export async function seedDevCatalogue(
  database: PostgresJsDatabase<typeof schema>,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): Promise<void> {
  assertDevSeedAllowed(nodeEnv);

  await database.transaction(async (transaction) => {
    await assertNoRealCatalogue(transaction);

    const locales = await transaction
      .select({ code: locale.code })
      .from(locale);
    if (locales.length === 0) {
      throw new DevSeedRefusedError(
        "No locales found. Run `pnpm db:seed reference` before the development catalogue seed.",
      );
    }
    const knownLocales = new Set(locales.map((row) => row.code));

    const concernRows = await transaction
      .select({ id: concern.id, slug: concern.slug })
      .from(concern);
    const concernIdBySlug = new Map(
      concernRows.map((row) => [row.slug, row.id]),
    );
    if (concernIdBySlug.size === 0) {
      throw new DevSeedRefusedError(
        "No concerns found. Run `pnpm db:seed reference` before the development catalogue seed.",
      );
    }

    const skinStateRows = await transaction
      .select({ id: skinState.id, slug: skinState.slug })
      .from(skinState);
    const skinStateIdBySlug = new Map(
      skinStateRows.map((row) => [row.slug, row.id]),
    );

    const phaseRows = await transaction
      .select({ id: protocolPhase.id, slug: protocolPhase.slug })
      .from(protocolPhase);
    const phaseIdBySlug = new Map(phaseRows.map((row) => [row.slug, row.id]));

    // ── brands, lines, categories ───────────────────────────────────────────
    const brandIdBySlug = new Map<string, string>();
    const lineIdBySlug = new Map<string, string>();

    for (const entry of DEV_BRANDS) {
      const [row] = await transaction
        .insert(brand)
        .values({
          slug: entry.slug,
          countryCode: entry.countryCode,
          isOfficialRepresentative: entry.isOfficialRepresentative,
          sortOrder: entry.sortOrder,
        })
        .onConflictDoUpdate({
          target: brand.slug,
          set: {
            countryCode: entry.countryCode,
            isOfficialRepresentative: entry.isOfficialRepresentative,
            sortOrder: entry.sortOrder,
            updatedAt: new Date(),
          },
        })
        .returning({ id: brand.id });
      if (!row)
        throw new DevSeedRefusedError(
          `Brand upsert returned nothing: ${entry.slug}`,
        );
      brandIdBySlug.set(entry.slug, row.id);

      for (const translation of entry.translations) {
        if (!knownLocales.has(translation.localeCode)) continue;
        await transaction
          .insert(brandTranslation)
          .values({
            brandId: row.id,
            localeCode: translation.localeCode,
            name: translation.name,
            normalizedName: normalizeCatalogSearchText(translation.name),
          })
          .onConflictDoUpdate({
            target: [brandTranslation.brandId, brandTranslation.localeCode],
            set: {
              name: translation.name,
              normalizedName: normalizeCatalogSearchText(translation.name),
            },
          });
      }

      for (const line of entry.lines) {
        const [lineRow] = await transaction
          .insert(productLine)
          .values({
            brandId: row.id,
            slug: line.slug,
            sortOrder: line.sortOrder,
          })
          .onConflictDoUpdate({
            // product_line is unique on (brand_id, slug), not slug alone — two
            // brands may both have a "hydration" line.
            target: [productLine.brandId, productLine.slug],
            set: { sortOrder: line.sortOrder, updatedAt: new Date() },
          })
          .returning({ id: productLine.id });
        if (!lineRow)
          throw new DevSeedRefusedError(
            `Line upsert returned nothing: ${line.slug}`,
          );
        lineIdBySlug.set(line.slug, lineRow.id);

        for (const translation of line.translations) {
          if (!knownLocales.has(translation.localeCode)) continue;
          await transaction
            .insert(productLineTranslation)
            .values({
              productLineId: lineRow.id,
              localeCode: translation.localeCode,
              name: translation.name,
              normalizedName: normalizeCatalogSearchText(translation.name),
            })
            .onConflictDoUpdate({
              target: [
                productLineTranslation.productLineId,
                productLineTranslation.localeCode,
              ],
              set: {
                name: translation.name,
                normalizedName: normalizeCatalogSearchText(translation.name),
              },
            });
        }
      }
    }

    const categoryIdBySlug = new Map<string, string>();
    for (const entry of DEV_CATEGORIES) {
      const [row] = await transaction
        .insert(category)
        .values({ slug: entry.slug, sortOrder: entry.sortOrder })
        .onConflictDoUpdate({
          target: category.slug,
          set: { sortOrder: entry.sortOrder, updatedAt: new Date() },
        })
        .returning({ id: category.id });
      if (!row)
        throw new DevSeedRefusedError(
          `Category upsert returned nothing: ${entry.slug}`,
        );
      categoryIdBySlug.set(entry.slug, row.id);

      for (const translation of entry.translations) {
        if (!knownLocales.has(translation.localeCode)) continue;
        await transaction
          .insert(categoryTranslation)
          .values({
            categoryId: row.id,
            localeCode: translation.localeCode,
            name: translation.name,
            normalizedName: normalizeCatalogSearchText(translation.name),
          })
          .onConflictDoUpdate({
            target: [
              categoryTranslation.categoryId,
              categoryTranslation.localeCode,
            ],
            set: {
              name: translation.name,
              normalizedName: normalizeCatalogSearchText(translation.name),
            },
          });
      }
    }

    // ── products ────────────────────────────────────────────────────────────
    for (const entry of DEV_PRODUCTS) {
      const brandId = brandIdBySlug.get(entry.brandSlug);
      if (!brandId)
        throw new DevSeedRefusedError(`Unknown brand: ${entry.brandSlug}`);
      const lineId = entry.lineSlug
        ? (lineIdBySlug.get(entry.lineSlug) ?? null)
        : null;
      const categoryId = categoryIdBySlug.get(entry.categorySlug) ?? null;

      // product_published_state_check: published implies approved with a timestamp.
      const publishedAt = entry.isPublished
        ? new Date("2026-08-25T00:00:00Z")
        : null;

      const [row] = await transaction
        .insert(product)
        .values({
          slug: entry.slug,
          brandId,
          lineId,
          categoryId,
          isProfessionalOnly: entry.isProfessionalOnly,
          priceVisibility: entry.priceVisibility,
          reviewState: entry.reviewState,
          isPublished: entry.isPublished,
          publishedAt,
          merchandisingRank: entry.merchandisingRank,
        })
        .onConflictDoUpdate({
          target: product.slug,
          set: {
            brandId,
            lineId,
            categoryId,
            isProfessionalOnly: entry.isProfessionalOnly,
            priceVisibility: entry.priceVisibility,
            reviewState: entry.reviewState,
            isPublished: entry.isPublished,
            publishedAt,
            merchandisingRank: entry.merchandisingRank,
            updatedAt: new Date(),
          },
        })
        .returning({ id: product.id });
      if (!row)
        throw new DevSeedRefusedError(
          `Product upsert returned nothing: ${entry.slug}`,
        );

      for (const translation of entry.translations) {
        if (!knownLocales.has(translation.localeCode)) continue;
        const searchParts: string[] = [translation.name];
        if ("promise" in translation && translation.promise) {
          searchParts.push(translation.promise);
        }
        if ("description" in translation && translation.description) {
          searchParts.push(translation.description);
        }
        const searchSource = searchParts.join(" ");
        const values = {
          productId: row.id,
          localeCode: translation.localeCode,
          name: translation.name,
          promise:
            "promise" in translation ? (translation.promise ?? null) : null,
          description:
            "description" in translation
              ? (translation.description ?? null)
              : null,
          normalizedSearchText: normalizeCatalogSearchText(searchSource),
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

      for (const slug of entry.concernSlugs) {
        const concernId = concernIdBySlug.get(slug);
        if (!concernId)
          throw new DevSeedRefusedError(`Unknown concern: ${slug}`);
        await transaction
          .insert(productConcern)
          .values({ productId: row.id, concernId })
          .onConflictDoNothing();
      }

      /*
        Skin states and routine phases. Both taxonomies are seeded by
        `seedReference`, so an unknown slug here means the reference seed did
        not run rather than that the fixture is wrong — the error says so.
      */
      for (const slug of entry.skinStateSlugs) {
        const skinStateId = skinStateIdBySlug.get(slug);
        if (!skinStateId)
          throw new DevSeedRefusedError(
            `Unknown skin state: ${slug}. Run the reference seed first.`,
          );
        await transaction
          .insert(productSkinState)
          .values({ productId: row.id, skinStateId })
          .onConflictDoNothing();
      }

      for (const slug of entry.phaseSlugs) {
        const phaseId = phaseIdBySlug.get(slug);
        if (!phaseId)
          throw new DevSeedRefusedError(
            `Unknown protocol phase: ${slug}. Run the reference seed first.`,
          );
        await transaction
          .insert(productProtocolPhase)
          .values({ productId: row.id, protocolPhaseId: phaseId })
          .onConflictDoNothing();
      }

      for (const item of entry.media) {
        const sourcePath = mediaPathFor(entry.slug, item.role);
        const values = {
          productId: row.id,
          role: item.role,
          sortOrder: item.sortOrder,
          sourcePath,
          sourceFilename: sourcePath.split("/").pop() ?? sourcePath,
          checksumSha256: checksumFor(sourcePath),
          mimeType: "image/svg+xml",
          byteSize: 1024n,
          width: 1000,
          height: 1250,
          originalObjectKey: sourcePath,
          cardObjectKey: sourcePath,
          detailObjectKey: sourcePath,
          provenance: item.provenance,
          rights: item.rights,
        };
        const [mediaRow] = await transaction
          .insert(productMedia)
          .values(values)
          .onConflictDoUpdate({
            target: productMedia.sourcePath,
            set: { sortOrder: values.sortOrder, updatedAt: new Date() },
          })
          .returning({ id: productMedia.id });
        if (!mediaRow) continue;

        for (const translation of entry.translations) {
          if (!knownLocales.has(translation.localeCode)) continue;
          await transaction
            .insert(productMediaTranslation)
            .values({
              productMediaId: mediaRow.id,
              localeCode: translation.localeCode,
              altText: translation.name,
            })
            .onConflictDoUpdate({
              target: [
                productMediaTranslation.productMediaId,
                productMediaTranslation.localeCode,
              ],
              set: { altText: translation.name },
            });
        }
      }

      for (const item of entry.variants) {
        const [variantRow] = await transaction
          .insert(variant)
          .values({
            productId: row.id,
            sku: item.sku,
            sizeValue: item.sizeValue,
            sizeUnit: item.sizeUnit,
            isActive: item.isActive,
          })
          .onConflictDoUpdate({
            target: variant.sku,
            set: {
              sizeValue: item.sizeValue,
              sizeUnit: item.sizeUnit,
              isActive: item.isActive,
              updatedAt: new Date(),
            },
          })
          .returning({ id: variant.id });
        if (!variantRow)
          throw new DevSeedRefusedError(
            `Variant upsert returned nothing: ${item.sku}`,
          );

        for (const translation of entry.translations) {
          if (!knownLocales.has(translation.localeCode)) continue;
          const sizeLabel = item.sizeValue
            ? `${Number(item.sizeValue)} ${item.sizeUnit ?? ""}`.trim()
            : null;
          await transaction
            .insert(variantTranslation)
            .values({
              variantId: variantRow.id,
              localeCode: translation.localeCode,
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

        for (const item2 of item.prices) {
          await transaction
            .insert(price)
            .values({
              variantId: variantRow.id,
              customerGroup: item2.customerGroup,
              amountRials: item2.amountRials,
            })
            .onConflictDoUpdate({
              target: [price.variantId, price.customerGroup],
              set: { amountRials: item2.amountRials, updatedAt: new Date() },
            });
        }

        // Stock is set directly rather than through a movement: this is fixture
        // data, not a transaction. Movements are written by the services that
        // own them, and inventing an initial_load here would put fictional rows
        // in the ledger real operations will read.
        await transaction
          .insert(inventory)
          .values({ variantId: variantRow.id, onHand: item.onHand })
          .onConflictDoUpdate({
            target: inventory.variantId,
            set: { onHand: item.onHand, updatedAt: new Date() },
          });
      }
    }
  });
}

/**
 * Removes only rows this seed created, identified by the `dev-` slug prefix.
 *
 * Deletion order follows the restrict foreign keys: prices and stock before
 * variants, variants before products, products before the lines, brands and
 * categories they reference. Translations, concern links and media cascade.
 */
export async function clearDevCatalogue(
  database: PostgresJsDatabase<typeof schema>,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): Promise<void> {
  assertDevSeedAllowed(nodeEnv);
  const devSlug = `${DEV_SLUG_PREFIX}%`;

  await database.transaction(async (transaction) => {
    const products = await transaction
      .select({ id: product.id })
      .from(product)
      .where(like(product.slug, devSlug));
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

    await transaction
      .delete(productLine)
      .where(like(productLine.slug, devSlug));
    await transaction.delete(brand).where(like(brand.slug, devSlug));
    await transaction.delete(category).where(like(category.slug, devSlug));
  });
}
