import { z } from "zod";

/**
 * Where a customer is told to send money — **the maintainer's fact, read from
 * the environment, and absent until he supplies it.**
 *
 * `COM4` needs an account to name. Inventing one is not a placeholder, it is a
 * wrong number on a payment instruction, so this **fails closed**: with nothing
 * configured, `bankAccount()` returns null and the transfer screen says the
 * details are not available rather than showing a plausible IBAN. That is the
 * same shape `PDP-09` uses for the enquiry link with no WhatsApp number behind
 * it.
 *
 * Nothing here is secret — a shop's account number is printed on its invoices —
 * so these are ordinary environment values rather than anything vaulted. They
 * are environment values rather than a database row because they change once a
 * year and belong with deployment, not with content.
 *
 *   BANK_TRANSFER_HOLDER=...   the name on the account
 *   BANK_TRANSFER_BANK=...     which bank
 *   BANK_TRANSFER_CARD=...     16-digit card number, digits only
 *   BANK_TRANSFER_IBAN=...     IR + 24 digits (optional)
 */

const schema = z.object({
  holder: z.string().trim().min(1),
  bank: z.string().trim().min(1),
  card: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\d{16}$/)),
  iban: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, "").toUpperCase())
    .pipe(z.string().regex(/^IR\d{24}$/))
    .optional(),
});

export type BankAccount = z.infer<typeof schema>;

/**
 * Takes a plain string map rather than `NodeJS.ProcessEnv`, so a test can pass
 * four keys without inventing a `NODE_ENV` it does not care about — and so the
 * function states what it actually needs.
 */
export type EnvLike = Readonly<Record<string, string | undefined>>;

export function bankAccount(env: EnvLike = process.env): BankAccount | null {
  const parsed = schema.safeParse({
    holder: env["BANK_TRANSFER_HOLDER"],
    bank: env["BANK_TRANSFER_BANK"],
    card: env["BANK_TRANSFER_CARD"],
    ...(env["BANK_TRANSFER_IBAN"] ? { iban: env["BANK_TRANSFER_IBAN"] } : {}),
  });
  // A partially configured account is not usable, and half a card number on a
  // payment page is worse than none.
  return parsed.success ? parsed.data : null;
}
