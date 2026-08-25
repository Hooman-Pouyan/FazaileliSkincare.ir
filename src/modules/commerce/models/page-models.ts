import type { Rials } from "@/lib/money";
import type { CatalogueQuery, CatalogueSort } from "./catalogue-query";
import type { OfferState } from "./offer";

/**
 * Presentation-ready shapes assembled on the server. These are not Drizzle rows
 * and they expose no query internals: a screen receives finished hrefs and
 * finished money strings, so no client leaf rebuilds URL policy or formats a
 * price — and therefore none of them can format it differently.
 */

export type MediaView = Readonly<{
  src: string;
  alt: string;
  width: number;
  height: number;
}>;

export type PriceView = Readonly<{
  amountRials: Rials;
  /** Already grouped, already in Persian digits, already in toman. */
  label: string;
}>;

export type ProductTile = Readonly<{
  slug: string;
  href: string;
  name: string;
  brandName: string;
  brandHref: string;
  promise: string | null;
  image: MediaView | null;
  offer: OfferState;
  price: PriceView | null;
}>;

export type FacetOption = Readonly<{
  value: string;
  label: string;
  count: number;
  isApplied: boolean;
  href: string;
}>;

export type FacetGroup = Readonly<{
  parameter: "brand" | "concern" | "category";
  options: readonly FacetOption[];
}>;

export type SortOption = Readonly<{
  value: CatalogueSort;
  href: string;
  isCurrent: boolean;
}>;

export type ScopeHeader = Readonly<{
  kind: CatalogueQuery["scope"]["kind"];
  title: string;
  introduction: string | null;
}>;

export type BreadcrumbLink = Readonly<{ label: string; href: string }>;

/**
 * What a route needs to emit correct metadata without re-deriving anything.
 * `robots` follows D-18-3: scope and paginated pages are indexable, filtered and
 * sorted permutations are not, and search results never are.
 */
export type PageMeta = Readonly<{
  title: string;
  description: string | null;
  canonicalHref: string;
  robots: "index,follow" | "noindex,follow";
}>;

export type ProductListingPage = Readonly<{
  scope: ScopeHeader;
  breadcrumbs: readonly BreadcrumbLink[];
  query: CatalogueQuery;
  results: readonly ProductTile[];
  facets: readonly FacetGroup[];
  appliedFilters: readonly Readonly<{
    parameter: string;
    value: string;
    removeHref: string;
  }>[];
  clearFiltersHref: string | null;
  sortOptions: readonly SortOption[];
  pagination: Readonly<{
    page: number;
    pageCount: number;
    pageSize: number;
    total: number;
    pages: readonly Readonly<{
      page: number;
      href: string;
      isCurrent: boolean;
    }>[];
    previousHref: string | null;
    nextHref: string | null;
  }>;
  meta: PageMeta;
}>;

export type HubConcern = Readonly<{
  slug: string;
  name: string;
  description: string | null;
  href: string;
  productCount: number;
}>;

export type HubBrand = Readonly<{
  slug: string;
  name: string;
  countryCode: string | null;
  href: string;
  productCount: number;
}>;

export type HubCategory = Readonly<{
  slug: string;
  name: string;
  href: string;
  productCount: number;
}>;

export type ShopHubPage = Readonly<{
  concerns: readonly HubConcern[];
  brands: readonly HubBrand[];
  categories: readonly HubCategory[];
  featured: readonly ProductTile[];
  searchHref: string;
  meta: PageMeta;
}>;

export type ProductVariantView = Readonly<{
  id: string;
  sku: string;
  sizeLabel: string | null;
  isAvailable: boolean;
  price: PriceView | null;
  href: string;
}>;

export type ProductDetailPage = Readonly<{
  slug: string;
  name: string;
  promise: string | null;
  description: string | null;
  ingredients: string | null;
  usage: string | null;
  suitableFor: string | null;
  brand: Readonly<{
    slug: string;
    name: string;
    href: string;
    countryCode: string | null;
  }>;
  category: Readonly<{ slug: string; name: string; href: string }> | null;
  concerns: readonly Readonly<{ slug: string; name: string; href: string }>[];
  media: readonly MediaView[];
  variants: readonly ProductVariantView[];
  offer: OfferState;
  price: PriceView | null;
  breadcrumbs: readonly BreadcrumbLink[];
  meta: PageMeta;
}>;
