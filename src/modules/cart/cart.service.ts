import { randomUUID } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cart,
  cartItem,
  inventory,
  inventoryReservation,
  price,
  product,
  variant,
} from "@/lib/db/schema";
import { isVisiblePublication } from "@/lib/preview";
import { resolveOfferState } from "@/modules/commerce/models/offer";
import type { CartOwner } from "./cart.ownership";
import type { CartActionResult } from "./models/cart-models";
import type { MergeConflict, MergeResult } from "./cart.merge";
import {
  addLineInput,
  removeLineInput,
  setLineQuantityInput,
} from "./models/cart-schemas";
import { reservationExpiry } from "./utils/reservations";

/**
 * The cart's transaction logic — everything `cart.actions.ts` does once it
 * knows whose cart it is.
 *
 * Split from the action boundary for one reason that matters: `"use server"`
 * files may export only async server actions, and these functions reach
 * `next/headers` through ownership resolution, which cannot run outside a
 * request. Keeping the transactions here means `COM1`'s exit gate — *"two carts
 * cannot reserve more than on-hand stock"* — can be proven against a real
 * database by two callers with two owners, which is the only way to prove it at
 * all. A concurrency rule that can only be exercised through a browser is a
 * concurrency rule nobody exercises.
 *
 * Every function takes the owner rather than resolving it. That is the same
 * discipline `getCart` follows in reverse: the *boundary* resolves identity, and
 * nothing below it accepts an identity it was handed by a caller it cannot see.
 */

const ANONYMOUS_GROUP = "public" as const;

/** Ninety days, matching the guest cookie. The row is the authority. */
const CART_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000;

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function ownerFilter(owner: CartOwner) {
  return owner.kind === "person"
    ? eq(cart.personId, owner.personId)
    : eq(cart.anonymousKeyHash, owner.anonymousKeyHash);
}

async function activeCartFor(tx: Tx, owner: CartOwner) {
  const rows = await tx
    .select({ id: cart.id })
    .from(cart)
    .where(and(ownerFilter(owner), eq(cart.status, "active")))
    .limit(1);
  return rows[0] ?? null;
}

async function openCartFor(tx: Tx, owner: CartOwner): Promise<string> {
  const existing = await activeCartFor(tx, owner);
  if (existing) return existing.id;

  const created = await tx
    .insert(cart)
    .values({
      personId: owner.kind === "person" ? owner.personId : null,
      anonymousKeyHash: owner.kind === "guest" ? owner.anonymousKeyHash : null,
      expiresAt: new Date(Date.now() + CART_LIFETIME_MS),
    })
    .returning({ id: cart.id });

  const row = created[0];
  if (!row) throw new Error("cart insert returned no row");
  return row.id;
}

/**
 * How many of a variant this cart may hold, with the inventory row locked.
 *
 * `FOR UPDATE` on the inventory row is what makes `COM1`'s exit gate true —
 * *"two carts cannot reserve more than on-hand stock."* Without it, two
 * concurrent adds both read the same `onHand`, both conclude one is free, and
 * both insert: the last unit is sold twice and nothing in the schema objects,
 * because each row is individually valid. The lock serialises them on the one
 * row they contend over, rather than on the whole table.
 *
 * Reservations belonging to *this* cart are excluded, because the write that
 * follows replaces them. Counting them would make a customer compete with
 * themselves.
 */
async function lockAndMeasure(
  tx: Tx,
  variantId: string,
  cartId: string,
): Promise<{ onHand: number; heldByOthers: number } | null> {
  const stock = await tx
    .select({ onHand: inventory.onHand })
    .from(inventory)
    .where(eq(inventory.variantId, variantId))
    .for("update")
    .limit(1);

  const held = await tx
    .select({
      total: sql<number>`coalesce(sum(${inventoryReservation.quantity}), 0)`,
    })
    .from(inventoryReservation)
    .where(
      and(
        eq(inventoryReservation.variantId, variantId),
        eq(inventoryReservation.status, "active"),
        gt(inventoryReservation.expiresAt, sql`now()`),
        sql`${inventoryReservation.sourceCartId} is distinct from ${cartId}`,
      ),
    );

  return {
    onHand: Number(stock[0]?.onHand ?? 0),
    heldByOthers: Number(held[0]?.total ?? 0),
  };
}

