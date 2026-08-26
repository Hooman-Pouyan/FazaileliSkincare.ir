/**
 * The one place an image address is built.
 *
 * Media rows store an **object key** — `catalog/storyderm/clinic-a/clinic-a-cream/primary-640.webp`
 * — and never a URL. The key is stable for the life of the file; where it is
 * served from is deployment configuration. Today that is `/media` out of
 * `public/`; tomorrow it is an Arvan or Liara bucket, and the change is one
 * environment variable rather than a migration and a search for every place a
 * path was concatenated.
 *
 * This is the same defect class as the locale prefix (`R-1`): every individual
 * `"/images/" + path` is correct, the system built out of them is not, and the
 * day the origin moves one of the seventeen call sites is missed.
 *
 * Decisions `C-7` and `C-8` in `docs/26-content-and-catalogue-decisions.md`.
 * Guarded by `url.guard.test.ts`.
 */

import type { MediaRole } from "./roles";

/**
 * Where derivatives are served from. Read at module scope so Next can inline it
 * into the client bundle — `NEXT_PUBLIC_*` is substituted at build time, not
 * looked up at runtime, so destructuring or indexing `process.env` dynamically
 * would leave it `undefined` in the browser.
 *
 * A remote origin also needs `images.remotePatterns` in `next.config.ts` before
 * `next/image` will optimise it. That is added with the origin, not before it.
 */
// `.env.example` ships the key with an empty value so the variable is visible
// and documented; an empty string means "unset", not "serve from the root".
const CONFIGURED_ORIGIN =
  process.env.NEXT_PUBLIC_MEDIA_ORIGIN || "/media";

/** Trailing slashes are a formatting choice; the joiner should not care. */
export const MEDIA_ORIGIN = CONFIGURED_ORIGIN.replace(/\/+$/, "");

/**
 * The two derivative widths every surface is served from. The tile renders at
 * 320 CSS px at the widest breakpoint and the gallery at 800; both double for
 * high-density displays. A third size is added when a surface needs one — `C-9`.
 */
export const DERIVATIVE_WIDTHS = {
  card: 640,
  detail: 1600,
} as const;

export type Derivative = keyof typeof DERIVATIVE_WIDTHS;

/**
 * A key is lowercase ASCII, slash-separated, and carries no leading slash, no
 * traversal and no whitespace. The source filenames contain spaces, parentheses
 * and Korean characters; none of them survive into a key.
 */
const VALID_KEY = /^[a-z0-9][a-z0-9._/-]*[a-z0-9]$/;

export function isObjectKey(value: string): boolean {
  return VALID_KEY.test(value) && !value.includes("//") && !value.includes("..");
}

/**
 * Resolve a stored object key to something a browser can fetch.
 *
 * Throws on a malformed key rather than emitting a broken `src`. A key is
 * written by the seed and constrained by the database, so a bad one is a
 * programming error, and a loud failure in development is worth more than a
 * silent 404 in production.
 */
export function mediaUrl(objectKey: string): string {
  if (!isObjectKey(objectKey)) {
    throw new Error(
      `Not an object key: ${JSON.stringify(objectKey)}. Keys are lowercase, ` +
        `slash-separated and relative — see C-8.`,
    );
  }

  return `${MEDIA_ORIGIN}/${objectKey}`;
}

/**
 * One media row's slot within its product: `primary`, `gallery-2`, `package-1`.
 *
 * The slot rather than the row's UUID keeps a bucket listing readable and
 * survives a database restore — a key that reads
 * `clinic-a-cream/gallery-2-640.webp` is diagnosable by eye, and
 * `9f3c…-640.webp` is not.
 */
export function mediaSlot(role: MediaRole, ordinal: number): string {
  return role === "primary" ? "primary" : `${role}-${ordinal}`;
}

type KeyParts = {
  brandSlug: string;
  lineSlug: string;
  productSlug: string;
  slot: string;
};

function prefix({ brandSlug, lineSlug, productSlug }: KeyParts): string {
  return `catalog/${brandSlug}/${lineSlug}/${productSlug}`;
}

/**
 * The key of a generated derivative. The width is in the name, so the file is
 * immutable and cacheable forever.
 */
export function derivativeKey(parts: KeyParts, derivative: Derivative): string {
  return `${prefix(parts)}/${parts.slot}-${DERIVATIVE_WIDTHS[derivative]}.webp`;
}

/**
 * The key of the untouched source file. Stored for provenance and never served
 * to a browser — the originals run to 14 MiB.
 */
export function originalKey(parts: KeyParts, extension: string): string {
  const clean = extension.replace(/^\./, "").toLowerCase();
  return `${prefix(parts)}/${parts.slot}-original.${clean}`;
}
