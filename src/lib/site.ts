/**
 * The canonical public origin, in one place.
 *
 * `metadataBase`, JSON-LD `url` values and any absolute link must agree —
 * canonical tags and structured data that disagree about the site's address is
 * a self-inflicted SEO fault, and SEO is a stated priority for this project.
 *
 * It is a constant rather than an environment variable on purpose: the site has
 * exactly one public origin, and a preview deployment must not emit canonicals
 * pointing at itself. Previews are `noindex` at the deployment level; their
 * canonicals still name production, which is the correct signal.
 */
export const SITE_ORIGIN = "https://fazaieli.ir";
