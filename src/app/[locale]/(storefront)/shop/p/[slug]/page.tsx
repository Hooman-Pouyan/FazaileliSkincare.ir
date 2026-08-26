import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { absoluteMediaUrl } from "@/lib/media/url";
import { SITE_ORIGIN, localeAlternates, localeUrl } from "@/lib/site";
import { getProduct } from "@/modules/commerce/commerce.reads";
import { StructuredData } from "@/modules/commerce/components/structured-data";
import { ProductDetailScreen } from "@/modules/commerce/screens/product-detail.screen";
import {
  breadcrumbList,
  productSchema,
} from "@/modules/commerce/utils/structured-data";

/**
 * The product page — `PDP-01`.
 *
 * Every tile in the shop has linked here since packet 3 and this route did not
 * exist, so all forty-eight of them 404'd, and the `ItemList` on `/shop/all`
 * published forty-eight URLs to Google that did the same. `getProduct` was
 * written in packet 3 and had never had a page.
 *
 * `?variant=` is the size selection, and it is a real URL rather than client
 * state: the server resolves the offer for the chosen size, so a shared link
 * shows the same size the sender was looking at and the page works with
 * JavaScript off. Unknown values are treated as no selection, not as an error —
 * `resolveOfferState` decides that, and a stale link should ask again rather
 * than break.
 */

type Props = {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** One read for the page and its metadata. */
const read = cache(
  async (locale: Locale, slug: string, variantId: string | undefined) =>
    getProduct(locale, slug, variantId),
);

function selectedVariant(
  raw: Record<string, string | string[] | undefined>,
): string | undefined {
  const value = raw.variant;
  const first = Array.isArray(value) ? value[0] : value;
  return first && first.length > 0 ? first : undefined;
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [{ locale, slug }, raw] = await Promise.all([params, searchParams]);
  const outcome = await read(locale, slug, selectedVariant(raw));

  // Nothing worth describing, and describing it would invite indexing of a URL
  // that 404s.
  if (outcome.kind !== "ready") {
    return { robots: { index: false, follow: true } };
  }

  const { meta } = outcome.page;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      // A `?variant=` permutation canonicals to the bare product, which is what
      // `canonicalPath` already holds: one product, one address, one ranking.
      canonical: localeUrl(meta.canonicalPath, locale),
      languages: localeAlternates(meta.canonicalPath),
    },
    robots: { index: meta.robots === "index,follow", follow: true },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const [{ locale, slug }, raw] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const outcome = await read(locale, slug, selectedVariant(raw));
  const absolute = (pathname: string) => localeUrl(pathname, locale);
  // Media is not a route, so it is not locale-prefixed: `localeUrl` would emit
  // `/en/media/…`. `absoluteMediaUrl` lives in `lib/media/url.ts` because that
  // file is the only one allowed to know where media is served from.
  const absoluteAsset = (src: string) => absoluteMediaUrl(src, SITE_ORIGIN);

  switch (outcome.kind) {
    case "ready":
      return (
        <>
          <StructuredData
            data={[
              breadcrumbList(outcome.page.breadcrumbs, absolute),
              productSchema(outcome.page, absolute, absoluteAsset),
            ]}
          />
          <ProductDetailScreen page={outcome.page} />
        </>
      );

    // A product with no approved copy in this locale is not the same thing as a
    // product that does not exist, but both are a 404 to the reader: there is
    // no fallback chain, and showing Persian to an English reader would be one.
    case "locale-unavailable":
    case "not-found":
    case "invalid-query":
    case "redirect":
      notFound();
  }
}
