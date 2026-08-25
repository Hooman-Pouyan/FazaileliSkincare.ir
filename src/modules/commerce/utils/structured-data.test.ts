import { describe, expect, it } from "vitest";
import type { ShopHubPage } from "../models/page-models";
import { breadcrumbList, collectionPage, hubItemList } from "./structured-data";

const ORIGIN = "https://fazaieli.ir";

function hub(overrides: Partial<ShopHubPage> = {}): ShopHubPage {
  return {
    concerns: [],
    brands: [],
    categories: [],
    featured: [],
    searchHref: "/fa/shop/search",
    meta: {
      title: "فروشگاه",
      description: null,
      canonicalHref: "/fa/shop",
      robots: "index,follow",
    },
    ...overrides,
  };
}

describe("hub structured data stays inside what the page can prove", () => {
  it("omits the item list entirely when there are no concerns", () => {
    expect(hubItemList(ORIGIN, hub())).toBeNull();
  });

  it("omits an absent description rather than emitting an empty string", () => {
    const node = collectionPage(ORIGIN, hub());
    expect(node).not.toHaveProperty("description");
  });

  it("emits no rating, review or offer anywhere", () => {
    const page = hub({
      concerns: [
        {
          slug: "melasma",
          name: "لک",
          description: null,
          href: "/fa/shop/concern/melasma",
          productCount: 4,
        },
      ],
    });

    const serialised = JSON.stringify([
      collectionPage(ORIGIN, page),
      hubItemList(ORIGIN, page),
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

  it("absolutises every href against the canonical origin", () => {
    const page = hub({
      concerns: [
        {
          slug: "acne",
          name: "جوش",
          description: null,
          href: "/fa/shop/concern/acne",
          productCount: 2,
        },
      ],
    });

    const list = hubItemList(ORIGIN, page) as {
      itemListElement: { url: string }[];
    };
    expect(list.itemListElement[0]?.url).toBe(
      "https://fazaieli.ir/fa/shop/concern/acne",
    );
  });

  it("numbers breadcrumb positions from one and drops an empty trail", () => {
    expect(breadcrumbList(ORIGIN, [])).toBeNull();

    const trail = breadcrumbList(ORIGIN, [
      { label: "فروشگاه", href: "/fa/shop" },
      { label: "لک", href: "/fa/shop/concern/melasma" },
    ]) as { itemListElement: { position: number }[] };

    expect(trail.itemListElement.map((item) => item.position)).toEqual([1, 2]);
  });
});
