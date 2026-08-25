import { describe, expect, it } from "vitest";
import { createPlaceholderEmail } from "./identifier";

describe("phone-first placeholder identity", () => {
  it("maps every equivalent phone spelling to one deterministic opaque email", () => {
    const inputs = ["09123456789", "۰۹۱۲۳۴۵۶۷۸۹", "+989123456789"];
    const emails = inputs.map((phone) =>
      createPlaceholderEmail({ phone, pepper: "test-identifier-pepper" }),
    );

    expect(new Set(emails)).toHaveLength(1);
    expect(emails[0]).toMatch(/^[a-f0-9]{64}@phone\.fazaieli\.invalid$/u);
    expect(emails[0]).not.toContain("9123456789");
  });

  it("does not collide for distinct normalized phones", () => {
    const first = createPlaceholderEmail({
      phone: "09123456789",
      pepper: "test-identifier-pepper",
    });
    const second = createPlaceholderEmail({
      phone: "09351234567",
      pepper: "test-identifier-pepper",
    });

    expect(first).not.toBe(second);
  });

  it("fails closed without the auth-only pepper", () => {
    expect(() =>
      createPlaceholderEmail({ phone: "09123456789", pepper: "" }),
    ).toThrowError("AUTH_IDENTIFIER_UNAVAILABLE");
  });
});
