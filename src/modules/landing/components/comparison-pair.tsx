import Image from "next/image";
import { Reveal } from "@/components/layout/reveal";
import type { LandingComparison } from "../models/page-models";

/**
 * Beat 4's before-and-after — `LAND-09`.
 *
 * A labelled pair, side by side, with no wipe and no autoplay. A slider that
 * animates itself across a treatment result is a claim being made by the
 * animation rather than by anyone accountable for it.
 *
 * **It renders nothing today, and that is deliberate.** `LAND-09` asked for it
 * to ship with placeholder imagery; it ships as structure with no content
 * seeded behind it instead. Two reasons, and both outrank proving a layout:
 * consent is per-person and none exists (`AGENTS.md` hard rule 9 — before/after
 * is default-deny), and Iranian advertising rules cover implied medical
 * results. Placeholder before-and-after imagery on a skincare site is the one
 * placeholder that is not harmless if it ever leaks.
 *
 * The component is here, tested against fixtures, so the day consent exists the
 * work is content rather than code.
 */
export function ComparisonPair({
  heading,
  comparisons,
  beforeLabel,
  afterLabel,
}: {
  readonly heading: string;
  readonly comparisons: readonly LandingComparison[];
  readonly beforeLabel: string;
  readonly afterLabel: string;
}) {
  if (comparisons.length === 0) return null;

  return (
    <Reveal as="section" className="flex flex-col gap-10">
      <h2 className="text-h2 font-bold">{heading}</h2>

      <ul className="flex flex-col gap-12">
        {comparisons.map((entry) => (
          <li key={entry.key} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  [beforeLabel, entry.before],
                  [afterLabel, entry.after],
                ] as const
              ).map(([label, media]) => (
                <figure key={label} className="flex flex-col gap-2">
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-mist">
                    {media && (
                      <Image
                        src={media.url}
                        alt={media.alt ?? label}
                        fill
                        sizes="(min-width: 1024px) 30vw, 45vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <figcaption className="text-small text-stone-text">
                    {label}
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="text-small text-stone-text">{entry.caption}</p>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
