import { describe, expect, it } from "vitest";
import { loadStorydermManifest } from "@/lib/db/seeds/storyderm-manifest";
import { PUBLIC_ONLY } from "@/lib/preview";
import {
  type CustomerGroup,
  type OfferState,
  type OfferVariant,
  resolveOfferState,
} from "./offer";
import { isPubliclyVisible } from "./publication";

/**
 * The manifest declares what each product *is*. This suite makes that
 * declaration binding: it runs the real policy functions over the real
 * curation and asserts the stated outcome.
 *
 * It needs no database, so a policy regression fails in seconds rather than
 * surviving until someone opens a browser. Its counterpart,
 * `commerce.reads.integration.test.ts`, asserts the same statements from the
 * other side — through SQL.
 *
 * It replaces the version that ran over the fictional `dev` catalogue. The
 * fixture changed; the idea — that a seed's intent should be executable — did
 * not.
 */

const manifest = loadStorydermManifest();
const PREVIEW = { previewDrafts: true } as const;

/** What the reads assemble, rebuilt here from the curation. */
function variantsOf(
  entry: (typeof manifest.products)[number],
): readonly OfferVariant[] {
  return entry.variants.map((variant) => ({
    id: variant.sku,
    // A held product's variants are seeded inactive — `C-17`.
    isActive: entry.disposition === "seed",
    onHand: variant.demoStock,
    prices:
      variant.demoPriceRials === null
        ? []
        : [
            {
              customerGroup: "public" as const,
              amountRials: BigInt(variant.demoPriceRials),
            },
          ],
  }));
}

function offerFor(
  entry: (typeof manifest.products)[number],
  customerGroup: CustomerGroup = "public",
  selectedVariantId: string | null = null,
): OfferState {
  return resolveOfferState({
    isProfessionalOnly: entry.audience === "professional",
    priceVisibility: entry.priceVisibility,
    customerGroup,
    variants: variantsOf(entry),
    selectedVariantId,
  });
}

function visible(
  entry: (typeof manifest.products)[number],
  preview: { previewDrafts: boolean },
): boolean {
  return isPubliclyVisible(
    {
      // Nothing in a development seed publishes or approves anything — `C-4`.
      isPublished: false,
      reviewState: "draft",
      hasTranslationForLocale: true,
      hasActiveVariant: variantsOf(entry).some((variant) => variant.isActive),
    },
    preview,
  );
}

describe("publication, over the real curation", () => {
  it("shows a customer nothing, because nothing is approved", () => {
    for (const entry of manifest.products) {
      expect(visible(entry, PUBLIC_ONLY), entry.slug).toBe(false);
    }
  });

  it("shows the seeded catalogue under draft preview", () => {
    const seeded = manifest.products.filter(
      (entry) => entry.disposition === "seed",
    );
    for (const entry of seeded) {
      expect(visible(entry, PREVIEW), entry.slug).toBe(true);
    }
  });

  it("keeps a held product invisible even under preview", () => {
    const held = manifest.products.filter(
      (entry) => entry.disposition === "hold",
    );
    expect(held.length).toBeGreaterThan(0);
    for (const entry of held) {
      expect(visible(entry, PREVIEW), entry.slug).toBe(false);
    }
  });
});

describe("offer state, over the real curation", () => {
  const seeded = manifest.products.filter(
    (entry) => entry.disposition === "seed",
  );

  it("never offers a price for an on-request product", () => {
    const onRequest = seeded.filter(
      (entry) => entry.priceVisibility === "on_request",
    );
    expect(onRequest.length).toBeGreaterThan(0);
    for (const entry of onRequest) {
      expect(offerFor(entry).kind, entry.slug).toBe(
        entry.audience === "professional" ? "professional_only" : "on_request",
      );
    }
  });

  it("never lets an anonymous visitor buy a professional-only product", () => {
    const professional = seeded.filter(
      (entry) => entry.audience === "professional",
    );
    expect(professional.length).toBeGreaterThan(0);
    for (const entry of professional) {
      // Restriction is decided before price or stock, so it can never present
      // as buyable to someone who may not buy it.
      expect(offerFor(entry, "public").kind, entry.slug).toBe(
        "professional_only",
      );
    }
  });

  it("reports out of stock rather than purchasable when nothing is on hand", () => {
    const empty = seeded.filter(
      (entry) =>
        entry.variants.length > 0 &&
        entry.priceVisibility === "public" &&
        entry.audience === "home" &&
        entry.variants.every((variant) => variant.demoStock === 0),
    );
    expect(empty.length).toBeGreaterThanOrEqual(2);
    for (const entry of empty) {
      expect(offerFor(entry).kind, entry.slug).toBe("out_of_stock");
    }
  });

  it("asks for a size before selling one, then sells the size chosen", () => {
    const ladders = seeded.filter(
      (entry) =>
        entry.variants.length > 1 &&
        entry.priceVisibility === "public" &&
        entry.audience === "home" &&
        entry.variants.every((variant) => variant.demoStock > 0),
    );
    expect(ladders.length).toBeGreaterThan(5);

    for (const entry of ladders) {
      expect(offerFor(entry).kind, entry.slug).toBe("variant_required");
      const first = entry.variants[0];
      if (!first) continue;
      expect(offerFor(entry, "public", first.sku).kind, entry.slug).toBe(
        "purchasable",
      );
    }
  });

  it("sells a single-variant product in stock without asking anything", () => {
    const simple = seeded.filter(
      (entry) =>
        entry.variants.length === 1 &&
        entry.priceVisibility === "public" &&
        entry.audience === "home" &&
        (entry.variants[0]?.demoStock ?? 0) > 0,
    );
    expect(simple.length).toBeGreaterThan(5);
    for (const entry of simple) {
      expect(offerFor(entry).kind, entry.slug).toBe("purchasable");
    }
  });
});
