import { describe, expect, it } from "vitest";
import { normalizeCatalogSearchText } from "../normalize-catalog-search";
import { REFERENCE_CONCERNS, REFERENCE_LOCALES } from "./reference-data";

describe("reference seed contract", () => {
  it("defines Persian as primary while enabling English and Arabic", () => {
    // Given: the supported locale seed rows
    // When: active and primary locale codes are selected
    const activeCodes = REFERENCE_LOCALES.filter((entry) => entry.isActive).map((entry) => entry.code);
    const primaryCodes = REFERENCE_LOCALES.filter((entry) => entry.isPrimary).map((entry) => entry.code);

    // Then: all approved locales exist and only Persian is primary
    expect(activeCodes).toEqual(["fa", "en", "ar"]);
    expect(primaryCodes).toEqual(["fa"]);
  });

  it("seeds only reviewed Persian and English concern translations", () => {
    // Given: the approved concern vocabulary
    // When: its locale coverage and normalized Persian names are read
    const localeCodes = new Set(REFERENCE_CONCERNS.flatMap((entry) => entry.translations.map((item) => item.localeCode)));
    const normalizedPersianNames = REFERENCE_CONCERNS.map((entry) => {
      const persian = entry.translations.find((item) => item.localeCode === "fa");
      return persian ? normalizeCatalogSearchText(persian.name) : "";
    });

    // Then: Arabic is not fabricated and every Persian value is searchable
    expect([...localeCodes].sort()).toEqual(["en", "fa"]);
    expect(normalizedPersianNames.every((name) => name.length > 0)).toBe(true);
  });
});
