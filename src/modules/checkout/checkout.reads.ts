import { getCart } from "@/modules/cart/cart.reads";
import { resolveViewer } from "@/modules/account/account.ownership";
import {
  listAddresses,
  type AddressView,
} from "@/modules/account/account.reads";
import { formatToman, type Rials } from "@/lib/money";
import type { CartLine } from "@/modules/cart/models/cart-models";
import { quoteShipping } from "./shipping.service";
import type { ShippingOption } from "./shipping.resolve";

/**
 * A shipping option with its money already rendered.
 *
 * Formatting lives here rather than in the screen so every amount on the page
 * comes from one place with one locale — the same reason the totals do.
 */
export type ShippingOptionView = ShippingOption &
  Readonly<{ amountLabel: string }>;

/**
 * Everything the checkout page needs, priced by the server — `COM2`.
 *
 * **The browser never contributes a number.** Subtotal comes from the cart's
 * own snapshot pricing, shipping from one quote, and the total is computed
 * here. A posted price is a suggestion; `COM-D5` requires the total to be
 * reproducible from canonical inputs, and the only way to keep that true is for
 * the client never to own one.
 *
 * **Blocking issues stop checkout rather than being priced around.** A line
 * that is unavailable, restricted or short of stock is exactly the thing that
 * must not become an order — `COM-D3`. The cart already computes those; this
 * refuses to quote while any survive.
 */

export type CheckoutBlocker =
  | "empty"
  | "line-issues"
  | "no-shipping-options"
  | "no-address";

export type CheckoutOutcome =
  | Readonly<{ kind: "ready"; page: CheckoutPageModel }>
  | Readonly<{
      kind: "blocked";
      reason: CheckoutBlocker;
      page: CheckoutPageModel;
    }>;

export type CheckoutPageModel = Readonly<{
  lines: readonly CartLine[];
  addresses: readonly AddressView[];
  selectedAddressId: string | null;
  shippingOptions: readonly ShippingOptionView[];
  selectedMethod: ShippingOptionView | null;
  subtotalRials: Rials;
  shippingRials: Rials;
  totalRials: Rials;
  subtotalLabel: string;
  shippingLabel: string;
  totalLabel: string;
  isSignedIn: boolean;
  /** Lines the customer must resolve before this can become an order. */
  blockingIssues: readonly Readonly<{ lineId: string; name: string }>[];
}>;

export async function getCheckout(
  localeCode: string,
  chosen?: Readonly<{ addressId?: string; method?: string }>,
): Promise<CheckoutOutcome> {
  const [cart, viewer] = await Promise.all([
    getCart(localeCode),
    resolveViewer(),
  ]);

  const addresses = viewer ? await listAddresses(viewer) : [];
  const money = (amount: Rials) =>
    formatToman(amount, localeCode === "fa" ? "fa" : "en");

  const empty = (reason: CheckoutBlocker): CheckoutOutcome => ({
    kind: "blocked",
    reason,
    page: {
      lines: [],
      addresses,
      selectedAddressId: null,
      shippingOptions: [],
      selectedMethod: null,
      subtotalRials: 0n as Rials,
      shippingRials: 0n as Rials,
      totalRials: 0n as Rials,
      subtotalLabel: money(0n as Rials),
      shippingLabel: money(0n as Rials),
      totalLabel: money(0n as Rials),
      isSignedIn: Boolean(viewer),
      blockingIssues: [],
    },
  });

  if (cart.kind !== "ready") return empty("empty");

  const { lines, summary } = cart.page;

  /*
    Which of `CART-04`'s six issues may not become an order.

    `unavailable`, `restricted`, `unpublished` and `quantity_reduced` all mean
    the customer cannot have what the line says, so pricing around them would
    produce an order the shop cannot fill.

    `price_changed` is **not** blocking: the cart has already re-priced and the
    customer is looking at the new number, so refusing would be refusing a
    correct total. `reservation_expired` is not blocking either — `placeOrder`
    re-checks stock inside its transaction, which is where that question is
    actually answerable; blocking here would reject a line that is still
    perfectly obtainable.
  */
  const BLOCKING: readonly CartLine["issue"][] = [
    "unavailable",
    "restricted",
    "unpublished",
    "quantity_reduced",
  ];
  const blockingIssues = lines
    .filter((line) => BLOCKING.includes(line.issue))
    .map((line) => ({ lineId: line.id, name: line.name }));

  const subtotalRials = summary.subtotalRials;

  // The address decides the destination, so it decides the quote. A stale id
  // from a re-submitted form selects nothing rather than someone else's row —
  // `listAddresses` is already owner-scoped, so a foreign id simply is not here.
  const selected =
    addresses.find((entry) => entry.id === chosen?.addressId) ??
    addresses.find((entry) => entry.isDefault) ??
    addresses[0] ??
    null;

  const quoted = await quoteShipping(
    {
      cityCode: selected?.cityCode ?? null,
      provinceCode: selected?.provinceCode ?? null,
    },
    subtotalRials,
  );
  const shippingOptions: readonly ShippingOptionView[] = quoted.map(
    (option) => ({ ...option, amountLabel: money(option.amountRials) }),
  );

  const selectedMethod =
    shippingOptions.find((option) => option.method === chosen?.method) ??
    shippingOptions[0] ??
    null;

  const shippingRials = selectedMethod?.amountRials ?? (0n as Rials);
  const totalRials = (subtotalRials + shippingRials) as Rials;

  const page: CheckoutPageModel = {
    lines,
    addresses,
    selectedAddressId: selected?.id ?? null,
    shippingOptions,
    selectedMethod,
    subtotalRials,
    shippingRials,
    totalRials,
    subtotalLabel: money(subtotalRials),
    shippingLabel: money(shippingRials),
    totalLabel: money(totalRials),
    isSignedIn: Boolean(viewer),
    blockingIssues,
  };

  if (blockingIssues.length > 0)
    return { kind: "blocked", reason: "line-issues", page };
  if (!selected) return { kind: "blocked", reason: "no-address", page };
  if (shippingOptions.length === 0)
    return { kind: "blocked", reason: "no-shipping-options", page };

  return { kind: "ready", page };
}
