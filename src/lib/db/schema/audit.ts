import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { outboxStatusEnum } from "./enums";
import { person } from "./identity";

export const auditLog = pgTable("audit_log", {
  id: uuid().primaryKey().defaultRandom(),
  actorId: uuid().references(() => person.id, { onDelete: "set null" }),
  action: text().notNull(),
  entityType: text().notNull(),
  entityId: uuid().notNull(),
  before: jsonb(),
  after: jsonb(),
  requestId: text(),
  ipAddress: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("audit_log_entity_time_idx").on(table.entityType, table.entityId, table.createdAt),
  index("audit_log_actor_time_idx").on(table.actorId, table.createdAt),
]);

export const notificationOutbox = pgTable("notification_outbox", {
  id: uuid().primaryKey().defaultRandom(),
  topic: text().notNull(),
  aggregateType: text().notNull(),
  aggregateId: uuid().notNull(),
  payload: jsonb().notNull(),
  deduplicationKey: text().notNull(),
  status: outboxStatusEnum().notNull().default("pending"),
  attempts: integer().notNull().default(0),
  availableAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  lockedAt: timestamp({ withTimezone: true }),
  lockedBy: text(),
  sentAt: timestamp({ withTimezone: true }),
  lastError: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("notification_outbox_deduplication_unique").on(table.deduplicationKey),
  index("notification_outbox_delivery_idx").on(table.status, table.availableAt),
  index("notification_outbox_aggregate_idx").on(table.aggregateType, table.aggregateId),
  check("notification_outbox_attempts_check", sql`${table.attempts} >= 0`),
]);
