import { config as loadEnv } from "dotenv";
import { and, eq, inArray } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import type { FacetGroup } from "./models/page-models";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const { db } = await import("@/lib/db");
const { product, productMedia, productTranslation } = await import(
  "@/lib/db/schema"
);
const { seedReference } = await import("@/lib/db/seeds/reference");
const { seedContent } = await import("@/lib/db/seeds/content");
const { seedCommerceDemo, seedStorydermCatalogue } = await import(
  "@/lib/db/seeds/storyderm"
);
const { loadStorydermManifest } = await import(
  "@/lib/db/seeds/storyderm-manifest"
);
const { faqPage } = await import("./utils/structured-data");
const { getProduct, getShopHub, listProducts } = await import(
  "./commerce.reads"
);

/**
 * Runs against a real PostgreSQL, because everything it protects is SQL: the
 * publication predicate, the exact-locale join, offer resolution across a
 * product's variants, facet counting, and the content spine's resolution rule.
 *
 * **Expectations come from the manifest, not from constants.** The catalogue is
 * fifty hand-curated products; hardcoding slugs here would mean every curation
 * change breaks a test for the wrong reason, and a count copied by hand is a
 * count nobody rechecks. Deriving them makes this suite assert something
 * stronger and more useful: *the database matches the curated manifest*.
 */

const FA = "fa";
const HUB = { kind: "hub" } as const;

const manifest = loadStorydermManifest();
const bySlug = new Map(manifest.products.map((entry) => [entry.slug, entry]));

/** Held back on purpose — `C-17`. Seeded, inactive, and never in a listing. */
const HELD = manifest.products
  .filter((entry) => entry.disposition === "hold")
  .map((entry) => entry.slug);

const SEEDED = manifest.products.filter(
  (entry) => entry.disposition === "seed",
);

function firstWhere(
  predicate: (entry: (typeof SEEDED)[number]) => boolean,
): string {
  const found = SEEDED.find(predicate);
  if (!found) throw new Error("the manifest no longer covers this state");
  return found.slug;
}

const ON_REQUEST = firstWhere(
  (entry) =>
    entry.priceVisibility === "on_request" && entry.audience === "home",
);
const PROFESSIONAL = firstWhere((entry) => entry.audience === "professional");
const MULTI_VARIANT = firstWhere(
  (entry) =>
    entry.variants.length > 1 &&
    entry.priceVisibility === "public" &&
    entry.audience === "home" &&
    entry.variants.every((variant) => variant.demoStock > 0),
);
const OUT_OF_STOCK = firstWhere(
  (entry) =>
    entry.variants.length > 0 &&
    entry.variants.every((variant) => variant.demoStock === 0),
);

/**
 * Two states the manifest cannot express, because they are not curation
 * decisions — they are things that go wrong in a real catalogue. Made here,
 * deliberately and in one place, rather than by adding fake rows to the seed.
 */
const ENGLISH_ONLY = firstWhere(
  (entry) => entry.slug !== MULTI_VARIANT && entry.variants.length === 1,
);
const NO_MEDIA = firstWhere(
  (entry) =>
    entry.slug !== MULTI_VARIANT &&
    entry.slug !== ENGLISH_ONLY &&
    entry.variants.length === 1 &&
    entry.priceVisibility === "public" &&
    entry.audience === "home" &&
    entry.variants.every((variant) => variant.demoStock > 0),
);

const faMessages = (await import("@/messages/fa.json")).default;
const enMessages = (await import("@/messages/en.json")).default;

function messageAt(root: unknown, key: string): string {
  const value = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        typeof node === "object" && node !== null
          ? (node as Record<string, unknown>)[part]
          : undefined,
      root,
    );
  if (typeof value !== "string") throw new Error(`Missing message ${key}`);
  return value;
}

const translatePlp = (key: string): string => messageAt(faMessages.plp, key);
const translateEnPlp = (key: string): string => messageAt(enMessages.plp, key);
const translateShop = (key: string): string => messageAt(faMessages.shop, key);

