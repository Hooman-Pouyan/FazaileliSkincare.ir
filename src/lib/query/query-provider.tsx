"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "./query-client";

/**
 * The Query boundary, mounted around the subtree that consumes it — not the app.
 *
 * `useState` rather than a module constant so the client is created once per
 * mount and never shared between server requests, which is the contract's
 * first rule for introducing Query at all.
 *
 * **Bounded on purpose.** The contract is explicit that *"PHP, PLP, PDP, SEO,
 * and server-owned facets do not become Query reads merely for consistency"* —
 * those pages are server-rendered because that is the site's whole competitive
 * argument, and putting them behind a client cache would trade ranking for
 * consistency. This wraps the shell so the cart drawer can synchronise across
 * routes, which is the approved first consumer, and nothing else subscribes.
 */
export function QueryProvider({ children }: { readonly children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
