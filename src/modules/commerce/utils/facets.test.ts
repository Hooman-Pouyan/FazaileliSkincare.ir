import { describe, expect, it } from "vitest";
import { parseCatalogueQuery } from "../models/catalogue-query";
import { appliedFilters, facetToggleHref } from "./facets";

function queryFrom(search: string) {
  const result = parseCatalogueQuery(
    { kind: "concern", slug: "lak" },
    new URLSearchParams(search),
  );
  if (result.kind === "invalid") throw new Error("expected a parseable query");
  return result.query;
}

describe("facetToggleHref", () => {
  it("adds a value that is not applied", () => {
    expect(facetToggleHref(queryFrom(""), "brand", "forlled")).toBe(
      "/shop/concern/lak?brand=forlled",
    );
  });

  it("removes a value that is applied", () => {
    expect(
      facetToggleHref(queryFrom("brand=forlled"), "brand", "forlled"),
    ).toBe("/shop/concern/lak");
  });

  it("returns to page one whenever a filter changes", () => {
    // Given: page 7 of the unfiltered set is unlikely to exist once filtered,
    // and landing on an empty page reads as a broken catalogue
    expect(facetToggleHref(queryFrom("page=7"), "brand", "forlled")).toBe(
      "/shop/concern/lak?brand=forlled",
    );
  });

  it("keeps the sort when a filter changes", () => {
    expect(
      facetToggleHref(queryFrom("sort=price_asc"), "brand", "forlled"),
    ).toBe("/shop/concern/lak?brand=forlled&sort=price_asc");
  });

  it("toggles availability on and off", () => {
    expect(facetToggleHref(queryFrom(""), "in_stock", "1")).toBe(
      "/shop/concern/lak?in_stock=1",
    );
    expect(facetToggleHref(queryFrom("in_stock=1"), "in_stock", "1")).toBe(
      "/shop/concern/lak",
    );
  });
});

describe("appliedFilters", () => {
  it("is empty on a bare scope URL", () => {
    expect(appliedFilters(queryFrom(""))).toEqual([]);
  });

  it("gives each applied value its own removal link", () => {
    const filters = appliedFilters(
      queryFrom("brand=forlled&brand=storyderm&in_stock=1"),
    );

    expect(filters).toEqual([
      {
        parameter: "brand",
        value: "forlled",
        removeHref: "/shop/concern/lak?brand=storyderm&in_stock=1",
      },
      {
        parameter: "brand",
        value: "storyderm",
        removeHref: "/shop/concern/lak?brand=forlled&in_stock=1",
      },
      {
        parameter: "in_stock",
        value: "1",
        removeHref: "/shop/concern/lak?brand=forlled&brand=storyderm",
      },
    ]);
  });

  it("includes price bounds as removable filters in toman", () => {
    const filters = appliedFilters(queryFrom("price_min=480000"));

    expect(filters).toEqual([
      {
        parameter: "price_min",
        value: "480000",
        removeHref: "/shop/concern/lak",
      },
    ]);
  });

  it("does not offer to remove the scope itself", () => {
    // Given: removing the concern from a concern PLP is navigation, not
    // filtering — the shell owns that, and a chip that silently changes which
    // page you are on is a different feature wearing the same clothes
    const filters = appliedFilters(queryFrom("brand=forlled"));

    expect(filters.map((filter) => filter.parameter)).toEqual(["brand"]);
  });
});
