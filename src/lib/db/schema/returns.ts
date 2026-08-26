import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  refundStatusEnum,
  returnDispositionEnum,
  returnStatusEnum,
  paymentMethodEnum,
} from "./enums";
import { person } from "./identity";
import { customerOrder, orderLine } from "./order";
import { payment } from "./payment";
import { shipment } from "./payment";

/**
 * Partial shipment — `COM-D10`.
 *
 * Support it without forcing it: an order that ships in one parcel has one
 * shipment with one line per order line, and nothing about that is special.
 * What this table buys is the ability to send three of five items now without
 * inventing a second order, which is the common case when one product is
 * waiting on a restock.
 *
 * The unique on `(shipment_id, order_line_id)` is what stops the same line
 * being allocated twice within one parcel; allocating **across** parcels is
 * legitimate and is checked in the service, because the sum against the order
 * line's quantity is not something a row-level constraint can see.
 */
export const shipmentLine = pgTable(
  "shipment_line",
  {
    id: uuid().primaryKey().defaultRandom(),
    shipmentId: uuid()
      .notNull()
      .references(() => shipment.id, { onDelete: "cascade" }),
    orderLineId: uuid()
      .notNull()
      .references(() => orderLine.id, { onDelete: "restrict" }),
    quantity: integer().notNull(),
  },
  (table) => [
    uniqueIndex("shipment_line_shipment_order_line_unique").on(
      table.shipmentId,
      table.orderLineId,
    ),
    index("shipment_line_order_line_idx").on(table.orderLineId),
    check("shipment_line_quantity_check", sql`${table.quantity} > 0`),
  ],
);

/**
 * A customer's request to send something back — `COM-D11`.
 *
 * **A request, not a decision.** It records what was asked for and who reviewed
 * it; whether money moves is `refund`'s business and whether stock returns is
 * `return_line`'s. Keeping the three apart is `COM-D11`'s entire point, and it
 * is the same discipline as `AGENTS.md` rule 8 for transfers: a claim is not
 * proof.
 *
 * `requestHash` alongside `idempotencyKey` follows `payment`: the key says
 * "this is the same submission", the hash says "and it asked for the same
 * thing". A retry with the same key but different lines is a bug, not a retry,
 * and without the hash it would silently overwrite the original request.
 */
export const returnRequest = pgTable(
  "return_request",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => customerOrder.id, { onDelete: "restrict" }),
    /** Null for a guest return, which is reached through an order access token. */
    personId: uuid().references(() => person.id, { onDelete: "set null" }),
    status: returnStatusEnum().notNull().default("requested"),
    /** The customer's words. Never edited, so a dispute has the original. */
    reason: text().notNull(),
    idempotencyKey: uuid().notNull(),
    requestHash: text().notNull(),
    reviewedBy: uuid().references(() => person.id, { onDelete: "restrict" }),
    reviewedAt: timestamp({ withTimezone: true }),
    reviewNote: text(),
    receivedAt: timestamp({ withTimezone: true }),
    resolvedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("return_request_idempotency_unique").on(table.idempotencyKey),
    index("return_request_order_idx").on(table.orderId),
    index("return_request_person_idx").on(table.personId),
    index("return_request_reviewer_idx").on(table.reviewedBy),
    index("return_request_status_time_idx").on(table.status, table.createdAt),

    // A reviewed request names its reviewer and when. Either both or neither —
    // a review with no reviewer is an audit trail that cannot be followed.
    check(
      "return_request_review_check",
      sql`(${table.reviewedBy} is null) = (${table.reviewedAt} is null)`,
    ),
    // Terminal states carry their timestamp.
    check(
      "return_request_approved_review_check",
      sql`${table.status} not in ('approved', 'rejected') or ${table.reviewedAt} is not null`,
    ),
    check(
      "return_request_received_check",
      sql`${table.status} <> 'received' or ${table.receivedAt} is not null`,
    ),
    check(
      "return_request_resolved_check",
      sql`${table.status} <> 'resolved' or ${table.resolvedAt} is not null`,
    ),
  ],
);

/**
 * What is coming back, line by line, and what happens to it when it arrives.
 *
 * Quantity is bounded twice: positive here, and never more than the order line
 * shipped — which the service checks, because a row cannot see its parent's
 * quantity. `disposition` defaults to `pending` rather than `restock`, because
 * `COM-D11` makes restocking a separate decision and skincare that has left the
 * building does not go back on a shelf by default.
 */
