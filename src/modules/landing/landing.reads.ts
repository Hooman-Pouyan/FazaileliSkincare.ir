import { resolveBlocks } from "@/modules/content/content.reads";
import type {
  LandingClaim,
  LandingComparison,
  LandingInvitation,
  LandingPage,
  LandingQuote,
} from "./models/page-models";

/**
 * The Landing's content, from PostgreSQL — `CONTENT-01`.
 *
 * _"No route, page model, Server Action or component imports a file from
 * `content/` at runtime, in any environment."_ The Landing was named there as
 * the surface most tempted to break that rule, and this is the read that keeps
 * it honest: the same four tables the PLP uses, resolved through the same
 * function, with `landing` as the surface.
 *
 * There is no second content store. `LANDING0` originally asked for a table per
 * batch; packet 7B built the spine first, so the Landing consumes it — `C-11`.
 */
export async function getLanding(localeCode: string): Promise<LandingPage> {
  const blocks = await resolveBlocks({
    surface: "landing",
    scope: null,
    localeCode,
  });

  let claim: LandingClaim | null = null;
  let invitation: LandingInvitation | null = null;
  const testimonials: LandingQuote[] = [];
  const comparisons: LandingComparison[] = [];

  for (const block of blocks) {
    if (block.kind === "testimonial") {
      for (const item of block.items) {
        // A quote with no words is not a quote. Skipping it keeps the rail from
        // rendering an attribution attached to nothing.
        if (!item.body) continue;
        testimonials.push({
          key: item.key,
          attribution: item.title,
          quote: item.body,
        });
      }
      continue;
    }

    if (block.kind === "gallery" && block.key.includes("before-after")) {
      for (const item of block.items) {
        comparisons.push({
          key: item.key,
          caption: item.title,
          before: item.media,
          after: null,
        });
      }
      continue;
    }

    if (block.key === "landing.claim") {
      claim = {
        heading: block.heading,
        body: block.body,
        credentials: block.items.map((item) => ({
          key: item.key,
          label: item.title,
        })),
      };
      continue;
    }

    if (block.key === "landing.invitation") {
      invitation = {
        heading: block.heading,
        body: block.body,
        cta: block.cta,
      };
    }
  }

  return { claim, testimonials, comparisons, invitation };
}
