"use client";

import {
  Home,
  Search,
  ShoppingBag,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  type NavigationItem,
  type NavigationItemId,
  activeRoom,
  hrefFor,
  navigationFor,
} from "@/lib/navigation/manifest";
import { useCommandPalette } from "./command-palette-context";

/**
 * The mobile bar, from the same manifest as the rail.
 *
 * It replaces the rail rather than joining it: `SHELL-02` forbids exposing two
 * interactive navigations to assistive technology at once, so the shell renders
 * exactly one at a time through CSS, and this element is `hidden` above the
 * breakpoint rather than duplicated.
 *
 * Four items, per decision N-1. Active state is carried by weight and a rule
 * above the item, never by colour alone.
 */

const ICONS: Partial<Record<NavigationItemId, LucideIcon>> = {
  brand: Home,
  shop: ShoppingBag,
  command: Search,
  account: UserRound,
  cart: ShoppingCart,
};

export function BottomNavigation() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const { open } = useCommandPalette();
  const items = navigationFor("bottom");
  const current = activeRoom(pathname);

  const shared =
    "grid min-h-11 flex-1 place-items-center gap-1 py-2 text-[length:var(--text-micro)]";

  function content(item: NavigationItem, isCurrent: boolean) {
    const Icon = ICONS[item.id];
    return (
      <>
        <span
          aria-hidden
          data-current={isCurrent ? "true" : undefined}
          className="h-0.5 w-6 bg-transparent data-[current=true]:bg-[color:var(--accent-shop)]"
        />
        {Icon ? (
          <Icon size={20} strokeWidth={isCurrent ? 2 : 1.5} aria-hidden />
        ) : null}
        <span className={isCurrent ? "font-semibold" : undefined}>
          {t(item.labelKey)}
        </span>
      </>
    );
  }

  return (
    <nav
      aria-label={t("primary")}
      className="fixed inset-inline-0 inset-block-end-0 z-40 flex border-t border-solid border-[color:var(--hairline)] bg-[color:var(--ground)] pb-[env(safe-area-inset-bottom)] text-[color:var(--stone-text)] md:hidden"
    >
      {items.map((item) => {
        const href = hrefFor(item, locale);
        const isCurrent = item.room !== null && item.room === current;

        if (href === null) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={open}
              aria-haspopup="dialog"
              className={shared}
            >
              {content(item, false)}
            </button>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.path ?? "/"}
            aria-current={isCurrent ? "page" : undefined}
            className={`${shared} ${isCurrent ? "text-[color:var(--ink)]" : ""}`}
          >
            {content(item, isCurrent)}
          </Link>
        );
      })}
    </nav>
  );
}
