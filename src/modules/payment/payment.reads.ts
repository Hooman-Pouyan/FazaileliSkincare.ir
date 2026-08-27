import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bankTransferClaim,
  customerOrder,
  payment,
  person,
} from "@/lib/db/schema";
import { formatToman, transferAmountFor, type Rials } from "@/lib/money";

/**
 * The staff transfer queue — `COM4`.
 *
 * Only `submitted` claims: an accepted or rejected one has been dealt with, and
 * a queue that keeps showing settled work is a queue nobody trusts. Oldest
 * first, because someone has been waiting for their order longer than anyone
 * else and that is the only fair order to work in.
 */

export type ClaimQueueRow = Readonly<{
  claimId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  contactPhone: string;
  expectedLabel: string;
  expectedRials: Rials;
  trackingNumber: string | null;
  last4: string | null;
  transferredAt: Date | null;
  submittedAt: Date;
}>;

export async function listSubmittedClaims(
  localeCode: string,
): Promise<readonly ClaimQueueRow[]> {
  const rows = await db
    .select({
      claimId: bankTransferClaim.id,
      orderId: customerOrder.id,
      orderNumber: customerOrder.orderNumber,
      customerName: person.displayName,
      contactPhone: customerOrder.contactPhone,
      expectedRials: bankTransferClaim.expectedAmountRials,
      trackingNumber: bankTransferClaim.trackingNumber,
      last4: bankTransferClaim.last4OfCard,
      transferredAt: bankTransferClaim.transferredAt,
      submittedAt: bankTransferClaim.createdAt,
    })
    .from(bankTransferClaim)
    .innerJoin(payment, eq(payment.id, bankTransferClaim.paymentId))
    .innerJoin(customerOrder, eq(customerOrder.id, payment.orderId))
    .leftJoin(person, eq(person.id, customerOrder.personId))
    .where(eq(bankTransferClaim.status, "submitted"))
    .orderBy(desc(bankTransferClaim.createdAt));

  return rows.map((row) => ({
    ...row,
    customerName: row.customerName ?? "—",
    expectedLabel: formatToman(
      row.expectedRials,
      localeCode === "fa" ? "fa" : "en",
    ),
  }));
}

/**
 * What a customer is told to transfer, for one of their own orders.
 *
 * Owner-scoped in the `where`. Returns null for an order that is not theirs or
 * is not awaiting a transfer — the screen then shows nothing rather than
 * instructions for somebody else's payment.
 */
export type TransferView = Readonly<{
  orderId: string;
  orderNumber: string;
  expectedRials: Rials;
  expectedLabel: string;
  status: string;
  claimStatus: string | null;
}>;

export async function getTransferFor(
  personId: string,
  orderId: string,
  localeCode: string,
): Promise<TransferView | null> {
  const rows = await db
    .select({
      orderId: customerOrder.id,
      orderNumber: customerOrder.orderNumber,
      totalRials: customerOrder.totalRials,
      status: customerOrder.status,
      claimStatus: bankTransferClaim.status,
    })
    .from(customerOrder)
    .innerJoin(payment, eq(payment.orderId, customerOrder.id))
    .leftJoin(bankTransferClaim, eq(bankTransferClaim.paymentId, payment.id))
    .where(
      and(
        eq(customerOrder.id, orderId),
        // The ownership this function's contract promises. Without it the
        // `personId` parameter was decoration and any signed-in customer could
        // read anyone's transfer instructions by id.
        eq(customerOrder.personId, personId),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const expectedRials = transferAmountFor(row.totalRials, row.orderId);

  return {
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    expectedRials,
    expectedLabel: formatToman(
      expectedRials,
      localeCode === "fa" ? "fa" : "en",
    ),
    status: row.status,
    claimStatus: row.claimStatus,
  };
}
