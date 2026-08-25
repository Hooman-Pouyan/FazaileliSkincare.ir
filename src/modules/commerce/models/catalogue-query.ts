import type { Rials } from "@/lib/money";

/**
 * The URL is the single source of filter, sort, search and page state, so this
 * module is the only place that grammar is written down. Routes parse with it
 * and every link is built with it — a client leaf assembling a query string by
 * hand is how a second, subtly different grammar appears.
 *
 * Two URLs for one result set is the duplicate-content problem every competitor
 * studied already has, so semantically valid but non-canonical input redirects
 * to one spelling rather than being served at both.
 *
 * Recognised-but-invalid input is an explicit failure, never a silent default:
 * sorting differently than the customer asked, or showing page 1 when they asked
 * for page 0, is a lie the URL then keeps telling.
 *
 * The grammar is provisional-but-binding under the gate-5 deferral in
 * `research/shop-research-gate-deferrals.md`: it ships, it is honoured
 * everywhere, and it is not forked. Facets are limited to what the schema can
 * already answer.
 */

export type CatalogueSort = "featured" | "newest" | "price_asc" | "price_desc";

/** Curated order — `merchandising_rank`, which `product_public_catalog_idx` covers. */
export const DEFAULT_SORT: CatalogueSort = "featured";
export const DEFAULT_PAGE = 1;

const SORTS: readonly CatalogueSort[] = [
  "featured",
  "newest",
  "price_asc",
  "price_desc",
];

export type CatalogueScope =
  | Readonly<{ kind: "hub" }>
  | Readonly<{ kind: "concern"; slug: string }>
  | Readonly<{ kind: "brand"; slug: string }>
  | Readonly<{ kind: "category"; slug: string }>
  | Readonly<{ kind: "search"; query: string }>;

export type CatalogueQuery = Readonly<{
  scope: CatalogueScope;
  brands: readonly string[];
  concerns: readonly string[];
  categories: readonly string[];
  inStockOnly: boolean;
  minPriceRials: Rials | null;
  maxPriceRials: Rials | null;
  sort: CatalogueSort;
  page: number;
}>;

export type QueryIssueCode =
  | "unrecognised"
  | "not_a_positive_integer"
  | "not_a_whole_number"
  | "range_inverted"
  | "empty";

export type QueryIssue = Readonly<{ parameter: string; code: QueryIssueCode }>;

export type CatalogueQueryResult =
  | Readonly<{ kind: "canonical"; query: CatalogueQuery }>
  | Readonly<{ kind: "redirect"; query: CatalogueQuery; href: string }>
  | Readonly<{ kind: "invalid"; issues: readonly QueryIssue[] }>;

/**
 * Every parameter this grammar recognises. Anything else is dropped and the
 * request redirects, keeping campaign tags and hand-edited noise out of the
 * indexed URL space.
 */
const KNOWN_PARAMETERS = new Set([
  "brand",
  "concern",
  "category",
  "in_stock",
  "price_min",
  "price_max",
  "q",
  "sort",
  "page",
]);

/** Fixed emission order. Two URLs differing only in parameter order are two URLs. */
const PARAMETER_ORDER = [
  "q",
  "brand",
  "concern",
  "category",
  "in_stock",
  "price_min",
  "price_max",
  "sort",
  "page",
] as const;

function uniqueSorted(values: readonly string[]): readonly string[] {
  return [
    ...new Set(values.map((value) => value.trim()).filter(Boolean)),
  ].sort();
}

/**
 * ASCII digits only. Persian and Arabic digits are folded for *search*, but a URL
 * bound is machine state rather than typed prose, and accepting several
 * spellings of one number would put several canonical URLs on one result set.
 */
