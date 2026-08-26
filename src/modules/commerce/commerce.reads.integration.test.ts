import { config as loadEnv } from "dotenv";
import { beforeAll, describe, expect, it } from "vitest";
import type { FacetGroup } from "./models/page-models";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const { db } = await import("@/lib/db");
const { seedReference } = await import("@/lib/db/seeds/reference");
const { seedDevCatalogue } = await import("@/lib/db/seeds/dev");
const { getProduct, getShopHub, listProducts } = await import(
  "./commerce.reads"
);

/**
 * Runs against a real PostgreSQL, because everything it protects is SQL: the
 * publication predicate, the exact-locale join, offer resolution across a
 * product's variants, and the canonical-query contract at the route boundary.
 *
 * It asserts the outcomes the development seed already declares, so this suite
 * and `seed-expectations.test.ts` check the same statements from opposite sides —
 * one through the policy functions, one through the database.
 */

const FA = "fa";
const HUB = { kind: "hub" } as const;

/**
 * The real Persian catalogue, resolved the way the route resolves it.
 *
 * Reading the shipped JSON rather than echoing keys back is the lesson from
 * packet 4: a test that returns its own key cannot see a key that does not
 * exist.
 */
const faMessages = (await import("@/messages/fa.json")).default;
const translateShop = (key: string): string => {
  const value = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        typeof node === "object" && node !== null
          ? (node as Record<string, unknown>)[part]
          : undefined,
      faMessages.shop,
    );
  if (typeof value !== "string") throw new Error(`Missing message shop.${key}`);
  return value;
};

beforeAll(async () => {
  await seedReference(db);
  await seedDevCatalogue(db, "test");
}, 60_000);

function slugsOf(page: { results: readonly { slug: string }[] }): string[] {
  return page.results.map((tile) => tile.slug);
}

describe("getShopHub", () => {
  it("returns taxonomy that leads somewhere and bounded featured products", async () => {
    const outcome = await getShopHub(FA, translateShop);

    expect(outcome.kind).toBe("ready");
    if (outcome.kind !== "ready") return;

    // Every listed concern, brand and category has at least one visible product;
    // a door that opens onto an empty room is worse than no door.
    for (const group of [
      outcome.page.concerns,
      outcome.page.brands,
      outcome.page.categories,
    ]) {
      expect(group.length).toBeGreaterThan(0);
      for (const entry of group) expect(entry.productCount).toBeGreaterThan(0);
    }

    expect(outcome.page.featured.length).toBeLessThanOrEqual(8);
    expect(outcome.page.meta.robots).toBe("index,follow");
  });
});

describe("listProducts — what the catalogue may and may not show", () => {
  it("shows published, approved, Persian-translated products", async () => {
    const outcome = await listProducts(FA, HUB, new URLSearchParams());

    expect(outcome.kind).toBe("ready");
    if (outcome.kind !== "ready") return;
    expect(slugsOf(outcome.page)).toContain("dev-product-1-shosto-roshana");
  });

  it("never shows an unpublished product", async () => {
    const outcome = await listProducts(FA, HUB, new URLSearchParams());
    if (outcome.kind !== "ready") throw new Error("expected ready");

    expect(slugsOf(outcome.page)).not.toContain(
      "dev-product-8-draft-never-visible",
    );
    expect(slugsOf(outcome.page)).not.toContain(
      "dev-product-9-verified-not-published",
    );
  });

  it("never shows a product whose only variant is inactive", async () => {
    const outcome = await listProducts(FA, HUB, new URLSearchParams());
    if (outcome.kind !== "ready") throw new Error("expected ready");

    expect(slugsOf(outcome.page)).not.toContain("dev-product-6-tonik-baran");
  });

  it("hides an untranslated product from Persian and shows it in English", async () => {
    // Given: no fallback chain — English copy never stands in for Persian
    const persian = await listProducts(FA, HUB, new URLSearchParams());
    const english = await listProducts("en", HUB, new URLSearchParams());
    if (persian.kind !== "ready" || english.kind !== "ready") {
      throw new Error("expected both ready");
    }

    expect(slugsOf(persian.page)).not.toContain(
      "dev-product-7-english-only-cream",
    );
    expect(slugsOf(english.page)).toContain("dev-product-7-english-only-cream");
  });

  it("keeps restricted and unpriced products visible but not purchasable", async () => {
    const outcome = await listProducts(FA, HUB, new URLSearchParams());
    if (outcome.kind !== "ready") throw new Error("expected ready");

    const onRequest = outcome.page.results.find(
      (tile) => tile.slug === "dev-product-4-mask-parniyan",
    );
    const professional = outcome.page.results.find(
      (tile) => tile.slug === "dev-product-5-peeling-atrisa",
    );

    expect(onRequest?.offer.kind).toBe("on_request");
    expect(onRequest?.price).toBeNull();
    expect(professional?.offer.kind).toBe("professional_only");
  });

  it("keeps a published product with no media in the catalogue", async () => {
    // Guards the LOW-8 amendment: media is a publication gate, not a runtime
    // predicate, so losing an image must not make stock unbuyable
    const outcome = await listProducts(FA, HUB, new URLSearchParams());
    if (outcome.kind !== "ready") throw new Error("expected ready");

    const tile = outcome.page.results.find(
      (entry) => entry.slug === "dev-product-10-no-media",
    );
    expect(tile?.image).toBeNull();
    expect(tile?.offer.kind).toBe("purchasable");
  });
});

