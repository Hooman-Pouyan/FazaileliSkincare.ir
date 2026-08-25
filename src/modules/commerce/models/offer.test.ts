import { describe, expect, it } from "vitest";
import { customerGroupEnum, priceVisibilityEnum } from "@/lib/db/schema/enums";
import { type OfferVariant, resolveOfferState } from "./offer";

const RIALS = 4_800_000n;

function variant(overrides: Partial<OfferVariant> = {}): OfferVariant {
  return {
    id: "v1",
    isActive: true,
    onHand: 5,
    prices: [{ customerGroup: "public", amountRials: RIALS }],
    ...overrides,
  };
}

describe("offer state vocabulary", () => {
  it("matches the customer groups and price visibilities the database defines", () => {
    // Given: the model declares these unions rather than importing Drizzle rows
    // Then: they cannot silently drift from the enums that store them
    expect([...customerGroupEnum.enumValues].sort()).toEqual(
      ["professional", "public", "student"].sort(),
    );
    expect([...priceVisibilityEnum.enumValues].sort()).toEqual(
      ["on_request", "public"].sort(),
    );
  });
});

describe("resolveOfferState", () => {
  it("returns purchasable for one active, priced, in-stock variant", () => {
    const state = resolveOfferState({
      isProfessionalOnly: false,
      priceVisibility: "public",
      customerGroup: "public",
      variants: [variant()],
    });

    expect(state).toEqual({
      kind: "purchasable",
      variantId: "v1",
      amountRials: RIALS,
      onHand: 5,
    });
  });

  it("refuses a professional-only product before considering price or stock", () => {
    // Given: a restricted product that is otherwise perfectly sellable
    const state = resolveOfferState({
      isProfessionalOnly: true,
      priceVisibility: "public",
      customerGroup: "public",
      variants: [variant()],
    });

    // Then: restriction wins, so a restricted product can never look buyable
    expect(state.kind).toBe("professional_only");
  });

  it("lets a professional viewer buy a professional-only product", () => {
    const state = resolveOfferState({
      isProfessionalOnly: true,
      priceVisibility: "public",
      customerGroup: "professional",
      variants: [
        variant({
          prices: [{ customerGroup: "professional", amountRials: RIALS }],
        }),
      ],
    });

    expect(state.kind).toBe("purchasable");
  });

  it("returns on_request when the price is not published", () => {
    const state = resolveOfferState({
      isProfessionalOnly: false,
      priceVisibility: "on_request",
      customerGroup: "public",
      variants: [variant({ prices: [] })],
    });

    expect(state.kind).toBe("on_request");
  });

  it("returns unavailable when no variant is active", () => {
    const state = resolveOfferState({
      isProfessionalOnly: false,
      priceVisibility: "public",
      customerGroup: "public",
      variants: [variant({ isActive: false })],
    });

    expect(state.kind).toBe("unavailable");
  });

  it("returns unavailable when no active variant carries a price for this viewer", () => {
    // Given: a variant priced only for professionals, viewed by the public
    const state = resolveOfferState({
      isProfessionalOnly: false,
      priceVisibility: "public",
      customerGroup: "public",
      variants: [
        variant({
          prices: [{ customerGroup: "professional", amountRials: RIALS }],
        }),
      ],
    });

    // Then: there is no public price to fall back to, and none is invented
    expect(state.kind).toBe("unavailable");
  });

  it("asks for a variant when several are sellable and none is chosen", () => {
    const state = resolveOfferState({
      isProfessionalOnly: false,
      priceVisibility: "public",
      customerGroup: "public",
      variants: [variant(), variant({ id: "v2" })],
    });

    expect(state).toEqual({
      kind: "variant_required",
      variantIds: ["v1", "v2"],
    });
  });

  it("becomes purchasable once one of several variants is chosen", () => {
    const state = resolveOfferState({
      isProfessionalOnly: false,
      priceVisibility: "public",
      customerGroup: "public",
      variants: [variant(), variant({ id: "v2", onHand: 2 })],
      selectedVariantId: "v2",
    });

    expect(state).toEqual({
      kind: "purchasable",
      variantId: "v2",
      amountRials: RIALS,
      onHand: 2,
    });
  });

  it("treats a selection that is not sellable as no selection", () => {
    const state = resolveOfferState({
      isProfessionalOnly: false,
      priceVisibility: "public",
      customerGroup: "public",
      variants: [variant(), variant({ id: "v2" })],
      selectedVariantId: "v-does-not-exist",
    });

    expect(state.kind).toBe("variant_required");
  });

  it("returns out_of_stock for a single sellable variant with no stock", () => {
    const state = resolveOfferState({
      isProfessionalOnly: false,
      priceVisibility: "public",
      customerGroup: "public",
      variants: [variant({ onHand: 0 })],
    });

    expect(state.kind).toBe("out_of_stock");
  });

  it("returns out_of_stock, not variant_required, when every variant is empty", () => {
    // Given: asking someone to choose between two things they cannot have is
    // worse than telling them the product is unavailable
    const state = resolveOfferState({
      isProfessionalOnly: false,
      priceVisibility: "public",
      customerGroup: "public",
      variants: [variant({ onHand: 0 }), variant({ id: "v2", onHand: 0 })],
    });

    expect(state.kind).toBe("out_of_stock");
  });

  it("still asks for a variant when only some are in stock", () => {
    const state = resolveOfferState({
      isProfessionalOnly: false,
      priceVisibility: "public",
      customerGroup: "public",
      variants: [variant({ onHand: 0 }), variant({ id: "v2", onHand: 3 })],
    });

    expect(state).toEqual({
      kind: "variant_required",
      variantIds: ["v1", "v2"],
    });
  });

  it("returns unavailable for a product with no variants at all", () => {
    const state = resolveOfferState({
      isProfessionalOnly: false,
      priceVisibility: "public",
      customerGroup: "public",
      variants: [],
    });

    expect(state.kind).toBe("unavailable");
  });
});
