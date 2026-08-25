import { sql } from "drizzle-orm";
import {
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
import { cartStatusEnum } from "./enums";
import { person } from "./identity";

export const cart = pgTable(
  "cart",
  {
    id: uuid().primaryKey().defaultRandom(),
    personId: uuid().references(() => person.id, { onDelete: "cascade" }),
    anonymousKeyHash: text(),
    status: cartStatusEnum().notNull().default("active"),
    version: integer().notNull().default(0),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("cart_active_person_unique")
      .on(table.personId)
      .where(sql`${table.status} = 'active' and ${table.personId} is not null`),
    uniqueIndex("cart_active_anonymous_unique")
      .on(table.anonymousKeyHash)
      .where(
        sql`${table.status} = 'active' and ${table.anonymousKeyHash} is not null`,
      ),
    index("cart_expiry_idx").on(table.status, table.expiresAt),
    check(
      "cart_owner_check",
      sql`(${table.personId} is null) <> (${table.anonymousKeyHash} is null)`,
    ),
    check("cart_version_check", sql`${table.version} >= 0`),
  ],
);

export const cartItem = pgTable(
  "cart_item",
  {
    id: uuid().primaryKey().defaultRandom(),
    cartId: uuid()
      .notNull()
      .references(() => cart.id, { onDelete: "cascade" }),
    variantId: uuid()
      .notNull()
      .references(() => variant.id, { onDelete: "restrict" }),
    quantity: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("cart_item_cart_variant_unique").on(
      table.cartId,
      table.variantId,
    ),
    index("cart_item_variant_idx").on(table.variantId),
    check("cart_item_quantity_check", sql`${table.quantity} > 0`),
  ],
);
