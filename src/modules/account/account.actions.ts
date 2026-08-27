"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { address, iranCity, person } from "@/lib/db/schema";
import { resolveViewer } from "./account.ownership";
import {
  addressIdInput,
  addressInput,
  profileInput,
} from "./models/account-schemas";

/**
 * The account's writes — `Phase D`. Nothing here moves money.
 *
 * Every action, in this order: **Zod parse, resolve the viewer, then the
 * database**, with the viewer in the `where` rather than in a check afterwards.
 * `AGENTS.md` hard rule 3, and the reason it is an order rather than a set: a
 * row read before ownership is known is a row that has already left the
 * database.
 *
 * **The phone is not editable here**, deliberately. It is the account's
 * identity and its verification is what a session rests on; changing it is
 * `AUTH5`'s job with re-verification attached, and letting a profile form move
 * it would be an account takeover with a save button.
 */

export type AccountActionResult =
  | Readonly<{ kind: "ok" }>
  | Readonly<{
      kind: "rejected";
      reason: "invalid" | "not-yours" | "not-signed-in" | "unknown-location";
    }>;

const REJECT_INVALID = { kind: "rejected", reason: "invalid" } as const;
const REJECT_ANON = { kind: "rejected", reason: "not-signed-in" } as const;
const REJECT_NOT_YOURS = { kind: "rejected", reason: "not-yours" } as const;

export async function updateProfile(
  raw: unknown,
): Promise<AccountActionResult> {
  const parsed = profileInput.safeParse(raw);
  if (!parsed.success) return REJECT_INVALID;

  const viewer = await resolveViewer();
  if (!viewer) return REJECT_ANON;

  const { firstName, lastName, preferredLocaleCode } = parsed.data;

  await db
    .update(person)
    .set({
      firstName,
      lastName,
      // `displayName` is what Better Auth and the rail render. Keeping it in
      // step here means a customer who fills in their name stops being
      // «مشتری فاضلی», which is the placeholder sign-up gives them.
      displayName: `${firstName} ${lastName}`.trim(),
      preferredLocaleCode,
      updatedAt: new Date(),
    })
    .where(eq(person.id, viewer.personId));

  revalidatePath("/account");
  return { kind: "ok" };
}

/**
 * Create or update one address.
 *
 * The province is **derived from the city**, never taken from the form. That is
 * a smaller surface than validating a pair: a dependent province/city selector
 * needs JavaScript to stay in step, and a mismatched pair submitted without it
 * is a parcel filed under the wrong province.
 *
 * Making an address default clears the previous one in the same transaction —
 * `address_person_default_unique` is a partial unique index, so two defaults is
 * not a bad state to be avoided, it is an insert that fails.
 */
export async function saveAddress(raw: unknown): Promise<AccountActionResult> {
  const parsed = addressInput.safeParse(raw);
  if (!parsed.success) return REJECT_INVALID;

  const viewer = await resolveViewer();
  if (!viewer) return REJECT_ANON;

  const input = parsed.data;

  // The province comes from the city, not from the form. A city belongs to
  // exactly one province, so there is no pair to disagree with itself.
  const city = await db
    .select({ provinceCode: iranCity.provinceCode })
    .from(iranCity)
    .where(eq(iranCity.code, input.cityCode))
    .limit(1);

  const provinceCode = city[0]?.provinceCode;
  if (!provinceCode) return { kind: "rejected", reason: "unknown-location" };

  return db.transaction(async (tx) => {
    if (input.id) {
      // Ownership is the predicate. A row belonging to someone else simply
      // does not match, and `rowCount` tells us so without a second query.
      const owned = await tx
        .select({ id: address.id })
        .from(address)
        .where(
          and(eq(address.id, input.id), eq(address.personId, viewer.personId)),
        )
        .limit(1);
      if (!owned[0]) return REJECT_NOT_YOURS;
    }

    if (input.isDefault) {
      await tx
        .update(address)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(address.personId, viewer.personId));
    }

    const values = {
      personId: viewer.personId,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      provinceCode,
      cityCode: input.cityCode,
      postalCode: input.postalCode,
      line: input.line,
      isDefault: input.isDefault,
      updatedAt: new Date(),
    };

    if (input.id) {
      await tx.update(address).set(values).where(eq(address.id, input.id));
    } else {
      // The first address a person saves is their default, whatever the form
      // said — an address book of one with nothing marked is a checkout step
      // that asks a question with one possible answer.
      const existing = await tx
        .select({ id: address.id })
        .from(address)
        .where(eq(address.personId, viewer.personId))
        .limit(1);
      await tx
        .insert(address)
        .values({ ...values, isDefault: input.isDefault || !existing[0] });
    }

    revalidatePath("/account");
    return { kind: "ok" } as const;
  });
}

