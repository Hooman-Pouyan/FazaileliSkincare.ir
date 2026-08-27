import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cart,
  cartItem,
  customerOrder,
  inventory,
  inventoryReservation,
  orderLine,
  payment,
  address as addressTable,
  iranCity,
  iranProvince,
  variant,
  productTranslation,
  variantTranslation,
} from "@/lib/db/schema";
import type { Rials } from "@/lib/money";
import { isVisiblePublication } from "@/lib/preview";
import { offerFor } from "@/modules/cart/cart.service";
import { quoteChosenMethod } from "./shipping.service";
import type { ShippingMethod } from "./shipping.resolve";

/**
 * Turning a cart into an order — `COM3`.
 *
 * **One cart, one version, one idempotency key produces at most one order.**
 * That is the exit gate, and it is enforced by the database rather than by
 * care: `customer_order.checkout_idempotency_key` is unique, so a retry loses
 * the race to its own first attempt and reads back what that attempt wrote.
 *
 * **Nothing the browser posts becomes a price.** The form sends an address id
 * and a method name. Every rial is re-derived here from the catalogue and one
 * shipping quote (`COM-D5`), inside the transaction, after the rows are locked.
 *
 * **Stock does not move here.** `COM-D6` keeps order state and payment state
 * apart, and an unpaid order is not a dispatched one — reservations are *bound*
 * to their order lines so they stop expiring, and `settleOrder` (`COM4`) is
 * what decrements inventory when money is actually confirmed. Decrementing at
 * placement would let an abandoned bank transfer quietly consume stock.
 */

export type PlaceOrderInput = Readonly<{
  personId: string;
  addressId: string;
  method: ShippingMethod;
  contactPhone: string;
  idempotencyKey: string;
  /** Hash of the submitted intent, so a reused key with different input is caught. */
  requestHash: string;
}>;

export type PlaceOrderResult =
  | Readonly<{
      kind: "ok";
      orderId: string;
      orderNumber: string;
      replayed: boolean;
    }>
  | Readonly<{
      kind: "rejected";
      reason:
        | "empty-cart"
        | "address-not-found"
        | "shipping-unavailable"
        | "line-unavailable"
        | "insufficient-stock"
        | "idempotency-conflict";
      /** Which line failed, when that is the reason. */
      variantId?: string;
    }>;

/**
 * `FZ-` plus a Tehran-date stamp and a short random tail.
 *
 * Deliberately **not** sequential. A sequential number tells anyone holding one
 * how many orders the shop has taken, and makes the next one guessable — which
 * is why `order_access_token` exists rather than the number being the secret.
 */
function makeOrderNumber(now: Date): string {
  const stamp = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .replace(/-/g, "");
  const tail = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `FZ-${stamp}-${tail}`;
}

