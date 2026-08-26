import Image from "next/image";
import { useTranslations } from "next-intl";
import { Divider } from "@/components/brand/divider";
import { GrowthSpine } from "@/components/brand/growth-spine";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/layout/reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ComparisonPair } from "../components/comparison-pair";
import { TestimonialRail } from "../components/testimonial-rail";
import type { LandingPage } from "../models/page-models";

/**
 * The Landing — five beats in the order `L-2` fixed, and no sixth.
 *
 * The order is `04-information-architecture.md` §0 verbatim and has already
 * been through review once; re-deriving it per screen is how a page becomes a
 * scroll of unrelated modules.
 *
 * **Beats 2, 4 and 5 come from the database and may be absent** — `LAND-10`.
 * Absent is total: the section, its heading, its ornament and its vertical
 * rhythm all go, and the beats around it close the gap with no visible seam.
 * Beats 1 and 3 always render, because the portrait and the three doors are the
 * page's skeleton and its primary navigation.
 *
 * **The spine is the through-line, not per-section decoration** — `LAND-05`.
 * Each stage sits beside a claim that is independently true, and every instance
 * is `aria-hidden` and absolutely positioned, so deleting all of them leaves the
 * page reading correctly. A test asserts that rather than trusting it.
 */

const DOORS = [
  { key: "shop", href: "/shop", accent: "bg-teal" },
  { key: "book", href: "/booking", accent: "bg-firouzeh" },
  { key: "academy", href: "/academy", accent: "bg-gold" },
] as const;

export function LandingScreen({ page }: { readonly page: LandingPage }) {
  const t = useTranslations("landing");
  const nav = useTranslations("nav");
  const brand = useTranslations("brand");

  return (
    <main>
      {/* ── Beat 1 · the portrait, held ─────────────────────────────────── */}
      <section className="relative flex min-h-[86svh] items-stretch">
        <GrowthSpine stage="bare" />
        <div className="flex flex-1 flex-col justify-center gap-7 px-8 md:px-20">
          <Reveal className="flex flex-col gap-7">
            <p className="text-small font-medium tracking-[0.16em] text-gold-text">
              {brand("eyebrow")}
            </p>
            <h1 className="max-w-[14ch] text-display-2 font-black leading-[1.24] text-balance">
              {t("headline")}
            </h1>
            <p className="max-w-[34ch] text-lede leading-fa font-light text-stone-text">
              {t("lede")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <Link href="/booking">{t("primaryCta")}</Link>
              </Button>
              <Link
                href="/shop"
                className="border-b border-gold pb-1 text-small font-medium"
              >
                {t("secondaryCta")}
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="relative hidden w-[46%] overflow-hidden border-s border-[var(--hairline)] bg-sand lg:block">
          <Image
            src="/images/mahdieh-fazaieli-hero.png"
            alt={t("portraitAlt")}
            fill
            priority
            sizes="46vw"
            className="object-cover object-[92%_center]"
          />
        </div>
      </section>

      {/* ── Beat 2 · the claim ──────────────────────────────────────────── */}
      {page.claim && (
        <section className="relative bg-ink py-24 text-sand">
          <GrowthSpine stage="bud" tone="dark" />
          <Container>
            <Reveal className="flex flex-col gap-8">
              {page.claim.heading && (
                <p className="text-small font-medium tracking-[0.16em] text-gold-light">
                  {page.claim.heading}
                </p>
              )}
              {page.claim.body && (
                <p className="max-w-[34em] text-h3 leading-fa font-light">
                  {page.claim.body}
                </p>
              )}
              {/*
                Editorial type, not a counter row — `L-2`. Two credentials and
                only two: the years of practice and students trained that beat 2
                also wants are claims about her business that no document here
                states, and they are not invented to fill a row.
              */}
              {page.claim.credentials.length > 0 && (
                <ul className="flex flex-col gap-4 pt-4">
                  {page.claim.credentials.map((credential) => (
                    <li
                      key={credential.key}
                      className="max-w-[40em] border-t border-[color-mix(in_oklab,var(--champagne)_40%,transparent)] pt-4 text-lede font-light"
                    >
                      {credential.label}
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          </Container>
        </section>
      )}

      {/* ── Beat 3 · three doors ────────────────────────────────────────── */}
      <section className="relative border-t border-[var(--hairline)]">
        <GrowthSpine stage="fork" />
        <h2 className="sr-only">{t("doorsHeading")}</h2>
        <Reveal as="ul" stagger step={60} className="grid md:grid-cols-3">
          {DOORS.map((door) => (
            <li key={door.key} className="contents">
              <Link
                href={door.href}
                className="group flex flex-col border-b border-[var(--hairline-soft)] md:border-b-0 md:[&:not(:last-child)]:border-e md:[&:not(:last-child)]:border-[var(--hairline-soft)]"
              >
                <div
                  className="flex h-64 items-center justify-center bg-mist"
                  aria-hidden
                />
                <div className="flex flex-col gap-3 px-9 pt-7 pb-11">
                  <span className={`h-px w-8 ${door.accent}`} aria-hidden />
                  <h3 className="text-h3 font-bold">{nav(door.key)}</h3>
                  <p className="max-w-[22em] text-body leading-fa text-stone-text">
                    {t(`doors.${door.key}`)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </Reveal>
      </section>

      {/* ── Beat 4 · proof ──────────────────────────────────────────────── */}
      {(page.testimonials.length > 0 || page.comparisons.length > 0) && (
        <section className="relative">
          <GrowthSpine stage="blossom" />
          <Container className="flex flex-col gap-20 py-24">
            <Divider />
            <TestimonialRail
              heading={t("testimonials.label")}
              quotes={page.testimonials}
              label={t("testimonials.label")}
              previousLabel={t("testimonials.previous")}
              nextLabel={t("testimonials.next")}
            />
            <ComparisonPair
              heading={t("comparison.heading")}
              comparisons={page.comparisons}
              beforeLabel={t("comparison.before")}
              afterLabel={t("comparison.after")}
            />
          </Container>
        </section>
      )}

      {/* ── Beat 5 · one closing invitation ─────────────────────────────── */}
      {page.invitation && (
        <section className="relative bg-teal py-24 text-sand">
          <GrowthSpine stage="petal" tone="dark" />
          <Container>
            <Reveal className="flex max-w-[34em] flex-col gap-6">
              {page.invitation.heading && (
                <h2 className="text-h2 font-bold">{page.invitation.heading}</h2>
              )}
              {page.invitation.body && (
                <p className="text-lede leading-fa font-light">
                  {page.invitation.body}
                </p>
              )}
              {/* One action, not a row of them — `L-2` beat 5. */}
              {page.invitation.cta && (
                <Button size="lg" asChild className="mt-2 self-start">
                  <Link href={page.invitation.cta.href}>
                    {page.invitation.cta.label}
                  </Link>
                </Button>
              )}
            </Reveal>
          </Container>
        </section>
      )}
    </main>
  );
}
