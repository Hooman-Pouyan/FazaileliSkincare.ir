import type {
  BreadcrumbLink,
  ProductDetailPage,
  ProductListingPage,
  ScopeQuestion,
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

/**
 * Turns a media `src` into an absolute URL.
 *
 * Separate from `AbsoluteUrl` because it is a different rule: a route is
 * locale-prefixed and an asset is not, so running an image through `localeUrl`
 * would emit `/en/media/…`. Injected for the same reason as `AbsoluteUrl` — this
 * module stays pure, and the one place allowed to know where media is served
 * from stays `lib/media/url.ts`.
 */
export type AbsoluteAsset = (src: string) => string;

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

/**
 * `FAQPage` for questions the page actually shows.
 *
 * Built from the same array the accordion renders, and null when that array is
 * empty. Emitting FAQ markup without a visible counterpart is a structured-data
 * violation that costs the rich result and risks a manual action — the whole
 * point of taking the array rather than a separate content source.
 */
export function faqPage(questions: readonly ScopeQuestion[]): JsonLd | null {
  if (questions.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

/**
 * `Product` for the product page — `PDP-10`.
 *
 * **An `offers` block appears only when the page shows a price.** That is the
 * whole discipline here. `professional_only` and `on_request` deliberately show
 * no money to the reader, and emitting one to a crawler would be structured
 * data that contradicts the page — the exact fabrication D-18-3 calls a
 * manual-action risk rather than a growth tactic. A hidden price published to
 * Google is also a real commercial leak: `professional_only` exists because the
 * trade price is not the public one.
 *
 * Availability is likewise the offer state's own answer, never a guess from
 * stock: `out_of_stock` says `OutOfStock`, and nothing else claims `InStock`.
 *
 * No rating, no review count, no `priceValidUntil` — there is no review data,
 * and a validity date nobody set is a fact invented to satisfy a validator.
 *
 * **The amount is rials, and the currency is `IRR`, which is the rial.** The
 * page renders toman, because that is what a customer in Iran reads — but
 * toman has no ISO 4217 code, so a feed cannot express it. Publishing the
 * toman figure under `IRR` would understate every price by a factor of ten,
 * which is `AGENTS.md` rule 1 arriving through the back door: the ÷10 is a
 * *view* transform, and structured data is not a view. The two are the same
 * amount stated in different units, and only one of them is expressible here.
 */
export function productSchema(
  page: ProductDetailPage,
  absolute: AbsoluteUrl,
  absoluteAsset: AbsoluteAsset,
): JsonLd {
  const url = absolute(page.meta.canonicalPath);
  const offer = page.offer;

  const schema: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: page.name,
    url,
    brand: { "@type": "Brand", name: page.brand.name },
  };

  if (page.promise) schema.description = page.promise;
  if (page.media.length > 0) {
    // Absolute, like every other URL in the graph — and resolved by an injected
    // function rather than by importing the origin. Reaching for `@/lib/site`
    // here pulled `@/i18n/navigation` into this module, which needs the Next
    // runtime, and broke `commerce.reads.integration.test.ts` on import. The
    // module's own contract already said why: builders take a resolver so they
    // stay pure and testable without a request or a React tree.
    schema.image = page.media.map((entry) => absoluteAsset(entry.src));
  }
  if (page.category) schema.category = page.category.name;

  const showsAPrice =
    (offer.kind === "purchasable" ||
      offer.kind === "variant_required" ||
      offer.kind === "out_of_stock") &&
    page.price !== null;

  if (showsAPrice && page.price) {
    schema.offers = {
      "@type": "Offer",
      url,
      priceCurrency: "IRR",
      price: page.price.amountRials.toString(),
      availability:
        offer.kind === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    };
  }

  return schema;
}
