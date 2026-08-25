import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Teal passes contrast on light ground (10.51:1). Firouzeh would not. */
export function StockBadge({
  inStock,
  shipsFrom = "ارسال از مشهد به سراسر ایران",
  className,
}: {
  inStock: boolean;
  shipsFrom?: string;
  className?: string;
}) {
  if (!inStock) {
    return (
      <p className={cn("text-[14px] text-[var(--stone-text)]", className)}>
        فعلاً موجود نیست
      </p>
    );
  }
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-[14px] text-[var(--teal)]",
        className,
      )}
    >
      <CheckIcon className="size-4" strokeWidth={2} aria-hidden />
      موجود — {shipsFrom}
    </p>
  );
}
