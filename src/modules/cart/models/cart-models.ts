import type { Rials } from "@/lib/money";
import type { OfferState } from "@/modules/commerce/models/offer";
import type {
  MediaView,
  PriceView,
} from "@/modules/commerce/models/page-models";

/**
 * Why a cart line may not simply be bought right now.
 *
 * A line is not a snapshot. Between adding something and looking at the cart
 * again, a price can change, a reservation can expire, a product can be
 * unpublished and stock can go. `CART-04` requires each of those to be an
 * explicit state rather than a silently corrected number — the alternative is a
 * cart that quietly shows a total the checkout will refuse.
 *
 * `null` means the line is fine.
 */
export type CartLineIssue =
  | "price_changed"
  | "reservation_expired"
  | "quantity_reduced"
  | "unavailable"
  | "restricted"
  | "unpublished";

export type CartLine = Readonly<{
  id: string;
  variantId: string;
  productSlug: string;
  href: string;
  name: string;
  brandName: string;
  sizeLabel: string | null;
  image: MediaView | null;
  quantity: number;
  /** The server's price now, never the one the browser last rendered. */
  unitPrice: PriceView | null;
  lineTotal: PriceView | null;
  /** What the catalogue says about this variant at this moment. */
  offer: OfferState;
  issue: CartLineIssue | null;
  /** How many are actually obtainable, when that is fewer than asked for. */
  availableQuantity: number;
}>;

export type CartSummary = Readonly<{
  itemCount: number;
  /** Server-computed, from the lines above. The client never sends a total. */
  subtotal: PriceView | null;
  subtotalRials: Rials;
}>;

export type CartPageModel = Readonly<{
  lines: readonly CartLine[];
  summary: CartSummary;
  /** Where an empty cart sends someone. */
  continueHref: string;
}>;

/**
 * Every cart read returns one of these — the same discipline as
 * `StorefrontOutcome`, and for the same reason.
 *
 * `empty` is not `not-found`: a customer who has added nothing has a perfectly
 * valid cart. And a database fault is neither — it throws, because an outage
 * rendering as an empty cart is how a shop quietly stops selling.
 */
export type CartOutcome =
  | Readonly<{ kind: "ready"; page: CartPageModel; summary: CartSummary }>
  | Readonly<{ kind: "empty"; summary: CartSummary; continueHref: string }>
  | Readonly<{ kind: "locale-unavailable"; summary: CartSummary }>;

/** What an action tells the caller. Expected failures are values, not throws. */
export type CartActionResult =
  | Readonly<{ kind: "ok"; itemCount: number }>
  | Readonly<{
      kind: "rejected";
      reason:
        | "not-found"
        | "unavailable"
        | "restricted"
        | "insufficient-stock"
        | "invalid-quantity"
        | "not-yours";
      /** Present for `insufficient-stock`: what could be had instead. */
      available?: number;
    }>;
