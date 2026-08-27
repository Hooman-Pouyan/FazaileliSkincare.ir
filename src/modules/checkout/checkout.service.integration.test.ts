import { config as loadEnv } from "dotenv";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const { db } = await import("@/lib/db");
const {
  address,
  cart,
  cartItem,
  customerOrder,
  inventory,
  inventoryReservation,
  orderLine,
  payment,
  person,
  shippingRate,
  variant,
  product,
} = await import("@/lib/db/schema");
const { placeOrder } = await import("./checkout.service");

/**
 * `COM3`'s exit gate, against a real PostgreSQL:
 *
 * *"one cart/version/idempotency request creates at most one correct order with
 * server totals and durable access."*
 *
 * The idempotency case cannot be observed in a unit test, because the guarantee
 * is a unique index and the failure it prevents is two transactions in flight
 * together. A double-tapped submit button is not a hypothetical — it is the
 * single most common way a shop takes payment twice.
 */

const databaseUrl = process.env.DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;

/** Pinned by `cart.service.integration.test.ts`; left alone here. */
const CART_SUITE_SLUG = "ultra-a-z-cream";
const SUITE_EMAIL = "checkout-suite@example.invalid";
/** A label no other suite uses, so the rate can be found and removed precisely. */
const SUITE_RATE = "checkout-suite-courier";

/*
  Fars, not Khorasan Razavi — and courier, not post.

  The demo seed carries a national `pickup`, a national `post` and a
  Khorasan-Razavi `courier`. Inserting another national `post` violates
  `shipping_rate_national_unique`, and deactivating one would not make `post`
  unavailable anyway, because the seeded national rule would still answer. A
  province-scoped `courier` in a province the seed does not cover is unique on
  insert *and* genuinely disappears when deactivated — which is the only way
  "the method is no longer offered" can actually be tested.
*/
const SUITE_PROVINCE = "07";
const SUITE_CITY = "07-01";
const PHONE = "+989121112233";
const HASH = "test-request-hash";

let personId: string;
let addressId: string;
let variantId: string;
let rateId: string;

