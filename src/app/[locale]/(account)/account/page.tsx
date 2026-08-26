import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { SignOutButton } from "@/modules/account/components/sign-out-button";
import { AddressBook } from "@/modules/account/components/address-book";
import { OrderList } from "@/modules/account/components/order-list";
import { ProfileForm } from "@/modules/account/components/profile-form";
import { SignInRequired } from "@/modules/account/components/sign-in-required";
import {
  getLocationOptions,
  getProfile,
  listAddresses,
  listOrders,
} from "@/modules/account/account.reads";
import { resolveViewer } from "@/modules/account/account.ownership";

/**
 * The account dashboard — `Phase D`.
 *
 * Profile, address book and recent orders on one page. Everything here is a
 * read or a profile write; no money moves, which is what makes this buildable
 * ahead of checkout.
 *
 * `noindex`: this is per-person state behind a session, there is nothing here
 * for a crawler, and indexing it would put someone's address in a search
 * result. `follow` stays, so the links out still pass through.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title"), robots: { index: false, follow: true } };
}

export default async function AccountPage({
  params,
}: {
  readonly params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  const viewer = await resolveViewer();
  if (!viewer) return <SignInRequired next="/account" />;

  // One round of parallel reads rather than four sequential ones.
  const [profile, addresses, locations, orders] = await Promise.all([
    getProfile(viewer),
    listAddresses(viewer),
    getLocationOptions(),
    listOrders(viewer, locale),
  ]);

  if (!profile) return <SignInRequired next="/account" />;

  return (
    <main>
      <Container className="flex max-w-[54rem] flex-col gap-12 pt-14 pb-[var(--space-9)]">
        <header className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="m-0 text-h2 font-bold">{t("title")}</h1>
          <SignOutButton label={t("signOut")} />
        </header>

        <ProfileForm profile={profile} />

        <AddressBook
          addresses={addresses}
          provinces={locations.provinces}
          cities={locations.cities}
        />

        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="m-0 text-h3 font-bold">{t("orders.title")}</h2>
            {orders.length > 0 && (
              <Link
                href="/account/orders"
                className="inline-flex min-h-11 items-center text-small text-firouzeh-text"
              >
                {t("dashboard.ordersLink")}
              </Link>
            )}
          </div>
          <OrderList orders={orders.slice(0, 5)} />
        </section>
      </Container>
    </main>
  );
}
