import type {
  BreadcrumbLink,
  ProductListingPage,
  ShopHubPage,
} from "../models/page-models";

/**
 * JSON-LD, bounded to what is true.
 *
 * D-18-3 is explicit that fabricated structured data is a manual-action risk
 * rather than a growth tactic, so these builders emit only facts already on the
 * page: names, URLs and positions. No rating, no review count, no price that the
 * offer state does not support, and no claim the customer cannot see.
 *
 * Pure functions returning plain objects — the route serialises them. Nothing
 * here reads the database or the request.
 *
 * Each builder takes an `absolute` resolver rather than an origin and a locale.
 * Turning a pathname into a URL is next-intl's prefixing rule, and re-deriving
 * it here would be a second implementation of it — structured data that
 * disagrees with the page's own canonical is a self-inflicted SEO fault. The
 * route passes `localeUrl` bound to its locale, so these stay pure and testable
 * without a request or a React tree.
 */

/** Turns a locale-agnostic pathname into the absolute URL for this request. */
export type AbsoluteUrl = (pathname: string) => string;

export type JsonLd = Record<string, unknown>;

export function breadcrumbList(
  links: readonly BreadcrumbLink[],
  absolute: AbsoluteUrl,
): JsonLd | null {
  if (links.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: links.map((link, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: link.label,
      item: absolute(link.href),
    })),
  };
}

/**
 * The hub's `ItemList` names the concern axis, not the products.
 *
 * The concerns are what the page is *for* — they are its navigation and the
 * thing a search engine should understand it offers. The featured products are
 * merchandising that changes with `merchandisingRank`; listing them here would
 * put a rotating set of items into structured data that the PDP already
 * describes properly, each with its own real offer.
 */
export function hubItemList(
  page: ShopHubPage,
  absolute: AbsoluteUrl,
): JsonLd | null {
  if (page.concerns.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: page.meta.title,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: page.concerns.length,
    itemListElement: page.concerns.map((concern, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: concern.name,
      url: absolute(concern.href),
    })),
  };
}

export function collectionPage(
  page: ShopHubPage,
  absolute: AbsoluteUrl,
): JsonLd {
  const node: JsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.meta.title,
    url: absolute(page.meta.canonicalPath),
  };
  // Emitted only when there is one. An empty string is a worse signal than an
  // absent property.
  if (page.meta.description) node.description = page.meta.description;
  return node;
}

/**
 * The results on this page of a listing, as an `ItemList`.
 *
 * `position` is absolute across the whole listing rather than within the page,
 * so page two starts at 13 and not at 1 — otherwise every page of a listing
 * claims to hold the same first item.
 *
 * Names and URLs only. No price and no availability: the product page carries
 * those with its real offer state, and repeating them here means two places
 * that can disagree about whether something can be bought.
 */
export function listingItemList(
  page: ProductListingPage,
  absolute: AbsoluteUrl,
): JsonLd | null {
  if (page.results.length === 0) return null;

  const offset = (page.pagination.page - 1) * page.pagination.pageSize;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: page.pagination.total,
    itemListElement: page.results.map((product, index) => ({
      "@type": "ListItem",
      position: offset + index + 1,
      name: product.name,
      url: absolute(product.href),
    })),
  };
}
