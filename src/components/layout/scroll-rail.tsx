"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { dirFor } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * A horizontally scrollable rail: native CSS scroll-snap, with pointer dragging
 * and arrow controls layered on top.
 *
 * **Why no carousel library.** The content is a real list in the document, in
 * order, before any script runs — so it is crawlable, readable with JavaScript
 * disabled, and already has momentum scrolling, touch, trackpad and keyboard
 * behaviour from the platform. A carousel library's contribution here would be
 * the arrows and the scroll position, which is the small part. Shipping a
 * dependency to re-implement scrolling would cost bundle size on a mobile-first
 * Iranian audience and put the list behind hydration for no gain.
 *
 * **Why not autoplay.** `10-design-playbook.md` Step 5 forbids it, and decision
 * L-3 keeps that: the reader sets the pace. Dragging, swiping, arrows and
 * keyboard all work; nothing moves on its own.
 *
 * **RTL.** Scrolling is done with `scrollBy`, whose sign follows the writing
 * direction, so the arrows are labelled by intent — previous and next — and the
 * icons are chosen from the resolved direction rather than hardcoded.
 */
export function ScrollRail({
  children,
  label,
  previousLabel,
  nextLabel,
  itemClassName,
  className,
}: {
  readonly children: React.ReactNode;
  readonly label: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
  /** Applied to the track; sizes the children through `[&>*]` utilities. */
  readonly itemClassName?: string;
  readonly className?: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const locale = useLocale();
  const isRtl = dirFor(locale) === "rtl";

  const readEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    // `scrollLeft` is negative or right-anchored in RTL depending on the
    // engine; the absolute distance travelled is the same in both.
    const travelled = Math.abs(track.scrollLeft);
    const range = track.scrollWidth - track.clientWidth;
    setAtStart(travelled < 8);
    setAtEnd(range - travelled < 8);
  }, []);

  useEffect(() => {
    readEdges();
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(readEdges);
    observer.observe(track);
    return () => observer.disconnect();
  }, [readEdges]);

  function page(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const step = track.clientWidth * 0.8;
    track.scrollBy({
      left: (isRtl ? -1 : 1) * direction * step,
      behavior: "smooth",
    });
  }

  // Pointer dragging, for a mouse. Touch and trackpad already scroll natively,
  // so this only binds for a device that has no other way to drag.
  const drag = useRef<{ id: number; x: number; from: number } | null>(null);

  function onPointerDown(event: React.PointerEvent<HTMLUListElement>) {
    if (event.pointerType !== "mouse") return;
    const track = trackRef.current;
    if (!track) return;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      from: track.scrollLeft,
    };
    track.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLUListElement>) {
    const state = drag.current;
    const track = trackRef.current;
    if (!state || !track || state.id !== event.pointerId) return;
    track.scrollLeft = state.from - (event.clientX - state.x);
  }

  function endDrag(event: React.PointerEvent<HTMLUListElement>) {
    const track = trackRef.current;
    if (!drag.current || !track) return;
    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
  }

  return (
    <div className={cn("relative", className)}>
      <ul
        ref={trackRef}
        aria-label={label}
        onScroll={readEdges}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          "flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain pb-2",
          // The scrollbar is hidden because the arrows and the partially
          // visible next item already say the rail scrolls. Keyboard focus
          // still scrolls it, and the element stays a real scroll container.
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "[&>li]:shrink-0 [&>li]:snap-start",
          itemClassName,
        )}
      >
        {children}
      </ul>

      {/* Controls are additive: with no JavaScript the rail still scrolls. */}
      <div className="mt-6 flex gap-2">
        <RailButton
          label={previousLabel}
          disabled={atStart}
          onClick={() => page(-1)}
          icon={isRtl ? "end" : "start"}
        />
        <RailButton
          label={nextLabel}
          disabled={atEnd}
          onClick={() => page(1)}
          icon={isRtl ? "start" : "end"}
        />
      </div>
    </div>
  );
}

function RailButton({
  label,
  disabled,
  onClick,
  icon,
}: {
  readonly label: string;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly icon: "start" | "end";
}) {
  const Icon = icon === "start" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-11 place-items-center rounded-control border border-[var(--hairline)]",
        "transition-colors duration-[var(--duration)] ease-[var(--easing)]",
        "hover:bg-surface disabled:opacity-30",
      )}
    >
      <Icon className="size-4" strokeWidth={1.5} aria-hidden />
    </button>
  );
}
