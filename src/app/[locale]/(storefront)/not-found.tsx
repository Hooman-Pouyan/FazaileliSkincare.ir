import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RouteState } from "@/components/layout/route-state";

/** Reached when a route calls `notFound()` — an entity that does not exist. */
export default async function StorefrontNotFound() {
  const t = await getTranslations("states");

  return (
    <RouteState
      title={t("notFoundTitle")}
      body={t("notFoundBody")}
      action={
        <Link
          href="/shop"
          className="border-b border-solid border-[color:var(--gold)] pb-1 text-[length:var(--text-body)]"
        >
          {t("backToShop")}
        </Link>
      }
    />
  );
}
