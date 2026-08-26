import { describe, expect, it } from "vitest";
import { productReviewStateEnum } from "@/lib/db/schema/enums";
import {
  type CatalogueVisibilityInput,
  type PublicationGateInput,
  isPubliclyVisible,
  publicationBlockers,
} from "./publication";

function visible(
  overrides: Partial<CatalogueVisibilityInput> = {},
): CatalogueVisibilityInput {
  return {
    isPublished: true,
    reviewState: "approved",
    hasTranslationForLocale: true,
    hasActiveVariant: true,
    ...overrides,
  };
}

function publishable(
  overrides: Partial<PublicationGateInput> = {},
): PublicationGateInput {
  return {
    ...visible(),
    hasApprovedPrimaryMedia: true,
    hasEligiblePriceOrIsOnRequest: true,
    ...overrides,
  };
}

describe("catalogue visibility", () => {
  it("matches the review states the database defines", () => {
    expect([...productReviewStateEnum.enumValues].sort()).toEqual(
      ["approved", "draft", "verified"].sort(),
    );
  });

  it("shows a published, approved, translated product with an active variant", () => {
    expect(isPubliclyVisible(visible())).toBe(true);
  });

  it("hides a product that is approved but not published", () => {
    expect(isPubliclyVisible(visible({ isPublished: false }))).toBe(false);
  });

  it("hides a product that is published but not approved", () => {
    // Given: the database check already forbids this combination, so reaching
    // it means something wrote around the constraint
    expect(isPubliclyVisible(visible({ reviewState: "draft" }))).toBe(false);
    expect(isPubliclyVisible(visible({ reviewState: "verified" }))).toBe(false);
  });

  it("hides a product with no translation in the requested locale", () => {
    // Given: there is no fallback chain — English copy never stands in for
    // Persian, and a locale without content shows nothing rather than the
    // wrong language
    expect(isPubliclyVisible(visible({ hasTranslationForLocale: false }))).toBe(
      false,
    );
  });

  it("hides a product with no active variant, because there is nothing to sell", () => {
    expect(isPubliclyVisible(visible({ hasActiveVariant: false }))).toBe(false);
  });

  it("does not require media to keep a published product visible", () => {
    // Given: media is a publication-gate requirement, not a runtime predicate.
    // Making it runtime means deleting an image silently makes stock unbuyable.
    expect(isPubliclyVisible(visible())).toBe(true);
  });
});

describe("publication gate", () => {
  it("reports no blockers for a complete product", () => {
    expect(publicationBlockers(publishable())).toEqual([]);
  });

  it("blocks publication without approved primary media", () => {
    expect(
      publicationBlockers(publishable({ hasApprovedPrimaryMedia: false })),
    ).toEqual(["missing_approved_primary_media"]);
  });

  it("blocks publication without a price or an on-request marking", () => {
    expect(
      publicationBlockers(
        publishable({ hasEligiblePriceOrIsOnRequest: false }),
      ),
    ).toEqual(["missing_price"]);
  });

  it("reports every blocker at once rather than the first one", () => {
    // Given: staff fixing one problem at a time is a slow way to publish
    const blockers = publicationBlockers(
      publishable({
        reviewState: "draft",
        hasTranslationForLocale: false,
        hasActiveVariant: false,
        hasApprovedPrimaryMedia: false,
        hasEligiblePriceOrIsOnRequest: false,
      }),
    );

    expect(blockers).toEqual([
      "not_approved",
      "missing_translation",
      "no_active_variant",
      "missing_approved_primary_media",
      "missing_price",
    ]);
  });
});

describe("draft preview relaxes publication and nothing else", () => {
  const draft = {
    isPublished: false,
    reviewState: "draft",
    hasTranslationForLocale: true,
    hasActiveVariant: true,
  } as const;

  it("hides a draft product from a customer", () => {
    expect(isPubliclyVisible(draft)).toBe(false);
  });

  it("shows it under preview", () => {
    expect(isPubliclyVisible(draft, { previewDrafts: true })).toBe(true);
  });

  it("still requires a translation in the exact locale", () => {
    expect(
      isPubliclyVisible(
        { ...draft, hasTranslationForLocale: false },
        { previewDrafts: true },
      ),
    ).toBe(false);
  });

  it("still requires an active variant — this is what holds a product back", () => {
    expect(
      isPubliclyVisible(
        { ...draft, hasActiveVariant: false },
        { previewDrafts: true },
      ),
    ).toBe(false);
  });
});
