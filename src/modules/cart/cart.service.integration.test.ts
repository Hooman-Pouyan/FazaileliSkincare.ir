import { config as loadEnv } from "dotenv";
import { and, eq, inArray, sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const { db } = await import("@/lib/db");
const { cart, cartItem, inventory, inventoryReservation, product, variant } =
  await import("@/lib/db/schema");
const { addLineFor, removeLineFor, setLineQuantityFor } = await import(
  "./cart.service"
);
const { CART_RESERVATION_TTL_MS } = await import("./utils/reservations");
import type { CartOwner } from "./cart.ownership";

/**
 * `COM1`'s exit gate, against a real PostgreSQL — because every rule it states
 * is a rule about concurrent transactions, and none of them can be observed in
 * a unit test.
 *
 * *"Two carts cannot reserve more than on-hand stock, and retries/merges never
 * duplicate or silently reduce quantities."*
 *
 * The oversell case is the one that matters. Two adds that each read `onHand`
 * before either writes will both conclude a unit is free, and each row they
 * insert is individually valid — no constraint objects, and the last unit is
 * sold twice. It is only visible if two transactions are genuinely in flight
 * together, which is what these tests arrange.
 */

const GUEST_A: CartOwner = { kind: "guest", anonymousKeyHash: "a".repeat(64) };
const GUEST_B: CartOwner = { kind: "guest", anonymousKeyHash: "b".repeat(64) };

const databaseUrl = process.env.DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;

let variantId: string;

/**
 * Every anonymous key this suite ever uses, so cleanup is exhaustive.
 *
 * The contended tests need more than two carts, and naming them here rather
 * than inside a test is the point: `resetFixtures` runs in `beforeEach`, so a
 * test that *fails* still gets cleaned up before the next one. Tidying at the
 * end of a test body only works when the test passes, which is precisely the
 * case that does not need it — the lesson `R-10` records about the integration
 * suite leaving the development database damaged.
 */
const SUITE_KEYS = [
  "a".repeat(64),
  "b".repeat(64),
  ...Array.from({ length: 6 }, (_, i) => String(i).repeat(64).slice(0, 64)),
];

async function resetFixtures(onHand: number) {
  // Only this suite's carts are touched; the seeded catalogue is left alone.
  const carts = await db
    .select({ id: cart.id })
    .from(cart)
    .where(inArray(cart.anonymousKeyHash, SUITE_KEYS));

  for (const row of carts) {
    await db
      .delete(inventoryReservation)
      .where(eq(inventoryReservation.sourceCartId, row.id));
    await db.delete(cartItem).where(eq(cartItem.cartId, row.id));
    await db.delete(cart).where(eq(cart.id, row.id));
  }

  // Anything still holding the fixture variant from an earlier failure would
  // silently reduce availability for every test after it.
  await db
    .delete(inventoryReservation)
    .where(eq(inventoryReservation.variantId, variantId));

  await db
    .update(inventory)
    .set({ onHand })
    .where(eq(inventory.variantId, variantId));
}

async function activeReservedTotal(): Promise<number> {
  const rows = await db
    .select({
      total: sql<number>`coalesce(sum(${inventoryReservation.quantity}), 0)`,
    })
    .from(inventoryReservation)
    .where(
      and(
        eq(inventoryReservation.variantId, variantId),
        eq(inventoryReservation.status, "active"),
      ),
    );
  return Number(rows[0]?.total ?? 0);
}

suite("cart service, against a real database", () => {
  beforeAll(async () => {
    const rows = await db
      .select({ id: variant.id })
      .from(variant)
      .innerJoin(product, eq(product.id, variant.productId))
      .where(
        and(eq(product.slug, "ultra-a-z-cream"), eq(variant.isActive, true)),
      )
      .limit(1);
    const found = rows[0];
    if (!found)
      throw new Error("fixture variant missing — run pnpm db:seed demo");
    variantId = found.id;
  });

  beforeEach(async () => {
    await resetFixtures(5);
  });

  it("never decrements on-hand stock — a reservation is a hold", async () => {
    // Given: five on hand
    // When: two are added to a cart
    const result = await addLineFor(GUEST_A, { variantId, quantity: 2 });
    expect(result.kind).toBe("ok");

    // Then: stock is untouched and the hold is what moved (AGENTS.md rule 6)
    const stock = await db
      .select({ onHand: inventory.onHand })
      .from(inventory)
      .where(eq(inventory.variantId, variantId));
    expect(stock[0]?.onHand).toBe(5);
    expect(await activeReservedTotal()).toBe(2);
  });

  /**
   * The exit gate, stated at its simplest.
   *
   * Verified to bite by deleting `FOR UPDATE` and re-running: a two-way race is
   * narrow enough that it often still passes by luck, so **the contention test
   * below is the one that actually catches oversell** — it fails reliably
   * without the lock and passes with it. This one is kept because it states the
   * rule in the plainest form a reader can check.
   */
  it("does not let two carts reserve more than exists, run concurrently", async () => {
    // Given: exactly one unit on hand
    await resetFixtures(1);

    // When: two different carts try to take it at the same moment
    const [a, b] = await Promise.all([
      addLineFor(GUEST_A, { variantId, quantity: 1 }),
      addLineFor(GUEST_B, { variantId, quantity: 1 }),
    ]);

    // Then: exactly one succeeds, and the total held never exceeds stock
    const wins = [a, b].filter((r) => r.kind === "ok");
    expect(wins).toHaveLength(1);
    expect(await activeReservedTotal()).toBeLessThanOrEqual(1);
  });

  it("holds the line even under many simultaneous adds", async () => {
    // Given: three on hand and six carts' worth of demand
    await resetFixtures(3);

    const attempts = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        addLineFor(
          {
            kind: "guest",
            anonymousKeyHash: String(i).repeat(64).slice(0, 64),
          },
          { variantId, quantity: 1 },
        ),
      ),
    );

    // Then: never more held than exist. Some attempts may lose to a lock
    // rather than to stock, which is correct — it is refusal, not oversell.
    expect(await activeReservedTotal()).toBeLessThanOrEqual(3);
    expect(attempts.filter((r) => r.kind === "ok").length).toBeLessThanOrEqual(
      3,
    );
  });

  it("refuses more than is obtainable, and says how many there are", async () => {
    await resetFixtures(2);
    const result = await addLineFor(GUEST_A, { variantId, quantity: 3 });

    expect(result.kind).toBe("rejected");
    if (result.kind === "rejected") {
      expect(result.reason).toBe("insufficient-stock");
      expect(result.available).toBe(2);
    }
  });

  it("treats a quantity change as absolute, so a retry cannot add twice", async () => {
    await addLineFor(GUEST_A, { variantId, quantity: 1 });
    const lines = await db
      .select({ id: cartItem.id, cartId: cartItem.cartId })
      .from(cartItem)
      .innerJoin(cart, eq(cart.id, cartItem.cartId))
      .where(eq(cart.anonymousKeyHash, "a".repeat(64)));
    const lineId = lines[0]!.id;

    // When: the same absolute quantity is submitted twice
    await setLineQuantityFor(GUEST_A, { lineId, quantity: 3 });
    await setLineQuantityFor(GUEST_A, { lineId, quantity: 3 });

    // Then: three, not six
    const after = await db
      .select({ quantity: cartItem.quantity })
      .from(cartItem)
      .where(eq(cartItem.id, lineId));
    expect(after[0]?.quantity).toBe(3);
    expect(await activeReservedTotal()).toBe(3);
  });

  it("adds to the existing line rather than creating a second one", async () => {
    await addLineFor(GUEST_A, { variantId, quantity: 1 });
    await addLineFor(GUEST_A, { variantId, quantity: 2 });

    const lines = await db
      .select({ id: cartItem.id, quantity: cartItem.quantity })
      .from(cartItem)
      .innerJoin(cart, eq(cart.id, cartItem.cartId))
      .where(eq(cart.anonymousKeyHash, "a".repeat(64)));

    expect(lines).toHaveLength(1);
    expect(lines[0]?.quantity).toBe(3);
  });

  /** `C5`. Before migration 0007 this was impossible: the reservation held the
   *  line down with `ON DELETE restrict`. */
  it("releases the hold when a line is removed, and keeps the audit row", async () => {
    await addLineFor(GUEST_A, { variantId, quantity: 2 });
    const lines = await db
      .select({ id: cartItem.id })
      .from(cartItem)
      .innerJoin(cart, eq(cart.id, cartItem.cartId))
      .where(eq(cart.anonymousKeyHash, "a".repeat(64)));

    const result = await removeLineFor(GUEST_A, { lineId: lines[0]!.id });
    expect(result.kind).toBe("ok");

    // The hold is gone from availability...
    expect(await activeReservedTotal()).toBe(0);

    // ...but the record that stock was held survives, with its cart.
    const released = await db
      .select({
        status: inventoryReservation.status,
        quantity: inventoryReservation.quantity,
        sourceCartItemId: inventoryReservation.sourceCartItemId,
        sourceCartId: inventoryReservation.sourceCartId,
      })
      .from(inventoryReservation)
      .where(eq(inventoryReservation.variantId, variantId));

    const row = released.find((entry) => entry.status === "released");
    expect(row).toBeDefined();
    expect(row?.quantity).toBe(2);
    expect(row?.sourceCartItemId).toBeNull();
    expect(row?.sourceCartId).not.toBeNull();
  });

  it("treats removing an already-removed line as success, not failure", async () => {
    await addLineFor(GUEST_A, { variantId, quantity: 1 });
    const lines = await db
      .select({ id: cartItem.id })
      .from(cartItem)
      .innerJoin(cart, eq(cart.id, cartItem.cartId))
      .where(eq(cart.anonymousKeyHash, "a".repeat(64)));
    const lineId = lines[0]!.id;

    await removeLineFor(GUEST_A, { lineId });
    const second = await removeLineFor(GUEST_A, { lineId });

    // A double-tapped remove must not report a failure for work that is done.
    expect(second.kind).toBe("ok");
  });

  it("will not change a line belonging to somebody else", async () => {
    await addLineFor(GUEST_A, { variantId, quantity: 1 });
    const lines = await db
      .select({ id: cartItem.id })
      .from(cartItem)
      .innerJoin(cart, eq(cart.id, cartItem.cartId))
      .where(eq(cart.anonymousKeyHash, "a".repeat(64)));

    const stolen = await setLineQuantityFor(GUEST_B, {
      lineId: lines[0]!.id,
      quantity: 5,
    });

    expect(stolen.kind).toBe("rejected");
    if (stolen.kind === "rejected") expect(stolen.reason).toBe("not-yours");
  });

  it("stops counting a reservation once it has expired", async () => {
    await addLineFor(GUEST_A, { variantId, quantity: 5 });
    expect(await activeReservedTotal()).toBe(5);

    // Age it past its window rather than waiting twenty minutes.
    await db
      .update(inventoryReservation)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(inventoryReservation.variantId, variantId));

    // Another cart can now take the stock: availability tests `expires_at`,
    // not just `status` — COM-D3.
    const other = await addLineFor(GUEST_B, { variantId, quantity: 5 });
    expect(other.kind).toBe("ok");
  });

  it("reserves for the documented twenty minutes", async () => {
    const before = Date.now();
    await addLineFor(GUEST_A, { variantId, quantity: 1 });

    const rows = await db
      .select({ expiresAt: inventoryReservation.expiresAt })
      .from(inventoryReservation)
      .where(
        and(
          eq(inventoryReservation.variantId, variantId),
          eq(inventoryReservation.status, "active"),
        ),
      );

    const ttl = rows[0]!.expiresAt.getTime() - before;
    expect(ttl).toBeGreaterThan(CART_RESERVATION_TTL_MS - 5_000);
    expect(ttl).toBeLessThanOrEqual(CART_RESERVATION_TTL_MS + 5_000);
  });

  it("refuses a professional-only product", async () => {
    const rows = await db
      .select({ id: variant.id })
      .from(variant)
      .innerJoin(product, eq(product.id, variant.productId))
      .where(
        and(eq(product.isProfessionalOnly, true), eq(variant.isActive, true)),
      )
      .limit(1);

    if (!rows[0]) return; // no professional-only fixture in this seed
    const result = await addLineFor(GUEST_A, {
      variantId: rows[0].id,
      quantity: 1,
    });

    expect(result.kind).toBe("rejected");
    if (result.kind === "rejected") {
      expect(["restricted", "unavailable"]).toContain(result.reason);
    }
  });

  it("rejects a quantity that is not a positive integer", async () => {
    for (const quantity of [0, -1, 1.5, 1_000_000]) {
      const result = await addLineFor(GUEST_A, { variantId, quantity });
      expect(result.kind).toBe("rejected");
    }
  });
});
