import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  auditLog,
  bankTransferClaim,
  customerOrder,
  inventory,
  inventoryMovement,
  inventoryReservation,
  notificationOutbox,
  orderLine,
  payment,
  paymentSettlement,
} from "@/lib/db/schema";
import { derivedUuid } from "@/lib/idempotency";
import { transferAmountFor, type Rials } from "@/lib/money";

/**
 * Bank transfer — `COM4`, and the launch payment method (`COM-D1`).
 *
 * **The exit gate is a sentence worth repeating: a receipt alone can never mark
 * an order paid.** A customer submitting a claim is telling us what they say
 * they did. It is evidence, not money. `AGENTS.md` rule 8 states it directly,
 * and the shape of this file is that rule: `submitClaim` writes a claim and
 * moves nothing, and only `settleOrder` — reached from a staff review — touches
 * stock or marks anything paid.
 *
 * **The expected amount is unique per order.** `transferAmountFor` adds a
 * deterministic 100–999 toman to the total, derived from the order id, so a
 * line on a bank statement maps to exactly one order at a glance. Deterministic
 * rather than random because it has to be recomputable from the order alone,
 * months later, by someone reconciling a statement.
 */

export type ClaimInput = Readonly<{
  personId: string;
  orderId: string;
  trackingNumber: string;
  last4: string;
  transferredAt: Date;
  idempotencyKey: string;
  requestHash: string;
}>;

export type ClaimResult =
  | Readonly<{ kind: "ok"; claimId: string; replayed: boolean }>
  | Readonly<{
      kind: "rejected";
      reason: "order-not-found" | "already-settled" | "duplicate-tracking";
    }>;

/**
 * A customer says they sent the money.
 *
 * Writes a claim and **nothing else**. No order status changes, no stock moves,
 * no payment is marked received. The whole point of the method is that a human
 * checks the bank before any of that happens.
 */
export async function submitClaim(input: ClaimInput): Promise<ClaimResult> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({
        orderId: customerOrder.id,
        status: customerOrder.status,
        totalRials: customerOrder.totalRials,
        paymentId: payment.id,
        paymentStatus: payment.status,
      })
      .from(customerOrder)
      .innerJoin(payment, eq(payment.orderId, customerOrder.id))
      .where(
        and(
          eq(customerOrder.id, input.orderId),
          // Owner-scoped in the `where`: somebody else's order is not found,
          // rather than found and refused.
          eq(customerOrder.personId, input.personId),
          eq(payment.method, "bank_transfer"),
        ),
      )
      .limit(1);

    const order = rows[0];
    if (!order) return { kind: "rejected", reason: "order-not-found" } as const;

    if (order.paymentStatus === "settled" || order.status === "paid") {
      return { kind: "rejected", reason: "already-settled" } as const;
    }

    const existing = await tx
      .select({ id: bankTransferClaim.id })
      .from(bankTransferClaim)
      .where(
        eq(bankTransferClaim.submissionIdempotencyKey, input.idempotencyKey),
      )
      .limit(1);

    // A resubmitted form is not a second claim.
    if (existing[0]) {
      return { kind: "ok", claimId: existing[0].id, replayed: true } as const;
    }

    const [claim] = await tx
      .insert(bankTransferClaim)
      .values({
        paymentId: order.paymentId,
        status: "submitted",
        expectedAmountRials: transferAmountFor(
          order.totalRials as Rials,
          order.orderId,
        ),
        trackingNumber: input.trackingNumber,
        last4OfCard: input.last4,
        transferredAt: input.transferredAt,
        submissionIdempotencyKey: input.idempotencyKey,
        submissionRequestHash: input.requestHash,
      })
      .returning({ id: bankTransferClaim.id });

    /*
      The payment moves to `submitted`, and the order to `payment_review`.

      Neither is `paid` and neither is `settled` — `COM-D6` keeps the two state
      machines apart, and both of these say the same true thing: somebody has
      told us something, and nobody has checked it yet.
    */
    await tx
      .update(payment)
      .set({ status: "submitted", updatedAt: new Date() })
      .where(eq(payment.id, order.paymentId));

    await tx
      .update(customerOrder)
      .set({ status: "payment_review", updatedAt: new Date() })
      .where(eq(customerOrder.id, order.orderId));

    return { kind: "ok", claimId: claim!.id, replayed: false } as const;
  });
}