/** The catalogue's own verdict on this variant, re-read rather than trusted. */
/*
  Exported because checkout needs the same verdict, and the review log records
  what happens otherwise: the publication rule was hand-written twice and wrong
  both times (`9.4`). A third copy in `placeOrder` would have been the third
  chance to get it wrong — this is the one definition of what may be sold.
*/
export async function offerFor(tx: Tx, variantId: string) {
  const rows = await tx
    .select({
      variantId: variant.id,
      isActive: variant.isActive,
      productId: product.id,
      isPublished: product.isPublished,
      reviewState: product.reviewState,
      isProfessionalOnly: product.isProfessionalOnly,
      priceVisibility: product.priceVisibility,
      onHand: sql<number>`coalesce(${inventory.onHand}, 0)`,
      amountRials: price.amountRials,
    })
    .from(variant)
    .innerJoin(product, eq(product.id, variant.productId))
    .leftJoin(inventory, eq(inventory.variantId, variant.id))
    .leftJoin(
      price,
      and(
        eq(price.variantId, variant.id),
        eq(price.customerGroup, ANONYMOUS_GROUP),
      ),
    )
    .where(eq(variant.id, variantId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    row,
    offer: resolveOfferState({
      isProfessionalOnly: row.isProfessionalOnly,
      priceVisibility: row.priceVisibility,
      customerGroup: ANONYMOUS_GROUP,
      variants: [
        {
          id: row.variantId,
          isActive: row.isActive,
          onHand: Number(row.onHand),
          prices:
            row.amountRials === null
              ? []
              : [
                  {
                    customerGroup: ANONYMOUS_GROUP,
                    amountRials: row.amountRials,
                  },
                ],
        },
      ],
      selectedVariantId: row.variantId,
    }),
  };
}

/** Create or renew the hold for a line, inside the caller's transaction. */
async function holdStock(
  tx: Tx,
  params: {
    lineId: string;
    cartId: string;
    variantId: string;
    quantity: number;
  },
): Promise<void> {
  const existing = await tx
    .select({ id: inventoryReservation.id })
    .from(inventoryReservation)
    .where(
      and(
        eq(inventoryReservation.sourceCartItemId, params.lineId),
        eq(inventoryReservation.status, "active"),
      ),
    )
    .limit(1);

  const expiresAt = reservationExpiry();

  if (existing[0]) {
    // A successful quantity change renews only the affected line — `COM-D3`.
    await tx
      .update(inventoryReservation)
      .set({ quantity: params.quantity, expiresAt, updatedAt: new Date() })
      .where(eq(inventoryReservation.id, existing[0].id));
    return;
  }

  await tx.insert(inventoryReservation).values({
    variantId: params.variantId,
    sourceCartItemId: params.lineId,
    sourceCartId: params.cartId,
    quantity: params.quantity,
    expiresAt,
    idempotencyKey: randomUUID(),
  });
}

/** Resolve a line's hold to `released`, with its timestamp — `CART-03`. */
async function releaseHold(tx: Tx, lineId: string): Promise<void> {
  await tx
    .update(inventoryReservation)
    .set({ status: "released", releasedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(inventoryReservation.sourceCartItemId, lineId),
        eq(inventoryReservation.status, "active"),
      ),
    );
}

/**
 * Request-time reclamation — `COM-D3`.
 *
 * Marks lapsed rows `expired` so the table stays readable. **Correctness never
 * depends on it**: every availability predicate already tests `expires_at`, so
 * an unreclaimed row is invisible to the arithmetic. That is deliberate, and it
 * is why no background worker is required — one is on the deferred list.
 */
async function reclaimExpired(tx: Tx, variantId: string): Promise<void> {
  await tx
    .update(inventoryReservation)
    .set({ status: "expired", releasedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(inventoryReservation.variantId, variantId),
        eq(inventoryReservation.status, "active"),
        sql`${inventoryReservation.expiresAt} <= now()`,
      ),
    );
}

async function countItems(tx: Tx, cartId: string): Promise<number> {
  const rows = await tx
    .select({ total: sql<number>`coalesce(sum(${cartItem.quantity}), 0)` })
    .from(cartItem)
    .where(eq(cartItem.cartId, cartId));
  return Number(rows[0]?.total ?? 0);
}

function bumpVersion(tx: Tx, cartId: string) {
  return tx
    .update(cart)
    .set({ version: sql`${cart.version} + 1`, updatedAt: new Date() })
    .where(eq(cart.id, cartId));
}

export async function addLineFor(
  owner: CartOwner,
  raw: unknown,
): Promise<CartActionResult> {
  const parsed = addLineInput.safeParse(raw);
  if (!parsed.success) return { kind: "rejected", reason: "invalid-quantity" };

  const { variantId, quantity } = parsed.data;

  const result = await db.transaction(async (tx) => {
    const cartId = await openCartFor(tx, owner);
    await reclaimExpired(tx, variantId);

    const resolved = await offerFor(tx, variantId);
    if (!resolved) return { kind: "rejected", reason: "not-found" } as const;
    if (resolved.offer.kind === "professional_only")
      return { kind: "rejected", reason: "restricted" } as const;
    if (
      resolved.offer.kind === "on_request" ||
      resolved.offer.kind === "unavailable" ||
      !isVisiblePublication(resolved.row)
    ) {
      return { kind: "rejected", reason: "unavailable" } as const;
    }

    const measured = await lockAndMeasure(tx, variantId, cartId);
    if (!measured) return { kind: "rejected", reason: "unavailable" } as const;

    const existing = await tx
      .select({ id: cartItem.id, quantity: cartItem.quantity })
      .from(cartItem)
      .where(
        and(eq(cartItem.cartId, cartId), eq(cartItem.variantId, variantId)),
      )
      .limit(1);

    const wanted = (existing[0]?.quantity ?? 0) + quantity;
    const obtainable = measured.onHand - measured.heldByOthers;
    if (obtainable <= 0)
      return { kind: "rejected", reason: "unavailable" } as const;
    if (wanted > obtainable) {
      return {
        kind: "rejected",
        reason: "insufficient-stock",
        available: obtainable,
      } as const;
    }

    const lineId =
      existing[0]?.id ??
      (
        await tx
          .insert(cartItem)
          .values({ cartId, variantId, quantity: wanted })
          .returning({ id: cartItem.id })
      )[0]?.id;

    if (!lineId) throw new Error("cart item insert returned no row");

    if (existing[0]) {
      await tx
        .update(cartItem)
        .set({ quantity: wanted, updatedAt: new Date() })
        .where(eq(cartItem.id, lineId));
    }

    await holdStock(tx, { lineId, cartId, variantId, quantity: wanted });
    await bumpVersion(tx, cartId);

    return { kind: "ok", itemCount: await countItems(tx, cartId) } as const;
  });

  return result;
}

export async function setLineQuantityFor(
  owner: CartOwner,
  raw: unknown,
): Promise<CartActionResult> {
  const parsed = setLineQuantityInput.safeParse(raw);
  if (!parsed.success) return { kind: "rejected", reason: "invalid-quantity" };

  const { lineId, quantity } = parsed.data;

  const result = await db.transaction(async (tx) => {
    const owned = await activeCartFor(tx, owner);
    if (!owned) return { kind: "rejected", reason: "not-yours" } as const;

    const lines = await tx
      .select({ id: cartItem.id, variantId: cartItem.variantId })
      .from(cartItem)
      .where(and(eq(cartItem.id, lineId), eq(cartItem.cartId, owned.id)))
      .limit(1);

    // Ownership is a predicate on the query, not a check after it. A line that
    // belongs to someone else simply does not match.
    const line = lines[0];
    if (!line) return { kind: "rejected", reason: "not-yours" } as const;

    await reclaimExpired(tx, line.variantId);

    const resolved = await offerFor(tx, line.variantId);
    if (!resolved) return { kind: "rejected", reason: "not-found" } as const;
    if (resolved.offer.kind === "professional_only")
      return { kind: "rejected", reason: "restricted" } as const;

    const measured = await lockAndMeasure(tx, line.variantId, owned.id);
    if (!measured) return { kind: "rejected", reason: "unavailable" } as const;

    const obtainable = measured.onHand - measured.heldByOthers;
    if (quantity > obtainable) {
      return {
        kind: "rejected",
        reason: "insufficient-stock",
        available: Math.max(0, obtainable),
      } as const;
    }

    await tx
      .update(cartItem)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItem.id, line.id));

    await holdStock(tx, {
      lineId: line.id,
      cartId: owned.id,
      variantId: line.variantId,
      quantity,
    });
    await bumpVersion(tx, owned.id);

    return { kind: "ok", itemCount: await countItems(tx, owned.id) } as const;
  });

  return result;
}

