import { describe, expect, it } from "vitest";
import { IRAN_PROVINCES } from "./geo-data";

/**
 * Reference data is the one kind of seed where being *wrong* is worse than
 * being *absent*: a missing city is a form a customer cannot complete, and a
 * misfiled one is a parcel that goes to the wrong province. These assert the
 * shape rather than the content — the content's authority is ISO 3166-2:IR,
 * recorded in `geo-data.ts`.
 */
describe("Iranian province reference data", () => {
  it("holds the thirty-one provinces", () => {
    // Given: the post-2004 division of Khorasan into three
    // Then: thirty-one, not the thirty of older lists
    expect(IRAN_PROVINCES).toHaveLength(31);
  });

  it("gives every province a unique code and a unique Persian name", () => {
    const codes = IRAN_PROVINCES.map((p) => p.code);
    const names = IRAN_PROVINCES.map((p) => p.nameFa);

    // A duplicate code silently overwrites a province on upsert; a duplicate
    // name violates `iran_province_name_fa_unique` at insert time. The first
    // is the dangerous one, because it is quiet.
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it("uses two-digit ISO 3166-2:IR codes", () => {
    for (const province of IRAN_PROVINCES) {
      expect(province.code).toMatch(/^\d{2}$/);
    }
  });

  it("fills every Persian and Latin field", () => {
    // An empty name reaches a form as a blank option nobody can choose.
    for (const province of IRAN_PROVINCES) {
      expect(province.nameFa.trim()).not.toBe("");
      expect(province.nameEn.trim()).not.toBe("");
      expect(province.capitalFa.trim()).not.toBe("");
      expect(province.capitalEn.trim()).not.toBe("");
    }
  });

  /** The institute is in Mashhad, so this one is worth naming. */
  it("places Mashhad in Razavi Khorasan", () => {
    const razavi = IRAN_PROVINCES.find((p) => p.code === "09");
    expect(razavi?.nameFa).toBe("خراسان رضوی");
    expect(razavi?.capitalFa).toBe("مشهد");
  });

  it("uses Persian script for the Persian names", () => {
    // A Latin name in the `nameFa` column renders as a broken option in an
    // otherwise Persian form, and is invisible to a test that only checks
    // non-emptiness.
    const persian = /[؀-ۿ]/;
    for (const province of IRAN_PROVINCES) {
      expect(persian.test(province.nameFa), province.nameEn).toBe(true);
      expect(persian.test(province.capitalFa), province.capitalEn).toBe(true);
    }
  });
});
