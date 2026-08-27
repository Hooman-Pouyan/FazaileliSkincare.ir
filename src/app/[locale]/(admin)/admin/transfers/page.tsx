import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { listSubmittedClaims } from "@/modules/payment/payment.reads";
import { resolveReviewer } from "@/modules/payment/payment.authz";
import { TransferQueueScreen } from "@/modules/payment/screens/transfer-queue.screen";

/**
 * `/admin/transfers` — `COM4`'s staff queue.
 *
 * **An unauthorised visitor gets `notFound()`, not a refusal.** Telling someone
 * a staff page exists is information they did not have, and the queue's
 * existence is not something a customer needs to know. Same reasoning as an
 * order that is not yours.
 *
 * Roles are read from the database on each request rather than from the
 * session, so revoking access takes effect immediately — see `payment.authz`.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return {
    title: t("transfersTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function TransfersPage({
  params,
}: {
  readonly params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const reviewer = await resolveReviewer();
  if (!reviewer) notFound();

  const claims = await listSubmittedClaims(locale);
  return <TransferQueueScreen claims={claims} />;
}
