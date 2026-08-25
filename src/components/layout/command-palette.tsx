"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FormEvent, useId } from "react";
import { Link } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { hrefFor, navigationFor } from "@/lib/navigation/manifest";
import { useCommandPalette } from "./command-palette-context";

/**
 * The cross-room shortcut: the canonical room destinations, and a field that
 * navigates to the Search PLP.
 *
 * Built on the Dialog primitive already in `components/ui`, which brings focus
 * trapping, escape dismissal, focus restoration and the labelled-dialog roles
 * with it. Nothing about modal behaviour is written here.
 *
 * There is deliberately no client-side filtering and no autocomplete. `SHELL-03`
 * puts results, empty states and errors on the Search PLP rather than in a
 * dialog data source, and states plainly that live autocomplete requires an
 * amendment to that plan first — it would be a fourth Commerce read and would
 * put eligibility selection in the browser. With four rooms to choose from there
 * is also nothing to filter; `cmdk` earns its place when a list is long enough
 * to need searching, and that is the upgrade path if ticket #5 approves it.
 *
 * The five canonical concerns (decision N-4) are not here yet for a specific
 * reason: they live in the database, and reading them would put a query on every
 * page including the landing. They arrive with the cached reference read, not by
 * making the shell dynamic.
 */
export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const t = useTranslations("command");
  const nav = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const fieldId = useId();

  const rooms = navigationFor("rail").filter((item) => item.room !== null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = String(form.get("q") ?? "").trim();
    if (query === "") return;

    close();
    router.push(`/${locale}/shop/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent className="max-w-[34rem]">
        <DialogHeader>
          <DialogTitle>{t("commandTitle")}</DialogTitle>
          <DialogDescription>{t("commandDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4" role="search">
          <div className="grid gap-2">
            <Label htmlFor={fieldId}>{t("searchLabel")}</Label>
            <Input
              id={fieldId}
              name="q"
              type="search"
              autoComplete="off"
              placeholder={t("searchPlaceholder")}
            />
          </div>
          <Button type="submit" className="w-full">
            {t("submit")}
          </Button>
        </form>

        <nav aria-label={t("roomsHeading")} className="mt-2">
          <h3 className="m-0 text-[length:var(--text-micro)] font-semibold tracking-[0.12em] text-[color:var(--gold-text)]">
            {t("roomsHeading")}
          </h3>
          <ul className="mt-3 grid gap-1">
            {rooms.map((item) => {
              if (item.path === null || hrefFor(item, locale) === null) {
                return null;
              }
              return (
                <li key={item.id}>
                  <Link
                    href={item.path}
                    onClick={close}
                    className="grid min-h-11 items-center text-[length:var(--text-body)] text-[color:var(--ink)]"
                  >
                    {nav(item.labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </DialogContent>
    </Dialog>
  );
}
