import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import {
  ListingRoute,
  listingMetadata,
  toSearchParams,
} from "@/modules/commerce/listing-route";

/**
 * Products from one brand. Second axis: a customer who already knows Forlle'd arrives here from search.
 *
 * Framework policy only: the segment, its params, and the scope it represents.
 * Everything else — parsing, reading, outcome mapping, metadata — is shared in
 * `listing-route.tsx`, because four copies of an outcome switch is four places
 * for one of them to stop handling `invalid-query`.
 */

type Props = {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [{ locale, slug }, raw] = await Promise.all([params, searchParams]);
  return listingMetadata(locale, { kind: "brand", slug }, toSearchParams(raw));
}

export default function Page({ params, searchParams }: Props) {
  return (
    <ListingRoute
      params={params}
      searchParams={searchParams}
      scope={(slug) => ({ kind: "brand", slug: slug ?? "" })}
    />
  );
}
