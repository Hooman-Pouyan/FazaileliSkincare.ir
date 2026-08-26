"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { queryKeys } from "@/lib/query/query-keys";
import { removeLine, setLineQuantity, addLine } from "./cart.actions";
import { fetchCart } from "./cart.fetch";
import { useCartStore } from "./cart.store-provider";
import type { CartActionResult } from "./models/cart-models";

/**
 * The cart, as the drawer sees it.
 *
 * This is TanStack Query's first approved consumer — candidate 1 in
 * `data-and-state-ownership.md`, *"cart drawer synchronization across routes"*.
 * It earns Query rather than a `useState` because it is exactly the problem
 * Query exists for: one piece of server state read by a drawer that outlives
 * every navigation, needing deduplication when several components ask at once,
 * invalidation after a mutation, and a refetch when a tab regains focus with a
 * twenty-minute reservation possibly expired behind it.
 *
 * **No optimistic quantities, prices or totals.** The contract forbids it
 * outright — *"do not use optimistic price, eligibility, stock, reservation, or
 * total values"* — and the reason is commercial rather than technical: an
 * optimistic total is a number the customer believes and the server has not
 * agreed to. Mutations therefore invalidate and refetch. The stepper shows
 * pending state through the Zustand store instead, which is a fact about the
 * interface rather than about money.
 */
export function useCart() {
  const locale = useLocale();
  return useQuery({
    queryKey: queryKeys.cart(locale),
    queryFn: () => fetchCart(locale),
  });
}

function useCartMutation<TInput>(
  action: (input: TInput) => Promise<CartActionResult>,
) {
  const locale = useLocale();
  const client = useQueryClient();
  const setPendingLine = useCartStore((state) => state.setPendingLine);

  return useMutation({
    mutationFn: action,
    // Always re-read, whether the action succeeded or was refused: a rejection
    // usually means the server knows something the cache does not.
    onSettled: async () => {
      setPendingLine(null);
      await client.invalidateQueries({ queryKey: queryKeys.cart(locale) });
    },
  });
}

export function useAddLine() {
  return useCartMutation(addLine);
}

export function useSetLineQuantity() {
  return useCartMutation(setLineQuantity);
}

export function useRemoveLine() {
  return useCartMutation(removeLine);
}
