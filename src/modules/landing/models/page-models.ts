/**
 * What the Landing renders, after the reads have resolved it.
 *
 * Every field that can be `null` or empty is a beat that may be **absent** —
 * `LAND-10`. Absent means the section, its heading, its ornament and its
 * vertical rhythm are all gone and the beats around it close the gap, which is
 * a composition requirement rather than error handling.
 *
 * Beats 1 and 3 — the portrait and the three doors — are not here. They are the
 * page's skeleton and its primary navigation, and a missing content row must
 * not be able to take the site's front door with it.
 */

export type LandingCredential = Readonly<{ key: string; label: string }>;

export type LandingClaim = Readonly<{
  heading: string | null;
  body: string | null;
  credentials: readonly LandingCredential[];
}>;

export type LandingQuote = Readonly<{
  key: string;
  attribution: string;
  quote: string;
}>;

export type LandingComparison = Readonly<{
  key: string;
  caption: string;
  before: Readonly<{ url: string; alt: string | null }> | null;
  after: Readonly<{ url: string; alt: string | null }> | null;
}>;

export type LandingInvitation = Readonly<{
  heading: string | null;
  body: string | null;
  cta: Readonly<{ label: string; href: string }> | null;
}>;

export type LandingPage = Readonly<{
  claim: LandingClaim | null;
  testimonials: readonly LandingQuote[];
  comparisons: readonly LandingComparison[];
  invitation: LandingInvitation | null;
}>;
