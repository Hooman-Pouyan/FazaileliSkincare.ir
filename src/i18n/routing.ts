import { defineRouting } from "next-intl/routing";

/**
 * Persian is the SOURCE language, not a translation. English and Arabic are
 * secondary locales (docs/00-decision-map.md, D10).
 */
export const routing = defineRouting({
  locales: ["fa", "en", "ar"],
  defaultLocale: "fa",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
export const dirFor = (locale: string) =>
  locale === "fa" || locale === "ar" ? "rtl" : "ltr";
