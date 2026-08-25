import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DevSeedRefusedError, assertDevSeedAllowed } from "./dev";
import {
  DEV_BRANDS,
  DEV_CATEGORIES,
  DEV_PRODUCTS,
  DEV_SKU_PREFIX,
  DEV_SLUG_PREFIX,
} from "./dev-data";
import { REFERENCE_CONCERNS } from "./reference-data";

/**
 * `as const` narrows the fixture to literal types, which makes every assertion
 * below provable at compile time and therefore useless — TypeScript reports the
 * filters as unreachable rather than letting them run. These are invariants over
 * data that will change, so the suite reads it through a widened view and checks
 * them at runtime, where a future edit can actually break them.
 */
type SeedProduct = Readonly<{
  slug: string;
  brandSlug: string;
  lineSlug: string | null;
  categorySlug: string;
  concernSlugs: readonly string[];
  priceVisibility: string;
  reviewState: string;
  isPublished: boolean;
  expectation: string;
  translations: readonly { readonly localeCode: string }[];
  variants: readonly {
    readonly sku: string;
    readonly prices: readonly unknown[];
  }[];
  media: readonly { readonly role: string }[];
}>;

const products: readonly SeedProduct[] = DEV_PRODUCTS;

describe("development seed guard", () => {
  it("refuses production outright", () => {
    expect(() => assertDevSeedAllowed("production")).toThrowError(
      DevSeedRefusedError,
    );
  });

  it("allows development, test, and an unset environment", () => {
    for (const environment of ["development", "test", undefined]) {
      expect(() => assertDevSeedAllowed(environment)).not.toThrow();
    }
  });
});

describe("development catalogue data", () => {
  it("prefixes every slug and SKU, because the second guard identifies its own rows by prefix", () => {
    // Given: the runtime guard refuses any product it did not create
    const slugs = [
      ...DEV_BRANDS.map((entry) => entry.slug),
      ...DEV_BRANDS.flatMap((entry) => entry.lines.map((line) => line.slug)),
      ...DEV_CATEGORIES.map((entry) => entry.slug),
      ...products.map((entry) => entry.slug),
    ];
    const skus = products.flatMap((entry) =>
      entry.variants.map((item) => item.sku),
    );

    // Then: nothing in the fixture can be mistaken for a real record
    expect(slugs.filter((slug) => !slug.startsWith(DEV_SLUG_PREFIX))).toEqual(
      [],
    );
    expect(skus.filter((sku) => !sku.startsWith(DEV_SKU_PREFIX))).toEqual([]);
  });

  it("keeps every slug and SKU unique, since both carry unique indexes", () => {
    const slugs = products.map((entry) => entry.slug);
    const skus = products.flatMap((entry) =>
      entry.variants.map((item) => item.sku),
    );

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(skus).size).toBe(skus.length);
  });

  it("covers every offer and publication state a route must handle", () => {
    // Given: the states the storefront plans require, including the two that
    // must never render
    const required = [
      "purchasable",
      "purchasable-multi-variant",
      "purchasable-without-media",
      "out-of-stock",
      "on-request-not-purchasable",
      "professional-only-not-purchasable",
      "no-active-variant-not-purchasable",
      "absent-from-fa-catalogue",
      "absent-from-catalogue",
    ];

    const present = new Set<string>(products.map((entry) => entry.expectation));

    expect([...required].filter((state) => !present.has(state))).toEqual([]);
  });

  it("satisfies product_published_state_check", () => {
    // Given: the database refuses a published product that is not approved
    const violations = products
      .filter((entry) => entry.isPublished && entry.reviewState !== "approved")
      .map((entry) => entry.slug);

    expect(violations).toEqual([]);
  });

  it("references only concerns the reference seed creates", () => {
    const known = new Set<string>(
      REFERENCE_CONCERNS.map((entry) => entry.slug),
    );
    const unknown = products.flatMap((entry) =>
      entry.concernSlugs.filter((slug) => !known.has(slug)),
    );

    expect(unknown).toEqual([]);
  });

  it("references only brands and categories it also defines", () => {
    const brands = new Set<string>(DEV_BRANDS.map((entry) => entry.slug));
    const lines = new Set<string>(
      DEV_BRANDS.flatMap((entry) => entry.lines.map((line) => line.slug)),
    );
    const categories = new Set<string>(
      DEV_CATEGORIES.map((entry) => entry.slug),
    );

    for (const entry of products) {
      expect(brands.has(entry.brandSlug)).toBe(true);
      expect(categories.has(entry.categorySlug)).toBe(true);
      if (entry.lineSlug) expect(lines.has(entry.lineSlug)).toBe(true);
    }
  });

  it("has a placeholder file on disk for every media row it declares", () => {
    // Given: the seeder writes these public paths into product_media
    const missing = products.flatMap((entry) =>
      entry.media
        .map((item) => `public/images/dev/${entry.slug}-${item.role}.svg`)
        .filter((path) => !existsSync(path)),
    );

    expect(missing).toEqual([]);
  });

  it("gives every product at least one Persian or English translation", () => {
    const untranslated = products.filter(
      (entry) => entry.translations.length === 0,
    );
    expect(untranslated).toEqual([]);
  });

  it("keeps the on_request product free of any price row", () => {
    // Given: price_visibility on_request means the price is not published,
    // which the read model must not be able to work around
    const onRequest = products.filter(
      (entry) => entry.priceVisibility === "on_request",
    );
    expect(onRequest.length).toBeGreaterThan(0);

    for (const entry of onRequest) {
      for (const item of entry.variants) {
        expect(item.prices).toEqual([]);
      }
    }
  });
});
