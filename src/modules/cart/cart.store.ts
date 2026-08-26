"use client";

import { createStore } from "zustand/vanilla";

/**
 * The cart's client interaction state — and **only** that.
 *
 * `docs/architecture/data-and-state-ownership.md` names this store directly:
 * *"Zustand may coordinate cart-drawer visibility and a pending quantity
 * interaction, but the cart lines, totals, availability, and reservation expiry
 * come from the Cart server model."* So what lives here is: is the drawer open,
 * and which line is mid-flight.
 *
 * What deliberately does **not** live here is everything a customer could be
 * harmed by: no prices, no quantities, no availability, no reservation expiry,
 * no line list. Those are re-read from the server after every mutation. A cart
 * that renders its own remembered price is how someone reaches checkout
 * expecting a number the server will refuse — `AGENTS.md` rule 5, one layer up.
 *
 * **`pendingLineId`, not `isPending`.** The contract says pending presentation
 * state may reference an action identifier while the boundary owns the result,
 * so the store knows *which* line is busy and nothing about how it went.
 *
 * **No error field.** Errors are not canonical store state — the action result
 * owns them, and an error kept here would outlive the action that caused it.
 *
 * **`createStore`, not `create`.** A module-level store is a process global,
 * and in Next that is shared across requests: one customer's open drawer would
 * be another's. The provider makes one instance per mount.
 */

export type CartInteractionState = {
  readonly isDrawerOpen: boolean;
  /** The line currently awaiting a server action, if any. */
  readonly pendingLineId: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  setPendingLine: (lineId: string | null) => void;
};

export type CartStore = ReturnType<typeof createCartStore>;

export function createCartStore(initial?: { readonly isDrawerOpen?: boolean }) {
  return createStore<CartInteractionState>()((set) => ({
    isDrawerOpen: initial?.isDrawerOpen ?? false,
    pendingLineId: null,
    openDrawer: () => set({ isDrawerOpen: true }),
    closeDrawer: () => set({ isDrawerOpen: false, pendingLineId: null }),
    setPendingLine: (lineId) => set({ pendingLineId: lineId }),
  }));
}
