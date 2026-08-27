import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/container";
import { formatJalali } from "@/lib/jalali";
import { Link } from "@/i18n/navigation";
import type { OrderDetailView } from "../account.reads";
import { TransferPanel } from "@/modules/payment/components/transfer-panel";
import type { TransferView } from "@/modules/payment/payment.reads";

/**
 * The order detail page, which **is** the invoice.
 *
 * Every line renders `order_line`'s snapshots — the product name, variant, SKU
 * and unit price as they were at purchase. Nothing here joins the catalogue,
 * which is the whole point: a price change or a rename must not rewrite a
 * document somebody has already been sent. `COM-D5`.
 *
 * The address is the order's own `addressSnapshot` for the same reason, not a
 * join to the address book — a customer who later deletes that address still
 * has an invoice that says where the parcel went.
 *
 * Printable because that is what an Iranian customer will do with it, and
 * because a print stylesheet is cheaper than a PDF pipeline nobody asked for.
 */

type AddressSnapshot = {
  recipientName?: string;
  recipientPhone?: string;
  provinceName?: string;
  cityName?: string;
  postalCode?: string;
  line?: string;
};

function readSnapshot(value: unknown): AddressSnapshot | null {
  if (typeof value !== "object" || value === null) return null;
  return value as AddressSnapshot;
}

export async function OrderDetailScreen({
  order,
  transfer = null,
}: {
  readonly order: OrderDetailView;
  readonly transfer?: TransferView | null;
}) {
  const t = await getTranslations("account");
  const shipTo = readSnapshot(order.addressSnapshot);

  return (
    <main>
      <Container className="flex flex-col gap-8 pt-14 pb-[var(--space-9)]">
        <Link
          href="/account/orders"
          className="inline-flex min-h-11 items-center self-start text-small text-stone-text hover:text-ink print:hidden"
        >
          {t("order.back")}
        </Link>

        <header className="flex flex-col gap-2">
          <h1 className="m-0 text-h2 font-bold">
            {t("order.title", { number: order.orderNumber })}
          </h1>
          <p className="m-0 text-small text-stone-text">
            {order.placedAt
              ? formatJalali(order.placedAt)
              : t("orders.notPlaced")}
            {" · "}
            {t(`status.${order.status}`)}
          </p>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-small">
            <thead>
              <tr className="border-b border-[var(--hairline)] text-start text-stone-text">
                <th className="py-2 text-start font-medium">
                  {t("order.product")}
                </th>
                <th className="py-2 text-start font-medium">
                  {t("order.sku")}
                </th>
                <th className="py-2 text-start font-medium">
                  {t("order.quantity")}
                </th>
                <th className="py-2 text-start font-medium">
                  {t("order.unitPrice")}
                </th>
                <th className="py-2 text-start font-medium">
                  {t("order.lineTotal")}
                </th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr
                  key={`${line.sku}-${line.productName}`}
                  className="border-b border-[var(--hairline-soft)]"
                >
                  <td className="py-3">
                    {line.productName}
                    {line.variantName ? ` — ${line.variantName}` : ""}
                  </td>
                  <td dir="ltr" className="py-3 tabular-nums">
                    {line.sku}
                  </td>
                  <td className="py-3 tabular-nums">{line.quantity}</td>
                  <td className="py-3 tabular-nums">
                    {line.unitPrice?.label ?? "—"}
                  </td>
                  <td className="py-3 tabular-nums">
                    {line.lineTotal?.label ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-8 lg:grid-cols-[6fr_4fr]">
          {shipTo && (
            <section className="flex flex-col gap-2">
              <h2 className="m-0 text-body font-medium">
                {t("order.shippingTo")}
              </h2>
              <p className="m-0 text-small leading-fa text-stone-text">
                {[
                  shipTo.recipientName,
                  shipTo.provinceName,
                  shipTo.cityName,
                  shipTo.line,
                  shipTo.postalCode,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </section>
          )}

          <aside className="flex flex-col gap-2 rounded-[var(--radius-surface)] bg-linen p-6">
            {(
              [
                ["order.subtotal", order.subtotal],
                ["order.shipping", order.shipping],
                ["order.discount", order.discount],
              ] as const
            ).map(([key, value]) => (
              <p key={key} className="m-0 flex justify-between text-small">
                <span className="text-stone-text">{t(key)}</span>
                <span className="tabular-nums">{value?.label ?? "—"}</span>
              </p>
            ))}
            <p className="m-0 flex justify-between border-t border-[var(--hairline)] pt-2 text-body font-medium">
              <span>{t("order.total")}</span>
              <span className="tabular-nums">{order.total?.label ?? "—"}</span>
            </p>
          </aside>
        </div>

        {transfer && <TransferPanel transfer={transfer} />}

        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-body font-medium">{t("order.payments")}</h2>
          {order.payments.length === 0 ? (
            <p className="m-0 text-small text-stone-text">
              {t("order.noPayments")}
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {order.payments.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--hairline-soft)] pb-2 text-small"
                >
                  <span>
                    {t(`paymentMethod.${entry.method}`)}
                    {" · "}
                    {t(`paymentStatus.${entry.status}`)}
                    {entry.transferTrackingNumber
                      ? ` · ${t("order.trackingNumber")} ${entry.transferTrackingNumber}`
                      : ""}
                  </span>
                  <span className="tabular-nums">
                    {entry.amount?.label ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Container>
    </main>
  );
}
