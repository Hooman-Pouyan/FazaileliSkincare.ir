"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAddLine } from "../cart.hooks";
import { useCartStore } from "../cart.store-provider";
import type { CartActionResult } from "../models/cart-models";

/**
 * The product page's one purchase control — `PDP-05`.
 *
 * Rendered **only** for a `purchasable` offer. Every other state is refused
 * before this component is reached, so there is no disabled-button branch here:
 * a greyed-out "add to basket" tells a customer they cannot buy something,
 * where the truth is usually that they must choose a size, or ask, or that it
 * is for professionals. `OfferLine` says which.
 *
 * The result is not optimistic. The button waits for the server, then the
 * drawer opens on what the server actually returned — because the alternative
 * is a drawer that shows an item the write refused.
 */
export function AddToCart({ variantId }: { readonly variantId: string }) {
  const t = useTranslations("cart");
  const addLine = useAddLine();
  const openDrawer = useCartStore((state) => state.openDrawer);
  const [rejection, setRejection] = useState<CartActionResult | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={addLine.isPending}
        onClick={() => {
          setRejection(null);
          addLine.mutate(
            { variantId, quantity: 1 },
            {
              onSuccess: (result) => {
                if (result.kind === "ok") openDrawer();
                else setRejection(result);
              },
            },
          );
        }}
        className="inline-flex min-h-12 items-center justify-center bg-ink px-6 text-small font-medium text-sand transition-opacity duration-[var(--duration)] ease-[var(--easing)] hover:opacity-90 disabled:opacity-60"
      >
        {addLine.isPending ? t("adding") : t("addToCart")}
      </button>

      {/*
        The error belongs to the action, not to the store — the Zustand contract
        is explicit that errors are not retained as canonical store state, and
        one kept there would outlive the click that caused it.
      */}
      {rejection?.kind === "rejected" && (
        <p role="status" className="m-0 text-small text-firouzeh-text">
          {t(`error.${rejection.reason}`, {
            available: rejection.available ?? 0,
          })}
        </p>
      )}
    </div>
  );
}
