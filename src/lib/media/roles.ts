/**
 * Media roles, mirroring the `media_role` enum in the database.
 *
 * Declared here rather than imported from the schema so that a client component
 * rendering a tile does not pull Drizzle into the browser bundle. The two are
 * kept in step by `roles.test.ts`, which compares this list against the enum
 * itself — a duplicated constant that no test compares is how two lists drift.
 */
export const MEDIA_ROLES = [
  "primary",
  "gallery",
  "package",
  "texture",
  "unknown",
] as const;

export type MediaRole = (typeof MEDIA_ROLES)[number];
