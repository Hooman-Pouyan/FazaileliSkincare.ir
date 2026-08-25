import { CalendarDays, GraduationCap, ShoppingBag, UserRound } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * The shell: a 56px vertical rail instead of a horizontal header.
 * It sits at the INLINE-START edge — right in Persian and Arabic, left in
 * English — mirrored automatically by logical properties.
 */
const ROOMS = [
  { key: "shop", href: "/shop", accent: "var(--teal)", icon: ShoppingBag },
  { key: "book", href: "/book", accent: "var(--firouzeh)", icon: CalendarDays },
  { key: "academy", href: "/academy", accent: "var(--gold)", icon: GraduationCap },
] as const;

export async function Rail({ active }: { active?: "shop" | "book" | "academy" }) {
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const otherLocales = routing.locales.filter((candidate) => candidate !== locale);

  return (
    <nav
      aria-label={t("shop")}
      className="fixed inset-block-0 inset-inline-start-0 z-40 flex w-14 flex-col items-center bg-[var(--ground)] py-6 border-inline-end border-[var(--hairline)]"
      style={{ borderInlineEndWidth: 1, borderInlineEndStyle: "solid" }}
    >
      <Link href="/" aria-label={t("home")} className="grid size-[30px] place-items-center rounded-full border-[1.5px] border-[var(--gold)]">
        <span className="size-[11px] rounded-full bg-[var(--lapis)]" aria-hidden />
      </Link>

      <ul className="mt-14 flex flex-col items-center gap-7">
        {ROOMS.map((room) => {
          const on = active === room.key;
          const Icon = room.icon;
          return (
            <li key={room.key} className="relative">
              {on && (
                <span aria-hidden className="absolute inset-inline-start-[-14px] top-1/2 h-6 w-0.5 -translate-y-1/2" style={{ background: room.accent }} />
              )}
              <Link href={room.href} title={t(room.key)} aria-current={on ? "page" : undefined} className="grid size-7 place-items-center">
                <Icon size={19} strokeWidth={1.5} color={on ? room.accent : "rgba(22,27,74,.34)"} aria-hidden />
                <span className="sr-only">{t(room.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-col items-center gap-6">
        <div role="group" aria-label={t("language")} className="flex flex-col items-center gap-2">
          {otherLocales.map((candidate) => (
            <Link
              key={candidate}
              href="/"
              locale={candidate}
              title={t(`locales.${candidate}`)}
              className="text-xs font-medium text-[var(--stone-text)]"
            >
              {candidate.toUpperCase()}
            </Link>
          ))}
        </div>
        <Link href="/studio" title={t("account")} className="grid size-7 place-items-center">
          <UserRound size={19} strokeWidth={1.5} color="rgba(22,27,74,.34)" aria-hidden />
          <span className="sr-only">{t("account")}</span>
        </Link>
      </div>
    </nav>
  );
}
