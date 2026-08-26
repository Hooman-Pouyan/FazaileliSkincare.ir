"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { MediaView } from "../models/page-models";

/**
 * The 60 of the product page's 60/40 — `PDP-03`.
 *
 * A client leaf, and only a leaf: the server chose the order and the primary
 * image, and this picks which of them is showing. `PDP-03` is explicit that
 * *"primary media is server selected from explicit order; the browser does not
 * infer it"* — so with JavaScript off the first image still renders, because
 * that is what the server sent.
 *
 * **`object-contain`, not `cover`, and that is a deliberate departure from the
 * design system's own `ProductGallery`.** Its preview images are square; the
 * real Storyderm packshots are 1916 × 3547. `cover` into a 4:5 box crops about
 * a third off a bottle, which is `R-4` — already recorded from the listing tile,
 * where the maintainer saw it and said the packshot should sit smaller and
 * centred. Repeating a defect on a new surface because a component file says so
 * is not adherence. The neutral field and the gold hairline on the active
 * thumbnail, which are what the design system is actually asserting, are kept.
 *
 * No hover zoom and no autoplay — `PDP-03` refuses both.
 */
export function ProductGallery({
  media,
  className,
}: {
  readonly media: readonly MediaView[];
  readonly className?: string;
}) {
  const t = useTranslations("pdp");
  const [active, setActive] = useState(0);
  const current = media[active] ?? media[0] ?? null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative aspect-[4/5] mx-auto max-w-[var(--media-hero-max-w)] w-full overflow-hidden bg-sand">
        {current ? (
          <Image
            src={current.src}
            alt={current.alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-contain p-6"
          />
        ) : (
          <span className="grid size-full place-items-center text-micro tracking-[0.14em] text-stone-text">
            {t("gallery.imagePending")}
          </span>
        )}
      </div>

      {media.length > 1 && (
        <ul
          aria-label={t("gallery.label")}
          className="m-0 flex list-none gap-2 p-0"
        >
          {media.map((entry, index) => (
            <li key={entry.src}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-current={index === active}
                aria-label={t("gallery.thumbnail", { index: index + 1 })}
                className={cn(
                  "block size-16 overflow-hidden border bg-sand p-1 transition-colors",
                  "duration-[var(--duration)] ease-[var(--easing)]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--firouzeh-text)]",
                  index === active
                    ? "border-[color:var(--gold)]"
                    : "border-transparent",
                )}
              >
                <Image
                  src={entry.src}
                  alt=""
                  width={64}
                  height={64}
                  className="size-full object-contain"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
