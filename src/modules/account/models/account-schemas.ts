import { z } from "zod";

/**
 * One schema per form, shared by the client and the Server Action — the forms
 * rule in `AGENTS.md`, and hard rule 3: every action opens with a Zod parse.
 */

/**
 * Ten digits, no separators — the format `address_postal_code_check` already
 * enforces in the database. Iranian postal codes are often written as
 * `XXXXX-XXXXX`, so the dash is stripped before validating rather than
 * rejected: refusing the format printed on somebody's own paperwork is a
 * failure of the form, not of the customer.
 */
const postalCode = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^\d{10}$/, "postal code must be ten digits"));

/**
 * Stored E.164. The database's `person_phone_e164_check` is the authority; this
 * is the same rule at the edge so a customer sees the error in the field rather
 * than as a failed action.
 */
const iranianPhone = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^\+98\d{10}$/, "phone must be +98 and ten digits"));

export const profileInput = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  preferredLocaleCode: z.enum(["fa", "en", "ar"]),
});

/**
 * The address form.
 *
 * **No phone field for the account holder, and a required one for the
 * recipient.** The person receiving a parcel is often not the person paying for
 * it — a daughter ordering for her mother is the common case here — and a
 * courier calls the recipient, not the payer.
 *
 * **The form asks for a city and nothing else about location.** The province is
 * derived from it server-side, which removes a whole class of problem rather
 * than validating it away: a dependent province/city pair needs JavaScript to
 * stay in step, and a mismatched pair submitted without it is a parcel filed
 * under the wrong province. A city belongs to exactly one province, so asking
 * twice was always asking one question too many.
 */
export const addressInput = z.object({
  id: z.uuid().optional(),
  recipientName: z.string().trim().min(1).max(120),
  recipientPhone: iranianPhone,
  cityCode: z.string().min(1).max(16),
  postalCode,
  line: z.string().trim().min(1).max(400),
  isDefault: z.boolean().default(false),
});

export const addressIdInput = z.object({ id: z.uuid() });

export type ProfileInput = z.infer<typeof profileInput>;
export type AddressInput = z.infer<typeof addressInput>;
