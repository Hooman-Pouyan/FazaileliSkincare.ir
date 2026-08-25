import { z } from "zod";

/**
 * `getSession` returns `user` as `unknown` on purpose — the auth runtime does
 * not promise a shape, and casting would invent one. This parses the single
 * field the account page needs and returns null for anything else, so a change
 * upstream shows up as a signed-out page rather than as a crash or, worse, as
 * `undefined` rendered to a customer.
 */
const sessionUser = z.object({
  phoneNumber: z.string().min(1),
});

export function readAccountPhone(user: unknown): string | null {
  const parsed = sessionUser.safeParse(user);
  return parsed.success ? parsed.data.phoneNumber : null;
}