export type SettleResult =
  | Readonly<{ kind: "ok"; replayed: boolean }>
  | Readonly<{
      kind: "rejected";
      reason:
        | "claim-not-found"
        | "not-reviewable"
        | "stock-unavailable"
        | "not-authorised";
      /** Present for `stock-unavailable`: what could not be met. */
      variantId?: string;
    }>;

/**
 * Staff confirm the money arrived — the only path that marks an order paid.
 *
 * Everything happens in one transaction, because `COM4` requires the stock,
 * movement, reservation, payment, order, audit and outbox effects to be atomic:
 * an order marked paid whose stock was never decremented is an oversell that
 * nobody will notice until the shelf is empty.
 *
 * **Late funds against gone stock are refused rather than forced.** If the goods
 * are no longer obtainable, this rejects and leaves the claim for the
 * refund-or-contact queue. Settling anyway would promise a customer something
 * the shop does not have, and unpicking that costs more than the refusal.
 */
export async function settleOrder(
  input: Readonly<{
    claimId: string;
    actorId: string;
    idempotencyKey: string;
  }>,
): Promise<SettleResult> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({
        claimId: bankTransferClaim.id,
        claimStatus: bankTransferClaim.status,
        paymentId: payment.id,
        paymentStatus: payment.status,
        orderId: customerOrder.id,
        orderStatus: customerOrder.status,
        totalRials: customerOrder.totalRials,
      })
      .from(bankTransferClaim)
      .innerJoin(payment, eq(payment.id, bankTransferClaim.paymentId))
      .innerJoin(customerOrder, eq(customerOrder.id, payment.orderId))
      .where(eq(bankTransferClaim.id, input.claimId))
      .limit(1);

    const found = rows[0];
    if (!found) return { kind: "rejected", reason: "claim-not-found" } as const;

    // Settling twice must be safe: a staff double-click, a retried request
    // after a timeout. The settlement's unique key is the real guarantee.
    const already = await tx
      .select({ id: paymentSettlement.id })
      .from(paymentSettlement)
      .where(eq(paymentSettlement.paymentId, found.paymentId))
      .limit(1);
    if (already[0]) return { kind: "ok", replayed: true } as const;

    if (found.claimStatus !== "submitted") {
      return { kind: "rejected", reason: "not-reviewable" } as const;
    }

    const lines = await tx
      .select({
        id: orderLine.id,
        variantId: orderLine.variantId,
        quantity: orderLine.quantity,
      })
      .from(orderLine)
      .where(eq(orderLine.orderId, found.orderId));

    const now = new Date();

    for (const line of lines) {
      // Lock the row before reading it, so two settlements cannot both see the
      // same on-hand and both decrement it.
      const stock = await tx
        .select({ onHand: inventory.onHand })
        .from(inventory)
        .where(eq(inventory.variantId, line.variantId))
        .for("update")
        .limit(1);

      const onHand = Number(stock[0]?.onHand ?? 0);
      if (onHand < line.quantity) {
        return {
          kind: "rejected",
          reason: "stock-unavailable",
          variantId: line.variantId,
        } as const;
      }

      const resulting = onHand - line.quantity;

      await tx
        .update(inventory)
        .set({ onHand: resulting, updatedAt: now })
        .where(eq(inventory.variantId, line.variantId));

      // The ledger, not just the balance. `AGENTS.md` rule 1: stock changes are
      // movements, so how a number got where it is stays answerable.
      await tx.insert(inventoryMovement).values({
        variantId: line.variantId,
        type: "sale",
        quantityDelta: -line.quantity,
        resultingOnHand: resulting,
        relatedAggregateType: "customer_order",
        relatedAggregateId: found.orderId,
        actorId: input.actorId,
        reason: "bank transfer settled",
        /*
          One movement per line, keyed so a retried settlement collides with
          its own first attempt rather than writing the ledger twice. Derived
          rather than concatenated because the column is `uuid` — a joined
          string is not one, which is how this was caught.
        */
        idempotencyKey: derivedUuid([input.idempotencyKey, line.id]),
      });

      // Now the hold is spent — the goods have left the balance, so continuing
      // to reserve them would double-count against everyone else.
      await tx
        .update(inventoryReservation)
        .set({ status: "consumed", consumedAt: now, updatedAt: now })
        .where(
          and(
            eq(inventoryReservation.orderLineId, line.id),
            eq(inventoryReservation.status, "active"),
          ),
        );
    }

    await tx
      .update(bankTransferClaim)
      .set({
        status: "accepted",
        reviewedBy: input.actorId,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(bankTransferClaim.id, found.claimId));

    await tx
      .update(payment)
      .set({ status: "settled", updatedAt: now })
      .where(eq(payment.id, found.paymentId));

    await tx.insert(paymentSettlement).values({
      paymentId: found.paymentId,
      orderId: found.orderId,
      amountRials: found.totalRials,
      actorId: input.actorId,
      idempotencyKey: input.idempotencyKey,
    });

    await tx
      .update(customerOrder)
      .set({ status: "paid", updatedAt: now })
      .where(eq(customerOrder.id, found.orderId));

    await tx.insert(auditLog).values({
      actorId: input.actorId,
      action: "payment.settled",
      entityType: "customer_order",
      entityId: found.orderId,
      // `after` rather than a summary string: the audit table stores state, and
      // a reconciliation months later wants the amount, not a sentence.
      after: {
        claimId: found.claimId,
        paymentId: found.paymentId,
        amountRials: found.totalRials.toString(),
      },
    });

    /*
      The customer is told by the outbox, not by this transaction.

      Sending inside a transaction means either a message about a settlement
      that rolled back, or a settlement that fails because an SMS gateway was
      down. The row is committed with everything else; delivery is somebody
      else's retry problem.
    */
    await tx.insert(notificationOutbox).values({
      topic: "order.paid",
      aggregateType: "customer_order",
      aggregateId: found.orderId,
      payload: { orderId: found.orderId },
      deduplicationKey: `order.paid:${found.orderId}`,
    });

    return { kind: "ok", replayed: false } as const;
  });
}

