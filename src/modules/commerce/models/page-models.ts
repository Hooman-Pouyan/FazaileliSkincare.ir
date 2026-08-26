import type { Rials } from "@/lib/money";
import type { CatalogueQuery, CatalogueSort } from "./catalogue-query";
import type { OfferState } from "./offer";

/**
 * Presentation-ready shapes assembled on the server. These are not Drizzle rows
 * and they expose no query internals: a screen receives finished hrefs and
 * finished money strings, so no client leaf rebuilds URL policy or formats a
 * price — and therefore none of them can format it differently.
 *
 * "Finished" means finished except for the locale. Every href here is a
 * locale-agnostic pathname — `/shop/concern/melasma`, never `/fa/shop/...` —
 * because `Link` and `redirect` from `@/i18n/navigation` own prefixing and
 * nothing else may. A model that prefixed its own hrefs and then handed them to
 * `Link` produced `/fa/fa/shop`; see `docs/22-locale-routing-decisions.md`.
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

/**
 * The facet codes the manifest accepts — `docs/24-facet-manifest.md` F-1.
 *
 * A union rather than a string, so a component cannot invent a group and a new
 * axis cannot be added without editing the manifest's row alongside it.
 */
export type FacetParameterCode =
  | "concern"
  | "skin_type"
  | "brand"
  | "line"
  | "category"
  | "phase";

export type FacetGroup = Readonly<{
  parameter: FacetParameterCode;
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
 *
 * `canonicalPath` carries **no locale**, like every other href in these models.
 * The route turns it into an absolute URL with `localeUrl`, which asks
 * next-intl for the prefix rather than guessing at one — decision R-1.
 */
export type PageMeta = Readonly<{
  title: string;
  description: string | null;
  canonicalPath: string;
  robots: "index,follow" | "noindex,follow";
}>;

/**
 * The price axis. Numeric, so it has no options — the rail needs the range the
 * current results actually span, or the control offers bounds that return
 * nothing.
 */
export type PriceFacet = Readonly<{
  /** Toman, because that is what the URL and the customer use. */
  minToman: number;
  maxToman: number;
  appliedMinToman: number | null;
  appliedMaxToman: number | null;
  /** Where the form submits. The rail builds no URL of its own. */
  action: string;
}>;

/** A question this scope answers, in her voice. See F-5. */
export type ScopeQuestion = Readonly<{ question: string; answer: string }>;

/**
 * Editorial content a listing carries beside its results.
 *
 * Read from the content spine and mapped here, so commerce owns the shape its
 * own screens consume rather than importing another module's types
 * (`AGENTS.md`). `kind` decides placement, not styling: `campaign` and
 * `editorial` sit above the grid, `gallery` below it.
 */
export type ContentBandItem = Readonly<{
  key: string;
  title: string;
  body: string | null;
  media: Readonly<{ url: string; alt: string | null }> | null;
}>;

export type ContentBand = Readonly<{
  key: string;
  kind: "editorial" | "gallery" | "campaign";
  heading: string | null;
  body: string | null;
  cta: Readonly<{ label: string; href: string }> | null;
  items: readonly ContentBandItem[];
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
  /** Absent when the results carry no eligible price to bound. */
  price: PriceFacet | null;
  /**
   * Absent until content exists. `FAQPage` markup is emitted only for questions
   * actually on the page — markup without a visible counterpart is a penalty,
   * not a shortcut.
   */
  questions: readonly ScopeQuestion[];
  /**
   * Editorial bands, in the order the content spine returned them. Empty is a
   * designed state: a listing with nothing to say says nothing, rather than
   * rendering an empty frame — `L-10`.
   */
  bands: readonly ContentBand[];
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

/**
 * A concern with the products chosen for it — the shortest path this site has
 * from a worry to a purchase, and the axis the competitive research found
 * missing from every Iranian competitor.
 */
export type HubConcernSpotlight = Readonly<{
  concern: HubConcern;
  products: readonly ProductTile[];
}>;

export type ShopHubPage = Readonly<{
  concerns: readonly HubConcern[];
  /** A bounded subset of `concerns`, each with a few of its products. */
  concernSpotlights: readonly HubConcernSpotlight[];
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
