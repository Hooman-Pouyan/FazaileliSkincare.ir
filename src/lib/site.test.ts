import { describe, expect, it, vi } from "vitest";

/*
  Same reason as `src/modules/landing/utils/structured-data.test.ts`:
  `@/i18n/navigation` calls next-intl's `createNavigation`, which reaches
  `next/navigation` and cannot resolve outside the Next runtime. The mock
  reimplements only the `as-needed` rule — Persian unprefixed, everything else
  prefixed — which `src/i18n/routing.test.ts` owns. What is under test here is
  which locale `x-default` names, not how a prefix is applied.
*/
vi.mock("@/i18n/navigation", () => ({
  getPathname: ({ href, locale }: { href: string; locale: string }) =>
    locale === "fa" ? href : `/${locale}${href === "/" ? "" : href}`,
}));

const { SITE_ORIGIN, localeAlternates, localeUrl } = await import("./site");

describe("canonical and alternate URLs", () => {
  it("omits the prefix for Persian and keeps it for the other locales", () => {
    // Given: a locale-agnostic pathname
    const pathname = "/shop";

    // When: each locale's absolute URL is built
    // Then: every URL comes from next-intl's own prefixing, never assembled here
    expect(localeUrl(pathname, "fa")).toBe(`${SITE_ORIGIN}/shop`);
    expect(localeUrl(pathname, "en")).toBe(`${SITE_ORIGIN}/en/shop`);
    expect(localeUrl(pathname, "ar")).toBe(`${SITE_ORIGIN}/ar/shop`);
  });

  /**
   * R-2 left `x-default` open because the answer depended on whether the root
   * negotiates. R-3 settled that it does not, so `x-default` is Persian — the
   * same address `fa` gets. Closes review item R.4.
   */
  it("points x-default at the Persian URL, not at a negotiated root", () => {
    // Given: a pathname rendered in every locale
    // When: the alternates map is built
    const alternates = localeAlternates("/shop");

    // Then: a reader whose language the site does not serve is sent to Persian
    expect(alternates["x-default"]).toBe(alternates.fa);
    expect(alternates["x-default"]).toBe(`${SITE_ORIGIN}/shop`);
  });

  it("emits an alternate for every configured locale", () => {
    // Given: the alternates for the landing page
    // When: its keys are read
    const keys = Object.keys(localeAlternates("/"));

    // Then: all three locales are present alongside x-default
    expect(keys.sort()).toEqual(["ar", "en", "fa", "x-default"]);
  });
});
