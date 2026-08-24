import { defineRouting } from "next-intl/routing";

/**
 * Persian is the SOURCE language, not a translation. English is secondary
 * and switches on later without rework (docs/00-decision-map.md, D10).
 */
export const routing = defineRouting({
  locales: ["fa", "en"],
  defaultLocale: "fa",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
export const dirFor = (locale: string) => (locale === "fa" ? "rtl" : "ltr");
