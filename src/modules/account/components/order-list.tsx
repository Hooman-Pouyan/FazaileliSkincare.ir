import { getTranslations } from "next-intl/server";
import { formatJalali } from "@/lib/jalali";
import { Link } from "@/i18n/navigation";
import type { OrderSummaryView } from "../account.reads";

/**
 * Orders, newest first.
 *
 * Dates render Jalali from a `timestamptz` — `AGENTS.md` rule 2: UTC is stored,
 * the calendar is a rendering concern, and one utility owns the conversion.
 *
 * Empty is the state this ships in and will stay in until Phase E places a
 * real order, so it says so plainly and offers the shop rather than framing
 * nothing.
 */
export async function OrderList({
  orders,
}: {
  readonly orders: readonly OrderSummaryView[];
}) {
  const t = await getTranslations("account");

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="m-0 text-body text-stone-text">{t("orders.empty")}</p>
        <Link
          href="/shop"
          className="inline-flex min-h-11 items-center border-b border-[color:var(--gold)] pb-1 text-small font-medium"
        >
          {t("orders.emptyAction")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-4 p-0">
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--hairline-soft)] pb-4"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span dir="ltr" className="text-body font-medium tabular-nums">
              {order.orderNumber}
            </span>
            <span className="text-small text-stone-text">
              {order.placedAt
                ? formatJalali(order.placedAt)
                : t("orders.notPlaced")}
              {" · "}
              {t(`status.${order.status}`)}
              {" · "}
              {t("orders.items", { count: order.itemCount })}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            {order.total && (
              <span className="text-body font-medium tabular-nums">
                {order.total.label}
              </span>
            )}
            <Link
              href={`/account/orders/${order.id}`}
              className="inline-flex min-h-11 items-center border-b border-[color:var(--gold)] pb-1 text-small font-medium"
            >
              {t("orders.view")}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
