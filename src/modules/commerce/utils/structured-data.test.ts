import { describe, expect, it } from "vitest";
import type { ShopHubPage } from "../models/page-models";
import type { ProductListingPage } from "../models/page-models";
import {
  breadcrumbList,
  collectionPage,
  hubItemList,
  listingItemList,
} from "./structured-data";

/**
 * The resolvers the route would pass. Persian is the default locale and is
 * served bare under `as-needed`; English carries a prefix. Stubbing them here
 * keeps these builders pure — they never learn the prefixing rule.
 */
const fa = (pathname: string) =>
  `https://fazaieli.ir${pathname === "/" ? "" : pathname}`;
const en = (pathname: string) =>
  `https://fazaieli.ir/en${pathname === "/" ? "" : pathname}`;

function hub(overrides: Partial<ShopHubPage> = {}): ShopHubPage {
  return {
    concerns: [],
    concernSpotlights: [],
    brands: [],
    categories: [],
    featured: [],
    searchHref: "/shop/search",
    meta: {
      title: "فروشگاه",
      description: null,
      canonicalPath: "/shop",
      robots: "index,follow",
    },
    ...overrides,
  };
}

describe("hub structured data stays inside what the page can prove", () => {
  it("omits the item list entirely when there are no concerns", () => {
    expect(hubItemList(hub(), fa)).toBeNull();
  });

  it("omits an absent description rather than emitting an empty string", () => {
    const node = collectionPage(hub(), fa);
    expect(node).not.toHaveProperty("description");
  });

  it("emits no rating, review or offer anywhere", () => {
    const page = hub({
      concerns: [
        {
          slug: "melasma",
          name: "لک",
          description: null,
          href: "/shop/concern/melasma",
          productCount: 4,
        },
      ],
    });

    const serialised = JSON.stringify([
      collectionPage(page, fa),
      hubItemList(page, fa),
    ]);

    for (const forbidden of [
      "aggregateRating",
      "ratingValue",
      "reviewCount",
      "Review",
      "Offer",
      "price",
    ]) {
      expect(serialised).not.toContain(forbidden);
    }
  });

  it("absolutises through next-intl, so Persian carries no prefix", () => {
    const page = hub({
      concerns: [
        {
          slug: "acne",
          name: "جوش",
          description: null,
          href: "/shop/concern/acne",
          productCount: 2,
        },
      ],
    });

    const persian = hubItemList(page, fa) as {
      itemListElement: { url: string }[];
    };
    // Persian is the default locale and is served bare. A hand-built
    // `${origin}/${locale}${href}` would emit a canonical pointing at a route
    // that redirects — decision R-1.
    expect(persian.itemListElement[0]?.url).toBe(
      "https://fazaieli.ir/shop/concern/acne",
    );

    const english = hubItemList(page, en) as {
      itemListElement: { url: string }[];
    };
    expect(english.itemListElement[0]?.url).toBe(
      "https://fazaieli.ir/en/shop/concern/acne",
    );
  });

  it("numbers breadcrumb positions from one and drops an empty trail", () => {
    expect(breadcrumbList([], fa)).toBeNull();

    const trail = breadcrumbList(
      [
        { label: "فروشگاه", href: "/shop" },
        { label: "لک", href: "/shop/concern/melasma" },
      ],
      fa,
    ) as { itemListElement: { position: number }[] };

    expect(trail.itemListElement.map((item) => item.position)).toEqual([1, 2]);
  });
});

describe("listing structured data", () => {
  function listing(overrides: Partial<ProductListingPage> = {}) {
    return {
      results: [
        {
          slug: "serum",
          href: "/shop/p/serum",
          name: "سرم",
          brandName: "فورله‌د",
          brandHref: "/shop/brand/forlled",
          promise: null,
          image: null,
          offer: { kind: "out_of_stock" },
          price: null,
        },
      ],
      pagination: {
        page: 1,
        pageCount: 3,
        pageSize: 12,
        total: 30,
        pages: [],
        previousHref: null,
        nextHref: null,
      },
      ...overrides,
    } as unknown as ProductListingPage;
  }

  it("numbers items across the whole listing, not within the page", () => {
    // Given: numbering each page from 1 tells a crawler that page two holds the
    // same first item as page one.
    const second = listingItemList(
      listing({
        pagination: {
          page: 3,
          pageCount: 3,
          pageSize: 12,
          total: 30,
          pages: [],
          previousHref: null,
          nextHref: null,
        },
      }),
      fa,
    ) as { itemListElement: { position: number }[]; numberOfItems: number };

    expect(second.itemListElement[0]?.position).toBe(25);
    expect(second.numberOfItems).toBe(30);
  });

  it("emits no price or availability, which the product page owns", () => {
    const serialised = JSON.stringify(listingItemList(listing(), fa));
    for (const forbidden of [
      "price",
      "availability",
      "Offer",
      "aggregateRating",
    ]) {
      expect(serialised).not.toContain(forbidden);
    }
  });

  it("omits itself entirely on an empty listing", () => {
    expect(listingItemList(listing({ results: [] }), fa)).toBeNull();
  });
});
