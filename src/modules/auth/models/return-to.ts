/**
 * Where to send someone after they sign in — safely.
 *
 * `Phase D` requires a signed-out visitor to be returned to where they were
 * going rather than to the home page: being bounced to the Landing is how a
 * customer loses the thing they came to do, and on an invoice link it means
 * they never arrive at all.
 *
 * **The value comes from a query string, so it is attacker-controlled.** An
 * unchecked `?next=` is an open redirect — the classic phishing primitive,
 * where a link that genuinely starts on this domain lands somebody on one that
 * does not. So this accepts only a same-origin *path*:
 *
 * - it must start with a single `/` — `//evil.example` is protocol-relative and
 *   goes off-site, and `https://evil.example` obviously does;
 * - no backslashes, which some browsers normalise to `/` *after* a naive check;
 * - no control characters, which can truncate a URL inside a parser.
 *
 * The pathname stays locale-agnostic; `@/i18n/navigation` applies the prefix,
 * so nothing here builds one by hand (`R-1`).
 */

export const DEFAULT_RETURN_TO = "/";

/** Control characters and space, which have no business in a pathname here. */
const UNSAFE = /[\u0000-\u0020\u007f]/;

export function safeReturnTo(
  raw: string | null | undefined,
  fallback: string = DEFAULT_RETURN_TO,
): string {
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  if (raw.length > 512) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("\\")) return fallback;
  if (UNSAFE.test(raw)) return fallback;
  return raw;
}
