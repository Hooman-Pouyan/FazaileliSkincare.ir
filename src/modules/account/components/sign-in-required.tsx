import { getTranslations } from "next-intl/server";
import { RouteState } from "@/components/layout/route-state";
import { Link } from "@/i18n/navigation";

/**
 * What a signed-out visitor sees on an account page.
 *
 * **It carries where they were going.** `Phase D` is explicit that someone sent
 * to sign in is returned to where they were headed, not to the home page —
 * being bounced to the Landing after signing in is how a customer loses the
 * thing they came to do, and on an invoice link it means they simply never
 * arrive.
 *
 * The `next` value is a locale-agnostic pathname; `@/i18n/navigation` applies
 * the prefix, so this never builds one by hand (`R-1`).
 */
export async function SignInRequired({ next }: { readonly next: string }) {
  const t = await getTranslations("account");

  return (
    <RouteState
      title={t("title")}
      body={t("signIn")}
      action={
        <Link
          href={{ pathname: "/login", query: { next } }}
          className="inline-flex min-h-11 items-center border-b border-solid border-[color:var(--gold)] pb-1 text-[length:var(--text-body)]"
        >
          {t("signIn")}
        </Link>
      }
    />
  );
}
