import type { Rials } from "@/lib/money";

/**
 * What a customer may do with a product right now.
 *
 * One pure function decides this for every surface — hub tile, listing tile,
 * product page, and the cart action that follows. A tile that computes
 * availability differently from the page it links to is how a shopper reaches an
 * add-to-cart button for something that cannot be sold.
 *
 * The database is not consulted here and no row type crosses this boundary: the
 * caller assembles the input, so the rules stay testable without a connection.
 */

export type CustomerGroup = "public" | "student" | "professional";
export type PriceVisibility = "public" | "on_request";

export type OfferPrice = Readonly<{
  customerGroup: CustomerGroup;
  amountRials: Rials;
}>;

export type OfferVariant = Readonly<{
  id: string;
  isActive: boolean;
  onHand: number;
  prices: readonly OfferPrice[];
}>;

export type OfferInput = Readonly<{
  isProfessionalOnly: boolean;
  priceVisibility: PriceVisibility;
  /** The viewer's group. Anonymous visitors are always `public`. */
  customerGroup: CustomerGroup;
  variants: readonly OfferVariant[];
  selectedVariantId?: string | null;
}>;

export type OfferState =
  | Readonly<{
      kind: "purchasable";
      variantId: string;
      amountRials: Rials;
      onHand: number;
    }>
  | Readonly<{ kind: "variant_required"; variantIds: readonly string[] }>
  | Readonly<{ kind: "out_of_stock" }>
  | Readonly<{ kind: "on_request" }>
  | Readonly<{ kind: "professional_only" }>
  | Readonly<{ kind: "unavailable" }>;

export type PurchasableOfferState = Extract<
  OfferState,
  { kind: "purchasable" }
>;

export function isPurchasable(
  state: OfferState,
): state is PurchasableOfferState {
  return state.kind === "purchasable";
}

/**
 * The eligible price is an exact match on the viewer's group. There is no
 * fallback to the public price for a student or professional viewer: whether one
 * should exist is a pricing decision nobody has made, and inventing it here
 * would quietly sell at a rate the owner never set. Until customer roles exist
 * every viewer is `public`, so only the public row is ever consulted in
 * practice.
 */
function eligiblePrice(
  variant: OfferVariant,
  customerGroup: CustomerGroup,
): Rials | null {
  const match = variant.prices.find(
    (price) => price.customerGroup === customerGroup,
  );
  return match ? match.amountRials : null;
}

type SellableVariant = Readonly<{
  id: string;
  onHand: number;
  amountRials: Rials;
}>;

export function resolveOfferState(input: OfferInput): OfferState {
  // Restriction is decided before price or stock, so a professional-only
  // product can never present as buyable to someone who may not buy it.
  if (input.isProfessionalOnly && input.customerGroup !== "professional") {
    return { kind: "professional_only" };
  }

  // No published price means no purchase path, whatever the stock says.
  if (input.priceVisibility === "on_request") {
    return { kind: "on_request" };
  }

  const sellable: SellableVariant[] = [];
  for (const variant of input.variants) {
    if (!variant.isActive) continue;
    const amountRials = eligiblePrice(variant, input.customerGroup);
    if (amountRials === null) continue;
    sellable.push({ id: variant.id, onHand: variant.onHand, amountRials });
  }

  if (sellable.length === 0) return { kind: "unavailable" };

  // An unknown selection is treated as no selection rather than as an error:
  // the surface simply asks again, which is what a stale link or a removed
  // variant should produce.
  const selected =
    sellable.find((variant) => variant.id === input.selectedVariantId) ??
    (sellable.length === 1 ? sellable[0] : undefined);

  if (selected) {
    return selected.onHand > 0
      ? {
          kind: "purchasable",
          variantId: selected.id,
          amountRials: selected.amountRials,
          onHand: selected.onHand,
        }
      : { kind: "out_of_stock" };
  }

  // Asking someone to choose between things they cannot have is worse than
  // telling them the product is unavailable.
  if (sellable.every((variant) => variant.onHand <= 0)) {
    return { kind: "out_of_stock" };
  }

  return {
    kind: "variant_required",
    variantIds: sellable.map((variant) => variant.id),
  };
}