/**
 * Staff reject a claim — the money did not arrive, or does not match.
 *
 * Deliberately separate from `settleOrder` rather than a boolean on it. The two
 * do genuinely different work: this moves no stock and creates no settlement,
 * and a rejection reason is required, because "we could not find your transfer"
 * with nothing further is not something a customer can act on.
 */
export async function rejectClaim(
  input: Readonly<{ claimId: string; actorId: string; reason: string }>,
): Promise<SettleResult> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({
        id: bankTransferClaim.id,
        status: bankTransferClaim.status,
        paymentId: bankTransferClaim.paymentId,
        orderId: payment.orderId,
      })
      .from(bankTransferClaim)
      .innerJoin(payment, eq(payment.id, bankTransferClaim.paymentId))
      .where(eq(bankTransferClaim.id, input.claimId))
      .limit(1);

    const claim = rows[0];
    if (!claim) return { kind: "rejected", reason: "claim-not-found" } as const;
    if (claim.status !== "submitted")
      return { kind: "rejected", reason: "not-reviewable" } as const;

    const now = new Date();

    await tx
      .update(bankTransferClaim)
      .set({
        status: "rejected",
        reviewedBy: input.actorId,
        reviewedAt: now,
        reviewReason: input.reason,
        updatedAt: now,
      })
      .where(eq(bankTransferClaim.id, claim.id));

    // Back to awaiting the transfer, not to failed: the customer can try
    // again, and an order killed by one mistyped tracking number is a sale
    // thrown away.
    await tx
      .update(payment)
      .set({ status: "pending", updatedAt: now })
      .where(eq(payment.id, claim.paymentId));

    await tx
      .update(customerOrder)
      .set({ status: "awaiting_transfer", updatedAt: now })
      .where(eq(customerOrder.id, claim.orderId));

    await tx.insert(auditLog).values({
      actorId: input.actorId,
      action: "payment.claim_rejected",
      entityType: "customer_order",
      entityId: claim.orderId,
      after: { claimId: claim.id, reason: input.reason },
    });

    return { kind: "ok", replayed: false } as const;
  });
}

/** Kept next to the service so a screen and a test agree on the amount. */
export function expectedAmountFor(totalRials: Rials, orderId: string): Rials {
  return transferAmountFor(totalRials, orderId);
}
