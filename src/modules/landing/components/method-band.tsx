import Image from "next/image";
import { ScrollScene } from "@/components/layout/scroll-scene";
import type { LandingBand } from "../models/page-models";

/**
 * Beat 1b — three moments of the work itself, as an editorial grid.
 *
 * **The component owns the photography and the spine owns the words.** These
 * images are art direction, versioned with the code the way the brand glyph is,
 * not content someone edits — so they are static paths rather than object keys.
 * `mediaUrl` and `C-7` govern *catalogue* media, whose address changes when the
 * CDN does; this set ships in `public/` and moves when the design moves.
 *
 * Every image is cleared for commercial use — `public/images/README.md` records
 * the licence for each — and each was chosen because it shows the *idea* of the
 * step rather than a stock gesture: a raked garden for preparation, a tea
 * ritual for care, cream on silk for the material.
 *
 * `ScrollScene` rather than `Reveal`: the three moments resolve as the reader
 * descends through them, which is the whole point of a beat that describes a
 * sequence.
 */

const IMAGES: Record<string, { readonly src: string; readonly alt: string }> = {
  prepare: {
    src: "/images/editorial/s02-ryoanji-raked-garden.webp",
    alt: "",
  },
  treat: {
    src: "/images/editorial/p04-cream-on-silk.webp",
    alt: "",
  },
  aftercare: {
    src: "/images/editorial/s03-nara-tea-ritual.webp",
    alt: "",
  },
};

export function MethodBand({ band }: { readonly band: LandingBand }) {
  if (band.entries.length === 0) return null;

  return (
    <section className="flex flex-col gap-12">
      {band.heading && (
        <h2 className="text-h2 font-bold text-balance">{band.heading}</h2>
      )}

      <ScrollScene as="ul" className="grid gap-10 md:grid-cols-3" span={0.6}>
        {band.entries.map((entry, index) => {
          const image = IMAGES[entry.key];
          return (
            <li key={entry.key} className="flex flex-col gap-5">
              {image && (
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-mist">
                  <Image
                    src={image.src}
                    // Decorative: the step is named in the heading beside it,
                    // so a description here would be read twice.
                    alt={image.alt}
                    fill
                    sizes="(min-width: 768px) 30vw, 90vw"
                    className="object-cover transition-transform duration-[var(--duration)] ease-[var(--easing)] hover:scale-[1.03]"
                  />
                </div>
              )}
              <div className="flex flex-col gap-3">
                <span className="text-small font-medium text-gold-text">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-h3 font-bold">{entry.title}</h3>
                {entry.body && (
                  <p className="max-w-[28em] text-body leading-fa text-stone-text">
                    {entry.body}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ScrollScene>
    </section>
  );
}
