import { getPathname } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";

/**
 * The canonical public origin, in one place.
 *
 * `metadataBase`, JSON-LD `url` values and any absolute link must agree —
 * canonical tags and structured data that disagree about the site's address is
 * a self-inflicted SEO fault, and SEO is a stated priority for this project.
 *
 * It is a constant rather than an environment variable on purpose: the site has
 * exactly one public origin, and a preview deployment must not emit canonicals
 * pointing at itself. Previews are `noindex` at the deployment level; their
 * canonicals still name production, which is the correct signal.
 */
export const SITE_ORIGIN = "https://fazaieli.ir";

/**
 * The absolute, locale-correct URL for a locale-agnostic pathname.
 *
 * `getPathname` is next-intl's own prefixing, so this agrees with every `Link`
 * on the page by construction. Concatenating `/${locale}` here instead would be
 * a second implementation of the prefix rule, which is the mistake decision R-1
 * exists to close: `as-needed` means Persian has no prefix, and a hand-built
 * one would emit a canonical pointing at a route that redirects.
 */
export function localeUrl(pathname: string, locale: Locale): string {
  return `${SITE_ORIGIN}${getPathname({ href: pathname, locale })}`;
}

/** Every locale's URL for the same pathname, ready for `alternates.languages`. */
export function localeAlternates(pathname: string): Record<Locale, string> {
  return Object.fromEntries(
    routing.locales.map((locale) => [locale, localeUrl(pathname, locale)]),
  ) as Record<Locale, string>;
}
