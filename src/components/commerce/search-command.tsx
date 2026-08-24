"use client";
import * as React from "react";
import { Command } from "cmdk";
import { SearchIcon } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatToman } from "@/lib/money";

export interface SearchHit {
  id: string;
  room: "shop" | "book" | "academy";
  label: string;
  meta?: string;
  priceRials?: bigint | null;
  href: string;
}

const ROOM_LABEL: Record<SearchHit["room"], string> = {
  shop: "فروشگاه",
  book: "رزرو",
  academy: "آکادمی",
};

/**
 * ⌘K — the coherence layer, and what REPLACES a mega-menu.
 * One input, results grouped by room. This is the only place the three spaces
 * appear together outside /studio.
 */
export function SearchCommand({
  hits, query, onQueryChange, open, onOpenChange,
}: {
  hits: SearchHit[];
  query: string;
  onQueryChange: (q: string) => void;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const grouped = (["shop", "book", "academy"] as const)
    .map((room) => ({ room, items: hits.filter((h) => h.room === room) }))
    .filter((g) => g.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="top-[18%] max-w-xl -translate-y-0 p-0">
        <Command shouldFilter={false} label="جستجو" className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-[var(--hairline)] px-5">
            <SearchIcon className="size-4 shrink-0 text-[var(--stone-text)]" />
            <Command.Input
              value={query}
              onValueChange={onQueryChange}
              placeholder="جستجو در محصولات، خدمات و دوره‌ها"
              className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-[var(--stone-text)]"
            />
          </div>
          <Command.List className="max-h-[52vh] overflow-y-auto p-2">
            <Command.Empty className="px-4 py-10 text-center text-[14px] text-[var(--stone-text)]">
              چیزی پیدا نشد
            </Command.Empty>
            {grouped.map((g) => (
              <Command.Group
                key={g.room}
                heading={ROOM_LABEL[g.room]}
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-[var(--gold-text)]"
              >
                {g.items.map((h) => (
                  <Command.Item
                    key={h.id}
                    value={h.id}
                    onSelect={() => { window.location.href = h.href; }}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-control)] px-3 py-2.5 text-[14.5px]",
                      "data-[selected=true]:bg-[color-mix(in_oklab,var(--ink)_6%,transparent)]",
                    )}
                  >
                    <span className="flex flex-col gap-0.5">
                      <span>{h.label}</span>
                      {h.meta && <span className="text-[12.5px] text-[var(--stone-text)]">{h.meta}</span>}
                    </span>
                    {h.priceRials != null && (
                      <span className="shrink-0 text-[13.5px] tabular-nums text-[var(--stone-text)]">
                        {formatToman(h.priceRials)}
                      </span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
