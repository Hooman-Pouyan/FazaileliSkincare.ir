import { describe, expect, it } from "vitest";
import {
  normalizeCatalogSearchText,
  normalizeOptionalCatalogSearchText,
} from "./normalize-catalog-search";

describe("catalogue search normalization", () => {
  it("normalizes Persian and Arabic character variants", () => {
    // Given: visually equivalent Persian and Arabic forms
    const source = "  يكى كی  ";

    // When: the text crosses the catalogue search boundary
    const result = normalizeCatalogSearchText(source);

    // Then: it has one canonical Persian representation
    expect(result).toBe("یکی کی");
  });

  it("normalizes digits, marks, half-spaces, and Unicode whitespace", () => {
    // Given: mixed digit sets and presentation characters
    const source = "۱۲\u200C٣\u0640\u064E\u00A0  Test";

    // When: the text is normalized
    const result = normalizeCatalogSearchText(source);

    // Then: search receives stable ASCII digits and spacing
    expect(result).toBe("12 3 test");
  });

  it("folds the Arabic alef and teh-marbuta forms a Persian keyboard cannot produce", () => {
    // Given: the same words typed on an Arabic keyboard — hamza-carrying alefs
    // and a teh marbuta where Persian writes a plain heh
    const cases: readonly (readonly [string, string])[] = [
      ["\u0623\u0628", "\u0627\u0628"],
      ["\u0625\u0628", "\u0627\u0628"],
      ["\u0622\u0628", "\u0627\u0628"],
      ["\u0671\u0628", "\u0627\u0628"],
      ["\u0645\u0639\u062c\u0632\u0629", "\u0645\u0639\u062c\u0632\u0647"],
    ];

    // When: each crosses the catalogue search boundary
    // Then: it lands on the Persian form the catalogue stores
    for (const [source, expected] of cases) {
      expect(normalizeCatalogSearchText(source)).toBe(expected);
    }
  });

  it("does not make a half-spaced spelling identical to a joined one", () => {
    // Given: the same word written with a zero-width non-joiner and without any
    // separator at all
    const halfSpaced = "\u0645\u06cc\u200c\u0631\u0648\u062f";
    const joined = "\u0645\u06cc\u0631\u0648\u062f";

    // When: both are normalized
    // Then: ZWNJ becomes a space, so the two remain different search terms.
    // This is a known limitation, not an oversight: collapsing the separator
    // entirely would merge genuinely distinct words. Trigram search is what
    // bridges the gap, which is why the index is trigram and not exact-match.
    expect(normalizeCatalogSearchText(halfSpaced)).toBe(
      "\u0645\u06cc \u0631\u0648\u062f",
    );
    expect(normalizeCatalogSearchText(joined)).toBe(joined);
    expect(normalizeCatalogSearchText(halfSpaced)).not.toBe(
      normalizeCatalogSearchText(joined),
    );
  });

  it("keeps folding idempotent, since stored columns are normalized once at write", () => {
    const source = "\u0623\u0628 \u0645\u0639\u062c\u0632\u0629 \u06f1\u06f2";
    const once = normalizeCatalogSearchText(source);

    expect(normalizeCatalogSearchText(once)).toBe(once);
  });

  it("preserves null and converts optional blank values to null", () => {
    // Given: missing and whitespace-only optional text
    // When: both values are normalized
    const missing = normalizeOptionalCatalogSearchText(null);
    const blank = normalizeOptionalCatalogSearchText(" \u200C ");

    // Then: neither creates an empty searchable value
    expect(missing).toBeNull();
    expect(blank).toBeNull();
  });
});