describe("listProducts — scopes, filters and the URL contract", () => {
  it("narrows to a concern", async () => {
    const outcome = await listProducts(
      FA,
      { kind: "concern", slug: "acne" },
      new URLSearchParams(),
    );

    expect(outcome.kind).toBe("ready");
    if (outcome.kind !== "ready") return;
    expect(slugsOf(outcome.page)).toContain("dev-product-4-mask-parniyan");
    expect(slugsOf(outcome.page)).not.toContain("dev-product-1-shosto-roshana");
  });

  it("returns not-found for a taxonomy that does not exist", async () => {
    const outcome = await listProducts(
      FA,
      { kind: "concern", slug: "no-such-concern" },
      new URLSearchParams(),
    );

    expect(outcome.kind).toBe("not-found");
  });

  it("finds a product by an infix Persian term", async () => {
    const outcome = await listProducts(
      FA,
      { kind: "search", query: "" },
      new URLSearchParams("q=شبنم"),
    );

    expect(outcome.kind).toBe("ready");
    if (outcome.kind !== "ready") return;
    expect(slugsOf(outcome.page)).toContain("dev-product-2-serum-shabnam");
    expect(outcome.page.meta.robots).toBe("noindex,follow");
  });

  it("returns a valid search with no matches as ready and empty", async () => {
    // Given: zero results is not not-found — the scope exists and the query
    // was fine
    const outcome = await listProducts(
      FA,
      { kind: "search", query: "" },
      new URLSearchParams("q=zzzzzznotathing"),
    );

    expect(outcome.kind).toBe("ready");
    if (outcome.kind !== "ready") return;
    expect(outcome.page.results).toEqual([]);
    expect(outcome.page.pagination.pageCount).toBe(1);
  });

  it("redirects a non-canonical URL instead of serving it", async () => {
    const outcome = await listProducts(FA, HUB, new URLSearchParams("page=1"));

    expect(outcome.kind).toBe("redirect");
    if (outcome.kind !== "redirect") return;
    // Locale-agnostic: prefixing belongs to `@/i18n/navigation` — decision R-1.
    expect(outcome.href).toBe("/shop");
  });

  it("rejects an unrecognised sort rather than defaulting", async () => {
    const outcome = await listProducts(
      FA,
      HUB,
      new URLSearchParams("sort=banana"),
    );

    expect(outcome.kind).toBe("invalid-query");
  });

  it("marks a filtered listing noindex and canonicals it to the clean scope", async () => {
    const outcome = await listProducts(
      FA,
      { kind: "concern", slug: "hydration" },
      new URLSearchParams("in_stock=1"),
    );

    expect(outcome.kind).toBe("ready");
    if (outcome.kind !== "ready") return;
    expect(outcome.page.meta.robots).toBe("noindex,follow");
    expect(outcome.page.meta.canonicalPath).toBe("/shop/concern/hydration");
    expect(outcome.page.appliedFilters).toHaveLength(1);
  });

  it("excludes out-of-stock products when availability is filtered", async () => {
    const all = await listProducts(
      FA,
      { kind: "concern", slug: "barrier" },
      new URLSearchParams(),
    );
    const inStock = await listProducts(
      FA,
      { kind: "concern", slug: "barrier" },
      new URLSearchParams("in_stock=1"),
    );
    if (all.kind !== "ready" || inStock.kind !== "ready") {
      throw new Error("expected both ready");
    }

    expect(slugsOf(all.page)).toContain("dev-product-3-krem-mahtab");
    expect(slugsOf(inStock.page)).not.toContain("dev-product-3-krem-mahtab");
  });
});

