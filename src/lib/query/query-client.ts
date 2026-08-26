import { QueryClient } from "@tanstack/react-query";

/**
 * One `QueryClient` per browser, and never one shared across server requests.
 *
 * `data-and-state-ownership.md`: *"create a browser `QueryClient` without
 * sharing it across server requests."* A module-level client on the server is a
 * process global — one customer's cart cached into another customer's render.
 * That is the same failure the Zustand contract names, and it is worse here,
 * because a query cache holds data rather than a boolean.
 *
 * The defaults below are the stale/retry policy the contract requires be
 * documented rather than inherited:
 *
 * - **`staleTime: 0`.** Everything this cache holds is commerce truth that the
 *   server may have changed — a price, a stock level, a reservation that
 *   expired while the tab sat open. Query's job here is deduplication and
 *   invalidation, not freshness assumptions.
 * - **`retry: 1`.** A cart read on Iranian mobile infrastructure fails
 *   transiently often enough to be worth one retry, and rarely enough that
 *   three would just delay showing the customer an error.
 * - **`refetchOnWindowFocus`.** Coming back to a tab is exactly when a
 *   twenty-minute reservation is most likely to have expired.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: true,
      },
      mutations: {
        // A mutation is a Server Action that has already written. Retrying it
        // automatically would re-run a write whose idempotency this layer
        // cannot see, so the caller decides.
        retry: 0,
      },
    },
  });
}
