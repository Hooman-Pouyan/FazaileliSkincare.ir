"use client";
import * as React from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatToman } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { FacetGroupModel } from "./types";

/**
 * The filter rail. Two rules taken from the research:
 *   1. LIVE COUNTS on every value — prevents dead-end filtering (Ulta).
 *   2. A SEARCH BOX inside long facets — essential above ~20 values (Hiland).
 *
 * Deliberately few groups. Khanoumi runs 14 facets over 11,781 SKUs; on ~60
 * SKUs facet maximalism returns one product per filter, which is worse than
 * no filter at all.
 */
export function FacetGroup({
  group,
  onToggle,
}: {
  group: FacetGroupModel;
  onToggle: (groupKey: string, value: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const values = query
    ? group.values.filter((v) => v.label.includes(query))
    : group.values;

  return (
    <Collapsible
      defaultOpen={group.defaultOpen ?? true}
      className="border-b border-[var(--hairline-soft)]"
    >
      <CollapsibleTrigger className="group flex w-full items-center justify-between py-4 text-start text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--firouzeh-text)]">
        {group.label}
        <ChevronDownIcon className="size-4 text-[var(--stone-text)] transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-5">
        {group.searchable && group.values.length > 10 && (
          <div className="relative mb-3">
            <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--stone-text)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو"
              aria-label={`جستجو در ${group.label}`}
              className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--hairline-soft)] bg-[var(--ground)] ps-10 pe-3 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--firouzeh-text)]"
            />
          </div>
        )}

        <ScrollArea className={cn(values.length > 12 && "h-64 pe-2")}>
          <ul className="flex flex-col gap-3">
            {values.map((v) => {
              const id = `${group.key}-${v.value}`;
              return (
                <li key={v.value} className="flex items-center gap-3">
                  <Checkbox
                    id={id}
                    checked={v.selected}
                    disabled={v.count === 0}
                    onCheckedChange={() => onToggle(group.key, v.value)}
                  />
                  <label
                    htmlFor={id}
                    className={cn(
                      "flex flex-1 cursor-pointer items-baseline justify-between gap-3 text-[14px]",
                      v.count === 0 && "opacity-40",
                    )}
                  >
                    <span>{v.label}</span>
                    <span className="text-[12.5px] tabular-nums text-[var(--stone-text)]">
                      {v.count}
                    </span>
                  </label>
                </li>
              );
            })}
            {values.length === 0 && (
              <li className="text-[13.5px] text-[var(--stone-text)]">
                چیزی پیدا نشد
              </li>
            )}
          </ul>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PriceFacet({
  min,
  max,
  value,
  onChange,
}: {
  min: bigint;
  max: bigint;
  value: [bigint, bigint];
  onChange: (v: [bigint, bigint]) => void;
}) {
  const toNum = (b: bigint) => Number(b / 10n);
  return (
    <Collapsible defaultOpen className="border-b border-[var(--hairline-soft)]">
      <CollapsibleTrigger className="group flex w-full items-center justify-between py-4 text-start text-[15px] font-medium">
        قیمت
        <ChevronDownIcon className="size-4 text-[var(--stone-text)] transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-5">
        <Slider
          min={toNum(min)}
          max={toNum(max)}
          step={50_000}
          value={[toNum(value[0]), toNum(value[1])]}
          onValueChange={([lo, hi]) =>
            onChange([BigInt(lo ?? 0) * 10n, BigInt(hi ?? 0) * 10n])
          }
        />
        <div className="mt-2 flex items-center justify-between text-[13px] tabular-nums text-[var(--stone-text)]">
          <span>{formatToman(value[0])} تومان</span>
          <span>{formatToman(value[1])} تومان</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function FacetRail({
  groups,
  onToggle,
  onClear,
  activeCount = 0,
  className,
  children,
}: {
  groups: FacetGroupModel[];
  onToggle: (groupKey: string, value: string) => void;
  onClear?: () => void;
  activeCount?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <aside
      aria-label="فیلترها"
      className={cn("flex w-full flex-col lg:w-64", className)}
    >
      <div className="flex items-baseline justify-between border-b border-[var(--hairline)] pb-3">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-[var(--gold-text)]">
          فیلترها
        </h2>
        {activeCount > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-[13px] text-[var(--firouzeh-text)] hover:underline"
          >
            پاک کردن ({activeCount})
          </button>
        )}
      </div>
      {children}
      {groups.map((g) => (
        <FacetGroup key={g.key} group={g} onToggle={onToggle} />
      ))}
    </aside>
  );
}
