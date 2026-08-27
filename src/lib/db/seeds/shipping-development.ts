import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { shippingRate } from "../schema";
import type * as schema from "../schema";

/**
 * Shipping rates for development — **placeholders, not the business's prices.**
 *
 * `12.5` records that what Mashhad courier costs is a fact about the business
 * and that inventing a plausible number is how a fixture becomes a price
 * somebody quotes. That still holds. These exist so the checkout journey can be
 * built and exercised end to end, and they are fenced accordingly:
 *
 * - seeded **only** by the `demo` profile, never by `reference`, which is what
 *   a production database would run;
 * - `seedCommerceDemo`'s existing `assertStorydermSeedAllowed` already refuses
 *   to run outside development, and this rides the same call site;
 * - every label is prefixed so a rate that somehow escaped is obvious on sight
 *   rather than plausible.
 *
 * The maintainer replaces the amounts and drops the prefix. Until then no
 * screen shows a number anyone should believe.
 *
 * Amounts are rials; the storefront renders toman (`rials / 10`).
 */

const PREFIX = "[نمونه] ";

const DEVELOPMENT_RATES = [
  {
    key: "pickup-national",
    method: "pickup" as const,
    provinceCode: null,
    cityCode: null,
    amountRials: 0n,
    labelFa: `${PREFIX}تحویل حضوری در مطب`,
    freeAboveRials: null,
  },
  {
    key: "courier-razavi",
    method: "courier" as const,
    // Khorasan Razavi — the institute's own province, where a courier is the
    // normal choice. `09` is ISO 3166-2:IR.
    provinceCode: "09",
    cityCode: null,
    amountRials: 500_000n,
    labelFa: `${PREFIX}پیک مشهد`,
    freeAboveRials: null,
  },
  {
    key: "post-national",
    method: "post" as const,
    provinceCode: null,
    cityCode: null,
    amountRials: 800_000n,
    labelFa: `${PREFIX}پست پیشتاز`,
    // Exercises the free-threshold path, which is otherwise dead code in dev.
    freeAboveRials: 50_000_000n,
  },
] as const;

export async function seedDevelopmentShippingRates(
  database: PostgresJsDatabase<typeof schema>,
): Promise<void> {
  await database.transaction(async (transaction) => {
    for (const entry of DEVELOPMENT_RATES) {
      /*
        Keyed on the label rather than a synthetic id, because `shipping_rate`
        has no natural key and re-running the seed must not stack duplicates —
        the partial unique indexes would reject the second insert anyway, and a
        seed that throws on its second run is not idempotent.
      */
      const existing = await transaction.query.shippingRate.findFirst({
        where: (rate, { eq }) => eq(rate.labelFa, entry.labelFa),
      });

      if (existing) {
        await transaction
          .update(shippingRate)
          .set({
            method: entry.method,
            provinceCode: entry.provinceCode,
            cityCode: entry.cityCode,
            amountRials: entry.amountRials,
            freeAboveRials: entry.freeAboveRials,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(shippingRate.id, existing.id));
        continue;
      }

      await transaction.insert(shippingRate).values({
        method: entry.method,
        provinceCode: entry.provinceCode,
        cityCode: entry.cityCode,
        amountRials: entry.amountRials,
        labelFa: entry.labelFa,
        freeAboveRials: entry.freeAboveRials,
        isActive: true,
      });
    }
  });
}
