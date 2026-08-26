import { headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth/auth";

/**
 * Who is asking — the account module's single answer to that question.
 *
 * Every read and every action resolves the viewer here and nowhere else, for
 * the same reason `CART-01` gives: a function that accepts a person id is a
 * function anyone can call with somebody else's. Ownership is a predicate on
 * the query, not a check performed after it.
 *
 * `getSession` returns `user` as `unknown` on purpose — the auth runtime
 * promises no shape — so this parses the two fields the module needs and
 * returns null for anything else. A change upstream surfaces as a signed-out
 * page rather than as `undefined` rendered to a customer.
 */

const sessionUser = z.object({
  id: z.string().min(1),
  phoneNumber: z.string().min(1).optional(),
});

export type Viewer = Readonly<{ personId: string; phone: string | null }>;

export async function resolveViewer(): Promise<Viewer | null> {
  const session = await getSession(await headers());
  const parsed = sessionUser.safeParse(session?.user);
  if (!parsed.success) return null;
  return { personId: parsed.data.id, phone: parsed.data.phoneNumber ?? null };
}