export async function placeOrder(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  return db.transaction(async (tx) => {
    /*
      Idempotency first, before anything is read or locked.

      A retry — a double-tapped button, a refreshed POST, a flaky network —
      must return the original order rather than making a second one. The
      unique index is the real guarantee; this is the fast path that avoids
      relying on catching its violation.
    */
    const existing = await tx
      .select({
        id: customerOrder.id,
        orderNumber: customerOrder.orderNumber,
        requestHash: customerOrder.checkoutRequestHash,
      })
      .from(customerOrder)
      .where(eq(customerOrder.checkoutIdempotencyKey, input.idempotencyKey))
      .limit(1);

    if (existing[0]) {
      // Same key, different intent. That is not a retry, it is a bug or an
      // attack, and silently returning the old order would hide both.
      if (existing[0].requestHash !== input.requestHash) {
        return { kind: "rejected", reason: "idempotency-conflict" } as const;
      }
      return {
        kind: "ok",
        orderId: existing[0].id,
        orderNumber: existing[0].orderNumber,
        replayed: true,
      } as const;
    }

    // The cart row is locked for the rest of the transaction, so a concurrent
    // checkout of the same cart waits here rather than racing us.
    const carts = await tx
      .select({ id: cart.id, version: cart.version })
      .from(cart)
      .where(and(eq(cart.personId, input.personId), eq(cart.status, "active")))
      .for("update")
      .limit(1);

    const activeCart = carts[0];
    if (!activeCart) return { kind: "rejected", reason: "empty-cart" } as const;

    // Owner-scoped in the `where`: a foreign address id finds nothing.
    const addresses = await tx
      .select({
        id: addressTable.id,
        recipientName: addressTable.recipientName,
        recipientPhone: addressTable.recipientPhone,
        postalCode: addressTable.postalCode,
        line: addressTable.line,
        provinceCode: addressTable.provinceCode,
        cityCode: addressTable.cityCode,
        provinceName: iranProvince.nameFa,
        cityName: iranCity.nameFa,
      })
      .from(addressTable)
      .innerJoin(iranProvince, eq(iranProvince.code, addressTable.provinceCode))
      .innerJoin(iranCity, eq(iranCity.code, addressTable.cityCode))
      .where(
        and(
          eq(addressTable.id, input.addressId),
          eq(addressTable.personId, input.personId),
        ),
      )
      .limit(1);

    const shipTo = addresses[0];
    if (!shipTo)
      return { kind: "rejected", reason: "address-not-found" } as const;

    const items = await tx
      .select({
        id: cartItem.id,
        variantId: cartItem.variantId,
        quantity: cartItem.quantity,
      })
      .from(cartItem)
      .where(eq(cartItem.cartId, activeCart.id));

    if (items.length === 0)
      return { kind: "rejected", reason: "empty-cart" } as const;

    /*
      Re-read the catalogue for every line, locking each inventory row.

      The cart page already showed a price, and it is not evidence: between
      render and submit a product can be unpublished, a price can change and
      stock can go. `COM-D3` requires those to stop an order rather than be
      priced around, and the lock is what makes the stock answer true for the
      length of this transaction rather than at the moment it was read.
    */
    const priced: {
      variantId: string;
      cartItemId: string;
      quantity: number;
      unitPriceRials: bigint;
      productName: string;
      variantName: string | null;
      sku: string;
    }[] = [];

    for (const item of items) {
      /*
        The catalogue's own verdict, from the one place that owns it.

        `offerFor` is `cart.service`'s — publication, professional-only,
        price visibility and price in a single typed query. Re-deriving any of
        that here is how `9.4` happened: the publication rule was written twice
        and wrong both times.
      */
      const resolved = await offerFor(tx, item.variantId);

      if (
        !resolved ||
        !isVisiblePublication(resolved.row) ||
        resolved.offer.kind === "professional_only" ||
        resolved.offer.kind === "on_request" ||
        resolved.offer.kind === "unavailable" ||
        resolved.row.amountRials === null
      ) {
        return {
          kind: "rejected",
          reason: "line-unavailable",
          variantId: item.variantId,
        } as const;
      }

      // Lock the inventory row, then measure what anyone *else* is holding.
      // This cart's own reservations are excluded: they are what we are about
      // to bind to the order, so counting them would make the customer compete
      // with themselves.
      await tx
        .select({ onHand: inventory.onHand })
        .from(inventory)
        .where(eq(inventory.variantId, item.variantId))
        .for("update")
        .limit(1);

      const held = await tx
        .select({
          total: sql<number>`coalesce(sum(${inventoryReservation.quantity}), 0)`,
        })
        .from(inventoryReservation)
        .where(
          and(
            eq(inventoryReservation.variantId, item.variantId),
            eq(inventoryReservation.status, "active"),
            gt(inventoryReservation.expiresAt, sql`now()`),
            sql`${inventoryReservation.sourceCartId} is distinct from ${activeCart.id}`,
          ),
        );

      const obtainable =
        Number(resolved.row.onHand ?? 0) - Number(held[0]?.total ?? 0);

      if (obtainable < item.quantity) {
        return {
          kind: "rejected",
          reason: "insufficient-stock",
          variantId: item.variantId,
        } as const;
      }

      /*
        The names that go into the invoice — a separate question from whether
        the line may be sold, and a separate query.

        Persian is asked for by name rather than by the request locale: an
        invoice is a document about a transaction that happened in a shop that
        trades in Persian, and it must read the same whichever locale the
        customer happened to browse in.
      */
      const naming = await tx
        .select({
          sku: variant.sku,
          productName: productTranslation.name,
          variantName: variantTranslation.displayName,
          sizeLabel: variantTranslation.sizeLabel,
        })
        .from(variant)
        .leftJoin(
          productTranslation,
          and(
            eq(productTranslation.productId, variant.productId),
            eq(productTranslation.localeCode, "fa"),
          ),
        )
        .leftJoin(
          variantTranslation,
          and(
            eq(variantTranslation.variantId, variant.id),
            eq(variantTranslation.localeCode, "fa"),
          ),
        )
        .where(eq(variant.id, item.variantId))
        .limit(1);

      const named = naming[0];
      if (!named) {
        return {
          kind: "rejected",
          reason: "line-unavailable",
          variantId: item.variantId,
        } as const;
      }

      priced.push({
        variantId: item.variantId,
        cartItemId: item.id,
        quantity: item.quantity,
        unitPriceRials: resolved.row.amountRials,
        productName: named.productName ?? named.sku,
        variantName: named.variantName ?? named.sizeLabel,
        sku: named.sku,
      });
    }

    const subtotalRials = priced.reduce(
      (sum, line) => sum + line.unitPriceRials * BigInt(line.quantity),
      0n,
    ) as Rials;

    // One quote, from the same inputs the page used. A posted amount is never
    // consulted — `COM-D5`.
    const shipping = await quoteChosenMethod(
      { cityCode: shipTo.cityCode, provinceCode: shipTo.provinceCode },
      subtotalRials,
      input.method,
    );
    if (!shipping)
      return { kind: "rejected", reason: "shipping-unavailable" } as const;

    const shippingRials = shipping.amountRials;
    const totalRials = (subtotalRials + shippingRials) as Rials;
    const now = new Date();

    const [created] = await tx
      .insert(customerOrder)
      .values({
        orderNumber: makeOrderNumber(now),
        personId: input.personId,
        contactPhone: input.contactPhone,
        status: "awaiting_transfer",
        subtotalRials,
        shippingRials,
        discountRials: 0n as Rials,
        totalRials,
        shippingMethod: input.method,
        /*
          The address is frozen into the order, not referenced.

          A customer who later edits or deletes that address still has an
          invoice saying where the parcel went — and a courier reading it a
          month later must not see a different destination than the one that
          was agreed. Province and city labels are copied for the same reason
          the prices are.
        */
        addressSnapshot: {
          schemaVersion: 1,
          recipientName: shipTo.recipientName,
          recipientPhone: shipTo.recipientPhone,
          provinceCode: shipTo.provinceCode,
          provinceName: shipTo.provinceName,
          cityCode: shipTo.cityCode,
          cityName: shipTo.cityName,
          postalCode: shipTo.postalCode,
          line: shipTo.line,
        },
        checkoutIdempotencyKey: input.idempotencyKey,
        checkoutRequestHash: input.requestHash,
        placedAt: now,
      })
      .returning({
        id: customerOrder.id,
        orderNumber: customerOrder.orderNumber,
      });

    if (!created) return { kind: "rejected", reason: "empty-cart" } as const;

    for (const line of priced) {
      const [insertedLine] = await tx
        .insert(orderLine)
        .values({
          orderId: created.id,
          variantId: line.variantId,
          productNameSnapshot: line.productName,
          variantNameSnapshot: line.variantName,
          skuSnapshot: line.sku,
          unitPriceRials: line.unitPriceRials,
          quantity: line.quantity,
          lineTotalRials: line.unitPriceRials * BigInt(line.quantity),
        })
        .returning({ id: orderLine.id });

      /*
        Bind this cart's reservations to the order line.

        They stay `active` — `COM-D6` puts consumption at settlement, because
        an unpaid order is not a dispatched one. What changes is that they now
        belong to an order rather than a cart, so the sweeper stops treating
        them as an abandoned browse and expiring them out from under a customer
        who is waiting on a bank transfer.
      */
      if (insertedLine) {
        await tx
          .update(inventoryReservation)
          .set({
            orderLineId: insertedLine.id,
            expiresAt: sql`now() + interval '14 days'`,
            updatedAt: now,
          })
          .where(
            and(
              eq(inventoryReservation.sourceCartItemId, line.cartItemId),
              eq(inventoryReservation.status, "active"),
              gt(inventoryReservation.expiresAt, sql`now()`),
            ),
          );
      }
    }

    /*
      The payment attempt exists from the moment the order does.

      `COM-D6` keeps the two states apart, and an order with no payment row is
      an order nobody can pay: the transfer claim in `COM4` attaches to this.
      `pending` is the honest starting state — no money has been claimed, let
      alone confirmed.
    */
    await tx.insert(payment).values({
      orderId: created.id,
      method: "bank_transfer",
      status: "pending",
      amountRials: totalRials,
      idempotencyKey: input.idempotencyKey,
      requestHash: input.requestHash,
    });

    // The cart is spent. `converted` rather than deleted, so the order can be
    // traced back to what was in front of the customer.
    await tx
      .update(cart)
      .set({
        status: "converted",
        version: activeCart.version + 1,
        updatedAt: now,
      })
      .where(eq(cart.id, activeCart.id));

    return {
      kind: "ok",
      orderId: created.id,
      orderNumber: created.orderNumber,
      replayed: false,
    } as const;
  });
}
