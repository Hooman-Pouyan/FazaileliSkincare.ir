import { describe, expect, it } from "vitest";
import { readAccountPhone } from "./session-view";

describe("readAccountPhone", () => {
  it("reads the phone from a well-formed session user", () => {
    expect(readAccountPhone({ phoneNumber: "+989123456789" })).toBe(
      "+989123456789",
    );
  });

  it.each([
    null,
    undefined,
    {},
    { phoneNumber: "" },
    { phoneNumber: 42 },
    "x",
    [],
  ])("returns null rather than inventing a value for %s", (input) => {
    // Given: the auth runtime types `user` as unknown and promises no shape.
    // A cast would render `undefined` to a customer; parsing shows a
    // signed-out page instead, which is at least true.
    expect(readAccountPhone(input)).toBeNull();
  });
});
