import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Rail } from "@/components/rail";
import { Button } from "@/components/ui/button";

const DOORS = [
  { key: "shop", href: "/shop", accent: "var(--teal)" },
  { key: "book", href: "/book", accent: "var(--firouzeh)" },
  { key: "academy", href: "/academy", accent: "var(--gold)" },
] as const;

export default async function LandingPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const nav = await getTranslations("nav");
  const brand = await getTranslations("brand");

  return (
    <>
      <Rail />
      <main className="ms-14">
        {/* HERO — editorial scroll, asymmetric split, no card, no shadow */}
        <section className="flex min-h-screen items-stretch">
          <div className="flex flex-1 flex-col justify-center gap-7 px-8 md:px-20">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--gold-text)]">
              {brand("eyebrow")}
            </p>
            <h1 className="max-w-[14ch] text-[clamp(2.5rem,6vw,4.9rem)] font-black leading-[1.24] text-balance">
              {t("headline")}
            </h1>
            <p className="max-w-[34ch] text-lg leading-[1.95] font-light text-[color-mix(in_oklab,var(--ink)_78%,transparent)]">
              {t("lede")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <Button size="lg">{t("primaryCta")}</Button>
              <Link href="/shop" className="border-b border-[var(--gold)] pb-1 text-[15px]">
                {t("secondaryCta")}
              </Link>
            </div>
          </div>
          <div className="relative hidden w-[46%] overflow-hidden border-s border-[var(--hairline)] bg-[var(--sand)] lg:block">
            <Image
              src="/images/mahdieh-fazaieli-hero.png"
              alt={t("portraitPlaceholder")}
              fill
              priority
              unoptimized
              sizes="46vw"
              className="object-cover object-[92%_center]"
            />
          </div>
        </section>

        {/* THREE DOORS — tall panels, not boxes with icons */}
        <section className="grid border-t border-[var(--hairline)] md:grid-cols-3">
          {DOORS.map((door) => (
            <Link
              key={door.key}
              href={door.href}
              className="group flex flex-col border-b border-[var(--hairline-soft)] md:border-b-0 md:[&:not(:last-child)]:border-e md:[&:not(:last-child)]:border-[var(--hairline-soft)]"
            >
              <div className="flex h-64 items-center justify-center bg-[color-mix(in_oklab,var(--ink)_6%,var(--ground))]" aria-hidden />
              <div className="flex flex-col gap-3 px-9 pb-11 pt-7">
                <span className="h-px w-8" style={{ background: door.accent }} aria-hidden />
                <h2 className="text-[28px] font-bold">{nav(door.key)}</h2>
                <p className="max-w-[22em] text-[15px] leading-[1.9] text-[var(--stone-text)]">
                  {t(`doors.${door.key}`)}
                </p>
              </div>
            </Link>
          ))}
        </section>

        {/* LAPIS BAND — where gold and firouzeh finally become legible */}
        <section className="bg-[var(--ink)] px-8 py-24 text-[var(--sand)] md:px-20">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--gold-light)]">
            {brand("tagline")}
          </p>
          <p className="mt-8 max-w-[34em] text-xl leading-[2] font-light text-[color-mix(in_oklab,var(--sand)_90%,transparent)]">
            {t("quote")}
          </p>
        </section>
      </main>
    </>
  );
}
