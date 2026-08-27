import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getCheckout } from "@/modules/checkout/checkout.reads";
import { CheckoutScreen } from "@/modules/checkout/screens/checkout.screen";

/**
 * Checkout — `COM2`.
 *
 * `noindex, nofollow`: this is a step inside a personal transaction, there is
 * nothing here for a crawler, and a crawler following it would be requesting
 * quotes against somebody's cart.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ locale: Locale }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const query = await searchParams;
  const one = (value: string | string[] | undefined) =>
    typeof value === "string" ? value : undefined;

  const outcome = await getCheckout(locale, {
    addressId: one(query["addressId"]),
    method: one(query["method"]),
  });

  return <CheckoutScreen outcome={outcome} />;
}
