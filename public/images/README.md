# Image assets — provenance and rights

`docs/14-storyderm-draft-catalog-pipeline.md` P0 states the rule: _prevent
temporary assets from silently becoming fake commercial truth._ Every image that
reaches a customer needs a recorded source and a rights status.

**The record already exists.** `designs/asset-library/2026-08-26/catalog.json`
carries creator, source page, download URL and licence for all 22 curated
candidates. This file is the short version — which sets may render, and which
may not.

## Status by set

| Set                                                                 | Files                                       | Licence                                   | May render                                                  |
| ------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| `brand/`                                                            | medallion, glyph, divider                   | Made for this project                     | **yes**                                                     |
| `dev/`                                                              | 7 flat-colour SVGs                          | Made for this project                     | **development only** — `dev/README.md` forbids customer use |
| `editorial/p02–p08`                                                 | 7 product still-lifes                       | Pexels / Unsplash                         | **yes** — both permit commercial use without attribution    |
| `editorial/s01, s02, s03, s09`                                      | sakura, Ryōan-ji, Nara tea, stepping stones | Pexels / Unsplash                         | **yes**                                                     |
| `editorial/s04`, `s08`, `botanical/`                                | sakura branch, bamboo silhouette            | CC0 1.0 per source declaration            | **yes**                                                     |
| `editorial/p01` and `heroes/forlled-stone-products-transparent.png` | Forlle'd's own product photography          | **Permission not verified**               | **needs one line from the maintainer**                      |
| `brands/storyderm/`                                                 | ~90 product shots by range                  | Supplied by the distributor per `docs/14` | Through the catalogue pipeline only, never by direct path   |

## The one exception, and why it renders anyway

The Shop hero shows Forlle'd's own product photography, which the catalog marks
`Permission not verified`. It renders today for a narrow reason: a retailer
showing a manufacturer's product photograph is ordinary practice, and Forlle'd
representation is the one brand relationship `content/brands/` records as
**confirmed**.

That is also why it renders while brand _logos_ do not. A logo asserts a
relationship; a product photograph shows a thing on a shelf. Decision L-14 holds
logos until the right is written down, and this is the same rule applied to a
lower-risk case.

It still needs one sentence before launch — that Forlle'd's material may be used
on this site. Ask the distributor; they usually say yes, and then this row moves.

## What is not used yet, and could be

The Japanese reference photography — the airy sakura branch, the raked garden at
Ryōan-ji, the Nara tea still life, the stone path — is cleared for use and is
genuinely on-brand. It is unused only because no slot has been designed for it
yet. `designs/asset-library/2026-08-26/README.md` holds the art-direction
recommendations per image; they are judgements, not tested placements.

The blossom **ornament** in `src/components/brand/blossom.tsx` stays drawn rather
than photographic. A photograph is an image in a slot; the ornament is a mark
that repeats across surfaces at any size in the site's own colours, and those are
different jobs.

## The rule for new files

Nothing lands in `public/images/` without a row here and an entry in the asset
library catalog. A file with no record is treated as unresolved, which means it
does not render to a customer.
