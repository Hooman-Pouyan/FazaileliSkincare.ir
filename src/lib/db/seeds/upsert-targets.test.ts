import { is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import * as schema from "../schema";

/**
 * Every `onConflictDoUpdate` target in the seeders, checked against the unique
 * indexes and primary keys the schema actually declares.
 *
 * PostgreSQL rejects an ON CONFLICT clause whose columns are not covered by a
 * unique constraint — `there is no unique or exclusion constraint matching the
 * ON CONFLICT specification`. That failure only appears against a live database,
 * which is the one thing the fast suite cannot reach, so the mismatch survives
 * every check until someone runs the seed. `product_line` is unique on
 * (brand_id, slug) rather than slug alone, and that is exactly how it was found.
 *
 * Adding an upsert to a seeder means adding its row here.
 */
const UPSERT_TARGETS: readonly (readonly [string, readonly string[]])[] = [
  ["locale", ["code"]],
  ["concern", ["slug"]],
  ["concern_translation", ["concernId", "localeCode"]],
  ["brand", ["slug"]],
  ["brand_translation", ["brandId", "localeCode"]],
  ["product_line", ["brandId", "slug"]],
  ["product_line_translation", ["productLineId", "localeCode"]],
  ["category", ["slug"]],
  ["category_translation", ["categoryId", "localeCode"]],
  ["product", ["slug"]],
  ["product_translation", ["productId", "localeCode"]],
  ["product_media", ["sourcePath"]],
  ["product_media_translation", ["productMediaId", "localeCode"]],
  ["variant", ["sku"]],
  ["variant_translation", ["variantId", "localeCode"]],
  ["price", ["variantId", "customerGroup"]],
  ["inventory", ["variantId"]],
];

function uniqueColumnSets(tableName: string): readonly string[][] {
  const table = Object.values(schema)
    .filter((value) => is(value, PgTable))
    .map((value) => getTableConfig(value))
    .find((config) => config.name === tableName);

  if (!table) throw new Error(`No table named ${tableName} in the schema`);

  const sets: string[][] = [];

  for (const index of table.indexes) {
    if (!index.config.unique) continue;
    if (index.config.where) continue; // partial: only unique within its predicate
    sets.push(
      index.config.columns.map((column) =>
        "name" in column ? String(column.name) : "",
      ),
    );
  }

  for (const key of table.primaryKeys) {
    sets.push(key.columns.map((column) => column.name));
  }

  const singleColumnPrimary = table.columns.filter((column) => column.primary);
  for (const column of singleColumnPrimary) sets.push([column.name]);

  return sets;
}

describe("seed upsert targets", () => {
  it.each(UPSERT_TARGETS)(
    "%s is uniquely constrained on the columns the seeder upserts",
    (tableName, columns) => {
      const wanted = [...columns].sort().join(",");
      const available = uniqueColumnSets(tableName).map((set) =>
        [...set].sort().join(","),
      );

      expect(available).toContain(wanted);
    },
  );
});
