"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Fade and an 8–16px rise, once, when a block enters the viewport.
 *
 * This is the whole motion vocabulary — `10-design-playbook.md` Step 5 and
 * decision L-3. One duration, one easing, both from the token layer; no
 * parallax, no loop, nothing that keeps running after the reveal.
 *
 * **It cannot hide content.** The element renders visible and the class that
 * hides it is only ever added by the effect, so a crawler, a reader with
 * JavaScript disabled, and the server-rendered HTML all get the finished page.
 * A reveal implemented the other way round — hidden by default, shown by
 * script — is the standard way a scroll animation quietly costs a site its
 * indexed content, and it is worth being explicit that this is not that.
 *
 * `prefers-reduced-motion` collapses `--duration` to 1ms in `tokens.css`, so the
 * transition completes instantly rather than being special-cased here.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  readonly children: React.ReactNode;
  /** Milliseconds. Used to stagger siblings; keep it under ~200ms. */
  readonly delay?: number;
  readonly className?: string;
  readonly as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"static" | "hidden" | "shown">("static");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Already on screen at mount: leave it alone rather than hiding it to
    // animate it in, which would flash the first fold on every load.
    const box = node.getBoundingClientRect();
    if (box.top < window.innerHeight * 0.9) {
      setState("shown");
      return;
    }

    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setState("shown");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // One element type at a time; `Tag` is a union of intrinsic tags that all
  // accept the same props, and casting the component rather than the ref keeps
  // the ref honestly typed.
  const Element = Tag as "div";

  return (
    <Element
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-[opacity,transform] duration-[var(--duration)] ease-[var(--easing)] motion-reduce:transition-none",
        state === "hidden" && "translate-y-3 opacity-0",
        className,
      )}
    >
      {children}
    </Element>
  );
}
