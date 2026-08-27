import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import { formatIranianPhone } from "@/lib/auth/phone";
import type { CheckoutOutcome } from "../checkout.reads";
import { placeOrderFormAction } from "../checkout.actions";

/**
 * Checkout — `COM2`.
 *
 * **Every number on this page came from `getCheckout`.** The form posts an
 * address id and a method name, never a price; `placeOrder` re-quotes from the
 * same canonical inputs. `COM-D5`.
 *
 * One page rather than a wizard. There are three decisions — where, how, and
 * confirm — and splitting three decisions across three routes costs a customer
 * two round trips to learn the delivery price.
 *
 * Phone and postal values are wrapped `dir="ltr"`: a Persian paragraph is RTL,
 * and a `+98…` number inside it reorders visually without isolation. Rule 6.
 */
export async function CheckoutScreen({
  outcome,
}: {
  readonly outcome: CheckoutOutcome;
}) {
  const t = await getTranslations("checkout");
  const { page } = outcome;

  if (!page.isSignedIn) {
    return (
      <Shell title={t("title")}>
        <p className="m-0 text-body text-stone-text">{t("signInFirst")}</p>
        <Link
          href={{ pathname: "/login", query: { next: "/checkout" } }}
          className="inline-flex min-h-11 items-center self-start bg-ink px-6 text-small font-medium text-sand"
        >
          {t("signIn")}
        </Link>
      </Shell>
    );
  }

  if (outcome.kind === "blocked" && outcome.reason === "empty") {
    return (
      <Shell title={t("title")}>
        <p className="m-0 text-body text-stone-text">{t("emptyCart")}</p>
        <Link
          href="/shop"
          className="inline-flex min-h-11 items-center self-start border-b border-[color:var(--gold)] pb-1 text-small font-medium"
        >
          {t("emptyCartAction")}
        </Link>
      </Shell>
    );
  }

  if (outcome.kind === "blocked" && outcome.reason === "line-issues") {
    return (
      <Shell title={t("blockedTitle")}>
        <p className="m-0 text-body text-stone-text">{t("blockedBody")}</p>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {page.blockingIssues.map((issue) => (
            <li key={issue.lineId} className="text-small">
              {issue.name}
            </li>
          ))}
        </ul>
        <Link
          href="/cart"
          className="inline-flex min-h-11 items-center self-start bg-ink px-6 text-small font-medium text-sand"
        >
          {t("reviewCart")}
        </Link>
      </Shell>
    );
  }

  const canPlace = outcome.kind === "ready";

  return (
    <main>
      <Container className="flex flex-col gap-10 pt-14 pb-[var(--space-9)]">
        <header className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="m-0 text-h2 font-bold">{t("title")}</h1>
          <Link
            href="/cart"
            className="inline-flex min-h-11 items-center text-small text-stone-text hover:text-ink"
          >
            {t("backToCart")}
          </Link>
        </header>

        <form
          action={placeOrderFormAction}
          className="grid gap-10 lg:grid-cols-[7fr_5fr] lg:gap-14"
        >
          <div className="flex flex-col gap-10">
            <section className="flex flex-col gap-4">
              <h2 className="m-0 text-h3 font-bold">{t("addressTitle")}</h2>

              {page.addresses.length === 0 ? (
                <div className="flex flex-col items-start gap-3">
                  <p className="m-0 text-body text-stone-text">
                    {t("noAddress")}
                  </p>
                  <Link
                    href="/account"
                    className="inline-flex min-h-11 items-center border-b border-[color:var(--gold)] pb-1 text-small font-medium"
                  >
                    {t("addAddress")}
                  </Link>
                </div>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {page.addresses.map((entry) => (
                    <li key={entry.id}>
                      <label className="flex cursor-pointer items-start gap-3 border border-[var(--hairline-soft)] p-4 has-[:checked]:border-[color:var(--ink)]">
                        <input
                          type="radio"
                          name="addressId"
                          value={entry.id}
                          defaultChecked={entry.id === page.selectedAddressId}
                          className="mt-1 accent-[color:var(--ink)]"
                        />
                        <span className="flex min-w-0 flex-col gap-1">
                          <span className="text-body font-medium">
                            {entry.recipientName}
                          </span>
                          <span className="text-small leading-fa text-stone-text">
                            {entry.provinceName} · {entry.cityName} ·{" "}
                            {entry.line}
                          </span>
                          <span
                            dir="ltr"
                            className="text-start text-small tabular-nums text-stone-text"
                          >
                            {entry.postalCode} ·{" "}
                            {formatIranianPhone(entry.recipientPhone)}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="m-0 text-h3 font-bold">{t("shippingTitle")}</h2>

              {page.shippingOptions.length === 0 ? (
                <p className="m-0 text-body text-stone-text">
                  {t("noShipping")}
                </p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {page.shippingOptions.map((option) => (
                    <li key={option.rateId}>
                      <label className="flex cursor-pointer items-center justify-between gap-4 border border-[var(--hairline-soft)] p-4 has-[:checked]:border-[color:var(--ink)]">
                        <span className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="method"
                            value={option.method}
                            defaultChecked={
                              option.method === page.selectedMethod?.method
                            }
                            className="accent-[color:var(--ink)]"
                          />
                          <span className="text-body">{option.label}</span>
                        </span>
                        <span className="shrink-0 text-body tabular-nums">
                          {option.amountRials === 0n
                            ? t("free")
                            : option.amountLabel}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="flex h-fit flex-col gap-4 rounded-[var(--radius-surface)] bg-linen p-6 lg:sticky lg:top-[var(--space-7)]">
            <h2 className="m-0 text-body font-medium">{t("summaryTitle")}</h2>

            <p className="m-0 flex justify-between text-small">
              <span className="text-stone-text">{t("subtotal")}</span>
              <span className="tabular-nums">{page.subtotalLabel}</span>
            </p>
            <p className="m-0 flex justify-between text-small">
              <span className="text-stone-text">{t("shipping")}</span>
              <span className="tabular-nums">
                {page.shippingRials === 0n ? t("free") : page.shippingLabel}
              </span>
            </p>
            <p className="m-0 flex justify-between border-t border-[var(--hairline)] pt-3 text-body font-medium">
              <span>{t("total")}</span>
              <span className="tabular-nums">{page.totalLabel}</span>
            </p>

            <button
              type="submit"
              disabled={!canPlace}
              className="mt-2 inline-flex min-h-12 items-center justify-center bg-ink px-6 text-small font-medium text-sand disabled:opacity-40"
            >
              {t("place")}
            </button>
          </aside>
        </form>
      </Container>
    </main>
  );
}

function Shell({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <main>
      <Container className="flex max-w-[42rem] flex-col items-start gap-5 pt-14 pb-[var(--space-9)]">
        <h1 className="m-0 text-h2 font-bold">{title}</h1>
        {children}
      </Container>
    </main>
  );
}
