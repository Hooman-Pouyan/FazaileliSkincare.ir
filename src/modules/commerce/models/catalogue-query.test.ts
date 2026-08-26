import { describe, expect, it } from "vitest";
import {
  type CatalogueScope,
  catalogueHref,
  parseCatalogueQuery,
} from "./catalogue-query";

const CONCERN: CatalogueScope = { kind: "concern", slug: "lak" };
const SEARCH: CatalogueScope = { kind: "search", query: "" };

function params(input: Record<string, string | string[]>): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      search.append(key, item);
    }
  }
  return search;
}

describe("canonical form", () => {
  it("accepts a bare scope URL as already canonical", () => {
    const result = parseCatalogueQuery(CONCERN, params({}));

    expect(result.kind).toBe("canonical");
    if (result.kind !== "canonical") return;
    expect(result.query.sort).toBe("featured");
    expect(result.query.page).toBe(1);
  });

  it("redirects rather than serving the default sort spelled out", () => {
    // Given: two URLs for one result set is the duplicate-content problem
    const result = parseCatalogueQuery(CONCERN, params({ sort: "featured" }));

    expect(result.kind).toBe("redirect");
    if (result.kind !== "redirect") return;
    expect(result.href).toBe("/shop/concern/lak");
  });

  it("redirects rather than serving page=1 spelled out", () => {
    const result = parseCatalogueQuery(CONCERN, params({ page: "1" }));

    expect(result.kind).toBe("redirect");
    if (result.kind !== "redirect") return;
    expect(result.href).toBe("/shop/concern/lak");
  });

  it("drops unknown parameters and redirects to the clean URL", () => {
    // Given: campaign tags, tracking junk, and hand-edited noise
    const result = parseCatalogueQuery(
      CONCERN,
      params({ utm_source: "instagram", colour: "blue", sort: "price_asc" }),
    );

    expect(result.kind).toBe("redirect");
    if (result.kind !== "redirect") return;
    expect(result.href).toBe("/shop/concern/lak?sort=price_asc");
  });

  it("sorts and deduplicates repeated filter values", () => {
    const result = parseCatalogueQuery(
      CONCERN,
      params({ brand: ["storyderm", "forlled", "storyderm"] }),
    );

    expect(result.kind).toBe("redirect");
    if (result.kind !== "redirect") return;
    expect(result.query.brands).toEqual(["forlled", "storyderm"]);
    expect(result.href).toBe("/shop/concern/lak?brand=forlled&brand=storyderm");
  });

  it("keeps an already-canonical filtered URL as canonical", () => {
    const result = parseCatalogueQuery(
      CONCERN,
      params({ brand: ["forlled", "storyderm"], sort: "price_asc", page: "3" }),
    );

    expect(result.kind).toBe("canonical");
  });
});

describe("invalid input is never silently defaulted", () => {
  it("rejects an unrecognised sort instead of falling back", () => {
    // Given: PLP-02 — invalid recognised input returns the explicit invalid
    // outcome, because silently sorting differently than asked is a lie
    const result = parseCatalogueQuery(CONCERN, params({ sort: "banana" }));

    expect(result.kind).toBe("invalid");
    if (result.kind !== "invalid") return;
    expect(result.issues).toEqual([
      { parameter: "sort", code: "unrecognised" },
    ]);
  });

  it.each(["0", "-2", "abc", "1.5", "1e3", ""])("rejects page=%s", (page) => {
    const result = parseCatalogueQuery(CONCERN, params({ page }));
    expect(result.kind).toBe("invalid");
  });

  it("rejects a price range that excludes everything", () => {
    const result = parseCatalogueQuery(
      CONCERN,
      params({ price_min: "900", price_max: "100" }),
    );

    expect(result.kind).toBe("invalid");
    if (result.kind !== "invalid") return;
    expect(result.issues).toEqual([
      { parameter: "price_max", code: "range_inverted" },
    ]);
  });

  it.each(["-1", "1.5", "abc", "۱۲۳"])("rejects price_min=%s", (value) => {
    expect(
      parseCatalogueQuery(CONCERN, params({ price_min: value })).kind,
    ).toBe("invalid");
  });

  it("rejects a search with nothing to search for", () => {
    const result = parseCatalogueQuery(SEARCH, params({ q: "   " }));

    expect(result.kind).toBe("invalid");
    if (result.kind !== "invalid") return;
    expect(result.issues).toEqual([{ parameter: "q", code: "empty" }]);
  });

  it("reports every issue at once", () => {
    const result = parseCatalogueQuery(
      CONCERN,
      params({ sort: "banana", page: "0" }),
    );

    expect(result.kind).toBe("invalid");
    if (result.kind !== "invalid") return;
    expect(result.issues).toHaveLength(2);
  });
});

