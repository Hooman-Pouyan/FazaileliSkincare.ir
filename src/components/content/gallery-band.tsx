import Image from "next/image";
import { Carousel } from "@/components/layout/carousel";
import { Reveal } from "@/components/layout/reveal";

export type GalleryEntry = Readonly<{
  key: string;
  title: string;
  body: string | null;
  media: Readonly<{ url: string; alt: string | null }> | null;
}>;

/**
 * A row of images with a line of text under each.
 *
 * `F-5` deferred a gallery on the listing for a good reason — decoration does
 * not help someone choose — so this one earns its place by being about the
 * products on the page rather than about mood. Every entry names something a
 * customer can then filter for.
 *
 * Swiper, because `M-3` makes it the only carousel. No autoplay: the module is
 * not even imported by the wrapper, so it cannot be switched on from here.
 * Before hydration the slides are a scrollable row of real elements, so the
 * captions are in the server-rendered HTML either way.
 *
 * An entry with no image still renders its caption. A gallery that silently
 * drops a row because a file is missing is how a page quietly gets shorter.
 */
export function GalleryBand({
  heading,
  entries,
  label,
  previousLabel,
  nextLabel,
}: {
  readonly heading: string | null;
  readonly entries: readonly GalleryEntry[];
  readonly label: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
}) {
  if (entries.length === 0) return null;

  return (
    <Reveal as="section" className="flex flex-col gap-8">
      {heading && <h2 className="text-h2 font-bold">{heading}</h2>}

      <Carousel
        label={label}
        previousLabel={previousLabel}
        nextLabel={nextLabel}
        slidesPerView={{ base: 1.4, sm: 2.4, lg: 4 }}
        items={entries.map((entry) => (
          <figure key={entry.key} className="flex flex-col gap-4">
            {entry.media && (
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-surface bg-mist">
                <Image
                  src={entry.media.url}
                  alt={entry.media.alt ?? entry.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, 60vw"
                  className="object-contain"
                />
              </div>
            )}
            <figcaption className="flex flex-col gap-1">
              <span className="text-small font-medium text-ink">
                {entry.title}
              </span>
              {entry.body && (
                <span className="text-small text-stone-text">{entry.body}</span>
              )}
            </figcaption>
          </figure>
        ))}
      />
    </Reveal>
  );
}
