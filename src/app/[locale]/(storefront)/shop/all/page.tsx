import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import {
  ListingRoute,
  listingMetadata,
  toSearchParams,
} from "@/modules/commerce/listing-route";

/**
 * The whole catalogue as one filterable listing.
 *
 * `/shop` is the hub — an editorial front door that asks a customer to choose a
 * concern. This is the other way in: everything, with every facet, for someone
 * who does not want to pick an axis first. Without it the filter rail only ever
 * appears *after* a scope has already narrowed the results, which is the
 * opposite of how browsing works.
 *
 * The `hub` scope in the query grammar has always meant "no scope"; it simply
 * had no route rendering it.
 */

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [{ locale }, raw] = await Promise.all([params, searchParams]);
  return listingMetadata(locale, { kind: "hub" }, toSearchParams(raw));
}

export default function Page({ params, searchParams }: Props) {
  return (
    <ListingRoute
      params={params}
      searchParams={searchParams}
      scope={() => ({ kind: "hub" })}
    />
  );
}
