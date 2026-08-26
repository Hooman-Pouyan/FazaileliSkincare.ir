import Image from "next/image";
import { useTranslations } from "next-intl";
import { BlossomOrnament } from "@/components/brand/blossom";
import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * The Shop's opening band — a **shop** hero, not the Landing's.
 *
 * The distinction is the subject. The Landing's hero is Mahdieh Fazaieli: a
 * portrait, a claim, three doors. This one's subject is the shelf. Products are
 * the largest object on screen, both actions are commercial, and the strip
 * beneath answers the three things a customer weighs before buying from an
 * Iranian skincare site — is it genuine, will it reach me, can I ask first.
 *
 * **On the field.** The product photograph is a cut-out, so it needs a ground of
 * our own rather than the grey box it was shot against. It sits on `--ink` with
 * a gold hairline running under it, which reads as the shelf the products were
 * photographed on and is the same hairline-and-lapis language as the rest of the
 * site. That field is also the only one where gold, champagne and the blossom
 * pass contrast, so the ornament can finally appear at full strength.
 */
export function HubHero({
  video,
}: {
  /** A short silent loop of the institute. Absent until one exists — see M-5. */
  readonly video?: { readonly src: string; readonly type: string };
}) {
  const t = useTranslations("shop");

  const facts = ["official", "shipping", "advice"] as const;

  return (
    <section className="relative overflow-hidden bg-ink text-sand">
      <BlossomOrnament className="pointer-events-none absolute -top-10 bottom-0 hidden w-48 opacity-40 lg:block lg:start-[46%]" />

      <Container className="relative">
        <div className="grid items-center gap-10 pt-20 pb-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:pt-28">
          <div className="flex flex-col gap-7">
            <p className="text-micro uppercase tracking-[0.2em] text-gold-light">
              {t("eyebrow")}
            </p>

            <h1 className="max-w-[16ch] text-display-2 font-black leading-[1.2] text-balance">
              {t("title")}
            </h1>

            <p className="max-w-[38ch] text-lede leading-fa font-light text-champagne">
              {t("lede")}
            </p>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              <Button asChild size="lg">
                <Link href="#concerns">{t("heroPrimary")}</Link>
              </Button>
              <a
                href={t("enquiryHref")}
                className="border-b border-gold pb-1 text-small font-medium text-champagne"
              >
                {t("heroSecondary")}
              </a>
            </div>
          </div>

          <div className="relative">
            {/* The shelf. A hairline, not a shadow — the products were shot on
                stone and this is the same gesture in our own language. */}
            <span
              aria-hidden
              className="absolute bottom-0 inset-x-0 h-px bg-gold opacity-60"
            />
            <div className="relative aspect-[5/4] w-full">
              <Image
                src="/images/heroes/forlled-stone-products-transparent.png"
                alt={t("heroImageAlt")}
                fill
                priority
                sizes="(max-width: 1024px) 92vw, 46vw"
                className="object-contain object-bottom"
              />
              {video && (
                <video
                  aria-hidden
                  muted
                  loop
                  playsInline
                  preload="none"
                  autoPlay
                  className="absolute inset-0 -z-10 hidden size-full object-cover opacity-40 motion-reduce:hidden md:block"
                >
                  <source src={video.src} type={video.type} />
                </video>
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* The three objections, answered before the fold. */}
      <div className="border-t border-[color-mix(in_oklab,var(--gold)_40%,transparent)]">
        <Container>
          <ul className="grid divide-y divide-[color-mix(in_oklab,var(--gold)_28%,transparent)] md:grid-cols-3 md:divide-x md:divide-y-0">
            {facts.map((fact) => (
              <li
                key={fact}
                className="flex flex-col gap-1.5 py-7 md:px-8 md:first:ps-0 md:last:pe-0"
              >
                <span className="text-small font-medium text-gold-light">
                  {t(`heroFacts.${fact}.title`)}
                </span>
                <span className="text-small font-light leading-fa text-champagne">
                  {t(`heroFacts.${fact}.body`)}
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </section>
  );
}
