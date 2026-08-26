import { type CatalogueQuery, catalogueHref } from "../models/catalogue-query";

/**
 * Links that add, remove, or clear a filter.
 *
 * Every one of them returns to page one. Page seven of an unfiltered set is
 * unlikely to exist once filtered, and landing on an empty page after clicking a
 * facet reads as a broken catalogue rather than as a narrowed result.
 *
 * The scope itself is never offered as a removable filter: taking the concern
 * off a concern listing is navigation, which the shell owns, not filtering.
 */

export type FacetParameter = "brand" | "concern" | "category" | "in_stock";

export type AppliedFilter = Readonly<{
  parameter: string;
  value: string;
  removeHref: string;
}>;

const LIST_PARAMETERS = {
  brand: "brands",
  concern: "concerns",
  category: "categories",
} as const;

function withoutPage(query: CatalogueQuery): CatalogueQuery {
  return { ...query, page: 1 };
}

function toggleList(
  values: readonly string[],
  value: string,
): readonly string[] {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value].sort();
}

export function facetToggleHref(
  query: CatalogueQuery,
  parameter: FacetParameter,
  value: string,
): string {
  const base = withoutPage(query);

  if (parameter === "in_stock") {
    return catalogueHref({ ...base, inStockOnly: !base.inStockOnly });
  }

  const key = LIST_PARAMETERS[parameter];
  return catalogueHref({
    ...base,
    [key]: toggleList(base[key], value),
  });
}

export function appliedFilters(
  query: CatalogueQuery,
): readonly AppliedFilter[] {
  const filters: AppliedFilter[] = [];

  for (const parameter of ["brand", "concern", "category"] as const) {
    for (const value of query[LIST_PARAMETERS[parameter]]) {
      filters.push({
        parameter,
        value,
        removeHref: facetToggleHref(query, parameter, value),
      });
    }
  }

  if (query.inStockOnly) {
    filters.push({
      parameter: "in_stock",
      value: "1",
      removeHref: facetToggleHref(query, "in_stock", "1"),
    });
  }

  for (const [parameter, key] of [
    ["price_min", "minPriceRials"],
    ["price_max", "maxPriceRials"],
  ] as const) {
    const rials = query[key];
    if (rials === null) continue;
    filters.push({
      parameter,
      value: (rials / 10n).toString(),
      removeHref: catalogueHref({ ...withoutPage(query), [key]: null }),
    });
  }

  return filters;
}
