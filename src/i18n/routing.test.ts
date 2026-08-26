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

  /**
   * The gate for decision R-3.
   *
   * next-intl defaults `localeDetection` to `true`, so this is a value that
   * comes back on its own the moment someone rewrites the config from the
   * documentation. When it is on, `/` 307s an English client to `/en` and the
   * Persian canonical becomes header-dependent — which nothing else in the
   * suite can see, because every test here runs without an `Accept-Language`
   * and therefore always gets Persian.
   */
  it("serves the unprefixed root to everyone rather than negotiating it", () => {
    // Given: the storefront's routing configuration
    // When: locale detection is read
    const detection = routing.localeDetection;

    // Then: the browser's headers never decide which document `/` returns
    expect(detection).toBe(false);
  });

  it("uses RTL direction when the Arabic locale is rendered", () => {
    // Given: an Arabic storefront request
    // When: its document direction is resolved
    const direction = dirFor("ar");

    // Then: Arabic renders right-to-left
    expect(direction).toBe("rtl");
  });
});
