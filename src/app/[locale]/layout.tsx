import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, dirFor } from "@/i18n/routing";
import { DirectionProvider } from "@/components/direction-provider";
import { CommandPaletteProvider } from "@/components/layout/command-palette-context";
import { Toaster } from "@/components/ui/sonner";
import "../globals.css";
import { SITE_ORIGIN } from "@/lib/site";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params; // Next 16: params is async
  const t = await getTranslations({ locale, namespace: "brand" });
  return {
    title: {
      default: `${t("name")} — ${t("tagline")}`,
      template: `%s | ${t("name")}`,
    },
    description: t("tagline"),
    metadataBase: new URL(SITE_ORIGIN),
    alternates: { languages: { fa: "/fa", en: "/en", ar: "/ar" } },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const direction = dirFor(locale);

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <DirectionProvider dir={direction}>
            <CommandPaletteProvider>
              {children}
              <Toaster dir={direction} />
            </CommandPaletteProvider>
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
