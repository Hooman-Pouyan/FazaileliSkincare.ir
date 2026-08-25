import { defineRouting } from "next-intl/routing";

/**
 * Persian is the SOURCE language, not a translation. English and Arabic are
 * secondary locales (docs/00-decision-map.md, D10).
 *
 * `as-needed` follows from that: Persian is served at `/`, `/shop`,
 * `/shop/concern/melasma`, and only English and Arabic carry a prefix. A
 * Persian customer arriving from an Instagram link should see the address of a
 * shop, not a translation of one — and the default locale sitting behind a
 * redundant prefix is a weaker canonical than the bare path.
 *
 * This is the ONLY place a locale reaches a URL. Everything else — the
 * navigation manifest, page models, the catalogue query grammar — emits
 * locale-agnostic pathnames and lets `@/i18n/navigation` apply the prefix.
 * Building `/${locale}/shop` by hand and handing it to `Link` produced
 * `/fa/fa/shop`; see decision R-1 in `docs/22-locale-routing-decisions.md`.
 */
export const routing = defineRouting({
  locales: ["fa", "en", "ar"],
  defaultLocale: "fa",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
export const dirFor = (locale: string) =>
  locale === "fa" || locale === "ar" ? "rtl" : "ltr";