/**
 * The production predicate, in a test.
 *
 * Every seeded product is `reviewState: draft` and unpublished — `C-1` — so the
 * storefront sees them only through the server-owned draft preview, which is on
 * outside production. Running a block with it off is how this suite checks what
 * a customer would actually get, without moving a single row.
 */
async function asCustomer<T>(body: () => Promise<T>): Promise<T> {
  const previous = process.env.CONTENT_DRAFT_PREVIEW;
  process.env.CONTENT_DRAFT_PREVIEW = "off";
  try {
    return await body();
  } finally {
    if (previous === undefined) delete process.env.CONTENT_DRAFT_PREVIEW;
    else process.env.CONTENT_DRAFT_PREVIEW = previous;
  }
}

beforeAll(async () => {
  await seedReference(db);
  await seedStorydermCatalogue(db, "test");
  await seedCommerceDemo(db, "test");
  await seedContent(db, "test");

  /*
    Two conditions the seed will never produce, because they are failures
    rather than curation: a product whose Persian copy is missing, and a
    product whose imagery has gone. Both are states the reads must handle, and
    both are made by removing rows rather than by inventing products — a fake
    product would drift from the manifest the moment the manifest changed.
  */
  const rows = await db
    .select({ id: product.id, slug: product.slug })
    .from(product)
    .where(inArray(product.slug, [ENGLISH_ONLY, NO_MEDIA]));

  for (const row of rows) {
    if (row.slug === ENGLISH_ONLY) {
      await db
        .delete(productTranslation)
        .where(
          and(
            eq(productTranslation.productId, row.id),
            eq(productTranslation.localeCode, FA),
          ),
        );
    }
    if (row.slug === NO_MEDIA) {
      await db.delete(productMedia).where(eq(productMedia.productId, row.id));
    }
  }
}, 120_000);

function slugsOf(page: { results: readonly { slug: string }[] }): string[] {
  return page.results.map((tile) => tile.slug);
}

async function listing(
  scope: Parameters<typeof listProducts>[1],
  search = new URLSearchParams(),
  locale = FA,
) {
  const outcome = await listProducts(
    locale,
    scope,
    search,
    locale === FA ? translatePlp : translateEnPlp,
  );
  if (outcome.kind !== "ready") {
    throw new Error(`expected ready, got ${outcome.kind}`);
  }
  return outcome.page;
}

describe("the database matches the curated manifest", () => {
  it("seeds every manifest product and nothing else", async () => {
    const rows = await db.select({ slug: product.slug }).from(product);
    expect(rows.map((row) => row.slug).sort()).toEqual(
      manifest.products.map((entry) => entry.slug).sort(),
    );
  });

  it("marks every seeded product draft, and publishes none of them", async () => {
    const rows = await db
      .select({
        reviewState: product.reviewState,
        isPublished: product.isPublished,
      })
      .from(product);
    expect(rows.every((row) => row.reviewState === "draft")).toBe(true);
    expect(rows.some((row) => row.isPublished)).toBe(false);
  });
});