suite("placeOrder", () => {
  beforeAll(async () => {
    /*
      A variant no other integration suite touches.

      `cart.service.integration.test.ts` pins to `ultra-a-z-cream`; this suite
      and the bank-transfer one take opposite ends of everything else. Vitest runs
      these files in parallel against one database, so two suites mutating one
      variant's `on_hand` is the shared-state race `14.5` records — avoided by
      construction rather than by luck.
    */
    const [v] = await db
      .select({ id: variant.id })
      .from(variant)
      .innerJoin(product, eq(product.id, variant.productId))
      .where(and(eq(variant.isActive, true), ne(product.slug, CART_SUITE_SLUG)))
      .orderBy(asc(variant.id))
      .limit(1);
    if (!v)
      throw new Error("seed the demo catalogue before running this suite");
    variantId = v.id;
  });

  /**
   * Rebuilt before each test rather than tidied after one, and **scoped to this
   * suite's own rows**.
   *
   * The first version deleted `cart`, `inventory_reservation` and friends
   * outright. Alone it passed; in the full suite two tests failed, because
   * Vitest runs files in parallel and the blanket deletes were tearing down
   * `cart.service.integration.test.ts`'s fixtures mid-transaction. A shared
   * database makes an unscoped `beforeEach` a race against every other suite —
   * so everything here is reachable from this suite's own person, and the
   * shipping rate is found by a label only this file uses.
   *
   * Rebuilt *before* rather than cleaned *after*, because a test that fails
   * still has to leave a clean database behind, and cleanup at the end of a
   * body only runs when the body succeeded. `R-10`.
   */
  beforeEach(async () => {
    const mine = await db
      .select({ id: person.id })
      .from(person)
      .where(eq(person.email, SUITE_EMAIL));

    for (const owner of mine) {
      const carts = await db
        .select({ id: cart.id })
        .from(cart)
        .where(eq(cart.personId, owner.id));
      const orders = await db
        .select({ id: customerOrder.id })
        .from(customerOrder)
        .where(eq(customerOrder.personId, owner.id));

      if (carts.length > 0) {
        const cartIds = carts.map((c) => c.id);
        await db
          .delete(inventoryReservation)
          .where(inArray(inventoryReservation.sourceCartId, cartIds));
        await db.delete(cartItem).where(inArray(cartItem.cartId, cartIds));
        await db.delete(cart).where(inArray(cart.id, cartIds));
      }
      if (orders.length > 0) {
        const orderIds = orders.map((o) => o.id);
        await db.delete(inventoryReservation).where(
          inArray(
            inventoryReservation.orderLineId,
            (
              await db
                .select({ id: orderLine.id })
                .from(orderLine)
                .where(inArray(orderLine.orderId, orderIds))
            ).map((l) => l.id),
          ),
        );
        await db.delete(payment).where(inArray(payment.orderId, orderIds));
        await db.delete(orderLine).where(inArray(orderLine.orderId, orderIds));
        await db
          .delete(customerOrder)
          .where(inArray(customerOrder.id, orderIds));
      }
      await db.delete(address).where(eq(address.personId, owner.id));
      await db.delete(person).where(eq(person.id, owner.id));
    }

    await db.delete(shippingRate).where(eq(shippingRate.labelFa, SUITE_RATE));

    const [p] = await db
      .insert(person)
      .values({
        displayName: "Checkout Suite",
        email: SUITE_EMAIL,
        phone: PHONE,
        phoneVerified: true,
      })
      .returning({ id: person.id });
    personId = p!.id;

    const [a] = await db
      .insert(address)
      .values({
        personId,
        recipientName: "گیرنده",
        recipientPhone: PHONE,
        provinceCode: SUITE_PROVINCE,
        cityCode: SUITE_CITY,
        postalCode: "9183756789",
        line: "خیابان آزمون",
        isDefault: true,
      })
      .returning({ id: address.id });
    addressId = a!.id;

    const [r] = await db
      .insert(shippingRate)
      .values({
        method: "courier",
        provinceCode: SUITE_PROVINCE,
        amountRials: 800_000n,
        labelFa: SUITE_RATE,
        isActive: true,
      })
      .returning({ id: shippingRate.id });
    rateId = r!.id;

    // Enough stock that this suite never contends with another for the last
    // unit — the oversell case belongs to `cart.service.integration.test.ts`.
    await db
      .insert(inventory)
      .values({ variantId, onHand: 500 })
      .onConflictDoUpdate({
        target: inventory.variantId,
        set: { onHand: 500 },
      });

    const [c] = await db
      .insert(cart)
      .values({
        personId,
        status: "active",
        // `cart.expires_at` is required — a cart is a lease, not a record.
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      })
      .returning({ id: cart.id });
    await db.insert(cartItem).values({ cartId: c!.id, variantId, quantity: 2 });
  });

  /*
    Assertions have to be scoped too, not just fixtures.

    `14.5` was about `beforeEach` deleting other suites' rows; this is its other
    half — `select().from(customerOrder)` counts every order in a database three
    suites share, so a test that asserts "exactly one order" passes alone and
    fails the moment anything else places one. Scope the read, not the schedule.
  */
  const myOrders = () =>
    db
      .select({ id: customerOrder.id })
      .from(customerOrder)
      .where(eq(customerOrder.personId, personId));

  const input = (key: string) => ({
    personId,
    addressId,
    method: "courier" as const,
    contactPhone: PHONE,
    idempotencyKey: key,
    requestHash: HASH,
  });

  it("prices the order from the server, never from the caller", async () => {
    const result = await placeOrder(input(crypto.randomUUID()));
    expect(result.kind).toBe("ok");

    const [order] = await db
      .select({
        subtotal: customerOrder.subtotalRials,
        shipping: customerOrder.shippingRials,
        total: customerOrder.totalRials,
      })
      .from(customerOrder)
      .where(eq(customerOrder.personId, personId));

    const [line] = await db
      .select({
        unit: orderLine.unitPriceRials,
        quantity: orderLine.quantity,
        total: orderLine.lineTotalRials,
      })
      .from(orderLine)
      .where(
        inArray(
          orderLine.orderId,
          (await myOrders()).map((o) => o.id),
        ),
      );

    // Given: nothing in the input said what anything costs.
    // Then: every number is derived, and the arithmetic closes.
    expect(line!.total).toBe(line!.unit * BigInt(line!.quantity));
    expect(order!.subtotal).toBe(line!.total);
    expect(order!.shipping).toBe(800_000n);
    expect(order!.total).toBe(order!.subtotal + order!.shipping);
  });

  it("returns the same order for a repeated key instead of placing a second", async () => {
    const key = crypto.randomUUID();
    const first = await placeOrder(input(key));
    const second = await placeOrder(input(key));

    expect(first).toMatchObject({ kind: "ok", replayed: false });
    expect(second).toMatchObject({
      kind: "ok",
      orderId: first.kind === "ok" ? first.orderId : "",
      replayed: true,
    });

    expect(await myOrders()).toHaveLength(1);
  });

  it("creates one order when two identical requests are genuinely concurrent", async () => {
    // The double-tapped button. Both transactions are open together, so the
    // fast-path lookup cannot save us — the unique index has to.
    const key = crypto.randomUUID();
    const results = await Promise.allSettled([
      placeOrder(input(key)),
      placeOrder(input(key)),
    ]);

    expect(await myOrders()).toHaveLength(1);

    // At least one caller must have been told it worked; neither may be told
    // something happened that did not.
    const succeeded = results.filter(
      (r) => r.status === "fulfilled" && r.value.kind === "ok",
    );
    expect(succeeded.length).toBeGreaterThanOrEqual(1);
  });

  it("refuses a reused key that carries a different intent", async () => {
    const key = crypto.randomUUID();
    await placeOrder(input(key));
    const conflicting = await placeOrder({
      ...input(key),
      requestHash: "a-different-intent",
    });

    // Silently returning the original would hide either a bug or an attack.
    expect(conflicting).toMatchObject({
      kind: "rejected",
      reason: "idempotency-conflict",
    });
  });

  it("refuses an address belonging to somebody else", async () => {
    const [other] = await db
      .insert(person)
      .values({
        displayName: "Someone Else",
        email: "other-suite@example.invalid",
      })
      .returning({ id: person.id });
    const [theirs] = await db
      .insert(address)
      .values({
        personId: other!.id,
        recipientName: "دیگری",
        recipientPhone: PHONE,
        provinceCode: "23",
        cityCode: "23-01",
        postalCode: "1234567890",
        line: "جای دیگر",
      })
      .returning({ id: address.id });

    const result = await placeOrder({
      ...input(crypto.randomUUID()),
      addressId: theirs!.id,
    });

    // Owner-scoped in the `where`, so a foreign id finds nothing at all.
    expect(result).toMatchObject({
      kind: "rejected",
      reason: "address-not-found",
    });
    await db.delete(address).where(eq(address.id, theirs!.id));
    await db.delete(person).where(eq(person.id, other!.id));
  });

  it("refuses when the chosen method is no longer offered", async () => {
    await db
      .update(shippingRate)
      .set({ isActive: false })
      .where(eq(shippingRate.id, rateId));

    const result = await placeOrder(input(crypto.randomUUID()));

    // A rate can be deactivated between rendering the page and submitting it.
    expect(result).toMatchObject({
      kind: "rejected",
      reason: "shipping-unavailable",
    });
    expect(await myOrders()).toHaveLength(0);
  });

  it("binds reservations to the order line without consuming them", async () => {
    // `COM-D6`: an unpaid order is not a dispatched one. Stock moves at
    // settlement, not here — but the hold must stop expiring.
    const [item] = await db
      .select({ id: cartItem.id, cartId: cartItem.cartId })
      .from(cartItem);
    await db.insert(inventoryReservation).values({
      variantId,
      sourceCartId: item!.cartId,
      sourceCartItemId: item!.id,
      quantity: 2,
      status: "active",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      idempotencyKey: crypto.randomUUID(),
    });

    await placeOrder(input(crypto.randomUUID()));

    const [held] = await db
      .select({
        status: inventoryReservation.status,
        orderLineId: inventoryReservation.orderLineId,
        expiresAt: inventoryReservation.expiresAt,
      })
      .from(inventoryReservation);

    expect(held!.status).toBe("active");
    expect(held!.orderLineId).not.toBeNull();
    expect(held!.expiresAt.getTime()).toBeGreaterThan(
      Date.now() + 24 * 60 * 60 * 1000,
    );
  });

  it("marks the cart converted so it cannot be checked out twice", async () => {
    await placeOrder(input(crypto.randomUUID()));
    const [spent] = await db.select({ status: cart.status }).from(cart);
    expect(spent!.status).toBe("converted");

    const again = await placeOrder(input(crypto.randomUUID()));
    expect(again).toMatchObject({ kind: "rejected", reason: "empty-cart" });
  });

  it("creates exactly one pending payment attempt for the order total", async () => {
    await placeOrder(input(crypto.randomUUID()));
    const mine = (await myOrders()).map((o) => o.id);
    const attempts = await db
      .select({
        method: payment.method,
        status: payment.status,
        amount: payment.amountRials,
      })
      .from(payment)
      .where(inArray(payment.orderId, mine));
    const [order] = await db
      .select({ total: customerOrder.totalRials })
      .from(customerOrder)
      .where(eq(customerOrder.personId, personId));

    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      method: "bank_transfer",
      status: "pending",
      amount: order!.total,
    });
  });
});
