import { z } from "zod";
import { normalizeIranianPhone } from "../../../lib/auth/phone";

const genericIssue = "AUTH_FORM_INVALID";

const phone = z.string().transform((value, context) => {
  try {
    return normalizeIranianPhone(value);
  } catch {
    context.addIssue({ code: "custom", message: genericIssue });
    return z.NEVER;
  }
});

const toLatinDigits = (value: string): string =>
  value.replace(/[۰-۹٠-٩]/gu, (digit) => {
    const codePoint = digit.charCodeAt(0);
    const zero = codePoint >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(codePoint - zero);
  });

const code = z
  .string()
  .transform((value) => toLatinDigits(value.trim()))
  .pipe(z.string().regex(/^\d{6}$/u, genericIssue));

export const loginSchema = z.object({ phone });
export const verifySchema = z.object({ code });

export type LoginValues = z.input<typeof loginSchema>;
export type ParsedLoginValues = z.output<typeof loginSchema>;
export type VerifyValues = z.input<typeof verifySchema>;
export type ParsedVerifyValues = z.output<typeof verifySchema>;
