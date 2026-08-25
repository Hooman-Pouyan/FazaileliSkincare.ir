/**
 * The one canonical form catalogue text is stored and searched in.
 *
 * Both boundaries must call this: the write path normalizes what it stores, and
 * the query path normalizes what it compares. There is no SQL-side equivalent,
 * so a query that skips it silently returns nothing for a correctly spelled
 * Persian term.
 *
 * Folding is deliberately conservative. It collapses forms a Persian keyboard
 * cannot produce but an Arabic one can — the same word, typed differently — and
 * stops there. `ئ` and `ؤ` are left alone because Persian genuinely uses them
 * (مسئول, مؤسسه); folding those would merge distinct words rather than reunite
 * one.
 */

const ARABIC_ALEF_FORMS = /[آأإٱ]/gu;
const TEH_MARBUTA = /ة/gu;
const ARABIC_YEH_FORMS = /[يى]/gu;
const ARABIC_KAF = /ك/gu;
const TATWEEL = /ـ/gu;
const COMBINING_MARKS = /[ً-ٰٟۖ-ۭ]/gu;
const PERSIAN_DIGITS = /[۰-۹]/gu;
const ARABIC_DIGITS = /[٠-٩]/gu;
const PERSIAN_DIGIT_SET = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGIT_SET = "٠١٢٣٤٥٦٧٨٩";

/**
 * ZWNJ becomes a space rather than nothing, so `می‌رود` and `میرود` remain
 * different terms. Collapsing the separator entirely would merge genuinely
 * distinct words. Trigram search is what bridges that gap — which is why the
 * index on `normalized_search_text` is trigram and not exact-match.
 */
const ZWNJ_AND_WHITESPACE = /[‌\s]+/gu;

export function normalizeCatalogSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(ARABIC_YEH_FORMS, "ی")
    .replace(ARABIC_KAF, "ک")
    .replace(ARABIC_ALEF_FORMS, "ا")
    .replace(TEH_MARBUTA, "ه")
    .replace(PERSIAN_DIGITS, (digit) =>
      String(PERSIAN_DIGIT_SET.indexOf(digit)),
    )
    .replace(ARABIC_DIGITS, (digit) => String(ARABIC_DIGIT_SET.indexOf(digit)))
    .replace(TATWEEL, "")
    .replace(COMBINING_MARKS, "")
    .replace(ZWNJ_AND_WHITESPACE, " ")
    .trim()
    .toLocaleLowerCase("en-US");
}

export function normalizeOptionalCatalogSearchText(
  value: string | null,
): string | null {
  if (value === null) return null;
  const normalized = normalizeCatalogSearchText(value);
  return normalized === "" ? null : normalized;
}
