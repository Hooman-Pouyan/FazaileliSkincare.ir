import { cache } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { type Locale, routing } from "@/i18n/routing";
import { localeAlternates, localeUrl } from "@/lib/site";
import { getShopHub } from "@/modules/commerce/commerce.reads";
import { StructuredData } from "@/modules/commerce/components/structured-data";
import { ShopHubScreen } from "@/modules/commerce/screens/shop-hub.screen";
import {
  collectionPage,
  hubItemList,
} from "@/modules/commerce/utils/structured-data";

/**
 * Framework policy only, per `docs/architecture/module-contracts.md`: await
 * params, call the module's public read, map the typed outcome to a response.
 * No Drizzle, no price arithmetic, no eligibility decision lives here.
 */

type ShopPageProps = { params: Promise<{ locale: Locale }> };

/**
 * `generateMetadata` and the page both need the hub, and React's request cache
 * makes that one query rather than two. Without it the alternative is a second
 * source for the page title, which is the duplication the page model exists to
 * prevent.
 *
 * The translator is resolved here and passed in. The read used to import
 * `next-intl/server` itself, which bound it to the React server runtime and made
 * it uncallable from a test.
 */
const readHub = cache(async (locale: Locale) => {
  const t = await getTranslations({ locale, namespace: "shop" });
  return getShopHub(locale, (key) => t(key));
});

export async function generateMetadata({
  params,
}: ShopPageProps): Promise<Metadata> {
  const { locale } = await params;
  const outcome = await readHub(locale);

  if (outcome.kind !== "ready") {
    return { robots: { index: false, follow: true } };
  }

  return {
    title: outcome.page.meta.title,
    description: outcome.page.meta.description,
    alternates: {
      // The hub is a scope page and is self-canonical in each locale, per
      // D-18-3. Both of these ask next-intl for the prefix, so Persian is `/shop`
      // and English is `/en/shop` without this file knowing that rule.
      canonical: localeUrl(outcome.page.meta.canonicalPath, locale),
      languages: localeAlternates(outcome.page.meta.canonicalPath),
    },
    // The hub is indexable. Filtered and sorted permutations are not, and that
    // rule lives with the PLP that emits them.
    robots: {
      index: outcome.page.meta.robots === "index,follow",
      follow: true,
    },
  };
}

export default async function ShopHubPage({ params }: ShopPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const outcome = await readHub(locale);
  // One prefixing rule, next-intl's, shared by the canonical and the JSON-LD.
  const absolute = (pathname: string) => localeUrl(pathname, locale);

  switch (outcome.kind) {
    case "ready":
      return (
        <>
          <StructuredData
            data={[
              collectionPage(outcome.page, absolute),
              hubItemList(outcome.page, absolute),
            ]}
          />
          <ShopHubScreen page={outcome.page} />
        </>
      );
    case "redirect":
      redirect(outcome.href);
    case "not-found":
    case "locale-unavailable":
    case "invalid-query":
      // The hub takes no query and always exists where a locale exists, so any
      // other outcome is a routing mistake rather than a customer-visible
      // condition. `not-found` renders the shared state rather than inventing a
      // fourth meaning here.
      notFound();
  }
}
