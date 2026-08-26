import { Carousel } from "@/components/layout/carousel";
import { Reveal } from "@/components/layout/reveal";
import type { LandingQuote } from "../models/page-models";

/**
 * Beat 4's proof rail — `LAND-08`.
 *
 * **Swiper, not a hand-rolled scroll-snap rail.** `LAND-08` describes CSS
 * scroll-snap with arrows, which is what it would have been before `M-3` made
 * Swiper the storefront's one carousel. Building a second rail mechanism here
 * would be the drift `AGENTS.md` forbids, and the wrapper already refuses
 * autoplay by not importing the module — so `L-3`'s refusal of looping rails
 * holds without this component having to remember it.
 *
 * **At zero quotes the entire beat is absent** — no frame, no heading, no
 * "coming soon". That is the state it ships in, so it is the state the tests
 * assert first.
 *
 * Every quote it renders today is invented and says so in its own attribution.
 * A real testimonial is not editorial copy and does not live in the content
 * spine; see the packet 6 review log.
 */
export function TestimonialRail({
  heading,
  quotes,
  label,
  previousLabel,
  nextLabel,
}: {
  readonly heading: string;
  readonly quotes: readonly LandingQuote[];
  readonly label: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
}) {
  if (quotes.length === 0) return null;

  return (
    <Reveal as="section" className="flex flex-col gap-10">
      <h2 className="text-h2 font-bold">{heading}</h2>

      <Carousel
        label={label}
        previousLabel={previousLabel}
        nextLabel={nextLabel}
        slidesPerView={{ base: 1.1, sm: 1.8, lg: 2.6 }}
        items={quotes.map((entry) => (
          <figure
            key={entry.key}
            className="flex h-full flex-col gap-5 border-s-2 border-gold ps-6"
          >
            <blockquote className="text-lede leading-fa font-light text-ink">
              {entry.quote}
            </blockquote>
            <figcaption className="text-small text-stone-text">
              {entry.attribution}
            </figcaption>
          </figure>
        ))}
      />
    </Reveal>
  );
}