describe("prices cross the URL in toman and are stored in rials", () => {
  it("multiplies the displayed toman bound into rials", () => {
    // Given: the URL carries the number a customer sees; the database stores
    // integer rials. One conversion, at this boundary, or the two units mix.
    const result = parseCatalogueQuery(
      CONCERN,
      params({ price_min: "480000", price_max: "1350000" }),
    );

    expect(result.kind).toBe("canonical");
    if (result.kind !== "canonical") return;
    expect(result.query.minPriceRials).toBe(4_800_000n);
    expect(result.query.maxPriceRials).toBe(13_500_000n);
  });

  it("writes the bound back out in toman, so the URL round-trips", () => {
    const result = parseCatalogueQuery(
      CONCERN,
      params({ price_min: "480000" }),
    );

    expect(result.kind).toBe("canonical");
    if (result.kind !== "canonical") return;
    expect(catalogueHref(result.query)).toBe(
      "/shop/concern/lak?price_min=480000",
    );
  });
});

describe("hrefs", () => {
  it("builds each scope's path", () => {
    const bare = (scope: CatalogueScope) => {
      const result = parseCatalogueQuery(scope, params({}));
      if (result.kind !== "canonical") throw new Error("expected canonical");
      return catalogueHref(result.query);
    };

    // `/shop` is the hub screen; the whole catalogue as a listing is its own page.
    expect(bare({ kind: "hub" })).toBe("/shop/all");
    expect(bare({ kind: "concern", slug: "lak" })).toBe("/shop/concern/lak");
    expect(bare({ kind: "brand", slug: "forlled" })).toBe(
      "/shop/brand/forlled",
    );
    expect(bare({ kind: "category", slug: "serum" })).toBe("/shop/c/serum");
  });

  it("puts the search term in the query string, not the path", () => {
    const result = parseCatalogueQuery(SEARCH, params({ q: "سرم" }));

    expect(result.kind).toBe("canonical");
    if (result.kind !== "canonical") return;
    expect(catalogueHref(result.query)).toBe(
      `/shop/search?q=${encodeURIComponent("سرم")}`,
    );
  });

  it("emits parameters in one fixed order regardless of input order", () => {
    // Given: two URLs differing only in parameter order are two URLs to a
    // crawler, and one of them is duplicate content
    const forward = parseCatalogueQuery(
      CONCERN,
      params({ page: "2", sort: "price_asc", brand: "forlled" }),
    );
    const backward = parseCatalogueQuery(
      CONCERN,
      params({ brand: "forlled", sort: "price_asc", page: "2" }),
    );

    if (forward.kind === "invalid" || backward.kind === "invalid") {
      throw new Error("expected both to parse");
    }
    expect(catalogueHref(forward.query)).toBe(catalogueHref(backward.query));
    expect(catalogueHref(forward.query)).toBe(
      "/shop/concern/lak?brand=forlled&sort=price_asc&page=2",
    );
  });

  it("carries no locale at all — prefixing belongs to the navigation layer", () => {
    // Given: this function used to take a locale and prepend it, and `Link`
    // prepended one too, so `/shop` became `/fa/fa/shop`. Decision R-1 leaves
    // the prefix to `@/i18n/navigation` alone.
    const result = parseCatalogueQuery(
      { kind: "concern", slug: "lak" },
      params({ brand: "forlled" }),
    );
    if (result.kind !== "canonical") throw new Error("expected canonical");

    const href = catalogueHref(result.query);
    expect(href).toBe("/shop/concern/lak?brand=forlled");
    for (const locale of ["fa", "en", "ar"]) {
      expect(href.startsWith(`/${locale}/`)).toBe(false);
    }
  });
});

describe("parameter order is part of the canonical URL", () => {
  const HUB = { kind: "hub" } as const;

  function parse(search: string) {
    return parseCatalogueQuery(HUB, new URLSearchParams(search));
  }

  it("redirects a URL whose parameters are in the wrong order", () => {
    // PARAMETER_ORDER's own comment says two URLs differing only in parameter
    // order are two URLs. That was applied when emitting a URL and not when
    // accepting one, so both spellings served a page.
    const outcome = parse("phase=treat&skin_type=dry&audience=home");
    expect(outcome.kind).toBe("redirect");
    if (outcome.kind !== "redirect") return;
    expect(outcome.href.indexOf("skin_type")).toBeLessThan(
      outcome.href.indexOf("phase"),
    );
  });

  it("serves the canonical spelling of the same query", () => {
    expect(parse("skin_type=dry&phase=treat&audience=home").kind).toBe(
      "canonical",
    );
  });

  it("never redirects twice — the target is canonical by construction", () => {
    const first = parse("page=3&sort=newest&concern=lak");
    expect(first.kind).toBe("redirect");
    if (first.kind !== "redirect") return;

    const search = first.href.slice(first.href.indexOf("?") + 1);
    const second = parse(search);
    expect(second.kind).toBe("canonical");
  });

  it("still redirects for every reason it did before", () => {
    expect(parse("page=1").kind).toBe("redirect");
    expect(parse("brand=zed&brand=alef").kind).toBe("redirect");
    expect(parse("utm_source=instagram").kind).toBe("redirect");
  });

  it("does not redirect a search term containing a space", () => {
    // The comparison is on decoded pairs, not on encoded strings: one encoder
    // writes a space as `%20` and the other as `+`, and comparing the strings
    // would redirect this query forever.
    const outcome = parseCatalogueQuery(
      { kind: "search", query: "" },
      new URLSearchParams({ q: "کرم شب" }),
    );
    expect(outcome.kind).toBe("canonical");
  });
});
