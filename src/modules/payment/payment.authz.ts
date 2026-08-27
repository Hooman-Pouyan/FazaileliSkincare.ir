import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { personRole } from "@/lib/db/schema";
import {
  resolveViewer,
  type Viewer,
} from "@/modules/account/account.ownership";

/**
 * Who may review a bank transfer — `COM4`'s staff authorisation.
 *
 * **Roles are read from the database on every request, never from the session.**
 * A role copied into a session token stays true until that token expires, so
 * revoking someone's access would not take effect until they happened to sign
 * out. For the one screen in this application that can mark money as received,
 * that gap is not acceptable — the extra query is worth it.
 *
 * Returns null rather than throwing, so a route can decide between
 * `notFound()` and a redirect. `/admin` uses `notFound()`: telling an
 * unauthorised visitor that a staff page exists is information they did not
 * have, and the queue's existence is not something a customer needs to know.
 */

const REVIEWERS = ["staff", "admin"] as const;

export async function resolveReviewer(): Promise<Viewer | null> {
  const viewer = await resolveViewer();
  if (!viewer) return null;

  const held = await db
    .select({ role: personRole.role })
    .from(personRole)
    .where(
      and(
        eq(personRole.personId, viewer.personId),
        inArray(personRole.role, [...REVIEWERS]),
      ),
    )
    .limit(1);

  return held[0] ? viewer : null;
}
