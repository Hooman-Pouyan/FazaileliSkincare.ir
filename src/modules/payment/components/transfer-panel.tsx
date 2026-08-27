import { getTranslations } from "next-intl/server";
import { bankAccount } from "../bank-transfer.config";
import { submitClaimFormAction } from "../payment.actions";
import type { TransferView } from "../payment.reads";

/**
 * What a customer sees on an order awaiting a bank transfer — `COM4`.
 *
 * **It fails closed.** With no account configured, this says the details are
 * not available and offers no form: a payment instruction with an invented
 * account number is worse than no instruction, because somebody acts on it.
 * The same shape `PDP-09` uses for the enquiry link with no number behind it.
 *
 * The card number, IBAN and amount are `dir="ltr"` and `tabular-nums`: they are
 * digits inside a Persian paragraph, and without isolation the grouping
 * reorders visually — which on an account number is not a cosmetic problem.
 */
export async function TransferPanel({
  transfer,
}: {
  readonly transfer: TransferView;
}) {
  const t = await getTranslations("transfer");
  const account = bankAccount();

  if (transfer.claimStatus === "submitted") {
    return (
      <section className="flex flex-col gap-2 rounded-[var(--radius-surface)] bg-linen p-6">
        <h2 className="m-0 text-body font-medium">{t("title")}</h2>
        <p className="m-0 text-small leading-fa text-stone-text">
          {t("submitted")}
        </p>
        <p className="m-0 text-small leading-fa text-stone-text">
          {t("reviewNote")}
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5 rounded-[var(--radius-surface)] bg-linen p-6">
      <h2 className="m-0 text-body font-medium">{t("instructionsTitle")}</h2>

      {account ? (
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-small">
          <dt className="text-stone-text">{t("holder")}</dt>
          <dd className="m-0">{account.holder}</dd>
          <dt className="text-stone-text">{t("bank")}</dt>
          <dd className="m-0">{account.bank}</dd>
          <dt className="text-stone-text">{t("card")}</dt>
          <dd dir="ltr" className="m-0 text-start tabular-nums">
            {account.card.replace(/(\d{4})(?=\d)/g, "$1-")}
          </dd>
          {account.iban && (
            <>
              <dt className="text-stone-text">{t("iban")}</dt>
              <dd dir="ltr" className="m-0 text-start tabular-nums">
                {account.iban}
              </dd>
            </>
          )}
        </dl>
      ) : (
        <p className="m-0 text-small leading-fa text-stone-text">
          {t("notConfigured")}
        </p>
      )}

      <div className="flex flex-col gap-1 border-t border-[var(--hairline-soft)] pt-4">
        <span className="text-small text-stone-text">{t("amount")}</span>
        <span dir="ltr" className="text-start text-h3 tabular-nums">
          {transfer.expectedLabel}
        </span>
        <p className="m-0 text-micro leading-fa text-stone-text">
          {t("amountHint")}
        </p>
      </div>

      {account && (
        <form
          action={submitClaimFormAction}
          className="flex flex-col gap-4 border-t border-[var(--hairline-soft)] pt-4"
        >
          <h3 className="m-0 text-small font-medium">{t("claimTitle")}</h3>
          <input type="hidden" name="orderId" value={transfer.orderId} />

          <label className="flex flex-col gap-2">
            <span className="text-small text-stone-text">
              {t("trackingNumber")}
            </span>
            <input
              name="trackingNumber"
              required
              dir="ltr"
              inputMode="numeric"
              className="min-h-11 border border-[var(--hairline-soft)] bg-ground px-3 text-body tabular-nums"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-small text-stone-text">{t("last4")}</span>
            <input
              name="last4"
              required
              dir="ltr"
              inputMode="numeric"
              maxLength={4}
              pattern="\d{4}"
              className="min-h-11 border border-[var(--hairline-soft)] bg-ground px-3 text-body tabular-nums"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-small text-stone-text">
              {t("transferredAt")}
            </span>
            <input
              name="transferredAt"
              type="date"
              required
              dir="ltr"
              className="min-h-11 border border-[var(--hairline-soft)] bg-ground px-3 text-body tabular-nums"
            />
          </label>

          <button
            type="submit"
            className="inline-flex min-h-11 items-center self-start bg-ink px-6 text-small font-medium text-sand"
          >
            {t("submit")}
          </button>
        </form>
      )}
    </section>
  );
}
