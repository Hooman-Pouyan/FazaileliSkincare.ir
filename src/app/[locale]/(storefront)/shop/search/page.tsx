import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import {
  ListingRoute,
  listingMetadata,
  toSearchParams,
} from "@/modules/commerce/listing-route";

/**
 * Search results. The destination the command palette submits to.
 *
 * The term lives in `?q=`, not in the path — a search result set is a view of
 * the catalogue, not a place in it, and D-18-3 keeps every one of them out of
 * the index. `listingMetadata` reads that from the page model's own `robots`
 * rather than deciding it here.
 */

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function queryOf(raw: Record<string, string | string[] | undefined>): string {
  const value = raw.q;
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [{ locale }, raw] = await Promise.all([params, searchParams]);
  return listingMetadata(
    locale,
    { kind: "search", query: queryOf(raw) },
    toSearchParams(raw),
  );
}

export default async function Page({ params, searchParams }: Props) {
  const raw = await searchParams;
  return (
    <ListingRoute
      params={params}
      searchParams={searchParams}
      scope={() => ({ kind: "search", query: queryOf(raw) })}
    />
  );
}
