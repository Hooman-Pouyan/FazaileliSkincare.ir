/**
 * Whether this server may show records a customer must never see.
 *
 * Shared by the catalogue and the content spine, and by whatever surface asks
 * next — Landing beats, Academy offerings, Booking copy all reach the same
 * question. It lives in `lib/` rather than inside one module because a second
 * copy of a rule this consequential is a second place for it to be wrong, and
 * modules do not import each other's types (`AGENTS.md`).
 *
 * Two kinds of record need it, for the same reason. The Storyderm catalogue is
 * real identity with unverified commercial truth; seeded editorial copy is
 * written in Mahdieh's voice without her review (`C-14`). Both are `draft` and
 * unpublished — and the database's own
 * `product_published_state_check` makes that pair inseparable: a product cannot
 * be published unless it is approved, and `content_block_published_state_check`
 * says the same for a block. That is correct, and it means the development
 * storefront would render an empty shop with no answers on it unless the *read*
 * relaxes rather than the data lying.
 *
 * `14-storyderm-draft-catalog-pipeline.md` P2 authorised exactly this and drew
 * the line it must not cross: _"Local and staging catalogue queries may expose
 * those rows only through an explicit server-owned draft-preview mode … a
 * client search parameter must never bypass that predicate."_
 *
 * So: server-owned, never a search parameter, and never on in production —
 * `NODE_ENV` is checked first and the environment variable cannot override it.
 *
 * What preview does NOT relax: an active variant is still required. That is
 * what keeps a held product (`C-17`) invisible in both modes, and it is why the
 * seeder marks a held product's variants inactive rather than relying on
 * publication alone.
 */

export type DraftPreview = Readonly<{ previewDrafts: boolean }>;

export const PUBLIC_ONLY: DraftPreview = { previewDrafts: false };

export function resolveDraftPreview(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  setting: string | undefined = process.env.CONTENT_DRAFT_PREVIEW,
): DraftPreview {
  // Production first, and not overridable. An environment variable set by
  // accident on a production host must not be able to publish a draft
  // catalogue; the only way to show drafts there is to approve them.
  if (nodeEnv === "production") return PUBLIC_ONLY;

  // On by default outside production, because an empty shop is not a useful
  // development environment. `off` exists so the storefront can be looked at
  // exactly as a customer will see it, without changing any data.
  return { previewDrafts: setting !== "off" };
}
