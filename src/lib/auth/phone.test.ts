import { describe, expect, it } from "vitest";
import {
  InvalidIranianPhoneError,
  formatIranianPhone,
  maskIranianPhone,
  normalizeIranianPhone,
} from "./phone";

describe("Iranian phone normalization", () => {
  it.each([
    ["09123456789", "+989123456789"],
    ["۰۹۱۲۳۴۵۶۷۸۹", "+989123456789"],
    ["٠٩١٢٣٤٥٦٧٨٩", "+989123456789"],
    ["+98 912 345 6789", "+989123456789"],
    ["0098 912 345 6789", "+989123456789"],
  ])("normalizes %s to canonical E.164", (input, expected) => {
    expect(normalizeIranianPhone(input)).toBe(expected);
  });

  it.each(["+12025550123", "0912345678", "+982112345678", "not-a-phone"])(
    "rejects a non-Iranian-mobile value without echoing it",
    (input) => {
      expect.assertions(3);

      try {
        normalizeIranianPhone(input);
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidIranianPhoneError);
        expect(error).toMatchObject({ code: "INVALID_PHONE" });
        expect(String(error)).not.toContain(input);
      }
    },
  );

  it("masks the canonical value while preserving useful recognition digits", () => {
    expect(maskIranianPhone("۰۹۱۲۳۴۵۶۷۸۹")).toBe("+98******6789");
  });
});

describe("display formatting", () => {
  it("groups the canonical number for reading", () => {
    expect(formatIranianPhone("+989123456789")).toBe("+98 912 345 6789");
  });

  it("normalizes before formatting, so every spelling reads the same", () => {
    // Given: the same number typed with Persian digits and a local prefix
    for (const input of ["۰۹۱۲۳۴۵۶۷۸۹", "09123456789", "+989123456789"]) {
      expect(formatIranianPhone(input)).toBe("+98 912 345 6789");
    }
  });
});