export async function removeLineFor(
  owner: CartOwner,
  raw: unknown,
): Promise<CartActionResult> {
  const parsed = removeLineInput.safeParse(raw);
  if (!parsed.success) return { kind: "rejected", reason: "not-found" };

  const result = await db.transaction(async (tx) => {
    const owned = await activeCartFor(tx, owner);
    if (!owned) return { kind: "rejected", reason: "not-yours" } as const;

    const lines = await tx
      .select({ id: cartItem.id })
      .from(cartItem)
      .where(
        and(eq(cartItem.id, parsed.data.lineId), eq(cartItem.cartId, owned.id)),
      )
      .limit(1);

    const line = lines[0];
    // Removing something already gone is a success, not an error: a
    // double-tapped remove button must not show a failure for work that is
    // done.
    if (!line) {
      return { kind: "ok", itemCount: await countItems(tx, owned.id) } as const;
    }

    // Release before delete, in the same transaction. `C5` made the delete
    // possible at all — the reservation used to hold the line down with
    // `ON DELETE restrict`.
    await releaseHold(tx, line.id);
    await tx.delete(cartItem).where(eq(cartItem.id, line.id));
    await bumpVersion(tx, owned.id);

    return { kind: "ok", itemCount: await countItems(tx, owned.id) } as const;
  });

  return result;
}

