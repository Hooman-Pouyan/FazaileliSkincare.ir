import { pgTable, uuid, text, integer, bigint, timestamp, pgEnum, jsonb, index, unique } from "drizzle-orm/pg-core";
import { person, address } from "./identity";
import { variant } from "./catalog";

export const orderStatusEnum = pgEnum("order_status", [
  "draft", "awaiting_payment", "awaiting_transfer", "paid", "fulfilled", "completed", "cancelled", "refunded",
]);
export const paymentMethodEnum = pgEnum("payment_method", ["gateway", "bank_transfer", "cash_on_pickup"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "submitted", "confirmed", "failed", "refunded"]);
export const shippingMethodEnum = pgEnum("shipping_method", ["post", "courier", "pickup"]);

export const cart = pgTable("cart", {
  id: uuid().primaryKey().defaultRandom(),
  personId: uuid().references(() => person.id, { onDelete: "cascade" }),
  anonymousKey: text(),                 // guest carts merge into the person's on login
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp({ withTimezone: true }),
}, (t) => [index("cart_person_idx").on(t.personId), index("cart_anon_idx").on(t.anonymousKey)]);

export const cartItem = pgTable("cart_item", {
  id: uuid().primaryKey().defaultRandom(),
  cartId: uuid().notNull().references(() => cart.id, { onDelete: "cascade" }),
  variantId: uuid().notNull().references(() => variant.id),
  quantity: integer().notNull().default(1),
  /** Soft reservation with a TTL — stock is NOT decremented here. */
  reservedUntil: timestamp({ withTimezone: true }),
}, (t) => [unique("cart_item_unique").on(t.cartId, t.variantId)]);

export const order = pgTable("order", {
  id: uuid().primaryKey().defaultRandom(),
  orderNumber: text().notNull(),        // human-readable, not the UUID
  personId: uuid().references(() => person.id),
  guestPhone: text(),
  status: orderStatusEnum().notNull().default("draft"),
  /** Recomputed server-side at payment time. The client's number is a hint. */
  subtotalRials: bigint({ mode: "bigint" }).notNull().default(0n),
  shippingRials: bigint({ mode: "bigint" }).notNull().default(0n),
  discountRials: bigint({ mode: "bigint" }).notNull().default(0n),
  totalRials: bigint({ mode: "bigint" }).notNull().default(0n),
  shippingMethod: shippingMethodEnum(),
  addressId: uuid().references(() => address.id),
  addressSnapshot: jsonb(),             // frozen at purchase; addresses change
  placedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("order_number_unique").on(t.orderNumber),
  index("order_person_idx").on(t.personId),
  index("order_status_idx").on(t.status),
]);

/** Immutable snapshots — a later price change must never rewrite history. */
export const orderLine = pgTable("order_line", {
  id: uuid().primaryKey().defaultRandom(),
  orderId: uuid().notNull().references(() => order.id, { onDelete: "cascade" }),
  variantId: uuid().notNull().references(() => variant.id),
  nameSnapshotFa: text().notNull(),
  skuSnapshot: text().notNull(),
  unitPriceRials: bigint({ mode: "bigint" }).notNull(),
  quantity: integer().notNull(),
  lineTotalRials: bigint({ mode: "bigint" }).notNull(),
});

export const payment = pgTable("payment", {
  id: uuid().primaryKey().defaultRandom(),
  orderId: uuid().notNull().references(() => order.id, { onDelete: "cascade" }),
  method: paymentMethodEnum().notNull(),
  status: paymentStatusEnum().notNull().default("pending"),
  amountRials: bigint({ mode: "bigint" }).notNull(),
  gateway: text(),
  /** Unique so a refreshed callback cannot verify twice. */
  authority: text(),
  refId: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp({ withTimezone: true }),
}, (t) => [unique("payment_authority_unique").on(t.authority), index("payment_order_idx").on(t.orderId)]);

/**
 * Bank transfer — the path that lets the shop open before ZarinPal lands.
 * ⚠️ A customer-uploaded receipt is a CLAIM, not proof. Only a staff member who
 * has matched the real bank statement sets `confirmedBy`. (AGENTS.md rule 8.)
 */
export const bankTransferClaim = pgTable("bank_transfer_claim", {
  id: uuid().primaryKey().defaultRandom(),
  paymentId: uuid().notNull().references(() => payment.id, { onDelete: "cascade" }),
  expectedAmountRials: bigint({ mode: "bigint" }).notNull(),
  trackingNumber: text(),
  last4OfCard: text(),
  transferredAt: timestamp({ withTimezone: true }),
  receiptImageKey: text(),
  confirmedBy: uuid().references(() => person.id),
  confirmedAt: timestamp({ withTimezone: true }),
  rejectedReason: text(),
}, (t) => [index("btc_payment_idx").on(t.paymentId)]);

/** Written BEFORE anything else happens. When a customer says "I paid", this is the defence. */
export const paymentEvent = pgTable("payment_event", {
  id: uuid().primaryKey().defaultRandom(),
  paymentId: uuid().notNull().references(() => payment.id, { onDelete: "cascade" }),
  kind: text().notNull(),               // request | callback | verify | confirm | reject
  actorId: uuid().references(() => person.id),
  payload: jsonb(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("payment_event_payment_idx").on(t.paymentId)]);

export const shipment = pgTable("shipment", {
  id: uuid().primaryKey().defaultRandom(),
  orderId: uuid().notNull().references(() => order.id, { onDelete: "cascade" }),
  carrier: text(),
  trackingCode: text(),
  shippedAt: timestamp({ withTimezone: true }),
  deliveredAt: timestamp({ withTimezone: true }),
});
