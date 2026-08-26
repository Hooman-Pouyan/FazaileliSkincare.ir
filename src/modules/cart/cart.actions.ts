"use server";

import { revalidatePath } from "next/cache";
import { addLineFor, removeLineFor, setLineQuantityFor } from "./cart.service";
import { resolveCartOwner, resolveOrCreateCartOwner } from "./cart.ownership";
import type { CartActionResult } from "./models/cart-models";

/**
 * The cart's Server Action boundary — `CART-02`.
 *
 * Thin on purpose. Each action does exactly three things: resolve who is
 * asking, hand the work to `cart.service.ts`, and revalidate. The parse and the
 * transaction live in the service, so the ordering `AGENTS.md` hard rule 3
 * requires — parse, authorise, then database — is enforced in one place rather
 * than repeated three times with one of them eventually forgotten.
 *
 * **Ownership is resolved here and nowhere else.** No action takes a cart id.
 * An action that accepted one would be an action anyone could call with
 * somebody else's, and no amount of checking afterwards makes that safe.
 *
 * `addLine` may create a cart, so it is the only one that may issue a guest
 * cookie. The other two operate on a cart that must already exist — if there is
 * no owner, there is nothing of theirs to change.
 *
 * `revalidatePath` refreshes the server-rendered `/cart` route. The drawer is
 * kept in step by TanStack Query invalidating its own key from the caller; the
 * two mechanisms cover the two surfaces and neither is a source of truth.
 */

export async function addLine(raw: unknown): Promise<CartActionResult> {
  const owner = await resolveOrCreateCartOwner();
  const result = await addLineFor(owner, raw);
  if (result.kind === "ok") revalidatePath("/cart");
  return result;
}

export async function setLineQuantity(raw: unknown): Promise<CartActionResult> {
  const owner = await resolveCartOwner();
  if (!owner) return { kind: "rejected", reason: "not-yours" };
  const result = await setLineQuantityFor(owner, raw);
  if (result.kind === "ok") revalidatePath("/cart");
  return result;
}

export async function removeLine(raw: unknown): Promise<CartActionResult> {
  const owner = await resolveCartOwner();
  if (!owner) return { kind: "rejected", reason: "not-yours" };
  const result = await removeLineFor(owner, raw);
  if (result.kind === "ok") revalidatePath("/cart");
  return result;
}

/**
 * The same three mutations, as `<form action=…>` targets.
 *
 * `/cart` has to work with JavaScript off — `AGENTS.md` — and a `<button
 * onClick>` is inert without it. A form whose `action` is a Server Action is
 * not: React posts it, the action runs, `revalidatePath` re-renders, and the
 * reader gets their updated cart. With JavaScript on, React intercepts the same
 * submit and nothing reloads. One control, correct either way, which is what
 * progressive enhancement actually means.
 *
 * They take `FormData` because that is what a form sends. Values arrive as
 * strings, so quantity is parsed here and then handed to the same Zod schema as
 * every other caller — the parse is not skipped, it is reached by a different
 * road.
 *
 * The result is deliberately discarded. A form post has nowhere to put a return
 * value, and the re-render shows the truth: a refused quantity change leaves the
 * line at its previous number with its issue line explaining why. The drawer,
 * which has JavaScript by definition, uses the typed actions above and can show
 * the rejection directly.
 */

function readQuantity(formData: FormData): number {
  const raw = formData.get("quantity");
  return Number.parseInt(typeof raw === "string" ? raw : "", 10);
}

export async function setLineQuantityFormAction(
  formData: FormData,
): Promise<void> {
  await setLineQuantity({
    lineId: formData.get("lineId"),
    quantity: readQuantity(formData),
  });
}

export async function removeLineFormAction(formData: FormData): Promise<void> {
  await removeLine({ lineId: formData.get("lineId") });
}
