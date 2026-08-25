import type { BreadcrumbLink, ShopHubPage } from "../models/page-models";

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
 */

export type JsonLd = Record<string, unknown>;

export function breadcrumbList(
  origin: string,
  links: readonly BreadcrumbLink[],
): JsonLd | null {
  if (links.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: links.map((link, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: link.label,
      item: absolute(origin, link.href),
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
export function hubItemList(origin: string, page: ShopHubPage): JsonLd | null {
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
      url: absolute(origin, concern.href),
    })),
  };
}

export function collectionPage(origin: string, page: ShopHubPage): JsonLd {
  const node: JsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.meta.title,
    url: absolute(origin, page.meta.canonicalHref),
  };
  // Emitted only when there is one. An empty string is a worse signal than an
  // absent property.
  if (page.meta.description) node.description = page.meta.description;
  return node;
}

function absolute(origin: string, href: string): string {
  return href.startsWith("http") ? href : `${origin}${href}`;
}
