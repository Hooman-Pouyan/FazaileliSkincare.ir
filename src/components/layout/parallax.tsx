"use client";

import { useEffect, useRef } from "react";
import { parallaxLayer } from "@/lib/motion/choreography";
import { cn } from "@/lib/utils";

/**
 * A decorative layer behind a section, drifting against the scroll — `E-1`.
 *
 * **It carries nothing.** `aria-hidden`, `pointer-events-none`, and absolutely
 * positioned inside a section that has already reserved its own height. If the
 * effect never runs — reduced motion, JavaScript off, an old browser — the
 * layer sits at rest and the section is unchanged. Depth is not allowed to say
 * anything, which is what makes it safe to lose.
 *
 * The layer is oversized (`-inset-y-[12%]`) so the drift never exposes an edge.
 * That space is reserved by the element, not created during the animation,
 * which is how the effect keeps `CLS` at zero.
 */
export function Parallax({
  children,
  depth,
  className,
}: {
  readonly children: React.ReactNode;
  readonly depth?: number;
  readonly className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    return parallaxLayer(node, depth === undefined ? {} : { depth });
  }, [depth]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none absolute -inset-y-[12%] inset-x-0 select-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
