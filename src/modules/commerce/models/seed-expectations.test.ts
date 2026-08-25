import { describe, expect, it } from "vitest";
import { DEV_PRODUCTS } from "@/lib/db/seeds/dev-data";
import {
  type CustomerGroup,
  type OfferState,
  type OfferVariant,
  type PriceVisibility,
  resolveOfferState,
} from "./offer";
import { isPubliclyVisible } from "./publication";
import type { ProductReviewState } from "./publication";

/**
 * The development seed declares what each fixture product is *for*. This suite
 * is what makes that declaration binding: it runs the real policy functions over
 * the real fixture and asserts the stated outcome.
 *
 * It needs no database, so a policy regression fails in seconds rather than
 * surviving until someone opens a browser.
 */

type SeedProduct = Readonly<{
  slug: string;
  isProfessionalOnly: boolean;
  priceVisibility: string;
  reviewState: string;
  isPublished: boolean;
  expectation: string;
  translations: readonly { readonly localeCode: string }[];
  variants: readonly {
    readonly sku: string;
    readonly isActive: boolean;
    readonly onHand: number;
    readonly prices: readonly {
      readonly customerGroup: string;
      readonly amountRials: bigint;
    }[];
  }[];
}>;

const products: readonly SeedProduct[] = DEV_PRODUCTS;

function variantsOf(entry: SeedProduct): readonly OfferVariant[] {
  return entry.variants.map((item) => ({
    id: item.sku,
    isActive: item.isActive,
    onHand: item.onHand,
    prices: item.prices.map((price) => ({
      customerGroup: price.customerGroup as CustomerGroup,
      amountRials: price.amountRials,
    })),
  }));
}

function offerFor(
  entry: SeedProduct,
  customerGroup: CustomerGroup = "public",
  selectedVariantId?: string,
): OfferState {
  return resolveOfferState({
    isProfessionalOnly: entry.isProfessionalOnly,
    priceVisibility: entry.priceVisibility as PriceVisibility,
    customerGroup,
    variants: variantsOf(entry),
    selectedVariantId,
  });
}

function visibleIn(entry: SeedProduct, localeCode: string): boolean {
  return isPubliclyVisible({
    isPublished: entry.isPublished,
    reviewState: entry.reviewState as ProductReviewState,
    hasTranslationForLocale: entry.translations.some(
      (translation) => translation.localeCode === localeCode,
    ),
    hasActiveVariant: entry.variants.some((item) => item.isActive),
  });
}

function bySlug(fragment: string): SeedProduct {
  const found = products.find((entry) => entry.slug.includes(fragment));
  if (!found) throw new Error(`No development product matching ${fragment}`);
  return found;
}

describe("every development product behaves as its expectation declares", () => {
  it("declares an expectation this suite knows how to check", () => {
    const checked = new Set<string>([
      "purchasable",
      "purchasable-multi-variant",
      "purchasable-without-media",
      "out-of-stock",
      "on-request-not-purchasable",
      "professional-only-not-purchasable",
      "no-active-variant-not-purchasable",
      "absent-from-fa-catalogue",
      "absent-from-catalogue",
    ]);
    const unchecked = products
      .map((entry) => entry.expectation)
      .filter((expectation) => !checked.has(expectation));

    expect(unchecked).toEqual([]);
  });

  it("purchasable products are visible in Persian and buyable", () => {
    for (const entry of products.filter((item) =>
      ["purchasable", "purchasable-without-media"].includes(item.expectation),
    )) {
      expect(visibleIn(entry, "fa"), entry.slug).toBe(true);
      expect(offerFor(entry).kind, entry.slug).toBe("purchasable");
    }
  });

  it("the multi-variant product asks for a choice, then becomes buyable", () => {
    const entry = bySlug("serum-shabnam");

    expect(visibleIn(entry, "fa")).toBe(true);
    expect(offerFor(entry).kind).toBe("variant_required");

    const firstSku = entry.variants[0]?.sku;
    expect(firstSku).toBeDefined();
    expect(offerFor(entry, "public", firstSku).kind).toBe("purchasable");
  });

  it("the empty product is visible but out of stock", () => {
    const entry = bySlug("krem-mahtab");

    expect(visibleIn(entry, "fa")).toBe(true);
    expect(offerFor(entry).kind).toBe("out_of_stock");
  });

  it("the on-request product is visible and carries no purchase path", () => {
    const entry = bySlug("mask-parniyan");

    expect(visibleIn(entry, "fa")).toBe(true);
    expect(offerFor(entry).kind).toBe("on_request");
  });

  it("the professional-only product is visible to the public but not buyable", () => {
    // D-18-2: visible for authority and Persian SEO, never purchasable by an
    // anonymous visitor, who is always the public customer group until AUTH3.
    const entry = bySlug("peeling-atrisa");

    expect(visibleIn(entry, "fa")).toBe(true);
    expect(offerFor(entry, "public").kind).toBe("professional_only");
    expect(offerFor(entry, "professional").kind).toBe("purchasable");
  });

  it("a product whose only variant is inactive leaves the catalogue entirely", () => {
    const entry = bySlug("tonik-baran");

    expect(visibleIn(entry, "fa")).toBe(false);
    expect(offerFor(entry).kind).toBe("unavailable");
  });

  it("an untranslated product is absent from Persian and present in English", () => {
    // Given: no fallback chain, so English copy never stands in for Persian
    const entry = bySlug("english-only-cream");

    expect(visibleIn(entry, "fa")).toBe(false);
    expect(visibleIn(entry, "en")).toBe(true);
  });

  it("unpublished products are absent from every locale", () => {
    for (const entry of products.filter(
      (item) => item.expectation === "absent-from-catalogue",
    )) {
      for (const localeCode of ["fa", "en", "ar"]) {
        expect(
          visibleIn(entry, localeCode),
          `${entry.slug} ${localeCode}`,
        ).toBe(false);
      }
    }
  });
});
