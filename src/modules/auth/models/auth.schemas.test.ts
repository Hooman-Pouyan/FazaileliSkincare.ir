import { describe, expect, it } from "vitest";
import { loginSchema, verifySchema } from "./auth.schemas";

describe("customer auth form schemas", () => {
  it("canonicalizes a Persian local mobile number", () => {
    expect(loginSchema.parse({ phone: " ۰۹۱۲ ۳۴۵ ۶۷۸۹ " })).toEqual({
      phone: "+989123456789",
    });
  });

  it("rejects non-Iranian or incomplete mobile numbers", () => {
    expect(loginSchema.safeParse({ phone: "02112345678" }).success).toBe(false);
    expect(loginSchema.safeParse({ phone: "0912345" }).success).toBe(false);
  });

  it("accepts exactly six OTP digits in Persian, Arabic, or Latin script", () => {
    expect(verifySchema.parse({ code: "۱۲۳۴۵۶" })).toEqual({ code: "123456" });
    expect(verifySchema.parse({ code: "١٢٣٤٥٦" })).toEqual({ code: "123456" });
    expect(verifySchema.parse({ code: "123456" })).toEqual({ code: "123456" });
    expect(verifySchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(verifySchema.safeParse({ code: "12345x" }).success).toBe(false);
  });
});
