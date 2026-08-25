import { createHmac } from "node:crypto";
import { normalizeIranianPhone } from "./phone";

export function createPlaceholderEmail(input: {
  phone: string;
  pepper: string;
}): string {
  if (!input.pepper) throw new Error("AUTH_IDENTIFIER_UNAVAILABLE");

  const phone = normalizeIranianPhone(input.phone);
  const digest = createHmac("sha256", input.pepper)
    .update(`placeholder-email:${phone}`)
    .digest("hex");

  return `${digest}@phone.fazaieli.invalid`;
}