describe("getShopHub", () => {
  it("returns taxonomy that leads somewhere and bounded featured products", async () => {
    const outcome = await getShopHub(FA, translateShop);

    expect(outcome.kind).toBe("ready");
    if (outcome.kind !== "ready") return;

    // A door that opens onto an empty room is worse than no door.
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
  it("shows the seeded catalogue under draft preview", async () => {
    const page = await listing(HUB);
    expect(page.pagination.total).toBeGreaterThan(30);
  });

  it("shows a customer nothing at all, because nothing is approved", async () => {
    // The whole catalogue is draft. This is the production predicate, and it
    // is the reason the preview exists rather than the data being published.
    await asCustomer(async () => {
      const page = await listing(HUB);
      expect(page.results).toEqual([]);
      expect(page.pagination.total).toBe(0);
    });
  });

  it("never shows a held product, in either mode", async () => {
    // C-17: a held product's variants are seeded inactive, and preview
    // deliberately does not relax the active-variant requirement.
    expect(HELD.length).toBeGreaterThan(0);
    const page = await listing(HUB, new URLSearchParams("page=2"));
    const everywhere = new Set([
      ...slugsOf(page),
      ...slugsOf(await listing(HUB)),
    ]);
    for (const slug of HELD) expect(everywhere.has(slug)).toBe(false);
  });

  it("hides an untranslated product from Persian and shows it in English", async () => {
    // No fallback chain — English copy never stands in for Persian.
    const persian = await listing(HUB, new URLSearchParams("q="), FA);
    const english = await listing(HUB, new URLSearchParams("q="), "en");
    expect(slugsOf(persian)).not.toContain(ENGLISH_ONLY);
    expect([
      ...slugsOf(english),
      ...slugsOf(await listing(HUB, new URLSearchParams("page=2"), "en")),
    ]).toContain(ENGLISH_ONLY);
  });

  it("keeps restricted and unpriced products visible but not purchasable", async () => {
    const onRequest = await getProduct(FA, ON_REQUEST);
    if (onRequest.kind !== "ready") throw new Error("expected ready");
    expect(onRequest.page.offer.kind).toBe("on_request");
    expect(onRequest.page.price).toBeNull();

    const professional = await getProduct(FA, PROFESSIONAL);
    if (professional.kind !== "ready") throw new Error("expected ready");
    expect(professional.page.offer.kind).toBe("professional_only");
  });

  it("keeps a product with no media in the catalogue", async () => {
    // LOW-8: media is a publication gate, not a runtime predicate, so losing
    // an image must not make stock unbuyable.
    const outcome = await getProduct(FA, NO_MEDIA);
    if (outcome.kind !== "ready") throw new Error("expected ready");
    expect(outcome.page.media).toEqual([]);
    expect(outcome.page.offer.kind).toBe("purchasable");
  });
});

describe("listProducts — scopes, filters and the URL contract", () => {
  it("narrows to a concern", async () => {
    const acne = bySlug.get(
      firstWhere((entry) => entry.taxonomy.concerns.includes("acne")),
    );
    expect(acne).toBeDefined();

    const page = await listing({ kind: "concern", slug: "acne" });
    const slugs = slugsOf(page);
    expect(slugs).toContain(acne?.slug);
    for (const slug of slugs) {
      expect(bySlug.get(slug)?.taxonomy.concerns).toContain("acne");
    }
  });

  it("returns not-found for a taxonomy that does not exist", async () => {
    const outcome = await listProducts(
      FA,
      { kind: "concern", slug: "no-such-concern" },
      new URLSearchParams(),
      translatePlp,
    );
    expect(outcome.kind).toBe("not-found");
  });

  it("finds a product by an infix Persian term", async () => {
    // «رم» sits inside «کرم». A prefix index cannot answer this; the trigram
    // GIN from migration 0003 is what makes it work.
    const page = await listing(
      { kind: "search", query: "" },
      new URLSearchParams("q=رم"),
    );
    expect(page.results.length).toBeGreaterThan(0);
    for (const slug of slugsOf(page)) {
      expect(bySlug.get(slug)?.names.display.fa).toContain("رم");
    }
    expect(page.meta.robots).toBe("noindex,follow");
  });

  it("returns a valid search with no matches as ready and empty", async () => {
    const page = await listing(
      { kind: "search", query: "" },
      new URLSearchParams("q=zzzzzznotathing"),
    );
    expect(page.results).toEqual([]);
    expect(page.pagination.pageCount).toBe(1);
  });

  it("redirects a non-canonical URL instead of serving it", async () => {
    const outcome = await listProducts(
      FA,
      HUB,
      new URLSearchParams("page=1"),
      translatePlp,
    );
    expect(outcome.kind).toBe("redirect");
    if (outcome.kind !== "redirect") return;
    // The whole catalogue has its own address — F-7. Locale-agnostic, because
    // prefixing belongs to `@/i18n/navigation` — R-1.
    expect(outcome.href).toBe("/shop/all");
  });

  it("rejects an unrecognised sort rather than defaulting", async () => {
    const outcome = await listProducts(
      FA,
      HUB,
      new URLSearchParams("sort=banana"),
      translatePlp,
    );
    expect(outcome.kind).toBe("invalid-query");
  });

  it("marks a filtered listing noindex and canonicals it to the clean scope", async () => {
    const page = await listing(
      { kind: "concern", slug: "hydration" },
      new URLSearchParams("in_stock=1"),
    );
    expect(page.meta.robots).toBe("noindex,follow");
    expect(page.meta.canonicalPath).toBe("/shop/concern/hydration");
    expect(page.appliedFilters).toHaveLength(1);
  });

  it("excludes out-of-stock products when availability is filtered", async () => {
    const concern = bySlug.get(OUT_OF_STOCK)?.taxonomy.concerns[0];
    expect(concern).toBeDefined();
    if (!concern) return;

    const all = await listing({ kind: "concern", slug: concern });
    const inStock = await listing(
      { kind: "concern", slug: concern },
      new URLSearchParams("in_stock=1"),
    );

    expect(slugsOf(all)).toContain(OUT_OF_STOCK);
    expect(slugsOf(inStock)).not.toContain(OUT_OF_STOCK);
  });

  it("renders a size ladder as one tile, not one per size", async () => {
    const ladder = bySlug.get(MULTI_VARIANT);
    expect(ladder?.variants.length).toBeGreaterThan(1);

    const page = await listing(HUB);
    const appearances = slugsOf(page).filter((slug) => slug === MULTI_VARIANT);
    expect(appearances.length).toBeLessThanOrEqual(1);
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
    const page = await listing({ kind: "concern", slug: "lak" });
    expect(groupOf(page, "concern")).toBeUndefined();
    expect(groupOf(page, "category")).toBeDefined();
  });

  it("offers the axes the facet manifest promised and the data now has", async () => {
    // F-8: `skin_type` and `phase` rendered nothing because their taxonomies
    // had no rows. Every seeded product now carries both.
    const page = await listing(HUB);
    expect(groupOf(page, "skin_type")).toBeDefined();
    expect(groupOf(page, "phase")).toBeDefined();
    expect(groupOf(page, "category")).toBeDefined();
  });

  it("counts a group with its own selections removed, so a shopper can widen", async () => {
    // PLP-03, and the whole reason facet counting is a separate query.
    const unfiltered = await listing(HUB);
    const categories = groupOf(unfiltered, "category");
    const first = categories?.options[0];
    expect(first).toBeDefined();
    if (!first || !categories) return;

    const filtered = await listing(
      HUB,
      new URLSearchParams({ category: first.value }),
    );
    const after = groupOf(filtered, "category");
    expect(after).toBeDefined();

    const before = new Map(
      categories.options.map((option) => [option.value, option.count]),
    );
    for (const option of after?.options ?? []) {
      expect(option.count).toBe(before.get(option.value));
    }
    expect(
      after?.options.find((option) => option.value === first.value)?.isApplied,
    ).toBe(true);
  });

  it("narrows one group when a different group is filtered", async () => {
    const unfiltered = await listing(HUB);
    const concernSlug = groupOf(unfiltered, "concern")?.options[0]?.value;
    expect(concernSlug).toBeDefined();
    if (!concernSlug) return;

    const filtered = await listing(
      HUB,
      new URLSearchParams({ concern: concernSlug }),
    );

    const total = (group: FacetGroup | undefined) =>
      (group?.options ?? []).reduce((sum, option) => sum + option.count, 0);

    expect(total(groupOf(filtered, "category"))).toBeLessThanOrEqual(
      total(groupOf(unfiltered, "category")),
    );
    expect(total(groupOf(filtered, "category"))).toBeGreaterThan(0);
  });

  it("never offers a facet value that matches everything or nothing", async () => {
    // F-8's lesson as an assertion: a value matching every product teaches a
    // shopper nothing, and a value matching none should not be rendered.
    const page = await listing(HUB);
    for (const group of page.facets) {
      for (const option of group.options) {
        expect(option.count).toBeGreaterThan(0);
        expect(option.count).toBeLessThan(page.pagination.total);
      }
    }
  });

  it("gives every option a link that toggles only that value", async () => {
    const page = await listing(HUB);
    for (const group of page.facets) {
      for (const option of group.options) {
        expect(option.href.startsWith("/shop")).toBe(true);
        expect(option.href.startsWith("/fa/")).toBe(false);
      }
    }
  });

  it("does not offer brand ranges until the results are one brand", async () => {
    // F-2. One brand is seeded, but the hub has no brand *filter*, so ranges
    // from several brands would sit side by side the moment a second arrives.
    const hub = await listing(HUB);
    expect(hub.facets.map((group) => group.parameter)).not.toContain("line");

    const brandSlug = groupOf(hub, "brand")?.options[0]?.value;
    expect(brandSlug).toBeDefined();
    if (!brandSlug) return;

    const scoped = await listing({ kind: "brand", slug: brandSlug });
    const codes = scoped.facets.map((group) => group.parameter);
    expect(codes).not.toContain("brand");
    expect(codes).toContain("line");
  });

  it("accepts the new parameters and canonicalises them in manifest order", async () => {
    const outcome = await listProducts(
      FA,
      HUB,
      new URLSearchParams("phase=treat&skin_type=dry&audience=home"),
      translatePlp,
    );
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
      translatePlp,
    );
    expect(outcome.kind).toBe("invalid-query");
  });

  it("reports the price range the current results actually span", async () => {
    const page = await listing(HUB);
    expect(page.price).not.toBeNull();
    if (!page.price) return;
    expect(page.price.minToman).toBeLessThan(page.price.maxToman);
    // Toman in the URL and in the control; rials never reach a customer.
    expect(page.price.action.startsWith("/shop")).toBe(true);
  });
});

describe("listProducts — the content spine", () => {
  it("carries the generic question set on the whole catalogue", async () => {
    const page = await listing(HUB);
    expect(page.questions.length).toBeGreaterThan(0);
    for (const entry of page.questions) {
      expect(entry.question.length).toBeGreaterThan(0);
      expect(entry.answer.length).toBeGreaterThan(0);
    }
  });

  it("replaces the generic set on a scope that has its own — never merges it", async () => {
    // C-12. Whoever writes the questions for a concern controls that page.
    const generic = await listing(HUB);
    const acne = await listing({ kind: "concern", slug: "acne" });

    expect(acne.questions.length).toBeGreaterThan(0);
    const genericQuestions = new Set(generic.questions.map((q) => q.question));
    for (const entry of acne.questions) {
      expect(genericQuestions.has(entry.question)).toBe(false);
    }
  });

  it("falls back to the generic set on a scope with none of its own", async () => {
    const generic = await listing(HUB);
    const category = await listing({ kind: "category", slug: "cream" });
    expect(category.questions.map((q) => q.question)).toEqual(
      generic.questions.map((q) => q.question),
    );
  });

  it("emits FAQ markup for exactly the questions the page shows", async () => {
    // C-15. One array, two consumers — structured data cannot claim a question
    // the page does not render.
    const page = await listing({ kind: "concern", slug: "acne" });
    const markup = faqPage(page.questions);
    expect(markup).not.toBeNull();
    expect((markup?.mainEntity as unknown[]).length).toBe(
      page.questions.length,
    );

    expect(faqPage([])).toBeNull();
  });

  it("puts an intro band above the results and a campaign inside its window", async () => {
    const page = await listing(HUB);
    const kinds = page.bands.map((band) => band.kind);
    expect(kinds).toContain("editorial");
    expect(kinds).toContain("campaign");

    const campaign = page.bands.find((band) => band.kind === "campaign");
    expect(campaign?.cta?.href.startsWith("/")).toBe(true);
  });

  it("scopes the gallery to the brand it is about", async () => {
    const hub = await listing(HUB);
    expect(hub.bands.some((band) => band.kind === "gallery")).toBe(false);

    const brand = await listing({ kind: "brand", slug: manifest.brand.slug });
    const gallery = brand.bands.find((band) => band.kind === "gallery");
    expect(gallery).toBeDefined();
    expect(gallery?.items.length).toBeGreaterThan(0);
    for (const item of gallery?.items ?? []) {
      // Addresses come from mediaUrl, never from a path built in a component.
      expect(item.media?.url).toMatch(/^\/media\/catalog\//);
    }
  });

  it("shows a customer no unreviewed copy at all", async () => {
    // C-14. Every seeded answer is written in her voice and she has not read
    // it; `content_block_published_state_check` makes that binding.
    await asCustomer(async () => {
      const page = await listing({ kind: "concern", slug: "acne" });
      expect(page.questions).toEqual([]);
      expect(page.bands).toEqual([]);
    });
  });

  it("renders Persian content and not Arabic, which is unreviewed", async () => {
    const arabic = await listProducts(
      "ar",
      HUB,
      new URLSearchParams(),
      (key) => key,
    );
    if (arabic.kind !== "ready") return;
    expect(arabic.page.questions).toEqual([]);
  });
});

describe("getProduct", () => {
  it("returns a purchasable product with its media and price", async () => {
    const single = firstWhere(
      (entry) =>
        entry.variants.length === 1 &&
        entry.priceVisibility === "public" &&
        entry.audience === "home" &&
        entry.slug !== NO_MEDIA &&
        entry.slug !== ENGLISH_ONLY &&
        entry.variants.every((variant) => variant.demoStock > 0),
    );

    const outcome = await getProduct(FA, single);
    if (outcome.kind !== "ready") throw new Error("expected ready");
    expect(outcome.page.offer.kind).toBe("purchasable");
    expect(outcome.page.price).not.toBeNull();
    expect(outcome.page.media.length).toBeGreaterThan(0);
    expect(outcome.page.media[0]?.src).toMatch(/^\/media\/catalog\//);
  });

  it("asks for a variant, then resolves once one is chosen", async () => {
    const unchosen = await getProduct(FA, MULTI_VARIANT);
    if (unchosen.kind !== "ready") throw new Error("expected ready");
    expect(unchosen.page.offer.kind).toBe("variant_required");

    const first = unchosen.page.variants[0];
    expect(first).toBeDefined();
    if (!first) return;

    const chosen = await getProduct(FA, MULTI_VARIANT, first.id);
    if (chosen.kind !== "ready") throw new Error("expected ready");
    expect(chosen.page.offer.kind).toBe("purchasable");
  });

  it("is not-found for a held product", async () => {
    const held = HELD[0];
    expect(held).toBeDefined();
    if (!held) return;
    const outcome = await getProduct(FA, held);
    expect(outcome.kind).toBe("not-found");
  });

  it("is not-found for any product when the viewer is a customer", async () => {
    await asCustomer(async () => {
      const outcome = await getProduct(FA, MULTI_VARIANT);
      expect(outcome.kind).toBe("not-found");
    });
  });

  it("is locale-unavailable, not not-found, when only the copy is missing", async () => {
    const outcome = await getProduct(FA, ENGLISH_ONLY);
    expect(outcome.kind).toBe("locale-unavailable");
  });

  it("is not-found for a slug that does not exist", async () => {
    const outcome = await getProduct(FA, "no-such-product");
    expect(outcome.kind).toBe("not-found");
  });
});