export const returnLine = pgTable(
  "return_line",
  {
    id: uuid().primaryKey().defaultRandom(),
    returnRequestId: uuid()
      .notNull()
      .references(() => returnRequest.id, { onDelete: "cascade" }),
    orderLineId: uuid()
      .notNull()
      .references(() => orderLine.id, { onDelete: "restrict" }),
    quantityRequested: integer().notNull(),
    /** Null until the parcel is opened. Zero is a real answer. */
    quantityReceived: integer(),
    disposition: returnDispositionEnum().notNull().default("pending"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("return_line_request_order_line_unique").on(
      table.returnRequestId,
      table.orderLineId,
    ),
    index("return_line_order_line_idx").on(table.orderLineId),
    check(
      "return_line_requested_check",
      sql`${table.quantityRequested} > 0`,
    ),
    check(
      "return_line_received_check",
      sql`${table.quantityReceived} is null or (${table.quantityReceived} >= 0 and ${table.quantityReceived} <= ${table.quantityRequested})`,
    ),
    // Nothing is dispositioned before it has been counted.
    check(
      "return_line_disposition_check",
      sql`${table.disposition} = 'pending' or ${table.quantityReceived} is not null`,
    ),
  ],
);

/**
 * Money going back — `COM-D11`, and the ledger `AGENTS.md` rule 1 governs.
 *
 * **Bound to a payment *and* its order**, through the same composite foreign
 * key `payment_settlement` uses. A refund that named only a payment could be
 * attached to an order the payment does not belong to, which is exactly the
 * defect correction `C2` closed for settlements — this table is built with the
 * fix already in place rather than discovering it twice.
 *
 * Partial refunds are the normal case, so there is no unique on `paymentId`:
 * one payment may have several refunds, and their sum against the payment's
 * amount is a service check. `idempotencyKey` and `requestHash` mean a retried
 * refund cannot pay twice, which is the failure that costs real money.
 */
export const refund = pgTable(
  "refund",
  {
    id: uuid().primaryKey().defaultRandom(),
    paymentId: uuid().notNull(),
    orderId: uuid().notNull(),
    returnRequestId: uuid().references(() => returnRequest.id, {
      onDelete: "restrict",
    }),
    status: refundStatusEnum().notNull().default("pending"),
    method: paymentMethodEnum().notNull(),
    amountRials: bigint({ mode: "bigint" }).notNull(),
    idempotencyKey: uuid().notNull(),
    requestHash: text().notNull(),
    /** The gateway's or the bank's own reference, once there is one. */
    providerReference: text(),
    failureReason: text(),
    processedBy: uuid().references(() => person.id, { onDelete: "restrict" }),
    completedAt: timestamp({ withTimezone: true }),
    failedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.paymentId, table.orderId],
      foreignColumns: [payment.id, payment.orderId],
      name: "refund_payment_order_fk",
    }).onDelete("restrict"),
    uniqueIndex("refund_idempotency_unique").on(table.idempotencyKey),
    uniqueIndex("refund_provider_reference_unique")
      .on(table.providerReference)
      .where(sql`${table.providerReference} is not null`),
    // Matches the composite foreign key's leading columns, so the referential
    // check has an index to use rather than a scan. A composite on
    // `(payment_id, order_id)` also serves a lookup on `payment_id` alone, so
    // it replaces the single-column index rather than sitting beside it.
    index("refund_payment_order_idx").on(table.paymentId, table.orderId),
    index("refund_order_idx").on(table.orderId),
    index("refund_return_idx").on(table.returnRequestId),
    index("refund_processor_idx").on(table.processedBy),
    index("refund_status_time_idx").on(table.status, table.createdAt),

    check("refund_amount_check", sql`${table.amountRials} > 0`),
    check(
      "refund_completed_check",
      sql`${table.status} <> 'completed' or ${table.completedAt} is not null`,
    ),
    check(
      "refund_failed_check",
      sql`${table.status} <> 'failed' or (${table.failedAt} is not null and ${table.failureReason} is not null)`,
    ),
    // A completed refund is not also a failed one.
    check(
      "refund_terminal_check",
      sql`${table.completedAt} is null or ${table.failedAt} is null`,
    ),
  ],
);
