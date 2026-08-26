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

  /**
   * `/` is Persian for everyone. See decision R-3 in
   * `docs/22-locale-routing-decisions.md`.
   *
   * next-intl defaults this to `true`, which negotiates the unprefixed root
   * against `Accept-Language` and 307s an English client to `/en`. That made
   * the Persian canonical depend on a request header — the site's single most
   * important URL served two different documents depending on who asked, and
   * Googlebot sending `Accept-Language: en` never reached the Persian home
   * page at all. R-2 chose the bare path precisely to make `/` the strongest
   * canonical the site has; leaving detection on quietly undid that.
   *
   * Locale is a choice the reader makes with the locale control, and the
   * choice is a URL. It is never made for them by their browser's headers.
   */
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
export const dirFor = (locale: string) =>
  locale === "fa" || locale === "ar" ? "rtl" : "ltr";
