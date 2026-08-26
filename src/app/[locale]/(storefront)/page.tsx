import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLanding } from "@/modules/landing/landing.reads";
import { landingJsonLd } from "@/modules/landing/utils/structured-data";
import { LandingScreen } from "@/modules/landing/screens/landing.screen";
import { localeAlternates, localeUrl } from "@/lib/site";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";

/**
 * The Landing route stays thin, like every other route in this repository: it
 * awaits `params`, resolves the page model, and renders a screen. It parses
 * nothing, queries nothing and composes nothing.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });
  const brand = await getTranslations({ locale, namespace: "brand" });

  return {
    title: `${brand("name")} — ${brand("tagline")}`,
    description: t("lede"),
    alternates: {
      canonical: localeUrl("/", locale),
      languages: localeAlternates("/"),
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await getLanding(locale);
  const t = await getTranslations({ locale, namespace: "landing" });
  const brand = await getTranslations({ locale, namespace: "brand" });

  const jsonLd = landingJsonLd({
    locale,
    name: brand("name"),
    tagline: brand("tagline"),
    description: t("lede"),
  });

  return (
    <>
      {jsonLd.map((entry, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
      <LandingScreen page={page} />
    </>
  );
}
