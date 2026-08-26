"use client";

import Image from "next/image";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  removeLineFormAction,
  setLineQuantityFormAction,
} from "../cart.actions";
import { useRemoveLine, useSetLineQuantity } from "../cart.hooks";
import { useCartStore } from "../cart.store-provider";
import type { CartLine } from "../models/cart-models";
import { MAX_LINE_QUANTITY } from "../models/cart-schemas";
import { QuantityStepper } from "./quantity-stepper";

/**
 * One cart line, and the list of them. Shared by the drawer and `/cart` —
 * `CART-05` requires both surfaces to render the same model, and the surest way
 * to make that true is for them to render the same component.
 *
 * **The controls differ by surface, and only the controls.**
 *
 * `/cart` is a real URL that must work with JavaScript off (`AGENTS.md`), so
 * its controls are `<form action={serverAction}>`: React posts them when it
 * can and the browser posts them when it cannot. The drawer is a dialog — it
 * cannot exist without JavaScript at all — so it uses the typed mutations,
 * which can show a rejection in place rather than only re-rendering.
 *
 * Everything above the controls is identical, which is the part `CART-05` is
 * actually about: a price or an availability that differed between the two
 * would be the defect.
 *
 * **The line states are not decoration.** `CART-04` requires a changed price, an
 * expired reservation, an unavailable item and an unpublished product to be
 * explicit, because the alternative is a cart that silently corrects itself and
 * a customer who reaches checkout expecting a different number.
 */
function LineIssue({ line }: { readonly line: CartLine }) {
  const t = useTranslations("cart");
  if (!line.issue) return null;

  const tone =
    line.issue === "reservation_expired"
      ? "text-stone-text"
      : "text-firouzeh-text";

  return (
    <p className={`m-0 text-small ${tone}`}>
      {line.issue === "quantity_reduced"
        ? t("issue.quantityReduced", { available: line.availableQuantity })
        : t(`issue.${line.issue}`)}
    </p>
  );
}

function LineDetails({ line }: { readonly line: CartLine }) {
  return (
    <div className="min-w-0">
      <p className="m-0 text-micro uppercase tracking-[0.13em] text-gold-text">
        {line.brandName}
      </p>
      <h3 className="m-0 text-body font-medium leading-fa">
        <Link href={line.href} className="hover:text-teal">
          {line.name}
        </Link>
      </h3>
      {line.sizeLabel && (
        <p className="m-0 text-small text-stone-text">{line.sizeLabel}</p>
      )}
    </div>
  );
}

function LineTotal({ line }: { readonly line: CartLine }) {
  const t = useTranslations("cart");
  if (!line.lineTotal) return null;

  return (
    <p className="m-0 flex items-baseline gap-1.5">
      <span className="text-body font-medium tabular-nums">
        {line.lineTotal.label}
      </span>
      <span className="text-small font-light text-stone-text">
        {t("currency")}
      </span>
    </p>
  );
}

/** The no-JavaScript controls: three forms, one server action each. */
function FormControls({ line }: { readonly line: CartLine }) {
  const t = useTranslations("cart");
  const ceiling = Math.min(
    MAX_LINE_QUANTITY,
    Math.max(1, line.availableQuantity),
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="inline-flex items-center border border-[var(--hairline)]"
        role="group"
        aria-label={t("quantity.label")}
      >
        <form action={setLineQuantityFormAction}>
          <input type="hidden" name="lineId" value={line.id} />
          <input type="hidden" name="quantity" value={line.quantity - 1} />
          <button
            type="submit"
            disabled={line.quantity <= 1}
            aria-label={t("quantity.decrease")}
            className="grid size-11 place-items-center text-ink disabled:opacity-40"
          >
            <MinusIcon className="size-4" strokeWidth={1.5} aria-hidden />
          </button>
        </form>

        <output className="min-w-11 px-2 text-center text-body tabular-nums">
          {line.quantity}
        </output>

        <form action={setLineQuantityFormAction}>
          <input type="hidden" name="lineId" value={line.id} />
          <input type="hidden" name="quantity" value={line.quantity + 1} />
          <button
            type="submit"
            disabled={line.quantity >= ceiling}
            aria-label={t("quantity.increase")}
            className="grid size-11 place-items-center text-ink disabled:opacity-40"
          >
            <PlusIcon className="size-4" strokeWidth={1.5} aria-hidden />
          </button>
        </form>
      </div>

      <form action={removeLineFormAction}>
        <input type="hidden" name="lineId" value={line.id} />
        <button
          type="submit"
          aria-label={t("remove", { name: line.name })}
          className="grid size-11 place-items-center text-stone-text hover:text-ink"
        >
          <Trash2Icon className="size-4" strokeWidth={1.5} aria-hidden />
        </button>
      </form>
    </div>
  );
}

/** The drawer's controls, which may assume JavaScript and report a rejection. */
function LiveControls({ line }: { readonly line: CartLine }) {
  const t = useTranslations("cart");
  const setQuantity = useSetLineQuantity();
  const remove = useRemoveLine();
  const pendingLineId = useCartStore((state) => state.pendingLineId);
  const setPendingLine = useCartStore((state) => state.setPendingLine);
  const isPending = pendingLineId === line.id;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <QuantityStepper
        value={line.quantity}
        disabled={isPending}
        onChange={(next) => {
          setPendingLine(line.id);
          setQuantity.mutate({ lineId: line.id, quantity: next });
        }}
      />
      <button
        type="button"
        onClick={() => {
          setPendingLine(line.id);
          remove.mutate({ lineId: line.id });
        }}
        disabled={isPending}
        aria-label={t("remove", { name: line.name })}
        className="grid size-11 place-items-center text-stone-text hover:text-ink disabled:opacity-40"
      >
        <Trash2Icon className="size-4" strokeWidth={1.5} aria-hidden />
      </button>
    </div>
  );
}

export function CartLineRow({
  line,
  mode,
}: {
  readonly line: CartLine;
  readonly mode: "page" | "drawer";
}) {
  return (
    <li className="flex gap-4 border-b border-[var(--hairline-soft)] pb-6">
      <div className="relative size-20 shrink-0 overflow-hidden bg-sand">
        {line.image ? (
          <Image
            src={line.image.src}
            alt={line.image.alt}
            fill
            sizes="80px"
            className="object-contain p-2"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <LineDetails line={line} />
        <LineIssue line={line} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          {mode === "page" ? (
            <FormControls line={line} />
          ) : (
            <LiveControls line={line} />
          )}
          <LineTotal line={line} />
        </div>
      </div>
    </li>
  );
}

export function CartLineList({
  lines,
  mode,
}: {
  readonly lines: readonly CartLine[];
  readonly mode: "page" | "drawer";
}) {
  return (
    <ul className="m-0 flex list-none flex-col gap-6 p-0">
      {lines.map((line) => (
        <CartLineRow key={line.id} line={line} mode={mode} />
      ))}
    </ul>
  );
}
