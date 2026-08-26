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

/**
 * Who a product is for. `product.isProfessionalOnly` owns it.
 *
 * Single-select with two named values rather than a "professional only" toggle:
 * a checkbox answers one question and leaves the other unaskable, and on a site
 * that deliberately shows professional stock it will not sell (D-18-2), "show
 * me only what I can buy" is the more common need. See F-3.
 */
export type CatalogueAudience = "home" | "professional";

export type CatalogueQuery = Readonly<{
  scope: CatalogueScope;
  brands: readonly string[];
  concerns: readonly string[];
  categories: readonly string[];
  /** Brand ranges — Storyderm's Ultra Lift, Forlle'd's Platinum. See F-2. */
  lines: readonly string[];
  /** Dry, oily, sensitive, and the rest. `productSkinState`. */
  skinTypes: readonly string[];
  /** Where a product sits in a routine — cleanse, treat, protect. */
  phases: readonly string[];
  audience: CatalogueAudience | null;
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
  "line",
  "skin_type",
  "phase",
  "audience",
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
  "concern",
  "skin_type",
  "brand",
  "line",
  "category",
  "phase",
  "audience",
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

/**
 * A query with nothing applied — the bare scope.
 *
 * Exists because building one by hand needs a cast, and a cast is a promise the
 * compiler stops checking: adding `lines`, `skinTypes`, `phases` and `audience`
 * to the type silently left a hand-built literal three fields short until the
 * cast was removed. One constructor means the next axis cannot do that.
 */
export function emptyQuery(scope: CatalogueScope): CatalogueQuery {
  return {
    scope,
    brands: [],
    concerns: [],
    categories: [],
    lines: [],
    skinTypes: [],
    phases: [],
    audience: null,
    inStockOnly: false,
    minPriceRials: null,
    maxPriceRials: null,
    sort: DEFAULT_SORT,
    page: DEFAULT_PAGE,
  };
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
  const lines = uniqueSorted(search.getAll("line"));
  const skinTypes = uniqueSorted(search.getAll("skin_type"));
  const phases = uniqueSorted(search.getAll("phase"));
  for (const [key, cleaned] of [
    ["brand", brands],
    ["concern", concerns],
    ["category", categories],
    ["line", lines],
    ["skin_type", skinTypes],
    ["phase", phases],
  ] as const) {
    const raw = search.getAll(key);
    if (raw.length !== cleaned.length || raw.some((v, i) => v !== cleaned[i])) {
      canonical = false;
    }
  }

  const audienceRaw = search.get("audience");
  let audience: CatalogueAudience | null = null;
  if (audienceRaw !== null) {
    if (audienceRaw === "home" || audienceRaw === "professional") {
      audience = audienceRaw;
    } else {
      issues.push({ parameter: "audience", code: "unrecognised" });
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
    lines,
    skinTypes,
    phases,
    audience,
    inStockOnly,
    minPriceRials: bounds.price_min,
    maxPriceRials: bounds.price_max,
    sort,
    page,
  };

  /*
    The single test for canonicality, replacing the flags collected above.

    `PARAMETER_ORDER` says it in its own comment — *"two URLs differing only in
    parameter order are two URLs"* — but that order was only ever applied when
    *emitting* a URL, never when accepting one. So `?phase=treat&skin_type=dry`
    and `?skin_type=dry&phase=treat` both served a page, which is the duplicate
    the fixed order exists to prevent.

    Comparing the incoming pairs against the pairs this query would emit
    subsumes every earlier rule — unknown parameters, unsorted repeats,
    untrimmed search terms, `page=1` — and it is idempotent by construction: the
    redirect target's own pairs are, by definition, its canonical ones, so a
    second pass never redirects again.
  */
  const expected = canonicalPairs(query);
  const received = [...search.entries()];
  const sameShape =
    received.length === expected.length &&
    received.every(
      ([key, value], index) =>
        key === expected[index]?.[0] && value === expected[index]?.[1],
    );

  return canonical && sameShape
    ? { kind: "canonical", query }
    : { kind: "redirect", query, href: catalogueHref(query) };
}

function scopePath(scope: CatalogueScope): string {
  switch (scope.kind) {
    case "hub":
      // `/shop` is the hub *screen* — an editorial front door. The whole
      // catalogue as a filterable listing is a different page, and it needs an
      // address of its own or there is nowhere to browse without first picking
      // a concern.
      return "/shop/all";
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
/**
 * The parameters a query canonically carries, in emission order.
 *
 * Shared by `catalogueHref`, which renders them, and `parseCatalogueQuery`,
 * which compares an incoming URL against them. Comparing *pairs* rather than
 * the encoded strings keeps the two encoders out of it: `catalogueHref` uses
 * `encodeURIComponent` and `URLSearchParams` writes a space as `+`, so a
 * string comparison would redirect a search for two words forever.
 */
function canonicalPairs(query: CatalogueQuery): [string, string][] {
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
      case "line":
        for (const slug of query.lines) values.push(["line", slug]);
        break;
      case "skin_type":
        for (const slug of query.skinTypes) values.push(["skin_type", slug]);
        break;
      case "phase":
        for (const slug of query.phases) values.push(["phase", slug]);
        break;
      case "audience":
        if (query.audience !== null) values.push(["audience", query.audience]);
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

  return values;
}

export function catalogueHref(query: CatalogueQuery): string {
  const values = canonicalPairs(query);
  const path = scopePath(query.scope);
  if (values.length === 0) return path;

  const search = values
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  return `${path}?${search}`;
}
