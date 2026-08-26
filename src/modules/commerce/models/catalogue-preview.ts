/**
 * Whether this server may show catalogue rows a customer must never see.
 *
 * The Storyderm catalogue is real identity with unverified commercial truth, so
 * every row is `reviewState: 'draft'` and unpublished — and the database's own
 * `product_published_state_check` makes that pair inseparable: a product cannot
 * be published unless it is approved. That is correct, and it means the
 * development storefront would render an empty catalogue unless the *read*
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

export type CataloguePreview = Readonly<{ previewDrafts: boolean }>;

export const PUBLIC_CATALOGUE: CataloguePreview = { previewDrafts: false };

export function resolveCataloguePreview(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  setting: string | undefined = process.env.CATALOGUE_DRAFT_PREVIEW,
): CataloguePreview {
  // Production first, and not overridable. An environment variable set by
  // accident on a production host must not be able to publish a draft
  // catalogue; the only way to show drafts there is to approve them.
  if (nodeEnv === "production") return PUBLIC_CATALOGUE;

  // On by default outside production, because an empty shop is not a useful
  // development environment. `off` exists so the storefront can be looked at
  // exactly as a customer will see it, without changing any data.
  return { previewDrafts: setting !== "off" };
}
