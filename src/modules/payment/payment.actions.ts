"use server";

import { createHash } from "node:crypto";
import { z } from "zod";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { derivedUuid } from "@/lib/idempotency";
import { resolveViewer } from "@/modules/account/account.ownership";
import { rejectClaim, settleOrder, submitClaim } from "./bank-transfer.service";
import { resolveReviewer } from "./payment.authz";

/**
 * The two sides of a bank transfer — `COM4`.
 *
 * A customer submits a claim; staff accept or reject it. They are separate
 * actions with separate authorisation, because they are separate authorities:
 * one is somebody saying what they did, the other is somebody who has looked at
 * a bank statement. `AGENTS.md` rule 8.
 */

const claimInput = z.object({
  orderId: z.uuid(),
  /** The bank's reference for the transfer. Digits, as printed on a receipt. */
  trackingNumber: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\d{4,32}$/)),
  /** Last four of the card it was sent from — what staff match on. */
  last4: z.string().regex(/^\d{4}$/),
  transferredAt: z.string().min(1),
});

const reviewInput = z.object({ claimId: z.uuid() });
const rejectInput = z.object({
  claimId: z.uuid(),
  reason: z.string().trim().min(1).max(400),
});

export async function submitClaimFormAction(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const text = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : "";
  };

  const parsed = claimInput.safeParse({
    orderId: text("orderId"),
    trackingNumber: text("trackingNumber"),
    last4: text("last4"),
    transferredAt: text("transferredAt"),
  });
  if (!parsed.success) {
    return redirect({
      href: { pathname: "/account/orders", query: { error: "invalid" } },
      locale,
    });
  }

  const viewer = await resolveViewer();
  if (!viewer) {
    return redirect({
      href: { pathname: "/login", query: { next: "/account/orders" } },
      locale,
    });
  }

  const requestHash = createHash("sha256")
    .update(
      [parsed.data.orderId, parsed.data.trackingNumber, parsed.data.last4].join(
        " ",
      ),
    )
    .digest("hex");

  const result = await submitClaim({
    personId: viewer.personId,
    orderId: parsed.data.orderId,
    trackingNumber: parsed.data.trackingNumber,
    last4: parsed.data.last4,
    // A date the customer typed. Invalid input becomes "now" rather than
    // failing the submission — the authoritative timestamp is the bank's, and
    // this field only helps staff find the line on a statement.
    transferredAt: Number.isNaN(Date.parse(parsed.data.transferredAt))
      ? new Date()
      : new Date(parsed.data.transferredAt),
    idempotencyKey: derivedUuid([viewer.personId, requestHash]),
    requestHash,
  });

  return redirect({
    href: {
      pathname: `/account/orders/${parsed.data.orderId}`,
      query: result.kind === "ok" ? { claimed: "1" } : { error: result.reason },
    },
    locale,
  });
}

export async function acceptClaimFormAction(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const parsed = reviewInput.safeParse({ claimId: formData.get("claimId") });
  if (!parsed.success) {
    return redirect({
      href: { pathname: "/admin/transfers", query: { error: "invalid" } },
      locale,
    });
  }

  // Re-checked here, not inferred from the page having rendered. A Server
  // Action is a public endpoint: whoever can POST to it can call it.
  const reviewer = await resolveReviewer();
  if (!reviewer) {
    return redirect({
      href: {
        pathname: "/admin/transfers",
        query: { error: "not-authorised" },
      },
      locale,
    });
  }

  const result = await settleOrder({
    claimId: parsed.data.claimId,
    actorId: reviewer.personId,
    idempotencyKey: derivedUuid(["settle", parsed.data.claimId]),
  });

  return redirect({
    href: {
      pathname: "/admin/transfers",
      query: result.kind === "ok" ? { settled: "1" } : { error: result.reason },
    },
    locale,
  });
}

export async function rejectClaimFormAction(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const parsed = rejectInput.safeParse({
    claimId: formData.get("claimId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    // A rejection with no reason is not something a customer can act on, so an
    // empty reason fails rather than being stored as an empty string.
    return redirect({
      href: {
        pathname: "/admin/transfers",
        query: { error: "reason-required" },
      },
      locale,
    });
  }

  const reviewer = await resolveReviewer();
  if (!reviewer) {
    return redirect({
      href: {
        pathname: "/admin/transfers",
        query: { error: "not-authorised" },
      },
      locale,
    });
  }

  const result = await rejectClaim({
    claimId: parsed.data.claimId,
    actorId: reviewer.personId,
    reason: parsed.data.reason,
  });

  return redirect({
    href: {
      pathname: "/admin/transfers",
      query:
        result.kind === "ok" ? { rejected: "1" } : { error: result.reason },
    },
    locale,
  });
}
