"use client";
import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** PDP imagery. 60/40 split at the page level; this owns the 60. */
export function ProductGallery({
  images,
  alt,
  className,
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const [active, setActive] = React.useState(0);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--sand)]">
        {images[active] ? (
          <Image
            src={images[active]!}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 640px"
            className="object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center text-[11px] tracking-[0.14em] text-[color-mix(in_oklab,var(--ink)_40%,transparent)]">
            تصویر محصول
          </span>
        )}
      </div>

      {images.length > 1 && (
        <ul className="flex gap-2">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`تصویر ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative aspect-square size-16 overflow-hidden border transition-colors",
                  i === active
                    ? "border-[var(--gold)]"
                    : "border-transparent hover:border-[var(--hairline)]",
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
