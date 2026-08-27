import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/container";
import { formatJalali } from "@/lib/jalali";
import {
  acceptClaimFormAction,
  rejectClaimFormAction,
} from "../payment.actions";
import type { ClaimQueueRow } from "../payment.reads";

/**
 * The staff transfer queue — `COM4`.
 *
 * Each row is what somebody needs in order to find one line on a bank
 * statement: the expected amount (unique per order by construction), the
 * reference the customer gave, the last four of their card, and when they say
 * they sent it.
 *
 * **Accepting is the only path that marks an order paid**, and it is a form
 * post to a Server Action that re-checks staff authorisation — rendering this
 * page is not what authorises the write. Rejecting requires a reason, because
 * "we could not find your transfer" with nothing further is not something a
 * customer can act on.
 */
export async function TransferQueueScreen({
  claims,
}: {
  readonly claims: readonly ClaimQueueRow[];
}) {
  const t = await getTranslations("admin");

  return (
    <main>
      <Container className="flex flex-col gap-8 pt-14 pb-[var(--space-9)]">
        <h1 className="m-0 text-h2 font-bold">{t("transfersTitle")}</h1>

        {claims.length === 0 ? (
          <p className="m-0 text-body text-stone-text">{t("empty")}</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {claims.map((claim) => (
              <li
                key={claim.claimId}
                className="flex flex-col gap-4 border border-[var(--hairline-soft)] p-5"
              >
                <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label={t("order")} value={claim.orderNumber} ltr />
                  <Field label={t("customer")} value={claim.customerName} />
                  <Field
                    label={t("expected")}
                    value={claim.expectedLabel}
                    ltr
                  />
                  <Field
                    label={t("submittedAt")}
                    value={formatJalali(claim.submittedAt)}
                  />
                  <Field
                    label={t("tracking")}
                    value={claim.trackingNumber ?? "—"}
                    ltr
                  />
                  <Field label={t("last4")} value={claim.last4 ?? "—"} ltr />
                </div>

                <div className="flex flex-wrap items-end gap-4 border-t border-[var(--hairline-soft)] pt-4">
                  <form action={acceptClaimFormAction}>
                    <input type="hidden" name="claimId" value={claim.claimId} />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center bg-ink px-6 text-small font-medium text-sand"
                    >
                      {t("accept")}
                    </button>
                  </form>

                  <form
                    action={rejectClaimFormAction}
                    className="flex flex-1 flex-wrap items-end gap-3"
                  >
                    <input type="hidden" name="claimId" value={claim.claimId} />
                    <label className="flex min-w-[14rem] flex-1 flex-col gap-2">
                      <span className="text-small text-stone-text">
                        {t("rejectReason")}
                      </span>
                      <input
                        name="reason"
                        required
                        maxLength={400}
                        className="min-h-11 border border-[var(--hairline-soft)] bg-ground px-3 text-body"
                      />
                    </label>
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center border border-[var(--hairline)] px-6 text-small font-medium"
                    >
                      {t("reject")}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </main>
  );
}

function Field({
  label,
  value,
  ltr = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly ltr?: boolean;
}) {
  return (
    <span className="flex flex-col gap-1">
      <span className="text-micro text-stone-text">{label}</span>
      <span
        {...(ltr ? { dir: "ltr" as const } : {})}
        className={ltr ? "text-start text-small tabular-nums" : "text-small"}
      >
        {value}
      </span>
    </span>
  );
}
