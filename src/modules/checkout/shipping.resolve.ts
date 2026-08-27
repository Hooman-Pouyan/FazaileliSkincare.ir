import type { Rials } from "@/lib/money";

/**
 * Which shipping rule applies, and what it costs — `COM-D2`, `COM-D5`.
 *
 * Pure on purpose. The exit gate requires every displayed choice to be
 * **reproducible from its canonical inputs**, and a function that takes rows
 * and returns options can be replayed with the same inputs forever. The
 * database read lives next door in `shipping.service.ts`.
 *
 * **Specificity decides, not order.** A rule may name a city, a province, or
 * neither, and the most specific match for the destination wins: courier priced
 * for Mashhad beats courier priced for Khorasan Razavi, which beats the
 * nationwide courier rate. Falling back to row order would make a quote depend
 * on insert time, which is the bug that only appears after the second rate.
 *
 * Every option carries the `rateId` and `scope` it came from, so a total can be
 * explained months later without guessing which row produced it.
 */

export type ShippingMethod = "post" | "courier" | "pickup";
export type RateScope = "city" | "province" | "national";

export type ShippingRateRow = Readonly<{
  id: string;
  method: ShippingMethod;
  provinceCode: string | null;
  cityCode: string | null;
  amountRials: Rials;
  labelFa: string;
  freeAboveRials: Rials | null;
  isActive: boolean;
}>;

export type ShippingOption = Readonly<{
  method: ShippingMethod;
  /** What the customer is charged, after any free threshold. */
  amountRials: Rials;
  /** What the rule says, before the threshold. Kept so a quote can explain itself. */
  listAmountRials: Rials;
  isFree: boolean;
  label: string;
  rateId: string;
  scope: RateScope;
}>;

/** Most specific first. `indexOf` on this is the whole precedence rule. */
const SCOPE_ORDER: readonly RateScope[] = ["city", "province", "national"];

function scopeOf(rate: ShippingRateRow): RateScope | null {
  if (rate.cityCode) return "city";
  if (rate.provinceCode) return "province";
  return "national";
}

function applies(
  rate: ShippingRateRow,
  cityCode: string | null,
  provinceCode: string | null,
): boolean {
  if (rate.cityCode) return rate.cityCode === cityCode;
  if (rate.provinceCode) return rate.provinceCode === provinceCode;
  return true;
}

/**
 * @param subtotalRials the cart subtotal, which the free threshold is measured
 *   against — not the total, or the threshold would depend on the shipping it
 *   is deciding.
 */
export function resolveShippingOptions(
  rates: readonly ShippingRateRow[],
  destination: Readonly<{
    cityCode: string | null;
    provinceCode: string | null;
  }>,
  subtotalRials: Rials,
): readonly ShippingOption[] {
  const best = new Map<
    ShippingMethod,
    { rate: ShippingRateRow; scope: RateScope }
  >();

  for (const rate of rates) {
    // Inactive rules are not rules. Checked here as well as in the query so the
    // resolution is correct whoever calls it.
    if (!rate.isActive) continue;
    if (!applies(rate, destination.cityCode, destination.provinceCode))
      continue;

    const scope = scopeOf(rate);
    if (!scope) continue;

    const held = best.get(rate.method);
    if (!held) {
      best.set(rate.method, { rate, scope });
      continue;
    }

    const better = SCOPE_ORDER.indexOf(scope) - SCOPE_ORDER.indexOf(held.scope);
    // A tie means two rules of equal specificity for one method, which the
    // partial unique indexes forbid. If it happens anyway, the lower id wins so
    // the quote stays deterministic rather than depending on row order.
    if (better < 0 || (better === 0 && rate.id < held.rate.id)) {
      best.set(rate.method, { rate, scope });
    }
  }

  return [...best.entries()]
    .map(([method, { rate, scope }]) => {
      const isFree =
        rate.freeAboveRials !== null && subtotalRials >= rate.freeAboveRials;
      return {
        method,
        amountRials: isFree ? (0n as Rials) : rate.amountRials,
        listAmountRials: rate.amountRials,
        isFree,
        label: rate.labelFa,
        rateId: rate.id,
        scope,
      };
    })
    .sort((a, b) =>
      a.amountRials === b.amountRials
        ? a.method.localeCompare(b.method)
        : Number(a.amountRials - b.amountRials),
    );
}
