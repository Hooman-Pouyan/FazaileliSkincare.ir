import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { OrderDetailScreen } from "@/modules/account/screens/order-detail.screen";
import { SignInRequired } from "@/modules/account/components/sign-in-required";
import { getOrder } from "@/modules/account/account.reads";
import { resolveViewer } from "@/modules/account/account.ownership";

/**
 * One order, which is the invoice.
 *
 * **An order that is not yours is `notFound`, not `forbidden`.** Telling
 * someone an order exists but is not theirs confirms the order number is real,
 * which is exactly what an enumeration attack needs. The read is owner-scoped
 * in its `where`, so a foreign id simply returns nothing.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("orders.title"), robots: { index: false, follow: false } };
}

export default async function OrderPage({
  params,
}: {
  readonly params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const viewer = await resolveViewer();
  if (!viewer) return <SignInRequired next={`/account/orders/${id}`} />;

  const order = await getOrder(viewer, id, locale);
  if (!order) notFound();

  return <OrderDetailScreen order={order} />;
}
