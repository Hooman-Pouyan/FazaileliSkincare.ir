import { z } from "zod";

/**
 * One schema per action, shared by the client form and the server action —
 * `AGENTS.md` forms rule, and hard rule 3: *every* server action opens with a
 * Zod parse.
 *
 * `MAX_LINE_QUANTITY` is a bound on a single line, not a business policy about
 * how much anyone may buy. It exists because an unbounded integer from a form
 * reaches `SUM(quantity)` and a reservation, and "the customer typed 2^31" is
 * not a case worth discovering in production. Stock is the real limit and it is
 * re-checked server-side regardless of what this allows.
 */
export const MAX_LINE_QUANTITY = 99;

const quantity = z
  .number()
  .int()
  .min(1, "quantity must be at least 1")
  .max(MAX_LINE_QUANTITY);

export const addLineInput = z.object({
  variantId: z.uuid(),
  quantity: quantity.default(1),
});

export const setLineQuantityInput = z.object({
  lineId: z.uuid(),
  /** Absolute, never a delta: a retried increment must not add twice. */
  quantity,
});

export const removeLineInput = z.object({
  lineId: z.uuid(),
});

export type AddLineInput = z.infer<typeof addLineInput>;
export type SetLineQuantityInput = z.infer<typeof setLineQuantityInput>;
export type RemoveLineInput = z.infer<typeof removeLineInput>;
