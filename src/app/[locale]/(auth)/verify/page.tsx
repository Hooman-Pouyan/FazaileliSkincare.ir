import { setRequestLocale } from "next-intl/server";
import { AuthScreen } from "@/modules/auth/screens/auth-screen";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AuthScreen locale={locale} mode="verify" />;
}
