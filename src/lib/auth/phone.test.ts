import { describe, expect, it } from "vitest";
import {
  InvalidIranianPhoneError,
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
