/**
 * Every query key in the application, in one place.
 *
 * `data-and-state-ownership.md` requires the first keys to be documented, and
 * requires them to be *"derived from canonical primitive identifiers"* — so a
 * key is built from the same values a URL or a database row would carry, never
 * from an object whose property order decides cache identity.
 *
 * Keeping them together is what makes invalidation reviewable: the alternative
 * is `["cart"]` written in four components and misspelled in one, which fails
 * silently by simply never invalidating.
 */
export const queryKeys = {
  /**
   * The cart, scoped by locale.
   *
   * Locale is part of the key because the model carries localised names and a
   * formatted price — the same cart in another language is a different render,
   * and reusing the cached one would show Persian names on `/en/cart`.
   *
   * Ownership is deliberately **not** in the key. The server resolves the owner
   * from the session and the httpOnly cookie (`CART-01`), so a key that carried
   * a cart id would be both redundant and a way to ask for someone else's.
   */
  cart: (locale: string) => ["cart", locale] as const,
} as const;
