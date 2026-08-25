import Image from "next/image";
import { useTranslations } from "next-intl";
import { SlashMark } from "@/components/brand/blossom";
import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * The Shop's opening band: an asymmetric editorial split, full height on
 * desktop, with the headline as real text in the document.
 *
 * **A note on video, because it was asked for.** This component accepts a
 * `video` source and renders it *behind* the still, never instead of it. The
 * poster is a real `next/image` that loads first and stays if the video never
 * does; the video element is `muted`, `loop`, `playsInline`, `preload="none"`
 * and hidden below `md`, so a phone on an Iranian mobile network downloads a
 * photograph and nothing else. Nothing in the copy or the links depends on it.
 *
 * That ordering is the whole trick: a video background costs SEO and LCP when
 * the text sits inside it or the poster is a frame the browser has to decode
 * the video to get. Here the text is beside it and the poster is an image.
 *
 * `prefers-reduced-motion` stops it playing — the attribute is set from CSS
 * rather than script so it holds before hydration.
 */
export function HubHero({
  video,
}: {
  /** A short, silent loop of the institute. Absent until one exists. */
  readonly video?: { readonly src: string; readonly type: string };
}) {
  const t = useTranslations("shop");

  return (
    <section className="relative flex min-h-[86svh] items-stretch overflow-hidden border-b border-[var(--hairline-soft)]">
      <Container className="flex flex-1 items-center py-24">
        <div className="grid w-full items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <div className="flex flex-col gap-7">
            <p className="flex items-center gap-3 text-micro uppercase tracking-[0.18em] text-gold-text">
              <SlashMark className="h-4" />
              {t("eyebrow")}
            </p>

            <h1 className="max-w-[15ch] text-display-2 font-black leading-[1.22] text-balance">
              {t("title")}
            </h1>

            <p className="max-w-[38ch] text-lede leading-fa font-light text-stone-text">
              {t("lede")}
            </p>

            <div className="flex flex-wrap items-center gap-5 pt-2">
              <Button asChild size="lg">
                <Link href="#concerns">{t("heroPrimary")}</Link>
              </Button>
              <a
                href={t("enquiryHref")}
                className="border-b border-firouzeh-text pb-1 text-small font-medium text-firouzeh-text"
              >
                {t("heroSecondary")}
              </a>
            </div>
          </div>

          <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand lg:aspect-auto lg:h-[64svh]">
            <Image
              src="/images/mahdieh-fazaieli-hero.png"
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover"
            />
            {video && (
              <video
                aria-hidden
                muted
                loop
                playsInline
                preload="none"
                autoPlay
                className="absolute inset-0 hidden size-full object-cover motion-reduce:hidden md:block"
              >
                <source src={video.src} type={video.type} />
              </video>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
