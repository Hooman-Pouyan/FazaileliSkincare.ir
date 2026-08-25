import parsePhoneNumber from "libphonenumber-js/core";
import metadata from "libphonenumber-js/metadata.max.json";

export class InvalidIranianPhoneError extends Error {
  readonly code = "INVALID_PHONE";

  constructor() {
    super("INVALID_PHONE");
    this.name = "InvalidIranianPhoneError";
  }
}

function convertToLatinDigits(input: string): string {
  return input.replace(/[\u0660-\u0669\u06f0-\u06f9]/gu, (digit) => {
    const codePoint = digit.codePointAt(0);

    if (codePoint === undefined) return digit;
    const zero = codePoint >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(codePoint - zero);
  });
}

export function normalizeIranianPhone(input: string): string {
  const phone = parsePhoneNumber(convertToLatinDigits(input), "IR", metadata);

  if (
    phone?.country !== "IR" ||
    !phone.isValid() ||
    phone.getType() !== "MOBILE"
  ) {
    throw new InvalidIranianPhoneError();
  }

  return phone.number;
}

export function maskIranianPhone(input: string): string {
  const phone = normalizeIranianPhone(input);
  return `${phone.slice(0, 3)}${"*".repeat(phone.length - 7)}${phone.slice(-4)}`;
}

/**
 * Groups a canonical E.164 Iranian number for reading: +98 912 345 6789.
 *
 * Display only. Every lookup, uniqueness check and rate-limit key uses the
 * unformatted canonical value from `normalizeIranianPhone`, or the same person
 * would occupy two identities.
 */
export function formatIranianPhone(input: string): string {
  const phone = normalizeIranianPhone(input);
  return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
}
