"use client";

import {
  CalendarDays,
  GraduationCap,
  Home,
  Search,
  ShoppingBag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  type NavigationItemId,
  hrefFor,
  navigationFor,
} from "@/lib/navigation/manifest";
import { useCommandPalette } from "./command-palette-context";

/**
 * The cross-room shortcut: canonical room destinations, and typing that goes to
 * the Search PLP.
 *
 * Built on the shadcn `command` primitive over cmdk, so filtering, roving focus,
 * escape dismissal, focus restoration and the combobox roles come from the
 * library. Nothing about modal or listbox behaviour is written here.
 *
 * There is deliberately no product autocomplete. `SHELL-03` puts results, empty
 * states and errors on the Search PLP rather than in a dialog data source, and
 * requires an amendment to that plan before a live transport exists — it would
 * be a fourth Commerce read and would put eligibility selection in the browser.
 * Pressing Enter navigates; it does not fetch.
 *
 * The five canonical concerns from decision N-4 are not here yet, and the reason
 * is a cost rather than an oversight: they live in the database, and reading them
 * in the shell would put a query on every page including the landing. They arrive
 * with the cached reference read.
 */

const ICONS: Partial<Record<NavigationItemId, LucideIcon>> = {
  brand: Home,
  shop: ShoppingBag,
  book: CalendarDays,
  academy: GraduationCap,
};

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const t = useTranslations("command");
  const nav = useTranslations("nav");
  const router = useRouter();
  const [query, setQuery] = useState("");

  const destinations = navigationFor("rail").filter(
    (item) => item.path !== null,
  );

  // `router` comes from `@/i18n/navigation`, so it applies the locale prefix.
  // Nothing here builds one, per decision R-1.
  function go(href: Parameters<typeof router.push>[0]) {
    close();
    setQuery("");
    router.push(href);
  }

  const trimmed = query.trim();

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      title={t("commandTitle")}
      description={t("commandDescription")}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t("searchPlaceholder")}
      />
      <CommandList>
        <CommandEmpty>{t("commandDescription")}</CommandEmpty>

        {trimmed === "" ? null : (
          <CommandGroup heading={t("searchLabel")}>
            <CommandItem
              value={`search-${trimmed}`}
              onSelect={() =>
                go({
                  pathname: "/shop/search",
                  query: { q: trimmed },
                })
              }
            >
              <Search aria-hidden />
              <span>{t("submit")}</span>
              <span className="text-[color:var(--stone-text)]" dir="auto">
                {trimmed}
              </span>
            </CommandItem>
          </CommandGroup>
        )}

        <CommandGroup heading={t("roomsHeading")}>
          {destinations.map((item) => {
            const href = hrefFor(item);
            const Icon = ICONS[item.id];
            if (href === null) return null;
            return (
              <CommandItem
                key={item.id}
                value={nav(item.labelKey)}
                onSelect={() => go(href)}
              >
                {Icon ? <Icon aria-hidden /> : null}
                <span>{nav(item.labelKey)}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
