import { config as loadEnv } from "dotenv";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const { db } = await import("@/lib/db");
const {
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
  person,
  cart,
  variant,
  product,
} = await import("@/lib/db/schema");
const { rejectClaim, settleOrder, submitClaim } = await import(
  "./bank-transfer.service"
);
const { transferAmountFor } = await import("@/lib/money");

/**
 * `COM4`'s exit gate:
 *
 * *"a real staff-confirmed transfer settles once, and a receipt alone can never
 * mark an order paid."*
 *
 * The second half is the one worth testing hardest. A customer claiming they
 * sent money is evidence, not money — `AGENTS.md` rule 8 — and the failure mode
 * is a shop that dispatches goods against a receipt nobody checked.
 *
 * Fixtures are scoped to this suite's own person, because `14.5` records what
 * an unscoped `beforeEach` does to a suite running in parallel on a shared
 * database.
 */

const databaseUrl = process.env.DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;

/** Pinned by `cart.service.integration.test.ts`; left alone here. */
const CART_SUITE_SLUG = "ultra-a-z-cream";
const SUITE_EMAIL = "transfer-suite@example.invalid";
const STAFF_EMAIL = "transfer-staff@example.invalid";
const PHONE = "+989121114455";

let personId: string;
let staffId: string;
let orderId: string;
let orderLineId: string;
let paymentId: string;
let variantId: string;
const TOTAL = 41_800_000n;

