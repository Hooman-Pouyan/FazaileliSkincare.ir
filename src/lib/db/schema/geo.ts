import {
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Iranian provinces and cities — reference data, not catalogue data.
 *
 * An address needs a canonical province and city rather than free text, because
 * `shipping_rate` prices by location (`COM-D2`) and a rate keyed on a string
 * someone typed is a rate that silently stops matching. `address` currently
 * stores both as `text`; these tables are what it will point at.
 *
 * **Codes are the identity, names are a translation.** A province's Persian
 * name is what a customer reads and an ISO code is what a rate table and an
 * import both key on. Keeping the code as the primary key means a spelling
 * correction is an update, not a re-parenting of every address in the system.
 *
 * This is reviewed reference data. Where the rows come from is recorded in the
 * seed, and the seed is deterministic — see `docs/system-design/cart-checkout-payment-fulfilment-and-returns.md` §3.2.
 */
export const iranProvince = pgTable(
  "iran_province",
  {
    /** ISO 3166-2:IR, without the `IR-` prefix: `07` is Tehran. */
    code: text().primaryKey(),
    nameFa: text().notNull(),
    nameEn: text().notNull(),
    /** Display order, so a form does not list them by code. */
    sortOrder: integer().notNull().default(0),
  },
  (table) => [
    uniqueIndex("iran_province_name_fa_unique").on(table.nameFa),
    index("iran_province_sort_idx").on(table.sortOrder, table.code),
  ],
);

export const iranCity = pgTable(
  "iran_city",
  {
    code: text().primaryKey(),
    provinceCode: text()
      .notNull()
      .references(() => iranProvince.code, { onDelete: "restrict" }),
    nameFa: text().notNull(),
    nameEn: text().notNull(),
    /**
     * Whether this is the province's administrative centre.
     *
     * Not decoration: the seeded set is currently the capitals only, so this is
     * what tells a reader that a province with one city is incomplete rather
     * than genuinely single-city.
     */
    isCapital: integer().notNull().default(0),
    sortOrder: integer().notNull().default(0),
  },
  (table) => [
    // A city name is only unique within its province — Iran has more than one
    // «آبادان»-shaped collision, and a global unique would reject real data.
    uniqueIndex("iran_city_province_name_unique").on(
      table.provinceCode,
      table.nameFa,
    ),
    index("iran_city_province_idx").on(table.provinceCode, table.sortOrder),
  ],
);
