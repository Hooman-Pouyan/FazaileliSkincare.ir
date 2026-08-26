import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  brand,
  brandTranslation,
  cart,
  cartItem,
  inventory,
  inventoryReservation,
  price,
  product,
  productMedia,
  productMediaTranslation,
  productTranslation,
  variant,
  variantTranslation,
} from "@/lib/db/schema";
import { formatToman, type Rials } from "@/lib/money";
import { mediaUrlOrNull } from "@/lib/media/url";
import { isVisiblePublication } from "@/lib/preview";
import { resolveOfferState } from "@/modules/commerce/models/offer";
import type { PriceView } from "@/modules/commerce/models/page-models";
import { resolveCartOwner, type CartOwner } from "./cart.ownership";
import type {
  CartLine,
  CartLineIssue,
  CartOutcome,
  CartSummary,
} from "./models/cart-models";

/**
 * The cart, as the server currently understands it — `CART-04`.
 *
 * **Nothing here is a snapshot.** Every price, every availability and every
 * offer state is re-derived on this read, because the alternative is a cart
 * that shows what was true when something was added. Between then and now a
 * price can change, a product can be unpublished and a reservation can expire;
 * `CART-04` requires each of those to surface as an explicit line state rather
 * than as a quietly corrected number.
 *
 * **Callers never pass identity.** Ownership is resolved here from the session
 * and the httpOnly cookie. A `getCart(cartId)` would be a function anyone could
 * call with somebody else's cart id.
 *
 * A database fault throws rather than returning an empty cart. An outage that
 * renders as "you have nothing in your basket" is how a shop quietly stops
 * selling, and it is the same rule the storefront reads already follow.
 */

const ANONYMOUS_GROUP = "public" as const;

function toPrice(
  amountRials: Rials | null,
  localeCode: string,
): PriceView | null {
  if (amountRials === null) return null;
  return {
    amountRials,
    label: formatToman(amountRials, localeCode === "fa" ? "fa" : "en"),
  };
}

const EMPTY_SUMMARY: CartSummary = {
  itemCount: 0,
  subtotal: null,
  subtotalRials: 0n,
};

function ownerFilter(owner: CartOwner) {
  return owner.kind === "person"
    ? eq(cart.personId, owner.personId)
    : eq(cart.anonymousKeyHash, owner.anonymousKeyHash);
}

