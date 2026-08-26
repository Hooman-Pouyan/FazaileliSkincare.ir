import type { Locale } from "@/i18n/routing";
import { localeUrl } from "@/lib/site";

/**
 * The Landing's structured data — `LAND-11`, bounded to truth.
 *
 * Three objects: `Organization`, `LocalBusiness` as `HealthAndBeautyBusiness`,
 * and `WebSite` with a `SearchAction`. A `Person` for Mahdieh Fazaieli carries
 * only credentials that are verifiable from a document in this repository.
 *
 * **What is deliberately absent, and stays absent until someone supplies it:**
 *
 * - `aggregateRating` and `review` — there is no review model, no ratings, and
 *   no consented testimonial. Markup claiming otherwise is a rich-result
 *   penalty attached to a lie.
 * - `offers` — the Landing sells nothing; the products have their own pages.
 * - `address`, `telephone` and `openingHours` — the institute's are not in any
 *   document here. `landing.structured-data.test.ts` asserts their absence, so
 *   they cannot be quietly invented by whoever adds the next field.
 *
 * That last one is the whole point of testing an omission: a missing field is
 * invisible, and the day someone fills it in with a plausible guess nothing
 * fails.
 */

export type JsonLd = Record<string, unknown>;

export function landingJsonLd({
  locale,
  name,
  tagline,
  description,
}: {
  readonly locale: Locale;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
}): readonly JsonLd[] {
  const home = localeUrl("/", locale);

  const organization: JsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name,
    description: tagline,
    url: home,
    // The city is stated in `00-decision-map.md`; the street address is not.
    // `areaServed` says what is known without implying a postal address.
    areaServed: { "@type": "City", name: "Mashhad" },
    founder: {
      "@type": "Person",
      name,
      jobTitle: tagline,
    },
  };

  const website: JsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    description,
    url: home,
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        // Built from `localeUrl`, not by interpolating the locale into a path.
        // The guard in `locale-prefix.test.ts` caught the hand-built version
        // here — R-1 is that prefixing is next-intl's job and nobody else's,
        // and structured data is not an exception to it.
        urlTemplate: `${localeUrl("/shop/search", locale)}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return [organization, website];
}
