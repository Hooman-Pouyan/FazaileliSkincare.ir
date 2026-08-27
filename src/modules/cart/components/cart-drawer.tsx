"use client";

import { ShoppingCartIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { useCart } from "../cart.hooks";
import { useCartStore } from "../cart.store-provider";
import { CartLineList } from "./cart-lines";

/**
 * The desktop cart — `CART-05`.
 *
 * Same server model as `/cart`, rendered by the same `CartLineList`, so the two
 * surfaces cannot drift into disagreeing about a price. Radix's `Sheet` handles
 * the focus trap and returns focus to whatever opened it, which is the part of
 * a drawer that is easy to get wrong by hand and impossible to notice with a
 * mouse.
 *
 * **No checkout control.** `CART-05` is explicit — *"do not ship a dead
 * button"* — and checkout is a separate programme behind business and legal
 * gates that are not closed. What ships instead is a sentence saying so, which
 * is true, and a link to the full cart page, which works.
 *
 * The design system's `CartDrawer` prompt adds two prohibitions this keeps: no
 * countdown and no "only 2 left" urgency. A reservation does have a twenty
 * minute life, and putting a timer on it would turn a quiet safeguard into
 * pressure.
 */
export function CartDrawer() {
  const t = useTranslations("cart");
  const isOpen = useCartStore((state) => state.isDrawerOpen);
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  const { data, isPending } = useCart();

  const lines = data?.kind === "ready" ? data.page.lines : [];
  const summary = data?.summary ?? null;

  return (
    <Sheet open={isOpen} onOpenChange={(next) => !next && closeDrawer()}>
      <SheetContent side="end" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-h3 font-bold">{t("title")}</SheetTitle>
          <SheetDescription className="text-small text-stone-text">
            {summary ? t("itemCount", { count: summary.itemCount }) : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {isPending ? (
            <p className="py-10 text-center text-small text-stone-text">
              {t("loading")}
            </p>
          ) : lines.length === 0 ? (
            <div className="flex flex-col items-start gap-3 py-10">
              <ShoppingCartIcon
                className="size-6 text-stone-text"
                strokeWidth={1.5}
                aria-hidden
              />
              <p className="m-0 text-body font-medium">{t("empty.title")}</p>
              <p className="m-0 text-small text-stone-text">
                {t("empty.body")}
              </p>
              <Link
                href="/shop"
                onClick={closeDrawer}
                className="mt-2 inline-flex min-h-11 items-center border-b border-[color:var(--gold)] pb-1 text-small font-medium"
              >
                {t("empty.action")}
              </Link>
            </div>
          ) : (
            <CartLineList lines={lines} mode="drawer" />
          )}
        </div>

        {lines.length > 0 && summary?.subtotal && (
          <SheetFooter className="border-t border-[var(--hairline)]">
            <div className="flex w-full items-baseline justify-between">
              <span className="text-small text-stone-text">
                {t("subtotal")}
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-lede font-medium tabular-nums">
                  {summary.subtotal.label}
                </span>
                <span className="text-small font-light text-stone-text">
                  {t("currency")}
                </span>
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="inline-flex min-h-12 w-full items-center justify-center bg-ink px-6 text-small font-medium text-sand"
            >
              {t("goToCheckout")}
            </Link>

            <Link
              href="/cart"
              onClick={closeDrawer}
              className="inline-flex min-h-11 w-full items-center justify-center border border-[color:var(--gold)] px-4 text-small font-medium"
            >
              {t("viewCart")}
            </Link>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