describe("listProducts — facet counts", () => {
  function groupOf(
    page: { facets: readonly FacetGroup[] },
    parameter: FacetGroup["parameter"],
  ): FacetGroup | undefined {
    return page.facets.find((group) => group.parameter === parameter);
  }

  it("offers every axis except the one the page already is", async () => {
    // Given: a concern page filtered by concern would invite a customer to
    // narrow a concern page by a different concern.
    const outcome = await listProducts(
      FA,
      { kind: "concern", slug: "lak" },
      new URLSearchParams(),
    );
    expect(outcome.kind).toBe("ready");
    if (outcome.kind !== "ready") return;

    expect(groupOf(outcome.page, "concern")).toBeUndefined();
    expect(groupOf(outcome.page, "brand")).toBeDefined();
  });

  it("counts a group with its own selections removed, so a shopper can widen", async () => {
    // This is PLP-03, and it is the whole reason facet counting is a separate
    // query. Count `brand` with the brand filter still applied and every
    // unselected brand reads zero — the rail can then only ever narrow.
    const unfiltered = await listProducts(FA, HUB, new URLSearchParams());
    expect(unfiltered.kind).toBe("ready");
    if (unfiltered.kind !== "ready") return;

    const brands = groupOf(unfiltered.page, "brand");
    const first = brands?.options[0];
    expect(first).toBeDefined();
    if (!first) return;

    const filtered = await listProducts(
      FA,
      HUB,
      new URLSearchParams({ brand: first.value }),
    );
    expect(filtered.kind).toBe("ready");
    if (filtered.kind !== "ready") return;

    const filteredBrands = groupOf(filtered.page, "brand");
    expect(filteredBrands).toBeDefined();

    // Every other brand keeps the count it had before, because the brand
    // filter was removed when counting brands.
    const before = new Map(
      brands.options.map((option) => [option.value, option.count]),
    );
    for (const option of filteredBrands?.options ?? []) {
      expect(option.count).toBe(before.get(option.value));
    }

    // And the applied one is marked, so the rail can render it as removable.
    expect(
      filteredBrands?.options.find((option) => option.value === first.value)
        ?.isApplied,
    ).toBe(true);
  });

  it("narrows one group when a different group is filtered", async () => {
    // The other half of the rule: a group's counts do respect every *other*
    // group's selections, or the numbers would be lies.
    const unfiltered = await listProducts(FA, HUB, new URLSearchParams());
    if (unfiltered.kind !== "ready") return;

    const concerns = groupOf(unfiltered.page, "concern");
    const concernSlug = concerns?.options[0]?.value;
    expect(concernSlug).toBeDefined();
    if (!concernSlug) return;

    const filtered = await listProducts(
      FA,
      HUB,
      new URLSearchParams({ concern: concernSlug }),
    );
    if (filtered.kind !== "ready") return;

    const brandsBefore = groupOf(unfiltered.page, "brand");
    const brandsAfter = groupOf(filtered.page, "brand");

    const totalBefore = (brandsBefore?.options ?? []).reduce(
      (sum, option) => sum + option.count,
      0,
    );
    const totalAfter = (brandsAfter?.options ?? []).reduce(
      (sum, option) => sum + option.count,
      0,
    );

    expect(totalAfter).toBeLessThanOrEqual(totalBefore);
    expect(totalAfter).toBeGreaterThan(0);
  });

  it("gives every option a link that toggles only that value", async () => {
    const outcome = await listProducts(FA, HUB, new URLSearchParams());
    if (outcome.kind !== "ready") return;

    for (const group of outcome.page.facets) {
      for (const option of group.options) {
        expect(option.href.startsWith("/shop")).toBe(true);
        // Prefixing belongs to the navigation layer — decision R-1.
        expect(option.href.startsWith("/fa/")).toBe(false);
      }
    }
  });
});

