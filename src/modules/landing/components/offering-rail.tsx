import { Carousel } from "@/components/layout/carousel";
import { Reveal } from "@/components/layout/reveal";
import { Link } from "@/i18n/navigation";
import type { LandingBand } from "../models/page-models";

/**
 * Beat 3b — what she teaches, as a rail rather than a paragraph.
 *
 * Ten real offerings, transcribed from her own posts. **No prices and no
 * dates**: `L-4` holds both as unconfirmed, and a course list that invents a
 * price is worse than one that does not mention money. The rail says what
 * exists; the Academy room says the rest when it has the rest to say.
 *
 * Swiper, because `M-3` makes it the storefront's one carousel — and because a
 * horizontal rail is the honest shape for ten peers with no ranking between
 * them. A vertical list would imply an order the content does not have.
 */
export function OfferingRail({
  band,
  label,
  previousLabel,
  nextLabel,
}: {
  readonly band: LandingBand;
  readonly label: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
}) {
  if (band.entries.length === 0) return null;

  return (
    <Reveal as="section" className="flex flex-col gap-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        {band.heading && <h2 className="text-h2 font-bold">{band.heading}</h2>}
        {band.cta && (
          <Link
            href={band.cta.href}
            className="border-b border-gold pb-1 text-small font-medium transition-colors duration-[var(--duration)] ease-[var(--easing)] hover:text-gold-text"
          >
            {band.cta.label}
          </Link>
        )}
      </div>

      <Carousel
        label={label}
        previousLabel={previousLabel}
        nextLabel={nextLabel}
        slidesPerView={{ base: 1.3, sm: 2.2, lg: 3.4 }}
        items={band.entries.map((entry) => (
          <article
            key={entry.key}
            className="group flex h-full flex-col gap-3 border-t border-[var(--hairline)] pt-5 transition-colors duration-[var(--duration)] ease-[var(--easing)] hover:border-gold"
          >
            <h3 className="text-lede font-medium">{entry.title}</h3>
            {entry.body && (
              <p className="text-small text-stone-text">{entry.body}</p>
            )}
          </article>
        ))}
      />
    </Reveal>
  );
}
