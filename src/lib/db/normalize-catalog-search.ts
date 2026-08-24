export function normalizeCatalogSearchText(value: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  return value
    .normalize("NFKC")
    .replace(/[يى]/gu, "ی")
    .replace(/ك/gu, "ک")
    .replace(/[۰-۹]/gu, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/gu, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/ـ/gu, "")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")
    .replace(/[\u200C\s]+/gu, " ")
    .trim()
    .toLocaleLowerCase("en-US");
}

export function normalizeOptionalCatalogSearchText(value: string | null): string | null {
  if (value === null) return null;
  const normalized = normalizeCatalogSearchText(value);
  return normalized === "" ? null : normalized;
}
