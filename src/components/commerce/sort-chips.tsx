"use client";
import { cn } from "@/lib/utils";
import type { SortOption } from "./types";

/**
 * Sort as a ROW OF CHIPS, not a dropdown — Hiland's pattern, and better for
 * six options: zero clicks to see what's available.
 */
export function SortChips({
  options, value, onChange, label = "مرتب‌سازی", className,
}: {
  options: SortOption[];
  value: string;
  onChange: (v: string) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="me-2 text-[13px] text-[var(--stone-text)]">{label}</span>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-9 rounded-[var(--radius-control)] border px-4 text-[13.5px] transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--firouzeh-text)]",
              on
                ? "border-[var(--ink)] font-medium text-[var(--ink)]"
                : "border-[var(--hairline-soft)] font-light text-[var(--stone-text)] hover:border-[var(--gold)]",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { value: "recommended", label: "پیشنهاد ما" },
  { value: "newest", label: "جدیدترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
  { value: "name", label: "الفبا" },
];
