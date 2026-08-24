import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { locale } from "./identity";

export const brand = pgTable("brand", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull(),
  countryCode: text(),
  isOfficialRepresentative: boolean().notNull().default(false),
  sortOrder: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("brand_slug_unique").on(table.slug),
  check("brand_country_code_check", sql`${table.countryCode} is null or ${table.countryCode} ~ '^[A-Z]{2}$'`),
]);

export const brandTranslation = pgTable("brand_translation", {
  brandId: uuid().notNull().references(() => brand.id, { onDelete: "cascade" }),
  localeCode: text().notNull().references(() => locale.code, { onDelete: "restrict" }),
  name: text().notNull(),
  normalizedName: text().notNull(),
}, (table) => [
  primaryKey({ columns: [table.brandId, table.localeCode] }),
  index("brand_translation_name_idx").on(table.localeCode, table.normalizedName),
]);

export const productLine = pgTable("product_line", {
  id: uuid().primaryKey().defaultRandom(),
  brandId: uuid().notNull().references(() => brand.id, { onDelete: "restrict" }),
  slug: text().notNull(),
  sortOrder: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("product_line_brand_slug_unique").on(table.brandId, table.slug),
  index("product_line_brand_idx").on(table.brandId),
]);

export const productLineTranslation = pgTable("product_line_translation", {
  productLineId: uuid().notNull().references(() => productLine.id, { onDelete: "cascade" }),
  localeCode: text().notNull().references(() => locale.code, { onDelete: "restrict" }),
  name: text().notNull(),
  normalizedName: text().notNull(),
}, (table) => [
  primaryKey({ columns: [table.productLineId, table.localeCode] }),
  index("product_line_translation_name_idx").on(table.localeCode, table.normalizedName),
]);

export const category = pgTable("category", {
  id: uuid().primaryKey().defaultRandom(),
  parentId: uuid(),
  slug: text().notNull(),
  sortOrder: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("category_slug_unique").on(table.slug),
  index("category_parent_idx").on(table.parentId),
  foreignKey({ columns: [table.parentId], foreignColumns: [table.id] }).onDelete("set null"),
  check("category_parent_check", sql`${table.parentId} is null or ${table.parentId} <> ${table.id}`),
]);

export const categoryTranslation = pgTable("category_translation", {
  categoryId: uuid().notNull().references(() => category.id, { onDelete: "cascade" }),
  localeCode: text().notNull().references(() => locale.code, { onDelete: "restrict" }),
  name: text().notNull(),
  description: text(),
  normalizedName: text().notNull(),
}, (table) => [
  primaryKey({ columns: [table.categoryId, table.localeCode] }),
  index("category_translation_name_idx").on(table.localeCode, table.normalizedName),
]);

export const concern = pgTable("concern", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull(),
  sortOrder: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("concern_slug_unique").on(table.slug)]);

export const concernTranslation = pgTable("concern_translation", {
  concernId: uuid().notNull().references(() => concern.id, { onDelete: "cascade" }),
  localeCode: text().notNull().references(() => locale.code, { onDelete: "restrict" }),
  name: text().notNull(),
  description: text(),
  normalizedName: text().notNull(),
}, (table) => [
  primaryKey({ columns: [table.concernId, table.localeCode] }),
  index("concern_translation_name_idx").on(table.localeCode, table.normalizedName),
]);

export const skinState = pgTable("skin_state", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull(),
  sortOrder: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("skin_state_slug_unique").on(table.slug)]);

export const skinStateTranslation = pgTable("skin_state_translation", {
  skinStateId: uuid().notNull().references(() => skinState.id, { onDelete: "cascade" }),
  localeCode: text().notNull().references(() => locale.code, { onDelete: "restrict" }),
  name: text().notNull(),
  description: text(),
  normalizedName: text().notNull(),
}, (table) => [
  primaryKey({ columns: [table.skinStateId, table.localeCode] }),
  index("skin_state_translation_name_idx").on(table.localeCode, table.normalizedName),
]);

export const protocol = pgTable("protocol", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull(),
  sortOrder: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("protocol_slug_unique").on(table.slug)]);

export const protocolTranslation = pgTable("protocol_translation", {
  protocolId: uuid().notNull().references(() => protocol.id, { onDelete: "cascade" }),
  localeCode: text().notNull().references(() => locale.code, { onDelete: "restrict" }),
  name: text().notNull(),
  description: text(),
  normalizedName: text().notNull(),
}, (table) => [
  primaryKey({ columns: [table.protocolId, table.localeCode] }),
  index("protocol_translation_name_idx").on(table.localeCode, table.normalizedName),
]);

export const protocolPhase = pgTable("protocol_phase", {
  id: uuid().primaryKey().defaultRandom(),
  protocolId: uuid().notNull().references(() => protocol.id, { onDelete: "cascade" }),
  slug: text().notNull(),
  sortOrder: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("protocol_phase_protocol_slug_unique").on(table.protocolId, table.slug),
  index("protocol_phase_protocol_idx").on(table.protocolId),
]);

export const protocolPhaseTranslation = pgTable("protocol_phase_translation", {
  protocolPhaseId: uuid().notNull(),
  localeCode: text().notNull().references(() => locale.code, { onDelete: "restrict" }),
  name: text().notNull(),
  description: text(),
  normalizedName: text().notNull(),
}, (table) => [
  primaryKey({ columns: [table.protocolPhaseId, table.localeCode] }),
  foreignKey({
    name: "protocol_phase_translation_phase_fk",
    columns: [table.protocolPhaseId],
    foreignColumns: [protocolPhase.id],
  }).onDelete("cascade"),
  index("protocol_phase_translation_name_idx").on(table.localeCode, table.normalizedName),
]);