export async function deleteAddress(
  raw: unknown,
): Promise<AccountActionResult> {
  const parsed = addressIdInput.safeParse(raw);
  if (!parsed.success) return REJECT_INVALID;

  const viewer = await resolveViewer();
  if (!viewer) return REJECT_ANON;

  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: address.id, isDefault: address.isDefault })
      .from(address)
      .where(
        and(
          eq(address.id, parsed.data.id),
          eq(address.personId, viewer.personId),
        ),
      )
      .limit(1);

    const target = rows[0];
    // Deleting something already gone is a success. A double-tapped delete
    // must not report a failure for work that is done.
    if (!target) return { kind: "ok" } as const;

    await tx.delete(address).where(eq(address.id, target.id));

    // Removing the default leaves the book with none, so the oldest survivor
    // takes it. Otherwise checkout would offer a list with nothing preselected
    // for someone who has never made that choice.
    if (target.isDefault) {
      const next = await tx
        .select({ id: address.id })
        .from(address)
        .where(eq(address.personId, viewer.personId))
        .limit(1);
      if (next[0]) {
        await tx
          .update(address)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(eq(address.id, next[0].id));
      }
    }

    revalidatePath("/account");
    return { kind: "ok" } as const;
  });
}

export async function setDefaultAddress(
  raw: unknown,
): Promise<AccountActionResult> {
  const parsed = addressIdInput.safeParse(raw);
  if (!parsed.success) return REJECT_INVALID;

  const viewer = await resolveViewer();
  if (!viewer) return REJECT_ANON;

  return db.transaction(async (tx) => {
    const owned = await tx
      .select({ id: address.id })
      .from(address)
      .where(
        and(
          eq(address.id, parsed.data.id),
          eq(address.personId, viewer.personId),
        ),
      )
      .limit(1);
    if (!owned[0]) return REJECT_NOT_YOURS;

    await tx
      .update(address)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(address.personId, viewer.personId),
          ne(address.id, parsed.data.id),
        ),
      );
    await tx
      .update(address)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(address.id, parsed.data.id));

    revalidatePath("/account");
    return { kind: "ok" } as const;
  });
}

/**
 * The same four actions as `<form action=…>` targets.
 *
 * The account surface has to work with JavaScript off for the same reason the
 * cart does — `AGENTS.md` — and a form whose `action` is a Server Action is the
 * mechanism that makes that true without a second code path. React posts it
 * when it can and the browser posts it when it cannot.
 *
 * `FormData` values are strings, so the booleans and the optional id are
 * normalised here and then handed to the same Zod schema as every other
 * caller. The parse is not skipped; it is reached by a different road.
 *
 * **A rejection redirects with its reason rather than being discarded.** The
 * first version swallowed the result, on the theory that the re-render was
 * feedback enough. It is not: a save that fails validation became a silent
 * no-op with nothing to tell the customer why — and it cost real time to
 * diagnose here, which is exactly the confusion a customer would have had with
 * no way to resolve it. `?error=` survives without JavaScript, which is the
 * constraint that rules out `useActionState` as the only channel.
 */

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Send the customer back to the account page, carrying why it failed.
 *
 * Locale-prefixed through `@/i18n/navigation` — a raw redirect drops the prefix
 * and lands a Persian customer on the default locale (`R-1`).
 */
async function back(result: AccountActionResult): Promise<void> {
  const locale = await getLocale();
  if (result.kind === "ok") {
    return redirect({ href: { pathname: "/account" }, locale });
  }
  return redirect({
    href: { pathname: "/account", query: { error: result.reason } },
    locale,
  });
}

export async function saveAddressFormAction(formData: FormData): Promise<void> {
  const id = text(formData, "id");
  const result = await saveAddress({
    ...(id ? { id } : {}),
    recipientName: text(formData, "recipientName"),
    recipientPhone: text(formData, "recipientPhone"),
    cityCode: text(formData, "cityCode"),
    postalCode: text(formData, "postalCode"),
    line: text(formData, "line"),
    isDefault: formData.get("isDefault") !== null,
  });
  return back(result);
}

export async function deleteAddressFormAction(
  formData: FormData,
): Promise<void> {
  return back(await deleteAddress({ id: text(formData, "id") }));
}

export async function setDefaultAddressFormAction(
  formData: FormData,
): Promise<void> {
  return back(await setDefaultAddress({ id: text(formData, "id") }));
}

export async function updateProfileFormAction(
  formData: FormData,
): Promise<void> {
  return back(
    await updateProfile({
      firstName: text(formData, "firstName"),
      lastName: text(formData, "lastName"),
      preferredLocaleCode: text(formData, "preferredLocaleCode"),
    }),
  );
}
