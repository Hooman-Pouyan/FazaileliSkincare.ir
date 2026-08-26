import { describe, expect, it, vi } from "vitest";

/*
  `@/i18n/navigation` calls next-intl's `createNavigation`, which reaches
  `next/navigation` and cannot resolve outside the Next runtime. The mock
  reimplements only the `as-needed` rule this module depends on — Persian
  unprefixed, everything else prefixed — which `src/i18n/routing.test.ts`
  already owns. What is under test here is the shape of the graph, not the
  prefixing.
*/
vi.mock("@/i18n/navigation", () => ({
  getPathname: ({ href, locale }: { href: string; locale: string }) =>
    locale === "fa" ? href : `/${locale}${href === "/" ? "" : href}`,
}));

const { landingJsonLd } = await import("./structured-data");

/**
 * `LAND-11`. Most of this suite asserts what is **not** there, which is the
 * only way an omission can be protected: a missing field is invisible, and the
 * day someone fills one in with a plausible guess, nothing else fails.
 */

const graph = landingJsonLd({
  locale: "fa",
  name: "مهدیه فضائلی",
  tagline: "آکادمی تخصصی مراقبت از پوست در مشهد",
  description: "از انتخاب مواد تا اجرای دقیق خدمات.",
});

function serialised(): string {
  return JSON.stringify(graph);
}

describe("what the Landing claims", () => {
  it("describes the business and the site, and nothing else", () => {
    expect(graph.map((entry) => entry["@type"])).toEqual([
      "HealthAndBeautyBusiness",
      "WebSite",
    ]);
  });

  it("points its search action at the real search route", () => {
    expect(serialised()).toContain("/shop/search?q={search_term_string}");
  });

  it("builds Persian URLs without a locale prefix", () => {
    // R-2: Persian is unprefixed. Structured data is the easiest place for a
    // hand-built `/fa/` to survive unnoticed, because nobody clicks it.
    expect(serialised()).not.toContain("/fa/");
  });
});

describe("what the Landing must never claim", () => {
  it.each([
    ["aggregateRating", "there is no review model and no ratings"],
    ["review", "no testimonial has consent, so none is a published review"],
    ["offers", "the Landing sells nothing; products have their own pages"],
    ["priceRange", "a price range is a commercial claim nobody has made"],
  ])("omits %s — %s", (field) => {
    expect(serialised()).not.toContain(field);
  });

  it.each([
    "address",
    "telephone",
    "openingHours",
    "postalCode",
    "streetAddress",
  ])("omits %s until the maintainer supplies it", (field) => {
    expect(serialised()).not.toContain(field);
  });

  it("says only what is on the record about where she works", () => {
    // The city is stated in `00-decision-map.md`. The street is not, and
    // `areaServed` is how you say the first without implying the second.
    expect(serialised()).toContain("Mashhad");
    expect(serialised()).toContain("areaServed");
  });
});
