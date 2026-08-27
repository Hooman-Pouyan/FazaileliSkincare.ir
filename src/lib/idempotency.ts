import { createHash } from "node:crypto";

/**
 * A stable UUID derived from arbitrary text.
 *
 * Several places need an idempotency key that is **the same for the same
 * intent** rather than fresh each time: a checkout submitted twice, a
 * settlement retried after a timeout, one movement row per order line. Those
 * columns are `uuid`, and the guarantee is a unique index — so the key has to
 * be a real UUID *and* a pure function of what it identifies.
 *
 * A random key would defeat the index it exists to feed: every retry would look
 * like a new intent and the second one would succeed. That is the failure this
 * prevents, and it is the expensive one — it is how a shop charges twice.
 *
 * Parts are joined on a NUL, which cannot appear in an id, so `["ab", "c"]` and
 * `["a", "bc"]` cannot collide. Joining on a space or a colon would let two
 * different intents hash to one key, which is the same bug wearing a disguise.
 *
 * Shaped as a v5 UUID (version nibble `5`, RFC-4122 variant bits) because the
 * column and anyone reading it expect that shape. It is not a true name-based
 * v5 — there is no namespace — so it is not portable across systems and is not
 * meant to be: it identifies rows in this database only.
 */
export function derivedUuid(parts: readonly string[]): string {
  const hex = createHash("sha256").update(parts.join("\u0000")).digest("hex");
  const variant = ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, "0");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    variant + hex.slice(18, 20),
    hex.slice(20, 32),
  ].join("-");
}
