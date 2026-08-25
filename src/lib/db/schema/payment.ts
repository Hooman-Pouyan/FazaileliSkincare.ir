import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  bankTransferClaimStatusEnum,
  paymentMethodEnum,
  paymentStatusEnum,
  shipmentStatusEnum,
  shippingMethodEnum,
} from "./enums";
import { person } from "./identity";
import { customerOrder } from "./order";

export const payment = pgTable(
  "payment",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => customerOrder.id, { onDelete: "restrict" }),
    method: paymentMethodEnum().notNull(),
    status: paymentStatusEnum().notNull().default("pending"),
    amountRials: bigint({ mode: "bigint" }).notNull(),
    provider: text(),
    providerAuthority: text(),
    providerReference: text(),
    idempotencyKey: uuid().notNull(),
    requestHash: text().notNull(),
    version: integer().notNull().default(0),
    fundsReceivedAt: timestamp({ withTimezone: true }),
    settledAt: timestamp({ withTimezone: true }),
    refundedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Referenced by payment_settlement's composite foreign key. Redundant with
    // the primary key on its own, and required by PostgreSQL so a settlement can
    // only name the order its own payment belongs to.
    uniqueIndex("payment_id_order_unique").on(table.id, table.orderId),
    uniqueIndex("payment_idempotency_unique").on(table.idempotencyKey),
    uniqueIndex("payment_provider_authority_unique")
      .on(table.provider, table.providerAuthority)
      .where(
        sql`${table.provider} is not null and ${table.providerAuthority} is not null`,
      ),
    uniqueIndex("payment_provider_reference_unique")
      .on(table.provider, table.providerReference)
      .where(
        sql`${table.provider} is not null and ${table.providerReference} is not null`,
      ),
    index("payment_order_time_idx").on(table.orderId, table.createdAt),
    index("payment_status_time_idx").on(
      table.status,
      table.createdAt,
      table.id,
    ),
    check("payment_amount_check", sql`${table.amountRials} >= 0`),
    check("payment_version_check", sql`${table.version} >= 0`),
  ],
);

export const bankTransferClaim = pgTable(
  "bank_transfer_claim",
  {
    id: uuid().primaryKey().defaultRandom(),
    paymentId: uuid()
      .notNull()
      .references(() => payment.id, { onDelete: "restrict" }),
    status: bankTransferClaimStatusEnum().notNull().default("submitted"),
    expectedAmountRials: bigint({ mode: "bigint" }).notNull(),
    trackingNumber: text(),
    last4OfCard: text(),
    transferredAt: timestamp({ withTimezone: true }),
    receiptObjectKey: text(),
    submissionIdempotencyKey: uuid().notNull(),
    submissionRequestHash: text().notNull(),
    reviewedBy: uuid().references(() => person.id, { onDelete: "restrict" }),
    reviewedAt: timestamp({ withTimezone: true }),
    reviewReason: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("bank_transfer_claim_submission_unique").on(
      table.submissionIdempotencyKey,
    ),
    index("bank_transfer_claim_payment_time_idx").on(
      table.paymentId,
      table.createdAt,
    ),
    index("bank_transfer_claim_status_time_idx").on(
      table.status,
      table.createdAt,
      table.id,
    ),
    index("bank_transfer_claim_reviewer_idx").on(table.reviewedBy),
    check(
      "bank_transfer_claim_amount_check",
      sql`${table.expectedAmountRials} >= 0`,
    ),
    check(
      "bank_transfer_claim_last4_check",
      sql`${table.last4OfCard} is null or ${table.last4OfCard} ~ '^[0-9]{4}$'`,
    ),
    check(
      "bank_transfer_claim_review_check",
      sql`(${table.status} = 'submitted' and ${table.reviewedBy} is null and ${table.reviewedAt} is null) or (${table.status} in ('accepted', 'rejected') and ${table.reviewedBy} is not null and ${table.reviewedAt} is not null)`,
    ),
  ],
);

export const paymentEvent = pgTable(
  "payment_event",
  {
    id: uuid().primaryKey().defaultRandom(),
    paymentId: uuid()
      .notNull()
      .references(() => payment.id, { onDelete: "restrict" }),
    kind: text().notNull(),
    providerEventId: text(),
    actorId: uuid().references(() => person.id, { onDelete: "restrict" }),
    payload: jsonb(),
    requestId: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("payment_event_provider_event_unique")
      .on(table.providerEventId)
      .where(sql`${table.providerEventId} is not null`),
    index("payment_event_payment_time_idx").on(
      table.paymentId,
      table.createdAt,
    ),
    index("payment_event_actor_idx").on(table.actorId),
  ],
);

export const paymentSettlement = pgTable(
  "payment_settlement",
  {
    id: uuid().primaryKey().defaultRandom(),
    paymentId: uuid().notNull(),
    orderId: uuid().notNull(),
    amountRials: bigint({ mode: "bigint" }).notNull(),
    actorId: uuid().references(() => person.id, { onDelete: "restrict" }),
    idempotencyKey: uuid().notNull(),
    settledAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // One relation, not two independent ones. Two separate foreign keys let a
    // settlement name payment A and order B; a transposed variable in
    // settleOrder would then mark the wrong order paid with every invariant
    // still passing. Reaching the order only through its payment makes that
    // unrepresentable. (Storefront/database review, HIGH-2 / C2.)
    foreignKey({
      columns: [table.paymentId, table.orderId],
      foreignColumns: [payment.id, payment.orderId],
      name: "payment_settlement_payment_order_fk",
    }).onDelete("restrict"),
    uniqueIndex("payment_settlement_payment_unique").on(table.paymentId),
    uniqueIndex("payment_settlement_idempotency_unique").on(
      table.idempotencyKey,
    ),
    index("payment_settlement_order_idx").on(table.orderId),
    index("payment_settlement_actor_idx").on(table.actorId),
    check("payment_settlement_amount_check", sql`${table.amountRials} >= 0`),
  ],
);

export const shipment = pgTable(
  "shipment",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => customerOrder.id, { onDelete: "restrict" }),
    status: shipmentStatusEnum().notNull().default("pending"),
    method: shippingMethodEnum().notNull(),
    carrier: text(),
    trackingCode: text(),
    readyAt: timestamp({ withTimezone: true }),
    shippedAt: timestamp({ withTimezone: true }),
    deliveredAt: timestamp({ withTimezone: true }),
    returnedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("shipment_order_idx").on(table.orderId),
    index("shipment_status_time_idx").on(table.status, table.createdAt),
  ],
);
