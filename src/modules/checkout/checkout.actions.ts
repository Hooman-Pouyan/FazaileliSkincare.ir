"use server";

import { createHash } from "node:crypto";
import { derivedUuid } from "@/lib/idempotency";
import { z } from "zod";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { resolveViewer } from "@/modules/account/account.ownership";
import { getProfile } from "@/modules/account/account.reads";
import { placeOrder } from "./checkout.service";

/**
 * Placing an order — the action `COM3` gates.
 *
 * Redirects go through `@/i18n/navigation`, not `next/navigation`. A raw
 * redirect drops the locale prefix, which lands a Persian customer on the
 * default-locale route mid-checkout — `R-1`, and the class of bug the
 * `locale-prefix` gate exists to catch. It caught this one.
 *
 * Zod parse, resolve the viewer, then the service; the viewer is never a
 * parameter a caller supplies. `AGENTS.md` hard rule 3.
 *
 * **The idempotency key is derived, not generated.** A fresh random key per
 * submission would make every double-tap a new order, which is the exact
 * failure `customer_order`'s unique index exists to prevent. It is a hash of
 * the person and their submitted choices, shaped as a UUID — so the same intent
 * submitted twice produces the same key and loses the race to its own first
 * attempt, while a genuinely different order produces a different one.
 */

const placeOrderInput = z.object({
  addressId: z.uuid(),
  method: z.enum(["post", "courier", "pickup"]),
});

/** Exported for the test that proves a repeated submission repeats the key. */
export async function deriveIdempotencyKey(
  parts: readonly string[],
): Promise<string> {
  return derivedUuid(parts);
}

export async function placeOrderFormAction(formData: FormData): Promise<void> {
  const locale = await getLocale();

  const parsed = placeOrderInput.safeParse({
    addressId: formData.get("addressId"),
    method: formData.get("method"),
  });
  if (!parsed.success)
    return redirect({
      href: { pathname: "/checkout", query: { error: "invalid" } },
      locale,
    });

  const viewer = await resolveViewer();
  if (!viewer)
    return redirect({
      href: { pathname: "/login", query: { next: "/checkout" } },
      locale,
    });

  const profile = await getProfile(viewer);
  const contactPhone = profile?.phone ?? viewer.phone;
  // An order has to be callable. Without a verified number there is no way to
  // arrange delivery, and inventing one is not an option.
  if (!contactPhone)
    return redirect({
      href: { pathname: "/account", query: { error: "phone-required" } },
      locale,
    });

  const requestHash = createHash("sha256")
    .update(
      [viewer.personId, parsed.data.addressId, parsed.data.method].join(" "),
    )
    .digest("hex");

  const result = await placeOrder({
    personId: viewer.personId,
    addressId: parsed.data.addressId,
    method: parsed.data.method,
    contactPhone,
    idempotencyKey: derivedUuid([viewer.personId, requestHash]),
    requestHash,
  });

  if (result.kind === "rejected") {
    return redirect({
      href: { pathname: "/checkout", query: { error: result.reason } },
      locale,
    });
  }

  /*
    `next-intl`'s `redirect` is not typed `never`, unlike the one in
    `next/navigation`, so every call is returned explicitly. Without that
    TypeScript cannot narrow `viewer` or `result` past the guards above — and
    the compiler saying so is the honest signal that the control flow was
    ambiguous to a reader too.
  */
  return redirect({
    href: {
      pathname: `/account/orders/${result.orderId}`,
      query: { placed: "1" },
    },
    locale,
  });
}
