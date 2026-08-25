import { config as loadEnv } from "dotenv";
import { beforeAll, describe, expect, it } from "vitest";

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

beforeAll(async () => {
  await seedReference(db);
  await seedDevCatalogue(db, "test");
}, 60_000);

function slugsOf(page: { results: readonly { slug: string }[] }): string[] {
  return page.results.map((tile) => tile.slug);
}

describe("getShopHub", () => {
  it("returns taxonomy that leads somewhere and bounded featured products", async () => {
    const outcome = await getShopHub(FA);

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
    expect(outcome.href).toBe("/fa/shop");
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
    expect(outcome.page.meta.canonicalPath).toBe("/fa/shop/concern/hydration");
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
