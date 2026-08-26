/**
 * Whether a product may appear in the catalogue, and whether staff may publish
 * it in the first place. Two questions, deliberately separate.
 *
 * `isPubliclyVisible` is the runtime read predicate. Every catalogue read
 * applies it, and it is the only place the rule lives — six conditions spread
 * across a hub query, a listing query and a detail query is how a draft product
 * reaches a customer.
 *
 * `publicationBlockers` is the staff gate. It is stricter, because the moment to
 * insist on a photograph and a price is before publication, not on every page
 * render.
 */

import { type CataloguePreview, PUBLIC_CATALOGUE } from "./catalogue-preview";

export type ProductReviewState = "draft" | "verified" | "approved";

export type CatalogueVisibilityInput = Readonly<{
  isPublished: boolean;
  reviewState: ProductReviewState;
  /**
   * A translation in the exact locale being requested. There is no fallback
   * chain: English copy never stands in for Persian, and a locale with no
   * content shows nothing rather than the wrong language.
   */
  hasTranslationForLocale: boolean;
  hasActiveVariant: boolean;
}>;

export type PublicationGateInput = CatalogueVisibilityInput &
  Readonly<{
    hasApprovedPrimaryMedia: boolean;
    /** A price for some customer group, or a deliberate `on_request` marking. */
    hasEligiblePriceOrIsOnRequest: boolean;
  }>;

export type PublicationBlocker =
  | "not_published"
  | "not_approved"
  | "missing_translation"
  | "no_active_variant"
  | "missing_approved_primary_media"
  | "missing_price";

/**
 * `preview.previewDrafts` relaxes publication and review state — and only those
 * two. A translation in the exact locale and an active variant are still
 * required, which is what keeps a deliberately held product invisible in every
 * mode (`C-17`) and stops preview from becoming "show everything".
 *
 * The flag is resolved by `resolveCataloguePreview`, which is server-owned and
 * cannot be turned on in production. It is never a search parameter.
 */
export function isPubliclyVisible(
  input: CatalogueVisibilityInput,
  preview: CataloguePreview = PUBLIC_CATALOGUE,
): boolean {
  const publicationSatisfied =
    preview.previewDrafts ||
    (input.isPublished && input.reviewState === "approved");

  return (
    publicationSatisfied &&
    input.hasTranslationForLocale &&
    input.hasActiveVariant
  );
}

/**
 * Every blocker at once, not the first one — staff fixing a product one
 * rejection at a time is a slow way to publish a catalogue.
 *
 * `not_published` is absent by design: this answers whether a product *could*
 * be published, so its current published flag is not itself a blocker.
 *
 * Approved primary media is required here and nowhere else. The storefront
 * review placed it in the read predicate as well; keeping it out of runtime is
 * a deliberate departure, because a runtime media requirement means deleting or
 * re-approving an image silently makes stock unbuyable, with no signal to
 * anyone. Enforced at the gate, a product cannot be published without a
 * photograph; if one later disappears the page degrades to a placeholder and
 * the product stays sellable.
 */
export function publicationBlockers(
  input: PublicationGateInput,
): readonly PublicationBlocker[] {
  const blockers: PublicationBlocker[] = [];

  if (input.reviewState !== "approved") blockers.push("not_approved");
  if (!input.hasTranslationForLocale) blockers.push("missing_translation");
  if (!input.hasActiveVariant) blockers.push("no_active_variant");
  if (!input.hasApprovedPrimaryMedia) {
    blockers.push("missing_approved_primary_media");
  }
  if (!input.hasEligiblePriceOrIsOnRequest) blockers.push("missing_price");

  return blockers;
}
