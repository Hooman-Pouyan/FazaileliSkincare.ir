"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import {
  createCartStore,
  type CartInteractionState,
  type CartStore,
} from "./cart.store";

/**
 * One store per mount, never a module global.
 *
 * `data-and-state-ownership.md`: *"never use a mutable process-global store
 * that can leak between Next.js requests."* On the server a module-level store
 * is shared by every request being rendered, so one customer's open drawer
 * would be another customer's.
 *
 * `useState` with a lazy initialiser rather than a ref: the store is created
 * once and never recreated, and unlike `ref.current` it is safe to read during
 * render — which React 19 and `react-hooks/refs` are strict about, and which
 * caught the first version of this file. It is also the same shape as
 * `QueryProvider`, so both boundaries are written the one way.
 */
const CartStoreContext = createContext<CartStore | null>(null);

export function CartStoreProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [store] = useState(createCartStore);

  return (
    <CartStoreContext.Provider value={store}>
      {children}
    </CartStoreContext.Provider>
  );
}

/**
 * Subscribe through a narrow selector — the contract asks for it explicitly,
 * because a whole-store subscription re-renders the drawer every time a
 * quantity stepper starts spinning.
 */
export function useCartStore<T>(
  selector: (state: CartInteractionState) => T,
): T {
  const store = useContext(CartStoreContext);
  if (!store) {
    throw new Error("useCartStore must be used inside <CartStoreProvider>");
  }
  return useStore(store, selector);
}
