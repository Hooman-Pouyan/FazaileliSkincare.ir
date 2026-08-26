import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { localeAlternates, localeUrl } from "@/lib/site";
import { listProducts } from "./commerce.reads";
import { StructuredData } from "./components/structured-data";
import type { CatalogueScope } from "./models/catalogue-query";
import { ProductListingScreen } from "./screens/product-listing.screen";
import {
  breadcrumbList,
  faqPage,
  listingItemList,
} from "./utils/structured-data";

/**
 * The four listing routes — concern, brand, category, search — differ only in
 * the scope they pass. Everything after that is identical: parse, read, map the
 * outcome, emit metadata.
 *
 * Written once here rather than four times in four `page.tsx` files, because
 * four copies of an outcome switch is four places for one of them to quietly
 * stop handling `invalid-query`.
 *
 * The route files stay thin and still own what routes own: their own segment,
 * their own params, and the scope they represent.
 */

type ListingParams = Promise<{ locale: Locale; slug?: string }>;
type ListingSearch = Promise<Record<string, string | string[] | undefined>>;

/**
 * The page and `generateMetadata` both read; the request cache makes it one
 * query. The translator is resolved here and injected, so the read never
 * imports `next-intl/server` and stays callable outside a React render.
 */
const read = cache(
  async (locale: Locale, scope: CatalogueScope, search: URLSearchParams) => {
    const t = await getTranslations({ locale, namespace: "plp" });
    return listProducts(locale, scope, search, (key) => t(key));
  },
);

function toSearchParams(
  raw: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    // A repeated parameter arrives as an array; the query grammar expects each
    // occurrence, because `?brand=a&brand=b` is two brands and not one string.
    for (const entry of Array.isArray(value) ? value : [value]) {
      params.append(key, entry);
    }
  }
  return params;
}

export async function listingMetadata(
  locale: Locale,
  scope: CatalogueScope,
  search: URLSearchParams,
): Promise<Metadata> {
  const outcome = await read(locale, scope, search);

  // A redirect, a bad query or a missing scope has no page worth describing,
  // and describing it anyway would invite indexing of a URL that 404s.
  if (outcome.kind !== "ready") {
    return { robots: { index: false, follow: true } };
  }

  const { meta } = outcome.page;
  const isIndexable = meta.robots === "index,follow";

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      // D-18-3: a filtered or sorted permutation canonicals to the clean scope,
      // which is what `canonicalPath` already holds — the read decided it, not
      // this file.
      canonical: localeUrl(meta.canonicalPath, locale),
      // Alternates are only meaningful for a page that may be indexed.
      ...(isIndexable
        ? { languages: localeAlternates(meta.canonicalPath) }
        : {}),
    },
    robots: { index: isIndexable, follow: true },
  };
}

export async function ListingRoute({
  params,
  searchParams,
  scope,
}: {
  readonly params: ListingParams;
  readonly searchParams: ListingSearch;
  /** Builds the scope from the resolved route params. */
  readonly scope: (slug: string | undefined) => CatalogueScope;
}) {
  const [{ locale, slug }, rawSearch] = await Promise.all([
    params,
    searchParams,
  ]);
  setRequestLocale(locale);

  const search = toSearchParams(rawSearch);
  const outcome = await read(locale, scope(slug), search);
  const absolute = (pathname: string) => localeUrl(pathname, locale);

  switch (outcome.kind) {
    case "ready":
      return (
        <>
          <StructuredData
            data={[
              breadcrumbList(outcome.page.breadcrumbs, absolute),
              listingItemList(outcome.page, absolute),
              faqPage(outcome.page.questions),
            ]}
          />
          <ProductListingScreen page={outcome.page} />
        </>
      );

    case "redirect":
      // A non-canonical URL is corrected rather than served, so one listing has
      // one address and cannot split its own ranking.
      //
      // `redirect` comes from `@/i18n/navigation`: the read returns a
      // locale-agnostic pathname, and the raw Next redirect would have sent an
      // English reader to the Persian route. The locale-prefix guard caught
      // that before it ran — decision R-1.
      redirect({ href: outcome.href, locale });

    case "invalid-query":
      // A recognised parameter with an unusable value. Not a redirect, because
      // silently dropping it would show a listing the customer did not ask for.
      notFound();

    case "not-found":
    case "locale-unavailable":
      notFound();
  }
}

export { toSearchParams };
