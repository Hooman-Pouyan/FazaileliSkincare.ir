import type { DraftPreview } from "@/lib/preview";

/**
 * The resolution rule, as pure functions.
 *
 * The SQL lives in `content.reads.ts`; the *decisions* live here, so they can
 * be tested without a database and read without a query planner.
 */

export const CONTENT_SURFACES = [
  "shop.hub",
  "shop.listing",
  "pdp",
  "landing",
  "booking",
  "academy",
] as const;
export type ContentSurface = (typeof CONTENT_SURFACES)[number];

export const CONTENT_SCOPE_KINDS = ["concern", "brand", "category"] as const;
export type ContentScopeKind = (typeof CONTENT_SCOPE_KINDS)[number];

export type ContentScope = Readonly<{
  kind: ContentScopeKind;
  slug: string;
}> | null;

export type ContentBlockKind =
  | "faq"
  | "editorial"
  | "gallery"
  | "campaign"
  /** Preview quotes only — a consented testimonial is a domain entity. */
  | "testimonial";
export type ContentReviewState = "draft" | "reviewed" | "approved";

export type PlacementInput = Readonly<{
  scopeKind: ContentScopeKind | null;
  scopeSlug: string | null;
  reviewState: ContentReviewState;
  isPublished: boolean;
  effectiveFrom: Date | null;
  effectiveUntil: Date | null;
}>;

/**
 * Whether a block may render at all.
 *
 * Preview relaxes publication and review — the same relaxation the catalogue
 * gets, for the same reason (`C-14`: seeded answers are written in her voice
 * and she has not read them yet). It does **not** relax the window: a campaign
 * whose end date has passed is over in every environment, because a stale
 * campaign in development teaches the wrong thing about `L-6`.
 */
export function isLive(
  block: PlacementInput,
  now: Date,
  preview: DraftPreview,
): boolean {
  const published =
    preview.previewDrafts ||
    (block.isPublished && block.reviewState === "approved");

  const started = block.effectiveFrom === null || block.effectiveFrom <= now;
  const notEnded = block.effectiveUntil === null || block.effectiveUntil > now;

  return published && started && notEnded;
}

/**
 * Specific replaces generic — `C-12`.
 *
 * A concern page with its own three questions shows those three, not those
 * three plus five generic ones. Merging would make a page's content depend on
 * rows the author of the specific set never saw; replacement means whoever
 * writes the questions for `concern/lak` controls that page completely.
 *
 * The fallback is deliberately one level deep. There is no cascade from
 * `concern/lak` to "all concerns" to "everything", because a three-level
 * fallback is a rule nobody can hold in their head while writing copy.
 */
export function selectScoped<
  T extends { scopeKind: ContentScopeKind | null; scopeSlug: string | null },
>(blocks: readonly T[], scope: ContentScope): readonly T[] {
  if (scope !== null) {
    const specific = blocks.filter(
      (block) =>
        block.scopeKind === scope.kind && block.scopeSlug === scope.slug,
    );
    if (specific.length > 0) return specific;
  }

  return blocks.filter(
    (block) => block.scopeKind === null && block.scopeSlug === null,
  );
}
