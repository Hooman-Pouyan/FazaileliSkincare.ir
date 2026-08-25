import {
  CalendarDays,
  GraduationCap,
  Languages,
  Search,
  ShoppingBag,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  type NavigationItemId,
  type NavigationRoom,
  hrefFor,
  navigationFor,
} from "@/lib/navigation/manifest";
import { CommandTrigger } from "./command-trigger";
import { LocaleSwitch } from "./locale-switch";
import { RailLink } from "./rail-link";

/**
 * The 56px rail, rendered from the one navigation manifest.
 *
 * It sits at the inline-start edge — right in Persian and Arabic, left in
 * English — and mirrors for free because every property here is logical. The
 * brand medallion and the room marks are the exception the design calls for:
 * they are symbols, not directions, so they never flip.
 */

const ICONS: Partial<Record<NavigationItemId, LucideIcon>> = {
  shop: ShoppingBag,
  book: CalendarDays,
  academy: GraduationCap,
  command: Search,
  account: UserRound,
  locale: Languages,
  cart: ShoppingCart,
};

/** Room accents are tokens. A literal colour in `src/` breaks AGENTS.md rule 5. */
const ACCENTS: Partial<Record<NavigationRoom, string>> = {
  shop: "var(--accent-shop)",
  book: "var(--accent-booking)",
  academy: "var(--accent-academy)",
  account: "var(--accent-studio)",
};

export async function Rail() {
  const t = await getTranslations("nav");
  const locale = await getLocale();

  const items = navigationFor("rail");
  const brand = items.find((item) => item.id === "brand");
  const rooms = items.filter(
    (item) => item.room !== null && item.id !== "brand",
  );
  const utilities = items.filter((item) => item.room === null);

  return (
    <nav
      aria-label={t("primary")}
      className="fixed inset-block-0 inset-inline-start-0 z-40 flex w-14 flex-col items-center border-inline-end border-solid border-[color:var(--hairline)] bg-[color:var(--ground)] py-6 border-e"
    >
      {brand ? (
        <Link
          href={hrefFor(brand, locale) ?? "/"}
          aria-label={t(brand.labelKey)}
          className="grid size-11 place-items-center"
        >
          <span className="grid size-[30px] place-items-center rounded-full border-[1.5px] border-solid border-[color:var(--gold)]">
            <span
              className="size-[11px] rounded-full bg-[color:var(--lapis)]"
              aria-hidden
            />
          </span>
        </Link>
      ) : null}

      <ul className="mt-12 flex flex-col items-center gap-4">
        {rooms.map((item) => {
          const Icon = ICONS[item.id];
          const href = hrefFor(item, locale);
          if (!Icon || href === null) return null;
          return (
            <li key={item.id}>
              <RailLink
                href={href}
                room={item.room}
                label={t(item.labelKey)}
                accent={item.room ? ACCENTS[item.room] : undefined}
              >
                <Icon size={19} strokeWidth={1.5} aria-hidden />
              </RailLink>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-col items-center gap-2">
        {utilities.map((item) => {
          if (item.id === "command") {
            return (
              <CommandTrigger key={item.id} label={t(item.labelKey)}>
                <Search size={19} strokeWidth={1.5} aria-hidden />
              </CommandTrigger>
            );
          }
          if (item.id === "locale") {
            return <LocaleSwitch key={item.id} label={t(item.labelKey)} />;
          }
          return null;
        })}
      </div>
    </nav>
  );
}
