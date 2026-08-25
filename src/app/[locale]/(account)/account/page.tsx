import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/auth";
import { formatIranianPhone } from "@/lib/auth/phone";
import { Link } from "@/i18n/navigation";
import { RouteState } from "@/components/layout/route-state";
import { readAccountPhone } from "@/modules/account/models/session-view";
import { SignOutButton } from "@/modules/account/components/sign-out-button";

/**
 * Where phone-OTP sign-in lands. Deliberately almost empty.
 *
 * This is not `AUTH5`: there is no session list, no phone change and no account
 * closure, because each of those is a security surface with its own tests and
 * its own failure modes. What it does is make the session visible — before this,
 * signing in succeeded and showed the customer nothing, which reads as failure.
 *
 * The session is read on the server. Nothing about it crosses to the browser
 * beyond the formatted phone number.
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AccountPage({
  params,
}: {
  readonly params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  const session = await getSession(await headers());
  const phone = session ? readAccountPhone(session.user) : null;

  if (!phone) {
    return (
      <RouteState
        title={t("title")}
        body={t("signIn")}
        action={
          <Link
            href="/login"
            className="border-b border-solid border-[color:var(--gold)] pb-1 text-[length:var(--text-body)]"
          >
            {t("signIn")}
          </Link>
        }
      />
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-[38rem] gap-8 px-6 py-16 lg:py-24">
      <h1 className="m-0 text-[length:var(--text-h2)] font-black leading-[1.35] text-[color:var(--ink)]">
        {t("title")}
      </h1>

      <p className="m-0 grid gap-2 text-[length:var(--text-body)] text-[color:var(--stone-text)]">
        <span>{t("signedInAs")}</span>
        <span
          dir="ltr"
          className="text-start text-[length:var(--text-h3)] text-[color:var(--ink)] [font-variant-numeric:tabular-nums]"
        >
          {formatIranianPhone(phone)}
        </span>
      </p>

      <SignOutButton label={t("signOut")} />
    </section>
  );
}
