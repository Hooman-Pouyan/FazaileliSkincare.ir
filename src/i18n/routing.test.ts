import { describe, expect, it } from "vitest";
import { dirFor, routing } from "./routing";

describe("locale routing", () => {
  it("includes Arabic when supported locales are requested", () => {
    // Given: the storefront's configured locales
    // When: the supported locale list is read
    const locales = routing.locales;

    // Then: Arabic is available as a first-class route
    expect(locales).toContain("ar");
  });

  it("uses RTL direction when the Arabic locale is rendered", () => {
    // Given: an Arabic storefront request
    // When: its document direction is resolved
    const direction = dirFor("ar");

    // Then: Arabic renders right-to-left
    expect(direction).toBe("rtl");
  });
});
