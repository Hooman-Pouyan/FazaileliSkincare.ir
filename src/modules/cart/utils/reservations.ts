/**
 * The reservation rules, in one place — `COM-D3`.
 *
 * These are the numbers a customer feels and an operator has to reason about,
 * so they are named constants with the decision beside them rather than
 * literals inside a query. `COM-D3` is explicit that *"the accepted TTL is
 * explicit and visible in operational documentation, not a silent constant."*
 */

/**
 * Twenty minutes, from `COM-D3`.
 *
 * Long enough to read a page, look at something else and come back; short
 * enough that an abandoned cart does not hold the last unit of something for an
 * afternoon. Checkout renews to a different, shorter window and a bank transfer
 * to a much longer one — neither is this number, and neither belongs to the
 * cart.
 */
export const CART_RESERVATION_TTL_MS = 20 * 60 * 1000;

export function reservationExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + CART_RESERVATION_TTL_MS);
}

/**
 * What one more customer can actually take.
 *
 * `onHand` less everything currently held by **someone else** — and the "else"
 * matters. A line's own reservation is being replaced by the write that follows,
 * so counting it would make a customer compete with themselves: raising a
 * quantity from 2 to 3 on the last 3 units would see 3 held, conclude 0 are
 * free, and refuse.
 *
 * `COM-D3`: availability subtracts only reservations that are `active` **and**
 * unexpired. An expired row still exists — request-time reclamation tidies it
 * later — so a predicate that forgets `expires_at` under-reports stock forever.
 *
 * Never negative. A negative would mean oversold, which is an integrity fault
 * rather than a quantity, and it is surfaced by the caller rather than clamped
 * silently into a plausible-looking zero.
 */
export function availableToReserve(
  onHand: number,
  heldByOthers: number,
): number {
  return Math.max(0, onHand - heldByOthers);
}
