"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { MAX_LINE_QUANTITY } from "../models/cart-schemas";

/**
 * Line quantity, in the drawer and on the cart page.
 *
 * The design system's `QuantityStepper` is `value`/`onChange`/`max`, and this
 * keeps that shape. What it adds is `disabled` while the line is in flight —
 * because the value is not the customer's opinion, it is a server fact, and
 * letting someone click twice before the first write lands is how a quantity
 * ends up somewhere neither of them chose.
 *
 * Bounds are presentation only. Stock is re-checked server-side on every
 * change, and `max` here just stops the obvious mistake before the round trip.
 */
export function QuantityStepper({
  value,
  onChange,
  max = MAX_LINE_QUANTITY,
  disabled = false,
}: {
  readonly value: number;
  readonly onChange: (next: number) => void;
  readonly max?: number;
  readonly disabled?: boolean;
}) {
  const t = useTranslations("cart");
  const ceiling = Math.max(1, Math.min(max, MAX_LINE_QUANTITY));

  return (
    <div
      className="inline-flex items-center border border-[var(--hairline)]"
      role="group"
      aria-label={t("quantity.label")}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label={t("quantity.decrease")}
        className="grid size-11 place-items-center text-ink disabled:opacity-40"
      >
        <MinusIcon className="size-4" strokeWidth={1.5} aria-hidden />
      </button>

      {/*
        Not an input. A free-typed number needs its own validation, its own
        debounce and its own answer to "what does an empty field mean" — and it
        buys nothing at these quantities. `aria-live` announces the value when
        it changes without moving focus, which `PDP-06` asks for.
      */}
      <output
        className="min-w-11 px-2 text-center text-body tabular-nums"
        aria-live="polite"
      >
        {value}
      </output>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= ceiling}
        aria-label={t("quantity.increase")}
        className="grid size-11 place-items-center text-ink disabled:opacity-40"
      >
        <PlusIcon className="size-4" strokeWidth={1.5} aria-hidden />
      </button>
    </div>
  );
}
