import type { QueryIssue } from "./catalogue-query";

/**
 * Every storefront read returns one of these. The route's whole job is to turn
 * the tag into a response, which is what keeps route files thin and stops each
 * one inventing its own idea of what "nothing to show" means.
 *
 * The distinctions are deliberate and none of them collapse into another:
 *
 * - A valid search with zero matches is `ready` with an empty result set. It is
 *   not `not-found`; the scope exists and the customer's query was fine.
 * - A product that exists but has no approved copy in this locale is
 *   `locale-unavailable`, never `not-found` and never the wrong language. There
 *   is no fallback chain.
 * - A database outage is none of these. It throws and reaches `error.tsx`,
 *   because an outage rendering as an empty catalogue is how a shop quietly
 *   stops selling.
 */
export type StorefrontOutcome<T> =
  | Readonly<{ kind: "ready"; page: T }>
  | Readonly<{ kind: "redirect"; href: string }>
  | Readonly<{ kind: "not-found" }>
  | Readonly<{ kind: "locale-unavailable" }>
  | Readonly<{ kind: "invalid-query"; issues: readonly QueryIssue[] }>;

export function ready<T>(page: T): StorefrontOutcome<T> {
  return { kind: "ready", page };
}

export function redirect<T>(href: string): StorefrontOutcome<T> {
  return { kind: "redirect", href };
}

export function notFound<T>(): StorefrontOutcome<T> {
  return { kind: "not-found" };
}

export function localeUnavailable<T>(): StorefrontOutcome<T> {
  return { kind: "locale-unavailable" };
}

export function invalidQuery<T>(
  issues: readonly QueryIssue[],
): StorefrontOutcome<T> {
  return { kind: "invalid-query", issues };
}