function parseWholeNumber(raw: string): number | null {
  if (!/^\d+$/u.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

/** The URL carries toman, the number a customer sees. Storage is integer rials. */
function tomanToRials(toman: number): Rials {
  return BigInt(toman) * 10n;
}

function rialsToToman(rials: Rials): string {
  return (rials / 10n).toString();
}

export function parseCatalogueQuery(
  scope: CatalogueScope,
  search: URLSearchParams,
): CatalogueQueryResult {
  const issues: QueryIssue[] = [];
  let canonical = true;

  for (const key of search.keys()) {
    if (!KNOWN_PARAMETERS.has(key)) canonical = false;
  }

  let resolvedScope = scope;
  if (scope.kind === "search") {
    const raw = search.get("q") ?? scope.query;
    const term = raw.trim();
    if (term === "") {
      issues.push({ parameter: "q", code: "empty" });
    } else {
      if (term !== raw) canonical = false;
      resolvedScope = { kind: "search", query: term };
    }
  }

  const brands = uniqueSorted(search.getAll("brand"));
  const concerns = uniqueSorted(search.getAll("concern"));
  const categories = uniqueSorted(search.getAll("category"));
  for (const [key, cleaned] of [
    ["brand", brands],
    ["concern", concerns],
    ["category", categories],
  ] as const) {
    const raw = search.getAll(key);
    if (raw.length !== cleaned.length || raw.some((v, i) => v !== cleaned[i])) {
      canonical = false;
    }
  }

  const inStockRaw = search.get("in_stock");
  let inStockOnly = false;
  if (inStockRaw !== null) {
    if (inStockRaw === "1") inStockOnly = true;
    else issues.push({ parameter: "in_stock", code: "unrecognised" });
  }

  const bounds: Record<"price_min" | "price_max", Rials | null> = {
    price_min: null,
    price_max: null,
  };
  for (const key of ["price_min", "price_max"] as const) {
    const raw = search.get(key);
    if (raw === null) continue;
    const toman = parseWholeNumber(raw);
    if (toman === null) {
      issues.push({ parameter: key, code: "not_a_whole_number" });
      continue;
    }
    bounds[key] = tomanToRials(toman);
  }
  if (
    bounds.price_min !== null &&
    bounds.price_max !== null &&
    bounds.price_min > bounds.price_max
  ) {
    issues.push({ parameter: "price_max", code: "range_inverted" });
  }

  const sortRaw = search.get("sort");
  let sort: CatalogueSort = DEFAULT_SORT;
  if (sortRaw !== null) {
    const match = SORTS.find((value) => value === sortRaw);
    if (!match) issues.push({ parameter: "sort", code: "unrecognised" });
    else {
      sort = match;
      if (match === DEFAULT_SORT) canonical = false;
    }
  }

  const pageRaw = search.get("page");
  let page = DEFAULT_PAGE;
  if (pageRaw !== null) {
    const parsed = parseWholeNumber(pageRaw);
    if (parsed === null || parsed < 1) {
      issues.push({ parameter: "page", code: "not_a_positive_integer" });
    } else {
      page = parsed;
      if (parsed === DEFAULT_PAGE) canonical = false;
    }
  }

  if (issues.length > 0) return { kind: "invalid", issues };

  const query: CatalogueQuery = {
    scope: resolvedScope,
    brands,
    concerns,
    categories,
    inStockOnly,
    minPriceRials: bounds.price_min,
    maxPriceRials: bounds.price_max,
    sort,
    page,
  };

  return canonical
    ? { kind: "canonical", query }
    : { kind: "redirect", query, href: catalogueHref(query) };
}

function scopePath(scope: CatalogueScope): string {
  switch (scope.kind) {
    case "hub":
      return "/shop";
    case "concern":
      return `/shop/concern/${scope.slug}`;
    case "brand":
      return `/shop/brand/${scope.slug}`;
    case "category":
      return `/shop/c/${scope.slug}`;
    case "search":
      return "/shop/search";
  }
}

/**
 * The canonical URL for a query, without a locale.
 *
 * `Link` and `redirect` from `@/i18n/navigation` add the prefix. This function
 * used to add one too, which is how a already-prefixed href reached `Link` and
 * came back doubled — decision R-1.
 */
export function catalogueHref(query: CatalogueQuery): string {
  const values: [string, string][] = [];

  for (const key of PARAMETER_ORDER) {
    switch (key) {
      case "q":
        if (query.scope.kind === "search")
          values.push(["q", query.scope.query]);
        break;
      case "brand":
        for (const slug of query.brands) values.push(["brand", slug]);
        break;
      case "concern":
        for (const slug of query.concerns) values.push(["concern", slug]);
        break;
      case "category":
        for (const slug of query.categories) values.push(["category", slug]);
        break;
      case "in_stock":
        if (query.inStockOnly) values.push(["in_stock", "1"]);
        break;
      case "price_min":
        if (query.minPriceRials !== null) {
          values.push(["price_min", rialsToToman(query.minPriceRials)]);
        }
        break;
      case "price_max":
        if (query.maxPriceRials !== null) {
          values.push(["price_max", rialsToToman(query.maxPriceRials)]);
        }
        break;
      case "sort":
        if (query.sort !== DEFAULT_SORT) values.push(["sort", query.sort]);
        break;
      case "page":
        if (query.page !== DEFAULT_PAGE) {
          values.push(["page", String(query.page)]);
        }
        break;
    }
  }

  const path = scopePath(query.scope);
  if (values.length === 0) return path;

  const search = values
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  return `${path}?${search}`;
}
