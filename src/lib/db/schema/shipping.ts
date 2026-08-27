import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { iranCity, iranProvince } from "./geo";
import { shippingMethodEnum } from "./enums";

/**
 * Flat-rate shipping — `COM-D2`.
 *
 * v1 prices by **method plus location specificity** and nothing else. No
 * weight, no dimensions, no carrier API: a rate is a row someone can read and
 * a customer can be quoted from, and `COM-D5` requires the quote to be
 * reproducible from its canonical inputs.
 *
 * **Specificity is the whole design.** A rule may name a city, or a province,
 * or neither — and the most specific match wins. Pickup in Mashhad, courier
 * within Khorasan Razavi, post to anywhere else, expressed as three rows rather
 * than as a branch in a service.
 *
 * The partial uniques below are what stop two rows from both being "the" rule
 * for one method at one level: one national default per method, one per
 * province, one per city. Without them a quote depends on row order, which is
 * the kind of bug that only shows up after a second rate is added.
 */
export const shippingRate = pgTable(
  "shipping_rate",
  {
    id: uuid().primaryKey().defaultRandom(),
    method: shippingMethodEnum().notNull(),
    /** Null means this rule is not province-scoped. */
    provinceCode: text().references(() => iranProvince.code, {
      onDelete: "restrict",
    }),
    /** Null means this rule is not city-scoped. A city implies its province. */
    cityCode: text().references(() => iranCity.code, { onDelete: "restrict" }),
    /** Integer rials, like every other amount in this database. */
    amountRials: bigint({ mode: "bigint" }).notNull(),
    /** What the customer sees this option called. */
    labelFa: text().notNull(),
    /**
     * Free above this subtotal, when set — `COM2`'s "free threshold if
     * configured".
     *
     * Nullable rather than `0`, because those mean different things: null is
     * "this method is never free", `0` would be "always free". A threshold that
     * defaults to zero is a shop that ships everything for nothing the day
     * somebody forgets to set it.
     *
     * Compared against the **subtotal**, not the total, or the threshold would
     * depend on the shipping it is deciding.
     */
    freeAboveRials: bigint({ mode: "bigint" }),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("shipping_rate_lookup_idx")
      .on(table.method, table.provinceCode, table.cityCode)
      .where(sql`${table.isActive}`),
    index("shipping_rate_province_idx").on(table.provinceCode),
    index("shipping_rate_city_idx").on(table.cityCode),

    // One active rule per method at each level of specificity.
    uniqueIndex("shipping_rate_national_unique")
      .on(table.method)
      .where(
        sql`${table.isActive} and ${table.provinceCode} is null and ${table.cityCode} is null`,
      ),
    uniqueIndex("shipping_rate_province_unique")
      .on(table.method, table.provinceCode)
      .where(
        sql`${table.isActive} and ${table.provinceCode} is not null and ${table.cityCode} is null`,
      ),
    uniqueIndex("shipping_rate_city_unique")
      .on(table.method, table.cityCode)
      .where(sql`${table.isActive} and ${table.cityCode} is not null`),

    check("shipping_rate_amount_check", sql`${table.amountRials} >= 0`),
    check(
      "shipping_rate_free_above_check",
      sql`${table.freeAboveRials} is null or ${table.freeAboveRials} > 0`,
    ),
    // A city-scoped rule must say which province it is in, so the resolver can
    // fall back one level without a second lookup.
    check(
      "shipping_rate_scope_check",
      sql`${table.cityCode} is null or ${table.provinceCode} is not null`,
    ),
  ],
);
