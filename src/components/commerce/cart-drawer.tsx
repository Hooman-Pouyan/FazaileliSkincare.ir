"use client";
import * as React from "react";
import Image from "next/image";
import { ShoppingBagIcon, Trash2Icon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/layout/empty-state";
import { formatToman } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Price } from "./price";
import { QuantityStepper } from "./quantity-stepper";
import type { CartLineModel } from "./types";

/**
 * The cart is a SHEET on `side="end"` — logical, so it opens from the correct
 * edge in both locales. `/cart` also exists as a real page for mobile and for
 * anyone who lands on the URL directly.
 */
export function CartDrawer({
  lines,
  onQuantityChange,
  onRemove,
  checkoutHref = "/checkout",
  trigger,
}: {
  lines: CartLineModel[];
  onQuantityChange: (id: string, q: number) => void;
  onRemove: (id: string) => void;
  checkoutHref?: string;
  trigger?: React.ReactNode;
}) {
  const subtotal = lines.reduce(
    (sum, l) => sum + l.unitPriceRials * BigInt(l.quantity),
    0n,
  );
  const count = lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`سبد خرید (${count})`}
            className="relative"
          >
            <ShoppingBagIcon />
            {count > 0 && (
              <span className="absolute -top-1 inset-inline-end-0 grid size-4 place-items-center rounded-full bg-[var(--teal)] text-[10px] text-[var(--sand)] tabular-nums">
                {count}
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="end" className="flex flex-col p-0">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>سبد خرید</SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <EmptyState
            title="سبد شما خالی است"
            body="از دغدغهٔ پوستتان شروع کنید — محصولات هر بخش را خودمان انتخاب کرده‌ایم."
          />
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6">
              {lines.map((l) => (
                <li
                  key={l.id}
                  className="flex gap-4 border-b border-[var(--hairline-soft)] py-5 last:border-b-0"
                >
                  <div className="relative aspect-[4/5] w-[72px] shrink-0 overflow-hidden bg-[var(--sand)]">
                    {l.imageUrl && (
                      <Image
                        src={l.imageUrl}
                        alt=""
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--gold-text)]">
                      {l.brandName}
                    </p>
                    <p className="text-[15px] font-medium leading-[1.55]">
                      {l.name}
                    </p>
                    {l.sizeLabel && (
                      <p className="text-[12.5px] text-[var(--stone-text)]">
                        {l.sizeLabel}
                      </p>
                    )}
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <QuantityStepper
                        value={l.quantity}
                        onChange={(q) => onQuantityChange(l.id, q)}
                      />
                      <button
                        type="button"
                        onClick={() => onRemove(l.id)}
                        aria-label="حذف"
                        className="text-[var(--stone-text)] transition-colors hover:text-[var(--danger)]"
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                    </div>
                    <Price
                      amountRials={l.unitPriceRials * BigInt(l.quantity)}
                      size="sm"
                      className="mt-1"
                    />
                  </div>
                </li>
              ))}
            </ul>

            <SheetFooter className="gap-4 border-t border-[var(--hairline)] px-6 pb-6 pt-5">
              <div className="flex items-baseline justify-between">
                <span className="text-[15px] font-medium">جمع سبد</span>
                <span className="text-[20px] font-bold tabular-nums">
                  {formatToman(subtotal)}{" "}
                  <span className="text-[13px] font-light text-[var(--stone-text)]">
                    تومان
                  </span>
                </span>
              </div>
              <p className="text-[12.5px] leading-[1.8] text-[var(--stone-text)]">
                کالاها تا زمان تأیید پرداخت برای شما کنار گذاشته می‌شود.
              </p>
              <Button asChild className="w-full">
                <a href={checkoutHref}>ادامهٔ خرید</a>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
