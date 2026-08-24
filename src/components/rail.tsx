import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * The shell: a 56px vertical rail instead of a horizontal header.
 * It sits at the INLINE-START edge — right in Persian, left in English —
 * mirrored automatically by logical properties, with no second stylesheet.
 */
const ROOMS = [
  { key: "shop", href: "/shop", accent: "var(--teal)", mark: <path d="M12 3 21 12 12 21 3 12Z" /> },
  { key: "book", href: "/book", accent: "var(--firouzeh)", mark: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18" /></> },
  { key: "academy", href: "/academy", accent: "var(--gold)", mark: <><path d="M12 4 19 12 12 20 5 12Z" /><circle cx="12" cy="12" r="2.4" /></> },
] as const;

export async function Rail({ active }: { active?: "shop" | "book" | "academy" }) {
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const other = locale === "fa" ? "en" : "fa";

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
          return (
            <li key={room.key} className="relative">
              {on && (
                <span aria-hidden className="absolute inset-inline-start-[-14px] top-1/2 h-6 w-0.5 -translate-y-1/2" style={{ background: room.accent }} />
              )}
              <Link href={room.href} title={t(room.key)} aria-current={on ? "page" : undefined} className="grid size-7 place-items-center">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" aria-hidden
                  stroke={on ? room.accent : "rgba(22,27,74,.34)"}>
                  {room.mark}
                </svg>
                <span className="sr-only">{t(room.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-col items-center gap-6">
        <Link href="/" locale={other} className="text-xs font-medium text-[var(--stone-text)]">
          {other.toUpperCase()}
        </Link>
        <Link href="/studio" title={t("account")} className="grid size-7 place-items-center">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="rgba(22,27,74,.34)" strokeWidth="1.5" aria-hidden>
            <circle cx="12" cy="8.6" r="3.6" /><path d="M5.4 20c.9-3.4 3.5-5.2 6.6-5.2s5.7 1.8 6.6 5.2" />
          </svg>
          <span className="sr-only">{t("account")}</span>
        </Link>
      </div>
    </nav>
  );
}