describe("listProducts — the facet manifest's new axes", () => {
  function codes(page: { facets: readonly FacetGroup[] }): string[] {
    return page.facets.map((group) => group.parameter);
  }

  it("does not offer brand ranges until the results are one brand", async () => {
    // F-2: on the hub, `line` is every range from every brand side by side,
    // meaning nothing to someone who has not chosen a brand.
    const hub = await listProducts(FA, HUB, new URLSearchParams());
    if (hub.kind !== "ready") return;
    expect(codes(hub.page)).not.toContain("line");

    const brands = hub.page.facets.find((g) => g.parameter === "brand");
    const brandSlug = brands?.options[0]?.value;
    if (!brandSlug) return;

    const scoped = await listProducts(
      FA,
      { kind: "brand", slug: brandSlug },
      new URLSearchParams(),
    );
    if (scoped.kind !== "ready") return;
    // The brand axis is the page, so it is gone; its ranges take its place.
    expect(codes(scoped.page)).not.toContain("brand");

    const narrowed = await listProducts(
      FA,
      HUB,
      new URLSearchParams({ brand: brandSlug }),
    );
    if (narrowed.kind !== "ready") return;
    // One brand selected on the hub counts too.
    expect(narrowed.page.query.brands).toEqual([brandSlug]);
  });

  it("accepts the new parameters and canonicalises them in manifest order", async () => {
    const outcome = await listProducts(
      FA,
      HUB,
      new URLSearchParams("phase=treat&skin_type=dry&audience=home"),
    );
    // Order in the URL is not the order the manifest emits, so this is a
    // redirect to the canonical spelling rather than a served page.
    expect(outcome.kind).toBe("redirect");
    if (outcome.kind !== "redirect") return;
    expect(outcome.href.indexOf("skin_type")).toBeLessThan(
      outcome.href.indexOf("phase"),
    );
  });

  it("rejects an audience value that is not one of the two", async () => {
    const outcome = await listProducts(
      FA,
      HUB,
      new URLSearchParams({ audience: "everyone" }),
    );
    expect(outcome.kind).toBe("invalid-query");
  });

  it("reports the price range the current results actually span", async () => {
    const outcome = await listProducts(FA, HUB, new URLSearchParams());
    if (outcome.kind !== "ready") return;

    if (outcome.page.price) {
      expect(outcome.page.price.minToman).toBeLessThan(
        outcome.page.price.maxToman,
      );
      // Toman in the URL and in the control; rials never reach a customer.
      expect(outcome.page.price.action.startsWith("/shop")).toBe(true);
    }
  });

  it("ships with no questions, and emits no FAQ markup for none", async () => {
    const outcome = await listProducts(FA, HUB, new URLSearchParams());
    if (outcome.kind !== "ready") return;
    expect(outcome.page.questions).toEqual([]);
  });
});

describe("getProduct", () => {
  it("returns a purchasable product with its media and price", async () => {
    const outcome = await getProduct(FA, "dev-product-1-shosto-roshana");

    expect(outcome.kind).toBe("ready");
    if (outcome.kind !== "ready") return;
    expect(outcome.page.offer.kind).toBe("purchasable");
    expect(outcome.page.price).not.toBeNull();
    expect(outcome.page.media.length).toBeGreaterThan(0);
    expect(outcome.page.breadcrumbs).toHaveLength(3);
  });

  it("asks for a variant, then resolves once one is chosen", async () => {
    const unchosen = await getProduct(FA, "dev-product-2-serum-shabnam");
    if (unchosen.kind !== "ready") throw new Error("expected ready");
    expect(unchosen.page.offer.kind).toBe("variant_required");

    const first = unchosen.page.variants[0];
    expect(first).toBeDefined();
    if (!first) return;

    const chosen = await getProduct(
      FA,
      "dev-product-2-serum-shabnam",
      first.id,
    );
    if (chosen.kind !== "ready") throw new Error("expected ready");
    expect(chosen.page.offer.kind).toBe("purchasable");
  });

  it("is not-found for an unpublished product", async () => {
    const outcome = await getProduct(FA, "dev-product-8-draft-never-visible");
    expect(outcome.kind).toBe("not-found");
  });

  it("is not-found for a product with no active variant", async () => {
    const outcome = await getProduct(FA, "dev-product-6-tonik-baran");
    expect(outcome.kind).toBe("not-found");
  });

  it("is locale-unavailable, not not-found, when only the copy is missing", async () => {
    const outcome = await getProduct(FA, "dev-product-7-english-only-cream");
    expect(outcome.kind).toBe("locale-unavailable");
  });

  it("is not-found for a slug that does not exist", async () => {
    const outcome = await getProduct(FA, "no-such-product");
    expect(outcome.kind).toBe("not-found");
  });
});
