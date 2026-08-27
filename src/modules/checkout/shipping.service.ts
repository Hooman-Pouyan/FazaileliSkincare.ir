import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { shippingRate } from "@/lib/db/schema";
import type { Rials } from "@/lib/money";
import {
  resolveShippingOptions,
  type ShippingMethod,
  type ShippingOption,
  type ShippingRateRow,
} from "./shipping.resolve";

/**
 * The one server quote — `COM2`'s exit gate.
 *
 * Everything a customer is shown, and everything an order is priced from, comes
 * through here. The resolution itself is pure and lives in `shipping.resolve`,
 * so a quote can be replayed from its inputs; this only fetches the rules that
 * could possibly apply.
 *
 * The `where` narrows to rules that are national, or name this province, or
 * name this city. Anything else cannot win and is not worth carrying.
 */
export async function quoteShipping(
  destination: Readonly<{
    cityCode: string | null;
    provinceCode: string | null;
  }>,
  subtotalRials: Rials,
): Promise<readonly ShippingOption[]> {
  const scopes = [
    and(isNull(shippingRate.provinceCode), isNull(shippingRate.cityCode)),
    destination.provinceCode
      ? and(
          eq(shippingRate.provinceCode, destination.provinceCode),
          isNull(shippingRate.cityCode),
        )
      : undefined,
    destination.cityCode
      ? eq(shippingRate.cityCode, destination.cityCode)
      : undefined,
  ].filter(Boolean);

  const rows = await db
    .select({
      id: shippingRate.id,
      method: shippingRate.method,
      provinceCode: shippingRate.provinceCode,
      cityCode: shippingRate.cityCode,
      amountRials: shippingRate.amountRials,
      labelFa: shippingRate.labelFa,
      freeAboveRials: shippingRate.freeAboveRials,
      isActive: shippingRate.isActive,
    })
    .from(shippingRate)
    .where(and(eq(shippingRate.isActive, true), or(...scopes)));

  return resolveShippingOptions(
    rows as readonly ShippingRateRow[],
    destination,
    subtotalRials,
  );
}

/**
 * Re-price one chosen method at order time.
 *
 * Checkout shows a list; placing an order must not trust which one came back
 * from the browser. `COM-D5` requires the total to be reproducible from
 * canonical inputs, so `placeOrder` re-quotes and takes the amount from here —
 * a posted price is a suggestion, not a fact.
 *
 * Returns null when the method is no longer offered, which is a real outcome:
 * a rate can be deactivated between rendering a page and submitting it.
 */
export async function quoteChosenMethod(
  destination: Readonly<{
    cityCode: string | null;
    provinceCode: string | null;
  }>,
  subtotalRials: Rials,
  method: ShippingMethod,
): Promise<ShippingOption | null> {
  const options = await quoteShipping(destination, subtotalRials);
  return options.find((option) => option.method === method) ?? null;
}
