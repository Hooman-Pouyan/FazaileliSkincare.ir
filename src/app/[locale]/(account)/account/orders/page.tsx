import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/layout/container";
import type { Locale } from "@/i18n/routing";
import { OrderList } from "@/modules/account/components/order-list";
import { SignInRequired } from "@/modules/account/components/sign-in-required";
import { listOrders } from "@/modules/account/account.reads";
import { resolveViewer } from "@/modules/account/account.ownership";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("orders.title"), robots: { index: false, follow: true } };
}

export default async function OrdersPage({
  params,
}: {
  readonly params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  const viewer = await resolveViewer();
  if (!viewer) return <SignInRequired next="/account/orders" />;

  const orders = await listOrders(viewer, locale);

  return (
    <main>
      <Container className="flex max-w-[54rem] flex-col gap-8 pt-14 pb-[var(--space-9)]">
        <h1 className="m-0 text-h2 font-bold">{t("orders.title")}</h1>
        <OrderList orders={orders} />
      </Container>
    </main>
  );
}