suite("bank transfer", () => {
  beforeAll(async () => {
    const [v] = await db
      .select({ id: variant.id })
      .from(variant)
      .where(eq(variant.isActive, true))
      .orderBy(desc(variant.id))
      .limit(1);
    if (!v)
      throw new Error("seed the demo catalogue before running this suite");
    variantId = v.id;
  });

  beforeEach(async () => {
    const mine = await db
      .select({ id: person.id })
      .from(person)
      .where(inArray(person.email, [SUITE_EMAIL, STAFF_EMAIL]));

    for (const owner of mine) {
      const orders = await db
        .select({ id: customerOrder.id })
        .from(customerOrder)
        .where(eq(customerOrder.personId, owner.id));
      const orderIds = orders.map((o) => o.id);

      if (orderIds.length > 0) {
        const lines = await db
          .select({ id: orderLine.id })
          .from(orderLine)
          .where(inArray(orderLine.orderId, orderIds));
        if (lines.length > 0) {
          await db.delete(inventoryReservation).where(
            inArray(
              inventoryReservation.orderLineId,
              lines.map((l) => l.id),
            ),
          );
        }
        const payments = await db
          .select({ id: payment.id })
          .from(payment)
          .where(inArray(payment.orderId, orderIds));
        const paymentIds = payments.map((x) => x.id);
        if (paymentIds.length > 0) {
          await db
            .delete(bankTransferClaim)
            .where(inArray(bankTransferClaim.paymentId, paymentIds));
          await db
            .delete(paymentSettlement)
            .where(inArray(paymentSettlement.paymentId, paymentIds));
        }
        await db
          .delete(inventoryMovement)
          .where(inArray(inventoryMovement.relatedAggregateId, orderIds));
        await db
          .delete(notificationOutbox)
          .where(inArray(notificationOutbox.aggregateId, orderIds));
        await db.delete(auditLog).where(inArray(auditLog.entityId, orderIds));
        await db.delete(payment).where(inArray(payment.orderId, orderIds));
        await db.delete(orderLine).where(inArray(orderLine.orderId, orderIds));
        await db
          .delete(customerOrder)
          .where(inArray(customerOrder.id, orderIds));
      }
      const carts = await db
        .select({ id: cart.id })
        .from(cart)
        .where(eq(cart.personId, owner.id));
      if (carts.length > 0) {
        const cartIds = carts.map((c) => c.id);
        await db
          .delete(inventoryReservation)
          .where(inArray(inventoryReservation.sourceCartId, cartIds));
        await db.delete(cart).where(inArray(cart.id, cartIds));
      }
      await db.delete(person).where(eq(person.id, owner.id));
    }

    const [p] = await db
      .insert(person)
      .values({
        displayName: "Transfer Suite",
        email: SUITE_EMAIL,
        phone: PHONE,
        phoneVerified: true,
      })
      .returning({ id: person.id });
    personId = p!.id;

    const [s] = await db
      .insert(person)
      .values({ displayName: "Transfer Staff", email: STAFF_EMAIL })
      .returning({ id: person.id });
    staffId = s!.id;

    const [o] = await db
      .insert(customerOrder)
      .values({
        orderNumber: `FZ-TEST-${Date.now().toString(36).toUpperCase()}`,
        personId,
        contactPhone: PHONE,
        status: "awaiting_transfer",
        subtotalRials: TOTAL,
        shippingRials: 0n,
        discountRials: 0n,
        totalRials: TOTAL,
        checkoutIdempotencyKey: crypto.randomUUID(),
        checkoutRequestHash: "hash",
        placedAt: new Date(),
      })
      .returning({ id: customerOrder.id });
    orderId = o!.id;

    const [l] = await db
      .insert(orderLine)
      .values({
        orderId,
        variantId,
        productNameSnapshot: "کرم آزمون",
        skuSnapshot: "TEST-SKU",
        unitPriceRials: TOTAL,
        quantity: 1,
        lineTotalRials: TOTAL,
      })
      .returning({ id: orderLine.id });
    orderLineId = l!.id;

    const [pay] = await db
      .insert(payment)
      .values({
        orderId,
        method: "bank_transfer",
        status: "pending",
        amountRials: TOTAL,
        idempotencyKey: crypto.randomUUID(),
        requestHash: "hash",
      })
      .returning({ id: payment.id });
    paymentId = pay!.id;

    await db
      .insert(inventory)
      .values({ variantId, onHand: 10 })
      .onConflictDoUpdate({ target: inventory.variantId, set: { onHand: 10 } });

    /*
      A variant no other integration suite touches.

      `cart.service.integration.test.ts` pins to `ultra-a-z-cream`; this suite
      and the checkout one take opposite ends of everything else. Vitest runs
      these files in parallel against one database, so two suites mutating one
      variant's `on_hand` is the shared-state race `14.5` records — avoided by
      construction rather than by luck.
    */
    const [v] = await db
      .select({ id: variant.id })
      .from(variant)
      .innerJoin(product, eq(product.id, variant.productId))
      .where(and(eq(variant.isActive, true), ne(product.slug, CART_SUITE_SLUG)))
      .orderBy(desc(variant.id))
      .limit(1);
    if (!v)
      throw new Error("seed the demo catalogue before running this suite");
    variantId = v.id;
  });

  beforeEach(async () => {
    const mine = await db
      .select({ id: person.id })
      .from(person)
      .where(inArray(person.email, [SUITE_EMAIL, STAFF_EMAIL]));

    for (const owner of mine) {
      const orders = await db
        .select({ id: customerOrder.id })
        .from(customerOrder)
        .where(eq(customerOrder.personId, owner.id));
      const orderIds = orders.map((o) => o.id);

      if (orderIds.length > 0) {
        const lines = await db
          .select({ id: orderLine.id })
          .from(orderLine)
          .where(inArray(orderLine.orderId, orderIds));
        if (lines.length > 0) {
          await db.delete(inventoryReservation).where(
            inArray(
              inventoryReservation.orderLineId,
              lines.map((l) => l.id),
            ),
          );
        }
        const payments = await db
          .select({ id: payment.id })
          .from(payment)
          .where(inArray(payment.orderId, orderIds));
        const paymentIds = payments.map((x) => x.id);
        if (paymentIds.length > 0) {
          await db
            .delete(bankTransferClaim)
            .where(inArray(bankTransferClaim.paymentId, paymentIds));
          await db
            .delete(paymentSettlement)
            .where(inArray(paymentSettlement.paymentId, paymentIds));
        }
        await db
          .delete(inventoryMovement)
          .where(inArray(inventoryMovement.relatedAggregateId, orderIds));
        await db
          .delete(notificationOutbox)
          .where(inArray(notificationOutbox.aggregateId, orderIds));
        await db.delete(auditLog).where(inArray(auditLog.entityId, orderIds));
        await db.delete(payment).where(inArray(payment.orderId, orderIds));
        await db.delete(orderLine).where(inArray(orderLine.orderId, orderIds));
        await db
          .delete(customerOrder)
          .where(inArray(customerOrder.id, orderIds));
      }
      const carts = await db
        .select({ id: cart.id })
        .from(cart)
        .where(eq(cart.personId, owner.id));
      if (carts.length > 0) {
        const cartIds = carts.map((c) => c.id);
        await db
          .delete(inventoryReservation)
          .where(inArray(inventoryReservation.sourceCartId, cartIds));
        await db.delete(cart).where(inArray(cart.id, cartIds));
      }
      await db.delete(person).where(eq(person.id, owner.id));
    }

    const [p] = await db
      .insert(person)
      .values({
        displayName: "Transfer Suite",
        email: SUITE_EMAIL,
        phone: PHONE,
        phoneVerified: true,
      })
      .returning({ id: person.id });
    personId = p!.id;

    const [s] = await db
      .insert(person)
      .values({ displayName: "Transfer Staff", email: STAFF_EMAIL })
      .returning({ id: person.id });
    staffId = s!.id;

    const [o] = await db
      .insert(customerOrder)
      .values({
        orderNumber: `FZ-TEST-${Date.now().toString(36).toUpperCase()}`,
        personId,
        contactPhone: PHONE,
        status: "awaiting_transfer",
        subtotalRials: TOTAL,
        shippingRials: 0n,
        discountRials: 0n,
        totalRials: TOTAL,
        checkoutIdempotencyKey: crypto.randomUUID(),
        checkoutRequestHash: "hash",
        placedAt: new Date(),
      })
      .returning({ id: customerOrder.id });
    orderId = o!.id;

    const [l] = await db
      .insert(orderLine)
      .values({
        orderId,
        variantId,
        productNameSnapshot: "کرم آزمون",
        skuSnapshot: "TEST-SKU",
        unitPriceRials: TOTAL,
        quantity: 1,
        lineTotalRials: TOTAL,
      })
      .returning({ id: orderLine.id });
    orderLineId = l!.id;

    const [pay] = await db
      .insert(payment)
      .values({
        orderId,
        method: "bank_transfer",
        status: "pending",
        amountRials: TOTAL,
        idempotencyKey: crypto.randomUUID(),
        requestHash: "hash",
      })
      .returning({ id: payment.id });
    paymentId = pay!.id;

    await db
      .insert(inventory)
      .values({ variantId, onHand: 10 })
      .onConflictDoUpdate({ target: inventory.variantId, set: { onHand: 10 } });

    /*
      A reservation always names the cart it came from — `source_cart_id` is
      NOT NULL. An order-bound hold is a cart hold that was re-pointed at an
      order line, never one created from nothing, so the fixture builds the
      same shape `placeOrder` produces.
    */
    const [held] = await db
      .insert(cart)
      .values({
        personId,
        status: "converted",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      })
      .returning({ id: cart.id });

    await db.insert(inventoryReservation).values({
      variantId,
      sourceCartId: held!.id,
      orderLineId,
      quantity: 1,
      status: "active",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      idempotencyKey: crypto.randomUUID(),
    });
  });

  const claim = (key = crypto.randomUUID()) => ({
    personId,
    orderId,
    trackingNumber: "123456789",
    last4: "5678",
    transferredAt: new Date(),
    idempotencyKey: key,
    requestHash: "claim-hash",
  });

  describe("the expected amount", () => {
    it("is unique per order and recomputable from it", () => {
      // A line on a bank statement has to map to exactly one order at a
      // glance, and it must be derivable months later by whoever is
      // reconciling — so it is a function of the order id, never random.
      const a = transferAmountFor(TOTAL, "order-a");
      const b = transferAmountFor(TOTAL, "order-b");
      expect(a).not.toBe(b);
      expect(transferAmountFor(TOTAL, "order-a")).toBe(a);
      expect(a).toBeGreaterThan(TOTAL);
      expect(a - TOTAL).toBeLessThanOrEqual(9_990n);
    });
  });

  it("a claim alone moves no stock and marks nothing paid", async () => {
    // The exit gate's second half, and the whole reason this method has a
    // staff step at all.
    const result = await submitClaim(claim());
    expect(result.kind).toBe("ok");

    const [order] = await db
      .select({ status: customerOrder.status })
      .from(customerOrder)
      .where(eq(customerOrder.id, orderId));
    const [pay] = await db
      .select({ status: payment.status })
      .from(payment)
      .where(eq(payment.id, paymentId));
    const [stock] = await db
      .select({ onHand: inventory.onHand })
      .from(inventory)
      .where(eq(inventory.variantId, variantId));
    const settlements = await db
      .select({ id: paymentSettlement.id })
      .from(paymentSettlement)
      .where(eq(paymentSettlement.paymentId, paymentId));

    expect(order!.status).toBe("payment_review");
    expect(pay!.status).toBe("submitted");
    expect(stock!.onHand).toBe(10);
    expect(settlements).toHaveLength(0);
  });

  it("records the expected amount on the claim", async () => {
    await submitClaim(claim());
    const [row] = await db
      .select({ expected: bankTransferClaim.expectedAmountRials })
      .from(bankTransferClaim)
      .where(eq(bankTransferClaim.paymentId, paymentId));
    expect(row!.expected).toBe(transferAmountFor(TOTAL, orderId));
  });

  it("treats a resubmitted claim as the same claim", async () => {
    const key = crypto.randomUUID();
    const first = await submitClaim(claim(key));
    const second = await submitClaim(claim(key));

    expect(second).toMatchObject({
      kind: "ok",
      claimId: first.kind === "ok" ? first.claimId : "",
      replayed: true,
    });
    const all = await db
      .select({ id: bankTransferClaim.id })
      .from(bankTransferClaim)
      .where(eq(bankTransferClaim.paymentId, paymentId));
    expect(all).toHaveLength(1);
  });

  it("refuses a claim against somebody else's order", async () => {
    const result = await submitClaim({ ...claim(), personId: staffId });
    expect(result).toMatchObject({
      kind: "rejected",
      reason: "order-not-found",
    });
  });

  it("settles once, and every effect lands together", async () => {
    await submitClaim(claim());
    const [row] = await db
      .select({ id: bankTransferClaim.id })
      .from(bankTransferClaim)
      .where(eq(bankTransferClaim.paymentId, paymentId));

    const settled = await settleOrder({
      claimId: row!.id,
      actorId: staffId,
      idempotencyKey: crypto.randomUUID(),
    });
    expect(settled).toMatchObject({ kind: "ok", replayed: false });

    const [order] = await db
      .select({ status: customerOrder.status })
      .from(customerOrder)
      .where(eq(customerOrder.id, orderId));
    const [pay] = await db
      .select({ status: payment.status })
      .from(payment)
      .where(eq(payment.id, paymentId));
    const [stock] = await db
      .select({ onHand: inventory.onHand })
      .from(inventory)
      .where(eq(inventory.variantId, variantId));
    const [held] = await db
      .select({ status: inventoryReservation.status })
      .from(inventoryReservation)
      .where(eq(inventoryReservation.orderLineId, orderLineId));
    const movements = await db
      .select({
        delta: inventoryMovement.quantityDelta,
        resulting: inventoryMovement.resultingOnHand,
      })
      .from(inventoryMovement)
      .where(eq(inventoryMovement.relatedAggregateId, orderId));
    const settlements = await db
      .select({ amount: paymentSettlement.amountRials })
      .from(paymentSettlement)
      .where(eq(paymentSettlement.paymentId, paymentId));
    const audits = await db
      .select({ action: auditLog.action })
      .from(auditLog)
      .where(eq(auditLog.entityId, orderId));
    const outbox = await db
      .select({ topic: notificationOutbox.topic })
      .from(notificationOutbox)
      .where(eq(notificationOutbox.aggregateId, orderId));

    // Stock, movement, reservation, payment, order, audit and outbox — the
    // seven effects `COM4` requires to be atomic.
    expect(stock!.onHand).toBe(9);
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({ delta: -1, resulting: 9 });
    expect(held!.status).toBe("consumed");
    expect(pay!.status).toBe("settled");
    expect(order!.status).toBe("paid");
    expect(settlements).toHaveLength(1);
    expect(settlements[0]!.amount).toBe(TOTAL);
    expect(audits.map((a) => a.action)).toContain("payment.settled");
    expect(outbox.map((o) => o.topic)).toContain("order.paid");
  });

  it("is safe to settle twice — a staff double-click costs nothing", async () => {
    await submitClaim(claim());
    const [row] = await db
      .select({ id: bankTransferClaim.id })
      .from(bankTransferClaim)
      .where(eq(bankTransferClaim.paymentId, paymentId));

    await settleOrder({
      claimId: row!.id,
      actorId: staffId,
      idempotencyKey: crypto.randomUUID(),
    });
    const again = await settleOrder({
      claimId: row!.id,
      actorId: staffId,
      idempotencyKey: crypto.randomUUID(),
    });

    expect(again).toMatchObject({ kind: "ok", replayed: true });

    const [stock] = await db
      .select({ onHand: inventory.onHand })
      .from(inventory)
      .where(eq(inventory.variantId, variantId));
    const movements = await db
      .select({ id: inventoryMovement.id })
      .from(inventoryMovement)
      .where(eq(inventoryMovement.relatedAggregateId, orderId));

    // Decremented once, not twice — the second call must not re-run the ledger.
    expect(stock!.onHand).toBe(9);
    expect(movements).toHaveLength(1);
  });

  it("refuses to settle late funds when the stock has gone", async () => {
    await submitClaim(claim());
    const [row] = await db
      .select({ id: bankTransferClaim.id })
      .from(bankTransferClaim)
      .where(eq(bankTransferClaim.paymentId, paymentId));

    // The transfer arrived days later and the shelf is empty.
    await db
      .update(inventory)
      .set({ onHand: 0 })
      .where(eq(inventory.variantId, variantId));

    const result = await settleOrder({
      claimId: row!.id,
      actorId: staffId,
      idempotencyKey: crypto.randomUUID(),
    });

    // Settling anyway would promise goods the shop does not have. The claim is
    // left for the refund-or-contact queue rather than forced through.
    expect(result).toMatchObject({
      kind: "rejected",
      reason: "stock-unavailable",
    });
    const [order] = await db
      .select({ status: customerOrder.status })
      .from(customerOrder)
      .where(eq(customerOrder.id, orderId));
    expect(order!.status).toBe("payment_review");
    expect(
      await db
        .select({ id: paymentSettlement.id })
        .from(paymentSettlement)
        .where(eq(paymentSettlement.paymentId, paymentId)),
    ).toHaveLength(0);
  });

  it("returns a rejected claim to awaiting transfer, moving no stock", async () => {
    await submitClaim(claim());
    const [row] = await db
      .select({ id: bankTransferClaim.id })
      .from(bankTransferClaim)
      .where(eq(bankTransferClaim.paymentId, paymentId));

    const result = await rejectClaim({
      claimId: row!.id,
      actorId: staffId,
      reason: "no matching transfer on the statement",
    });
    expect(result.kind).toBe("ok");

    const [order] = await db
      .select({ status: customerOrder.status })
      .from(customerOrder)
      .where(eq(customerOrder.id, orderId));
    const [stock] = await db
      .select({ onHand: inventory.onHand })
      .from(inventory)
      .where(eq(inventory.variantId, variantId));

    // Back to awaiting, not failed: an order killed by one mistyped tracking
    // number is a sale thrown away.
    expect(order!.status).toBe("awaiting_transfer");
    expect(stock!.onHand).toBe(10);
  });

  it("will not settle a claim that has already been reviewed", async () => {
    await submitClaim(claim());
    const [row] = await db
      .select({ id: bankTransferClaim.id })
      .from(bankTransferClaim)
      .where(eq(bankTransferClaim.paymentId, paymentId));

    await rejectClaim({
      claimId: row!.id,
      actorId: staffId,
      reason: "not found",
    });
    const settled = await settleOrder({
      claimId: row!.id,
      actorId: staffId,
      idempotencyKey: crypto.randomUUID(),
    });

    expect(settled).toMatchObject({
      kind: "rejected",
      reason: "not-reviewable",
    });
  });
});
