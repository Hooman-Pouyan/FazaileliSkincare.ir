import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { variant } from "./catalog";
import {
  customerGroupEnum,
  inventoryMovementTypeEnum,
  priceBatchStatusEnum,
} from "./enums";
import { person } from "./identity";

export const price = pgTable("price", {
  id: uuid().primaryKey().defaultRandom(),
  variantId: uuid().notNull().references(() => variant.id, { onDelete: "restrict" }),
  customerGroup: customerGroupEnum().notNull().default("public"),
  amountRials: bigint({ mode: "bigint" }).notNull(),
  effectiveAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("price_variant_group_unique").on(table.variantId, table.customerGroup),
  check("price_amount_check", sql`${table.amountRials} >= 0`),
]);

export const priceAdjustmentBatch = pgTable("price_adjustment_batch", {
  id: uuid().primaryKey().defaultRandom(),
  label: text().notNull(),
  status: priceBatchStatusEnum().notNull().default("draft"),
  requestHash: text().notNull(),
  createdBy: uuid().notNull().references(() => person.id, { onDelete: "restrict" }),
  committedBy: uuid().references(() => person.id, { onDelete: "restrict" }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  committedAt: timestamp({ withTimezone: true }),
}, (table) => [
  uniqueIndex("price_adjustment_batch_request_hash_unique").on(table.requestHash),
  index("price_adjustment_batch_created_by_idx").on(table.createdBy),
  index("price_adjustment_batch_committed_by_idx").on(table.committedBy),
  check(
    "price_adjustment_batch_commit_check",
    sql`(${table.status} = 'committed') = (${table.committedBy} is not null and ${table.committedAt} is not null)`,
  ),
]);

export const priceHistory = pgTable("price_history", {
  id: uuid().primaryKey().defaultRandom(),
  variantId: uuid().notNull().references(() => variant.id, { onDelete: "restrict" }),
  customerGroup: customerGroupEnum().notNull(),
  oldAmountRials: bigint({ mode: "bigint" }),
  newAmountRials: bigint({ mode: "bigint" }).notNull(),
  changedBy: uuid().notNull().references(() => person.id, { onDelete: "restrict" }),
  batchId: uuid().references(() => priceAdjustmentBatch.id, { onDelete: "restrict" }),
  changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("price_history_variant_changed_idx").on(table.variantId, table.changedAt),
  index("price_history_batch_idx").on(table.batchId),
  index("price_history_changed_by_idx").on(table.changedBy),
  check(
    "price_history_amount_check",
    sql`(${table.oldAmountRials} is null or ${table.oldAmountRials} >= 0) and ${table.newAmountRials} >= 0`,
  ),
]);

export const inventory = pgTable("inventory", {
  variantId: uuid().primaryKey().references(() => variant.id, { onDelete: "restrict" }),
  onHand: integer().notNull().default(0),
  version: integer().notNull().default(0),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("inventory_on_hand_check", sql`${table.onHand} >= 0`),
  check("inventory_version_check", sql`${table.version} >= 0`),
]);

export const inventoryMovement = pgTable("inventory_movement", {
  id: uuid().primaryKey().defaultRandom(),
  variantId: uuid().notNull().references(() => variant.id, { onDelete: "restrict" }),
  type: inventoryMovementTypeEnum().notNull(),
  quantityDelta: integer().notNull(),
  resultingOnHand: integer().notNull(),
  relatedAggregateType: text(),
  relatedAggregateId: uuid(),
  actorId: uuid().references(() => person.id, { onDelete: "restrict" }),
  reason: text(),
  idempotencyKey: uuid().notNull(),
  occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("inventory_movement_idempotency_unique").on(table.idempotencyKey),
  index("inventory_movement_variant_time_idx").on(table.variantId, table.occurredAt),
  index("inventory_movement_aggregate_idx").on(table.relatedAggregateType, table.relatedAggregateId),
  index("inventory_movement_actor_idx").on(table.actorId),
  check("inventory_movement_delta_check", sql`${table.quantityDelta} <> 0`),
  check("inventory_movement_result_check", sql`${table.resultingOnHand} >= 0`),
  check(
    "inventory_movement_aggregate_check",
    sql`(${table.relatedAggregateType} is null) = (${table.relatedAggregateId} is null)`,
  ),
]);
