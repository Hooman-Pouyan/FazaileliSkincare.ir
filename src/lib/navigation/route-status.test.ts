import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * No `loading.tsx` above a route that can answer `notFound()`.
 *
 * A `loading.tsx` wraps its segment in a Suspense boundary, so Next streams:
 * the shell and the fallback are flushed first, and the real markup arrives
 * later in the same response. The status line goes out with that first flush —
 * which means by the time the page calls `notFound()`, `200` has already been
 * sent, and the reader gets a not-found page under a success status.
 *
 * Measured on 2026-08-26, with the file present and then moved aside:
 *
 *   /shop/p/does-not-exist   200 -> 404
 *   /shop/concern/nope       200 -> 404
 *   /shop/c/nonsense         200 -> 404
 *   /shop/brand/nope         200 -> 404
 *   /shop/p/ultra-a-z-cream  200 -> 200   (unchanged, as it should be)
 *
 * Every one of those is a soft-404: an error page served as a success. Search
 * Console reports them as errors, and crawl budget is spent on URLs that do not
 * exist — on a site whose entire competitive argument is crawlable Persian
 * listings. Facet URLs are enumerable, so a crawler can generate these by
 * walking combinations.
 *
 * This is a gate rather than a note because nothing else can see it. The status
 * code is invisible to typecheck, to ESLint, and to every render test in this
 * suite, and `loading.tsx` is a file the framework documentation actively
 * encourages adding. It came back once already as review item `7.12` without
 * anyone connecting it to the boundary.
 *
 * **If a listing genuinely needs a loading state**, the answer is a Suspense
 * boundary *inside* the page, below the point where the outcome is decided —
 * not a segment-level `loading.tsx` above it. Recorded as the second half of
 * `R-9` in `docs/27-storefront-refinement-backlog.md`.
 */

const SEGMENTS_THAT_MAY_404 = [
  "src/app/[locale]/(storefront)",
  "src/app/[locale]",
];

describe("not-found keeps its status code", () => {
  const projectRoot = resolve(__dirname, "../../..");

  it.each(SEGMENTS_THAT_MAY_404)(
    "%s has no segment-level loading.tsx",
    (segment) => {
      // Given: a route segment whose pages can resolve to `notFound()`
      const candidate = resolve(projectRoot, segment, "loading.tsx");

      // When: the segment is inspected
      // Then: no Suspense boundary flushes a 200 before the outcome is known
      expect(
        existsSync(candidate),
        `${segment}/loading.tsx streams the shell before the page resolves, so ` +
          `every notFound() below it is served as 200. Put the boundary inside ` +
          `the page instead, below the point the outcome is decided.`,
      ).toBe(false);
    },
  );
});
