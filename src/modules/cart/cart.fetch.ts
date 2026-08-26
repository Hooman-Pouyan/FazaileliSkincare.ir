"use server";

import { getCart } from "./cart.reads";
import type { CartOutcome } from "./models/cart-models";

/**
 * The cart, for the drawer's TanStack Query cache.
 *
 * A Server Action rather than a Route Handler on purpose: the read already
 * resolves ownership from the session and the httpOnly cookie, and a
 * `/api/cart` endpoint would be a second, publicly addressable way to ask the
 * same question — one more surface to get authorisation right on, for no gain.
 *
 * It returns the **whole outcome**, including prices the server computed a
 * moment ago. Query caches that; it never becomes the source of it. The
 * distinction is `data-and-state-ownership.md`'s: *"treat query data as server
 * state and never copy it into Zustand"*, and it is why every mutation
 * invalidates rather than patching a cached total.
 */
export async function fetchCart(localeCode: string): Promise<CartOutcome> {
  return getCart(localeCode);
}
