"use client";

import { useEffect, useRef } from "react";
import { revealSequence } from "@/lib/motion/choreography";
import { cn } from "@/lib/utils";

/**
 * A block, or a group of blocks, entering once when it reaches the viewport.
 *
 * The choreography lives in `@/lib/motion/choreography`; this component owns
 * only *when* it runs. `stagger` means a group can enter in sequence without
 * every caller inventing its own delays — which is the reason anime.js is here
 * and CSS is not.
 *
 * **It cannot hide content.** The hidden state is set by the animation, in the
 * browser, one frame before it animates out of it. The server-rendered HTML —
 * what a crawler and a reader with JavaScript disabled receive — is the
 * finished page. A reveal built the other way round is the standard way a
 * scroll animation quietly costs a site its indexed content.
 *
 * `prefers-reduced-motion` skips the whole thing rather than shortening it.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
  /** Animate the direct children in sequence rather than the block as a whole. */
  stagger: staggerChildren = false,
  step,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly as?: "div" | "section" | "li" | "article" | "ul";
  readonly stagger?: boolean;
  readonly step?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Already on screen at mount: leave it alone. Hiding the first fold in
    // order to animate it in is a flash on every page load.
    if (node.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    let cleanup = () => {};
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const targets = staggerChildren
          ? Array.from(node.children)
          : [node as Element];
        cleanup = revealSequence(targets, step ? { step } : {});
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cleanup();
    };
  }, [staggerChildren, step]);

  const Element = Tag as "div";
  return (
    <Element ref={ref} className={cn(className)}>
      {children}
    </Element>
  );
}
