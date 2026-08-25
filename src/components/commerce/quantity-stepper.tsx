"use client";
import { MinusIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/money";

/** 44px targets on both controls — this is a phone-first audience. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center border border-[var(--hairline-soft)]",
        className,
      )}
    >
      <button
        type="button"
        aria-label="کاهش"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid size-11 place-items-center text-[var(--stone-text)] transition-colors hover:text-[var(--ink)] disabled:opacity-40"
      >
        <MinusIcon className="size-4" />
      </button>
      <span
        aria-live="polite"
        className="w-9 text-center text-[16px] font-medium tabular-nums"
      >
        {toPersianDigits(String(value))}
      </span>
      <button
        type="button"
        aria-label="افزایش"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid size-11 place-items-center text-[var(--stone-text)] transition-colors hover:text-[var(--ink)] disabled:opacity-40"
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}
