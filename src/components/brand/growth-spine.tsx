"use client";

import { useEffect, useRef } from "react";
import { drawStrokes } from "@/lib/motion/choreography";
import { cn } from "@/lib/utils";
import { BlossomOpen, BranchSegment, Bud, Petal } from "./ornament";

/**
 * The Landing's through-line — `LAND-05`.
 *
 * One branch, entering from the inline-start margin, that advances state as the
 * reader descends: bare, then budding, then dividing into three, then in
 * blossom, then a single petal at rest. It is the page's spine, not decoration
 * applied per section.
 *
 * **The rule that keeps it from becoming decoration.** Every stage sits beside
 * a claim that is independently true. It carries no text and asserts nothing on
 * its own — a row of concept cards with icons and adjectives is the failure mode
 * `LAND-05` exists to refuse, and an ornament that needs a caption is that
 * failure wearing a branch.
 *
 * **It is `aria-hidden` and absolutely positioned**, so it takes part in no
 * layout and no accessibility tree. Deleting every `<GrowthSpine>` from the page
 * must leave a page that still reads correctly; `landing.screen.test.tsx`
 * asserts exactly that by rendering the beats without it.
 *
 * **Motion.** `drawStrokes` over anime.js, which is where SVG stroke
 * choreography belongs under `M-4` — CSS owns state changes, anime owns
 * timelines. It is inert under `prefers-reduced-motion`, and because the server
 * renders the paths already drawn, a reader with JavaScript off gets the
 * finished branch rather than an empty column. Nothing here can hide content:
 * there is no content to hide.
 */

export type SpineStage = "bare" | "bud" | "fork" | "blossom" | "petal";

/**
 * Champagne and gold fail contrast on `--ground` (`tokens.css` line 6), so
 * `LAND-06` restricts the ornament to the lapis and teal bands. The reading
 * applied here: the *pieces* obey that restriction, and the connecting line
 * falls back to the hairline token on light ground, so the branch stays
 * continuous down the page instead of appearing and vanishing per section.
 */
const TONE = {
  light: "text-[var(--hairline)]",
  dark: "text-champagne",
} as const;

export function GrowthSpine({
  stage,
  tone = "light",
  className,
}: {
  readonly stage: SpineStage;
  readonly tone?: keyof typeof TONE;
  readonly className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let cleanup = () => {};
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const svg = node.querySelector("svg");
        if (svg) cleanup = drawStrokes(svg);
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cleanup();
    };
  }, [stage]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        // `start-8` and not `left-8`: the branch enters from the reading edge,
        // which is the right-hand side in Persian. `inset-y-0` and not
        // `inset-block-0` — Tailwind has no such utility, it compiles to
        // nothing, and it is the exact spelling that left the rail unpositioned
        // in packet 4. The compilation gate caught it here before it rendered.
        "pointer-events-none absolute inset-y-0 start-8 hidden select-none lg:block",
        TONE[tone],
        className,
      )}
    >
      <div className="flex flex-col items-center">
        <BranchSegment variant={stage === "fork" ? "fork" : "curve"} />
        {stage === "bud" && <Bud />}
        {stage === "blossom" && <BlossomOpen className="text-gold-light" />}
        {stage === "petal" && (
          <>
            <BlossomOpen />
            <Petal className="mt-6 opacity-70" />
          </>
        )}
        {stage !== "petal" && <BranchSegment />}
      </div>
    </div>
  );
}
