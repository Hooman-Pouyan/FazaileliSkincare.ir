import { sql } from "drizzle-orm";
import {
  bigint,
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
import { variant } from "./catalog";
import { orderStatusEnum, shippingMethodEnum } from "./enums";
import { person } from "./identity";

export const customerOrder = pgTable(
  "customer_order",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderNumber: text().notNull(),
    personId: uuid().references(() => person.id, { onDelete: "set null" }),
    guestPhone: text(),
    contactPhone: text().notNull(),
    status: orderStatusEnum().notNull().default("draft"),
    subtotalRials: bigint({ mode: "bigint" })
      .notNull()
      .default(sql`0`),
    shippingRials: bigint({ mode: "bigint" })
      .notNull()
      .default(sql`0`),
    discountRials: bigint({ mode: "bigint" })
      .notNull()
      .default(sql`0`),
    totalRials: bigint({ mode: "bigint" })
      .notNull()
      .default(sql`0`),
    shippingMethod: shippingMethodEnum(),
    addressSnapshot: jsonb(),
    checkoutIdempotencyKey: uuid().notNull(),
    checkoutRequestHash: text().notNull(),
    version: integer().notNull().default(0),
    placedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("customer_order_number_unique").on(table.orderNumber),
    uniqueIndex("customer_order_checkout_idempotency_unique").on(
      table.checkoutIdempotencyKey,
    ),
    index("customer_order_person_time_idx").on(
      table.personId,
      table.createdAt,
      table.id,
    ),
    index("customer_order_status_time_idx").on(
      table.status,
      table.createdAt,
      table.id,
    ),
    // customer_order_contact_check is deliberately absent. It required a
    // person or a guest phone, but personId is ON DELETE SET NULL: deleting a
    // registered customer who had ordered set personId to null and the check
    // aborted the delete inside a cascade, as an opaque constraint error rather
    // than a domain rule. contactPhone is a NOT NULL snapshot taken at
    // placement and already guarantees every order carries its own contact, so
    // the order survives the customer row. (Review HIGH-1 / C1.)
    check(
      "customer_order_contact_phone_e164_check",
      sql`${table.contactPhone} ~ '^\\+[1-9][0-9]{7,14}$'`,
    ),
    check(
      "customer_order_totals_check",
      sql`${table.subtotalRials} >= 0 and ${table.shippingRials} >= 0 and ${table.discountRials} >= 0 and ${table.totalRials} = ${table.subtotalRials} + ${table.shippingRials} - ${table.discountRials}`,
    ),
    check(
      "customer_order_discount_check",
      sql`${table.discountRials} <= ${table.subtotalRials} + ${table.shippingRials}`,
    ),
    check("customer_order_version_check", sql`${table.version} >= 0`),
  ],
);

export const orderLine = pgTable(
  "order_line",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => customerOrder.id, { onDelete: "restrict" }),
    variantId: uuid()
      .notNull()
      .references(() => variant.id, { onDelete: "restrict" }),
    productNameSnapshot: text().notNull(),
    variantNameSnapshot: text(),
    skuSnapshot: text().notNull(),
    unitPriceRials: bigint({ mode: "bigint" }).notNull(),
    quantity: integer().notNull(),
    lineTotalRials: bigint({ mode: "bigint" }).notNull(),
  },
  (table) => [
    index("order_line_order_idx").on(table.orderId),
    index("order_line_variant_idx").on(table.variantId),
    check("order_line_quantity_check", sql`${table.quantity} > 0`),
    check("order_line_price_check", sql`${table.unitPriceRials} >= 0`),
    check(
      "order_line_total_check",
      sql`${table.lineTotalRials} = ${table.unitPriceRials} * ${table.quantity}`,
    ),
  ],
);
