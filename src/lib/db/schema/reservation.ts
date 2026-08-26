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
import { cart, cartItem } from "./cart";
import { reservationStatusEnum } from "./enums";
import { orderLine } from "./order";

export const inventoryReservation = pgTable(
  "inventory_reservation",
  {
    id: uuid().primaryKey().defaultRandom(),
    variantId: uuid()
      .notNull()
      .references(() => variant.id, { onDelete: "restrict" }),
    /**
     * The cart line this reservation was taken for, while that line still
     * exists — correction `C5`.
     *
     * It was `notNull` with `onDelete: "restrict"`, which made removing an item
     * from a cart impossible: the reservation held the line down, and the only
     * ways out were to delete audit history or to leave the line in the cart.
     * `restrict` was protecting the wrong thing. What must survive a removal is
     * the *record* that stock was held — the variant, the quantity, the cart —
     * not the pointer to a row the customer deleted on purpose.
     */
    sourceCartItemId: uuid().references(() => cartItem.id, {
      onDelete: "set null",
    }),
    /**
     * The cart itself, and this one is permanent.
     *
     * `sourceCartItemId` goes null when the line is removed; this does not, so
     * "which cart held this stock, and what happened to it" stays answerable
     * after the fact. `onDelete: "restrict"` because a cart with reservation
     * history is not something to delete casually — expiry resolves the
     * reservation, it does not erase the cart.
     */
    sourceCartId: uuid()
      .notNull()
      .references(() => cart.id, { onDelete: "restrict" }),
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
    index("inventory_reservation_cart_idx").on(table.sourceCartId),
    check("inventory_reservation_quantity_check", sql`${table.quantity} > 0`),
    check(
      "inventory_reservation_resolution_check",
      sql`(${table.status} = 'active' and ${table.consumedAt} is null and ${table.releasedAt} is null) or (${table.status} = 'consumed' and ${table.consumedAt} is not null and ${table.releasedAt} is null) or (${table.status} in ('released', 'expired') and ${table.releasedAt} is not null and ${table.consumedAt} is null)`,
    ),
  ],
);
