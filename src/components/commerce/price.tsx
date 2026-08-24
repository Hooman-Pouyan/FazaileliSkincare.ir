import { formatToman } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * The ONLY place a price is rendered. Integer rials in, toman out.
 * Persian digits and the ٬ separator in fa.
 *
 * No `-٪۳۰` discount pill: on medical-grade product, permanent visible
 * discounting tells patients the price was never real, and by extension that
 * the recommendation isn't either. A struck-through compare-at is available
 * for genuine, time-bounded promotions only.
 */
export function Price({
  amountRials,
  compareAtRials,
  locale = "fa",
  size = "default",
  currencyLabel = "تومان",
  className,
}: {
  amountRials: bigint;
  compareAtRials?: bigint | null;
  locale?: "fa" | "en";
  size?: "sm" | "default" | "lg";
  currencyLabel?: string;
  className?: string;
}) {
  const sizes = {
    sm: "text-[15px]",
    default: "text-[18px]",
    lg: "text-[30px]",
  } as const;

  return (
    <p className={cn("flex items-baseline gap-2 tabular-nums", className)}>
      {compareAtRials != null && compareAtRials > amountRials && (
        <span className="text-[13px] text-[var(--stone-text)] line-through">
          {formatToman(compareAtRials, locale)}
        </span>
      )}
      <span className={cn("font-medium", sizes[size])}>{formatToman(amountRials, locale)}</span>
      <span className="text-[13px] font-light text-[var(--stone-text)]">{currencyLabel}</span>
    </p>
  );
}

/**
 * Some products are «استعلام قیمت» — they show an enquiry action instead of a
 * price, and are NEVER silently addable to a cart, or you take an order at a
 * price nobody agreed.
 */
export function PriceOnRequest({
  label = "استعلام قیمت",
  href,
  className,
}: { label?: string; href: string; className?: string }) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-2 border-b border-[var(--firouzeh-text)] pb-1 text-[14.5px] font-medium text-[var(--firouzeh-text)]",
        className,
      )}
    >
      {label}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 20.5l1.6-5.5A8.4 8.4 0 1 1 21 11.5Z" />
      </svg>
    </a>
  );
}
