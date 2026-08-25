"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { SortChips, DEFAULT_SORT_OPTIONS } from "./sort-chips";
import type { SortOption } from "./types";

/** Result count, in-stock toggle, sort chips, and the mobile filter trigger. */
export function PlpToolbar({
  resultCount,
  sort,
  onSortChange,
  inStockOnly,
  onInStockChange,
  sortOptions = DEFAULT_SORT_OPTIONS,
  children,
  className,
}: {
  resultCount: number;
  sort: string;
  onSortChange: (v: string) => void;
  inStockOnly?: boolean;
  onInStockChange?: (v: boolean) => void;
  sortOptions?: SortOption[];
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 border-b border-[var(--hairline-soft)] pb-5",
        className,
      )}
    >
      <p className="text-[14px] text-[var(--stone-text)] tabular-nums">
        <span className="font-medium text-[var(--ink)]">{resultCount}</span>{" "}
        محصول
      </p>

      {onInStockChange && (
        <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-[var(--stone-text)]">
          <Checkbox
            checked={inStockOnly}
            onCheckedChange={(v) => onInStockChange(Boolean(v))}
          />
          فقط کالاهای موجود
        </label>
      )}

      <div className="ms-auto flex items-center gap-3">
        {children}
        <SortChips
          options={sortOptions}
          value={sort}
          onChange={onSortChange}
          className="hidden md:flex"
        />
      </div>
    </div>
  );
}
