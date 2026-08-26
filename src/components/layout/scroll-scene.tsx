"use client";

import { useEffect, useRef } from "react";
import { scrubReveal } from "@/lib/motion/choreography";
import { cn } from "@/lib/utils";

/**
 * A section that resolves as the reader scrolls into it, rather than snapping
 * in once at a threshold — `E-5`.
 *
 * The difference from `Reveal` is who sets the pace. `Reveal` fires once and
 * runs on its own clock; this follows the scroll, so moving back up runs it
 * backwards and stopping halfway leaves it halfway. That is the reader in
 * control, which is the opposite of the scroll hijack `L-3` still refuses.
 *
 * Nothing is ever fully transparent — the floor is 25% opacity — so a reader
 * who lands mid-section with a stalled script still sees the content, and the
 * server-rendered HTML is the finished section either way.
 */
export function ScrollScene({
  children,
  className,
  as: Tag = "div",
  distance,
  span,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly as?: "div" | "section" | "ul";
  readonly distance?: number;
  readonly span?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    return scrubReveal(Array.from(node.children), {
      ...(distance === undefined ? {} : { distance }),
      ...(span === undefined ? {} : { span }),
    });
  }, [distance, span]);

  const Element = Tag as "div";
  return (
    <Element ref={ref} className={cn(className)}>
      {children}
    </Element>
  );
}