/**
 * The merge transaction — `COM-D4`, with identity already resolved.
 *
 * Split from `cart.merge.ts` for the same reason the three mutations are split
 * from `cart.actions.ts`: `COM1`'s exit gate names merges — *"retries or merges
 * never duplicate or silently reduce quantities"* — and that can only be proven
 * by a test that drives two real carts. Ownership resolution needs
 * `next/headers`, which no test has.
 */
export async function mergeCartsFor(
  personId: string,
  guestKeyHash: string,
): Promise<MergeResult> {
  return db.transaction(async (tx) => {
    const guestRows = await tx
      .select({ id: cart.id })
      .from(cart)
      .where(
        and(eq(cart.anonymousKeyHash, guestKeyHash), eq(cart.status, "active")),
      )
      .limit(1);

    const guest = guestRows[0];
    if (!guest) return { kind: "nothing-to-merge" } as const;

    const personRows = await tx
      .select({ id: cart.id })
      .from(cart)
      .where(and(eq(cart.personId, personId), eq(cart.status, "active")))
      .limit(1);
    const personCart = personRows[0];

    // No account cart: ownership simply moves. Lines, reservations and their
    // `source_cart_id` all still point at the same row, so nothing has to be
    // rewritten and nothing can be lost in the rewriting.
    if (!personCart) {
      await tx
        .update(cart)
        .set({
          personId: personId,
          anonymousKeyHash: null,
          updatedAt: new Date(),
        })
        .where(eq(cart.id, guest.id));

      const total = await tx
        .select({ n: sql<number>`coalesce(sum(${cartItem.quantity}), 0)` })
        .from(cartItem)
        .where(eq(cartItem.cartId, guest.id));

      return { kind: "merged", itemCount: Number(total[0]?.n ?? 0) } as const;
    }

    const guestLines = await tx
      .select({
        id: cartItem.id,
        variantId: cartItem.variantId,
        quantity: cartItem.quantity,
      })
      .from(cartItem)
      .where(eq(cartItem.cartId, guest.id));

    const personLines = await tx
      .select({
        id: cartItem.id,
        variantId: cartItem.variantId,
        quantity: cartItem.quantity,
      })
      .from(cartItem)
      .where(eq(cartItem.cartId, personCart.id));

    const personByVariant = new Map(
      personLines.map((line) => [line.variantId, line]),
    );

    // Measure every line first, change nothing yet. `COM-D4` requires the whole
    // merge to be refused rather than partially applied, so the decision has to
    // be complete before the first write.
    const conflicts: MergeConflict[] = [];
    const plan: {
      variantId: string;
      quantity: number;
      targetLineId: string | null;
      guestLineId: string;
    }[] = [];

    for (const guestLine of guestLines) {
      const mine = personByVariant.get(guestLine.variantId);
      const wanted = guestLine.quantity + (mine?.quantity ?? 0);

      const stock = await tx
        .select({ onHand: inventory.onHand })
        .from(inventory)
        .where(eq(inventory.variantId, guestLine.variantId))
        .for("update")
        .limit(1);

      const held = await tx
        .select({
          total: sql<number>`coalesce(sum(${inventoryReservation.quantity}), 0)`,
        })
        .from(inventoryReservation)
        .where(
          and(
            eq(inventoryReservation.variantId, guestLine.variantId),
            eq(inventoryReservation.status, "active"),
            gt(inventoryReservation.expiresAt, sql`now()`),
            sql`${inventoryReservation.sourceCartId} not in (${guest.id}, ${personCart.id})`,
          ),
        );

      const obtainable =
        Number(stock[0]?.onHand ?? 0) - Number(held[0]?.total ?? 0);

      if (wanted > obtainable) {
        conflicts.push({
          variantId: guestLine.variantId,
          requested: wanted,
          available: Math.max(0, obtainable),
        });
        continue;
      }

      plan.push({
        variantId: guestLine.variantId,
        quantity: wanted,
        targetLineId: mine?.id ?? null,
        guestLineId: guestLine.id,
      });
    }

    if (conflicts.length > 0) return { kind: "conflicts", conflicts } as const;

    for (const step of plan) {
      if (step.targetLineId) {
        await tx
          .update(cartItem)
          .set({ quantity: step.quantity, updatedAt: new Date() })
          .where(eq(cartItem.id, step.targetLineId));

        // The account line's own hold now covers the summed quantity; the
        // guest line's hold is released with the line it belonged to.
        await tx
          .update(inventoryReservation)
          .set({ quantity: step.quantity, updatedAt: new Date() })
          .where(
            and(
              eq(inventoryReservation.sourceCartItemId, step.targetLineId),
              eq(inventoryReservation.status, "active"),
            ),
          );
        await tx
          .update(inventoryReservation)
          .set({
            status: "released",
            releasedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(inventoryReservation.sourceCartItemId, step.guestLineId),
              eq(inventoryReservation.status, "active"),
            ),
          );
        await tx.delete(cartItem).where(eq(cartItem.id, step.guestLineId));
      } else {
        // Move the line wholesale, and move its hold's cart with it so
        // "which cart holds this stock" stays true.
        await tx
          .update(cartItem)
          .set({ cartId: personCart.id, updatedAt: new Date() })
          .where(eq(cartItem.id, step.guestLineId));
        await tx
          .update(inventoryReservation)
          .set({ sourceCartId: personCart.id, updatedAt: new Date() })
          .where(
            and(
              eq(inventoryReservation.sourceCartItemId, step.guestLineId),
              eq(inventoryReservation.status, "active"),
            ),
          );
      }
    }

    // `converted`, which is the word COM-D4 uses and the value the enum
    // already had: the guest cart did not vanish, it became part of an
    // account's. Its rows stay queryable under that status.
    await tx
      .update(cart)
      .set({ status: "converted", updatedAt: new Date() })
      .where(eq(cart.id, guest.id));
    await tx
      .update(cart)
      .set({ version: sql`${cart.version} + 1`, updatedAt: new Date() })
      .where(eq(cart.id, personCart.id));

    const total = await tx
      .select({ n: sql<number>`coalesce(sum(${cartItem.quantity}), 0)` })
      .from(cartItem)
      .where(eq(cartItem.cartId, personCart.id));

    return { kind: "merged", itemCount: Number(total[0]?.n ?? 0) } as const;
  });
}
