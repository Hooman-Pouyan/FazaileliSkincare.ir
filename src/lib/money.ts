/**
 * Money — the single most common bug in Iranian ecommerce.
 *
 * RULE: the database stores an integer count of RIALS (bigint).
 * TOMAN is a display transform (÷10) applied only at the view layer.
 * No floats. No mixed units. Ever. (AGENTS.md rule 1.)
 */

export type Rials = bigint;

const PERSIAN_DIGITS = [
  "۰",
  "۱",
  "۲",
  "۳",
  "۴",
  "۵",
  "۶",
  "۷",
  "۸",
  "۹",
] as const;

export const toRials = (toman: number | bigint): Rials => BigInt(toman) * 10n;
export const toTomanString = (rials: Rials): string => (rials / 10n).toString();

/** Grouped with the Persian thousands separator ٬ (U+066C), not a comma. */
export function formatToman(rials: Rials, locale: "fa" | "en" = "fa"): string {
  const groups = toTomanString(rials).replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
  return locale === "fa" ? toPersianDigits(groups) : groups.replace(/٬/g, ",");
}

export function toPersianDigits(input: string): string {
  return input.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]!);
}

/**
 * Bank-transfer matching: each open order expects a slightly UNIQUE amount so a
 * line on the bank statement maps to exactly one order at a glance.
 * Deterministic in the order id — never random, or it cannot be recomputed.
 * (docs/03-domain-model.md)
 */
export function transferAmountFor(totalRials: Rials, orderId: string): Rials {
  let hash = 0;
  for (const ch of orderId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const remainderToman = BigInt((hash % 900) + 100); // 100–999 toman
  return totalRials + remainderToman * 10n;
}
