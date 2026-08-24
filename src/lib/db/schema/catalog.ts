import { pgTable, uuid, text, integer, bigint, boolean, timestamp, pgEnum, index, unique, primaryKey } from "drizzle-orm/pg-core";

export const priceVisibilityEnum = pgEnum("price_visibility", ["public", "on_request"]);
export const customerGroupEnum = pgEnum("customer_group", ["public", "student", "professional"]);

/** Brand → Line → Product is three levels. Forlle'd → Hyalogy → AC Spot Essence. */
export const brand = pgTable("brand", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull(),
  nameFa: text().notNull(),
  nameEn: text().notNull(),
  countryOfOrigin: text(),              // ژاپن / کره / فرانسه — a real buying criterion here
  isOfficialRepresentative: boolean().notNull().default(false),
  sortOrder: integer().notNull().default(0),
}, (t) => [unique("brand_slug_unique").on(t.slug)]);

export const productLine = pgTable("product_line", {
  id: uuid().primaryKey().defaultRandom(),
  brandId: uuid().notNull().references(() => brand.id),
  slug: text().notNull(),
  nameFa: text().notNull(),
  nameEn: text(),
}, (t) => [unique("product_line_slug_unique").on(t.slug)]);

/** Concern is a first-class entity, not a tag — it is the primary browse axis. */
export const concern = pgTable("concern", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull(),               // lak, acne, hydration, barrier, aging
  nameFa: text().notNull(),
  nameEn: text(),
  descriptionFa: text(),
  sortOrder: integer().notNull().default(0),
}, (t) => [unique("concern_slug_unique").on(t.slug)]);

export const category = pgTable("category", {
  id: uuid().primaryKey().defaultRandom(),
  parentId: uuid(),
  slug: text().notNull(),
  nameFa: text().notNull(),
  nameEn: text(),
  sortOrder: integer().notNull().default(0),
}, (t) => [unique("category_slug_unique").on(t.slug)]);

export const product = pgTable("product", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull(),
  brandId: uuid().notNull().references(() => brand.id),
  lineId: uuid().references(() => productLine.id),
  categoryId: uuid().references(() => category.id),
  nameFa: text().notNull(),
  nameEn: text(),
  /** Aveda's highest-leverage field: one line saying what it does. */
  promiseFa: text(),
  promiseEn: text(),
  descriptionFa: text(),
  descriptionEn: text(),
  ingredientsFa: text(),
  usageFa: text(),
  suitableForFa: text(),
  ircCode: text(),                      // IFDA health registration — authenticity signal
  isProfessionalOnly: boolean().notNull().default(false),
  priceVisibility: priceVisibilityEnum().notNull().default("public"),
  isPublished: boolean().notNull().default(false),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("product_slug_unique").on(t.slug),
  index("product_brand_idx").on(t.brandId),
  index("product_published_idx").on(t.isPublished),
]);

export const productConcern = pgTable("product_concern", {
  productId: uuid().notNull().references(() => product.id, { onDelete: "cascade" }),
  concernId: uuid().notNull().references(() => concern.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.productId, t.concernId] })]);

/** The variant carries price and stock, not the product. */
export const variant = pgTable("variant", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid().notNull().references(() => product.id, { onDelete: "cascade" }),
  sku: text().notNull(),
  sizeLabel: text(),                    // ۳۰ میلی‌لیتر
  barcode: text(),
  isActive: boolean().notNull().default(true),
}, (t) => [unique("variant_sku_unique").on(t.sku), index("variant_product_idx").on(t.productId)]);

/** Integer RIALS. Toman is a view transform. Per variant, per customer group. */
export const price = pgTable("price", {
  id: uuid().primaryKey().defaultRandom(),
  variantId: uuid().notNull().references(() => variant.id, { onDelete: "cascade" }),
  group: customerGroupEnum().notNull().default("public"),
  amountRials: bigint({ mode: "bigint" }).notNull(),
  validFrom: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique("price_variant_group_unique").on(t.variantId, t.group)]);

/** Rial pricing on imported stock moves. "Why is this more than last month?" needs an answer. */
export const priceHistory = pgTable("price_history", {
  id: uuid().primaryKey().defaultRandom(),
  variantId: uuid().notNull().references(() => variant.id, { onDelete: "cascade" }),
  group: customerGroupEnum().notNull(),
  amountRials: bigint({ mode: "bigint" }).notNull(),
  changedBy: uuid(),
  changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  batchId: uuid(),                      // bulk percentage adjustments commit as one audited batch
}, (t) => [index("price_history_variant_idx").on(t.variantId)]);

/** Never a bare `stock` integer. */
export const inventory = pgTable("inventory", {
  variantId: uuid().primaryKey().references(() => variant.id, { onDelete: "cascade" }),
  onHand: integer().notNull().default(0),
  reserved: integer().notNull().default(0),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
