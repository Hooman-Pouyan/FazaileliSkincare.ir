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
