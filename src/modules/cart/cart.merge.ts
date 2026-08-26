"use server";

import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cart,
  cartItem,
  inventory,
  inventoryReservation,
} from "@/lib/db/schema";
import {
  clearGuestCartCookie,
  readGuestCartHash,
  resolveCartOwner,
} from "./cart.ownership";
import { mergeCartsFor } from "./cart.service";

/**
 * Guest cart → account cart, at sign-in — `COM-D4`.
 *
 * **All or nothing.** If any resulting line cannot be fully reserved, the
 * transaction changes nothing and returns the conflicts. The alternative —
 * merging what fits and quietly trimming the rest — is the failure `COM-D4`
 * names outright: *"no quantity is capped silently."* Someone who put three of
 * something in a cart, signed in, and ended up with one would not notice until
 * the parcel arrived.
 *
 * **Idempotent by construction.** The guest cart is converted or absorbed and
 * its cookie is cleared, so a retry finds no guest cart and returns `merged`
 * with nothing to do. That is why `COM-D4`'s "same merge idempotency key" needs
 * no key column here: the guest cart *is* the key, and it is spent exactly once.
 *
 * Reservations move with their lines rather than being re-taken. Re-taking
 * would release the hold and immediately compete for it again, which on the
 * last unit of something means losing a cart to a race the customer started
 * themselves.
 */

export type MergeConflict = Readonly<{
  variantId: string;
  requested: number;
  available: number;
}>;

export type MergeResult =
  | Readonly<{ kind: "merged"; itemCount: number }>
  | Readonly<{ kind: "nothing-to-merge" }>
  | Readonly<{ kind: "conflicts"; conflicts: readonly MergeConflict[] }>;

export async function mergeGuestCartIntoAccount(): Promise<MergeResult> {
  const owner = await resolveCartOwner();
  // Only a signed-in person can absorb a guest cart. Called with anything else
  // this is a no-op rather than an error: it runs on the sign-in path, where a
  // visitor with no guest cart is the common case.
  if (!owner || owner.kind !== "person") return { kind: "nothing-to-merge" };

  // Read here rather than accept it from the caller. The cookie is httpOnly, so
  // the browser could not supply it even if we wanted it to — and a merge that
  // took a cart identifier as an argument would be a merge anyone could aim at
  // someone else's cart. `CART-01`: callers never pass identity.
  const guestKeyHash = await readGuestCartHash();
  if (!guestKeyHash) return { kind: "nothing-to-merge" };

  const outcome = await mergeCartsFor(owner.personId, guestKeyHash);

  // The guest key is spent. Clearing it is what makes a retry a no-op, and it
  // is why `COM-D4`'s "same merge idempotency key" needs no key column: the
  // guest cart *is* the key, and it is spent exactly once.
  //
  // Not cleared on `conflicts`, deliberately — the customer still has to choose
  // what to do with those lines, and clearing the cookie would throw away the
  // cart they were choosing about.
  if (outcome.kind === "merged") await clearGuestCartCookie();
  return outcome;
}
