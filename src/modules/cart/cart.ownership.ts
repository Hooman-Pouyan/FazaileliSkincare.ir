import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth/auth";

/**
 * Who this cart belongs to — `CART-01`.
 *
 * No `server-only` marker: the package is not a dependency here and adding one
 * for a convention the repository does not otherwise use would be drift. It is
 * also unnecessary — `next/headers` and `node:crypto` both fail in a client
 * component, so importing this from the browser breaks loudly at the import.
 *
 * Two owners, never both: a signed-in person, or an anonymous key. The database
 * enforces that with `cart_owner_check`, so this only has to decide which one
 * applies, in that order — signing in does not leave you shopping as a guest.
 *
 * **The guest key is issued by the server and never trusted from the client.**
 * The cookie holds a 256-bit random value; the row holds its SHA-256. That
 * asymmetry is the point: a cart id is a bearer token for someone's shopping,
 * and a database dump should not hand over the ability to read live carts. It
 * is the same reasoning as `AGENTS.md` rule 4 — server-owned, httpOnly, never
 * reachable from script.
 *
 * There is deliberately no way to pass a cart id in. `getCart` and every action
 * resolve ownership themselves, which is `CART-04`: *"callers never pass
 * cart/user/customer-group identity."* A function that accepted one would be a
 * function someone could call with somebody else's.
 */

export const GUEST_CART_COOKIE = "fz_cart";

/**
 * Ninety days. Long enough that a cart survives the gap between deciding and
 * being paid, which in Iran is a real interval; short enough to be a session
 * rather than a record. The cart row carries its own `expiresAt` as the
 * authority — this is only how long the browser keeps the key.
 */
const GUEST_COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

/** 32 bytes of CSPRNG, hex-encoded. Guessing one is not a threat model. */
const GUEST_KEY_BYTES = 32;

/** A stored key is a hex digest and nothing else. */
const guestKey = z.string().regex(/^[0-9a-f]{64}$/);

export function hashGuestKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export type CartOwner =
  | Readonly<{ kind: "person"; personId: string }>
  | Readonly<{ kind: "guest"; anonymousKeyHash: string }>;

const sessionUser = z.object({ id: z.string().min(1) });

/**
 * The owner for this request, without creating anything.
 *
 * Returns `null` for an anonymous visitor with no cookie yet: reading a cart
 * must not mint one. A cookie set on a `GET` would give every crawler a cart
 * and every page a `Set-Cookie`, which costs the shared cache for no one's
 * benefit. Writes call `resolveOrCreateCartOwner`.
 */
export async function resolveCartOwner(): Promise<CartOwner | null> {
  const session = await getSession(await headers());
  const user = sessionUser.safeParse(session?.user);
  if (user.success) return { kind: "person", personId: user.data.id };

  const raw = (await cookies()).get(GUEST_CART_COOKIE)?.value;
  const parsed = guestKey.safeParse(raw);
  if (!parsed.success) return null;

  return { kind: "guest", anonymousKeyHash: hashGuestKey(parsed.data) };
}

/**
 * The same, but issues a guest key when there is none.
 *
 * Only ever called from a Server Action, because only a write may set a cookie
 * — and because that is the first moment a visitor has actually asked for a
 * cart. A malformed or forged cookie is replaced rather than rejected: the
 * value is meaningless to anyone but this server, so the only sensible response
 * to one that does not parse is to hand out a real one.
 */
export async function resolveOrCreateCartOwner(): Promise<CartOwner> {
  const session = await getSession(await headers());
  const user = sessionUser.safeParse(session?.user);
  if (user.success) return { kind: "person", personId: user.data.id };

  const jar = await cookies();
  const existing = guestKey.safeParse(jar.get(GUEST_CART_COOKIE)?.value);
  if (existing.success) {
    return { kind: "guest", anonymousKeyHash: hashGuestKey(existing.data) };
  }

  const rawKey = randomBytes(GUEST_KEY_BYTES).toString("hex");
  jar.set(GUEST_CART_COOKIE, rawKey, {
    httpOnly: true,
    sameSite: "lax",
    // `lax` rather than `strict`: a customer arriving from an Instagram link
    // should still have their cart. It is not a credential and it authorises
    // no write that is not re-checked server-side.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE_SECONDS,
  });

  return { kind: "guest", anonymousKeyHash: hashGuestKey(rawKey) };
}

/**
 * The guest cart's hash, if this browser still carries one.
 *
 * Read even when a session exists, which is the whole point: at the moment of
 * sign-in the person is authenticated *and* still holding a guest cookie, and
 * that overlap is the only window in which the two carts can be reconciled.
 * `resolveCartOwner` deliberately stops looking once it finds a session, so it
 * cannot answer this.
 */
export async function readGuestCartHash(): Promise<string | null> {
  const raw = (await cookies()).get(GUEST_CART_COOKIE)?.value;
  const parsed = guestKey.safeParse(raw);
  return parsed.success ? hashGuestKey(parsed.data) : null;
}

/** After a merge, the guest key is spent — `COM-D4`. */
export async function clearGuestCartCookie(): Promise<void> {
  (await cookies()).delete(GUEST_CART_COOKIE);
}
