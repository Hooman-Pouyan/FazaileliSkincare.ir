import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  mediaProvenanceEnum,
  mediaRightsEnum,
  mediaRoleEnum,
  priceVisibilityEnum,
  productReviewStateEnum,
  sizeUnitEnum,
} from "./enums";
import { locale } from "./identity";
import {
  brand,
  category,
  concern,
  productLine,
  protocolPhase,
  skinState,
} from "./catalog-reference";

export const product = pgTable(
  "product",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull(),
    brandId: uuid()
      .notNull()
      .references(() => brand.id, { onDelete: "restrict" }),
    lineId: uuid().references(() => productLine.id, { onDelete: "restrict" }),
    categoryId: uuid().references(() => category.id, { onDelete: "restrict" }),
    ircCode: text(),
    isProfessionalOnly: boolean().notNull().default(false),
    priceVisibility: priceVisibilityEnum().notNull().default("public"),
    reviewState: productReviewStateEnum().notNull().default("draft"),
    isPublished: boolean().notNull().default(false),
    publishedAt: timestamp({ withTimezone: true }),
    merchandisingRank: integer().notNull().default(0),
    version: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_slug_unique").on(table.slug),
    index("product_brand_idx").on(table.brandId),
    index("product_line_idx").on(table.lineId),
    index("product_category_idx").on(table.categoryId),
    index("product_public_catalog_idx")
      .on(table.merchandisingRank, table.id)
      .where(sql`${table.isPublished} and ${table.reviewState} = 'approved'`),
    check(
      "product_published_state_check",
      sql`not ${table.isPublished} or (${table.reviewState} = 'approved' and ${table.publishedAt} is not null)`,
    ),
    check("product_version_check", sql`${table.version} >= 0`),
  ],
);

export const productTranslation = pgTable(
  "product_translation",
  {
    productId: uuid()
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    localeCode: text()
      .notNull()
      .references(() => locale.code, { onDelete: "restrict" }),
    name: text().notNull(),
    promise: text(),
    description: text(),
    ingredients: text(),
    usage: text(),
    suitableFor: text(),
    normalizedSearchText: text().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.localeCode] }),
    index("product_translation_search_idx").on(
      table.localeCode,
      table.normalizedSearchText,
    ),
    // Trigram, not full text: PostgreSQL ships no Persian stemmer, so a text
    // search configuration would be a guess. Trigrams give infix and typo
    // tolerance over the already-normalized column, which is what a Persian
    // shopper typing part of a product name actually needs. The btree above still
    // serves locale-scoped prefix and exact lookups. (Review MEDIUM-3 / C3.)
    index("product_translation_search_trgm_idx").using(
      "gin",
      sql`${table.normalizedSearchText} gin_trgm_ops`,
    ),
  ],
);

export const productConcern = pgTable(
  "product_concern",
  {
    productId: uuid()
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    concernId: uuid()
      .notNull()
      .references(() => concern.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.concernId] }),
    index("product_concern_concern_idx").on(table.concernId, table.productId),
  ],
);

export const productSkinState = pgTable(
  "product_skin_state",
  {
    productId: uuid()
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    skinStateId: uuid()
      .notNull()
      .references(() => skinState.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.skinStateId] }),
    index("product_skin_state_state_idx").on(
      table.skinStateId,
      table.productId,
    ),
  ],
);

export const productProtocolPhase = pgTable(
  "product_protocol_phase",
  {
    productId: uuid()
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    protocolPhaseId: uuid()
      .notNull()
      .references(() => protocolPhase.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.protocolPhaseId] }),
    index("product_protocol_phase_phase_idx").on(
      table.protocolPhaseId,
      table.productId,
    ),
  ],
);

export const productMedia = pgTable(
  "product_media",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    role: mediaRoleEnum().notNull().default("unknown"),
    sortOrder: integer().notNull().default(0),
    sourcePath: text().notNull(),
    sourceFilename: text().notNull(),
    checksumSha256: text().notNull(),
    mimeType: text().notNull(),
    byteSize: bigint({ mode: "bigint" }).notNull(),
    width: integer().notNull(),
    height: integer().notNull(),
    originalObjectKey: text(),
    cardObjectKey: text(),
    detailObjectKey: text(),
    provenance: mediaProvenanceEnum().notNull(),
    rights: mediaRightsEnum().notNull().default("unknown"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_media_source_path_unique").on(table.sourcePath),
    uniqueIndex("product_media_primary_unique")
      .on(table.productId)
      .where(sql`${table.role} = 'primary'`),
    index("product_media_product_sort_idx").on(
      table.productId,
      table.sortOrder,
      table.id,
    ),
    index("product_media_checksum_idx").on(table.checksumSha256),
    check(
      "product_media_checksum_check",
      sql`${table.checksumSha256} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "product_media_dimensions_check",
      sql`${table.width} > 0 and ${table.height} > 0 and ${table.byteSize} > 0`,
    ),
  ],
);

export const productMediaTranslation = pgTable(
  "product_media_translation",
  {
    productMediaId: uuid()
      .notNull()
      .references(() => productMedia.id, { onDelete: "cascade" }),
    localeCode: text()
      .notNull()
      .references(() => locale.code, { onDelete: "restrict" }),
    altText: text().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.productMediaId, table.localeCode] }),
  ],
);

export const variant = pgTable(
  "variant",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => product.id, { onDelete: "restrict" }),
    sku: text().notNull(),
    barcode: text(),
    sizeValue: numeric({ precision: 10, scale: 2 }),
    sizeUnit: sizeUnitEnum(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("variant_sku_unique").on(table.sku),
    uniqueIndex("variant_barcode_unique")
      .on(table.barcode)
      .where(sql`${table.barcode} is not null`),
    index("variant_product_active_idx").on(table.productId, table.isActive),
    check(
      "variant_size_check",
      sql`(${table.sizeValue} is null and ${table.sizeUnit} is null) or (${table.sizeValue} > 0 and ${table.sizeUnit} is not null)`,
    ),
  ],
);

export const variantTranslation = pgTable(
  "variant_translation",
  {
    variantId: uuid()
      .notNull()
      .references(() => variant.id, { onDelete: "cascade" }),
    localeCode: text()
      .notNull()
      .references(() => locale.code, { onDelete: "restrict" }),
    displayName: text(),
    sizeLabel: text(),
  },
  (table) => [primaryKey({ columns: [table.variantId, table.localeCode] })],
);
