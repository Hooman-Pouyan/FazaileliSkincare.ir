import { describe, expect, it } from "vitest";
import type { ShopHubPage } from "../models/page-models";
import { breadcrumbList, collectionPage, hubItemList } from "./structured-data";

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