/** The active cart row for an owner, or null. Never creates one. */
export async function findActiveCart(
  owner: CartOwner,
): Promise<{ id: string; version: number } | null> {
  const rows = await db
    .select({ id: cart.id, version: cart.version })
    .from(cart)
    .where(and(ownerFilter(owner), eq(cart.status, "active")))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCart(localeCode: string): Promise<CartOutcome> {
  const owner = await resolveCartOwner();
  const continueHref = "/shop";

  if (!owner) return { kind: "empty", summary: EMPTY_SUMMARY, continueHref };

  const active = await findActiveCart(owner);
  if (!active) return { kind: "empty", summary: EMPTY_SUMMARY, continueHref };

  const itemRows = await db
    .select({
      id: cartItem.id,
      variantId: cartItem.variantId,
      quantity: cartItem.quantity,
      sku: variant.sku,
      isActive: variant.isActive,
      sizeLabel: variantTranslation.sizeLabel,
      onHand: sql<number>`coalesce(${inventory.onHand}, 0)`,
      amountRials: price.amountRials,
      productId: product.id,
      productSlug: product.slug,
      isPublished: product.isPublished,
      reviewState: product.reviewState,
      isProfessionalOnly: product.isProfessionalOnly,
      priceVisibility: product.priceVisibility,
      name: productTranslation.name,
      brandSlug: brand.slug,
      brandName: brandTranslation.name,
      reservationExpiresAt: inventoryReservation.expiresAt,
      reservedQuantity: inventoryReservation.quantity,
    })
    .from(cartItem)
    .innerJoin(variant, eq(variant.id, cartItem.variantId))
    .innerJoin(product, eq(product.id, variant.productId))
    .innerJoin(brand, eq(brand.id, product.brandId))
    .leftJoin(
      brandTranslation,
      and(
        eq(brandTranslation.brandId, brand.id),
        eq(brandTranslation.localeCode, localeCode),
      ),
    )
    .leftJoin(
      productTranslation,
      and(
        eq(productTranslation.productId, product.id),
        eq(productTranslation.localeCode, localeCode),
      ),
    )
    .leftJoin(
      variantTranslation,
      and(
        eq(variantTranslation.variantId, variant.id),
        eq(variantTranslation.localeCode, localeCode),
      ),
    )
    .leftJoin(inventory, eq(inventory.variantId, variant.id))
    .leftJoin(
      price,
      and(
        eq(price.variantId, variant.id),
        eq(price.customerGroup, ANONYMOUS_GROUP),
      ),
    )
    .leftJoin(
      inventoryReservation,
      and(
        eq(inventoryReservation.sourceCartItemId, cartItem.id),
        eq(inventoryReservation.status, "active"),
      ),
    )
    .where(eq(cartItem.cartId, active.id))
    .orderBy(asc(cartItem.createdAt), asc(cartItem.id));

  if (itemRows.length === 0) {
    return { kind: "empty", summary: EMPTY_SUMMARY, continueHref };
  }

  // Media in one query rather than per line — a ten-line cart should not be
  // ten round trips.
  const productIds = [...new Set(itemRows.map((row) => row.productId))];
  const mediaRows = await db
    .select({
      productId: productMedia.productId,
      key: productMedia.cardObjectKey,
      width: productMedia.width,
      height: productMedia.height,
      alt: productMediaTranslation.altText,
      sortOrder: productMedia.sortOrder,
    })
    .from(productMedia)
    .leftJoin(
      productMediaTranslation,
      and(
        eq(productMediaTranslation.productMediaId, productMedia.id),
        eq(productMediaTranslation.localeCode, localeCode),
      ),
    )
    .where(inArray(productMedia.productId, productIds))
    .orderBy(asc(productMedia.sortOrder), asc(productMedia.id));

  const firstMedia = new Map<string, (typeof mediaRows)[number]>();
  for (const row of mediaRows) {
    if (!firstMedia.has(row.productId)) firstMedia.set(row.productId, row);
  }

  // What everyone *else* is holding, so a line can say how many are really
  // obtainable. The line's own reservation is excluded: a customer must not be
  // told they cannot have what they already hold.
  const variantIds = [...new Set(itemRows.map((row) => row.variantId))];
  const heldRows = await db
    .select({
      variantId: inventoryReservation.variantId,
      held: sql<number>`coalesce(sum(${inventoryReservation.quantity}), 0)`,
    })
    .from(inventoryReservation)
    .where(
      and(
        inArray(inventoryReservation.variantId, variantIds),
        eq(inventoryReservation.status, "active"),
        gt(inventoryReservation.expiresAt, sql`now()`),
        sql`(${inventoryReservation.sourceCartId} is distinct from ${active.id})`,
      ),
    )
    .groupBy(inventoryReservation.variantId);
  const heldByOthers = new Map(
    heldRows.map((row) => [row.variantId, Number(row.held)]),
  );

  const now = Date.now();
  const lines: CartLine[] = [];
  let subtotalRials = 0n;
  let itemCount = 0;
  let anyLocaleMissing = false;

  for (const row of itemRows) {
    if (row.name === null) {
      anyLocaleMissing = true;
      continue;
    }

    const offer = resolveOfferState({
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
    });

    // The same question the catalogue asked when this was added, through the
    // same seam. Written out by hand here first, which marked every line of a
    // draft catalogue as withdrawn and left the subtotal null.
    const published = isVisiblePublication(row);
    const available = Math.max(
      0,
      Number(row.onHand) - (heldByOthers.get(row.variantId) ?? 0),
    );
    const reservationLive =
      row.reservationExpiresAt !== null &&
      row.reservationExpiresAt.getTime() > now;

    // Precedence matters: the most fundamental problem is the one to state.
    // Telling someone their reservation lapsed on a product that has since been
    // withdrawn would be true and useless.
    let issue: CartLineIssue | null = null;
    if (!published) issue = "unpublished";
    else if (offer.kind === "professional_only") issue = "restricted";
    else if (offer.kind === "unavailable" || !row.isActive)
      issue = "unavailable";
    else if (offer.kind === "out_of_stock" || available === 0)
      issue = "unavailable";
    else if (available < row.quantity) issue = "quantity_reduced";
    else if (!reservationLive) issue = "reservation_expired";

    const unitPrice = toPrice(row.amountRials, localeCode);
    const sellable = issue === null || issue === "reservation_expired";
    const lineTotalRials =
      unitPrice && sellable
        ? unitPrice.amountRials * BigInt(row.quantity)
        : null;

    if (lineTotalRials !== null) {
      subtotalRials += lineTotalRials;
      itemCount += row.quantity;
    }

    const media = firstMedia.get(row.productId);
    const src = media ? mediaUrlOrNull(media.key) : null;

    lines.push({
      id: row.id,
      variantId: row.variantId,
      productSlug: row.productSlug,
      href: `/shop/p/${row.productSlug}`,
      name: row.name,
      brandName: row.brandName ?? row.brandSlug,
      sizeLabel: row.sizeLabel,
      image:
        src && media
          ? {
              src,
              alt: media.alt ?? row.name,
              width: media.width,
              height: media.height,
            }
          : null,
      quantity: row.quantity,
      unitPrice,
      lineTotal: toPrice(lineTotalRials, localeCode),
      offer,
      issue,
      availableQuantity: available,
    });
  }

  const summary: CartSummary = {
    itemCount,
    subtotal: toPrice(subtotalRials > 0n ? subtotalRials : null, localeCode),
    subtotalRials,
  };

  // A cart whose every line lacks copy in this locale is not an empty cart and
  // must not render fallback line content — `CART-04`. There is no fallback
  // chain here any more than there is on a product page.
  if (lines.length === 0 && anyLocaleMissing) {
    return { kind: "locale-unavailable", summary: EMPTY_SUMMARY };
  }
  if (lines.length === 0) {
    return { kind: "empty", summary: EMPTY_SUMMARY, continueHref };
  }

  return {
    kind: "ready",
    page: { lines, summary, continueHref },
    summary,
  };
}
