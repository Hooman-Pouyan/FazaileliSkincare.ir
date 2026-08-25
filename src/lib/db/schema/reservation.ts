import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { variant } from "./catalog";
import { cartItem } from "./cart";
import { reservationStatusEnum } from "./enums";
import { orderLine } from "./order";

export const inventoryReservation = pgTable(
  "inventory_reservation",
  {
    id: uuid().primaryKey().defaultRandom(),
    variantId: uuid()
      .notNull()
      .references(() => variant.id, { onDelete: "restrict" }),
    sourceCartItemId: uuid()
      .notNull()
      .references(() => cartItem.id, { onDelete: "restrict" }),
    orderLineId: uuid().references(() => orderLine.id, {
      onDelete: "restrict",
    }),
    quantity: integer().notNull(),
    status: reservationStatusEnum().notNull().default("active"),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    consumedAt: timestamp({ withTimezone: true }),
    releasedAt: timestamp({ withTimezone: true }),
    idempotencyKey: uuid().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("inventory_reservation_idempotency_unique").on(
      table.idempotencyKey,
    ),
    uniqueIndex("inventory_reservation_active_cart_item_unique")
      .on(table.sourceCartItemId)
      .where(sql`${table.status} = 'active'`),
    index("inventory_reservation_variant_active_idx")
      .on(table.variantId, table.expiresAt)
      .where(sql`${table.status} = 'active'`),
    index("inventory_reservation_order_line_idx").on(table.orderLineId),
    check("inventory_reservation_quantity_check", sql`${table.quantity} > 0`),
    check(
      "inventory_reservation_resolution_check",
      sql`(${table.status} = 'active' and ${table.consumedAt} is null and ${table.releasedAt} is null) or (${table.status} = 'consumed' and ${table.consumedAt} is not null and ${table.releasedAt} is null) or (${table.status} in ('released', 'expired') and ${table.releasedAt} is not null and ${table.consumedAt} is null)`,
    ),
  ],
);
