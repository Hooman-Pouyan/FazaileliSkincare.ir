# The Storyderm catalogue and media pipeline — phased implementation plan

**Parent:** [`../../26-content-and-catalogue-decisions.md`](../../26-content-and-catalogue-decisions.md)
**Supersedes the pending half of:** [`../../14-storyderm-draft-catalog-pipeline.md`](../../14-storyderm-draft-catalog-pipeline.md) P0–P2
**Decisions implemented:** C-1 … C-10 · C-16 · C-17
**Depends on:** the reference seed · the `product_media` schema (already present)
**Primary acceptance locale:** `fa`

---

## 1. Why this plan exists

`docs/14` was written on 2026-08-24 and was right about the danger: a filename is
not a product, a folder is not a range, and a file count is not a product count.
It protected against that by keeping the whole development catalogue fictional.

Two days of building on that catalogue showed the cost. The PLP renders ten
invented products with invented brands, so nothing about the page's density,
image weight, facet distribution or Persian typography is being tested against
anything real. Ninety genuine packshots sit in `public/images/brands/storyderm/`
and are referenced by no row.

C-1 resolves it: **truth is per field.** This plan is C-1 made executable.

---

## 2. The source inventory, restated

Ninety usable files after excluding thirteen `Thumbs.db` and one `.DS_Store`,
across ten numbered range folders. The counts below are **files**, and the
importer never turns a file count into a product count (`docs/14`, restated as
C-16).

| Folder                  | Files | What the filenames actually settle                                                           |
| ----------------------- | ----: | -------------------------------------------------------------------------------------------- |
| `1.Ultra Lift`          |     9 | Two size pairs (A-Z Cream 50/220, Essence Aqua 150/500) plus one powder in four repeat shots |
| `2.Princess Shine`      |    16 | Ten `Princess Peel_IMG` frames are one gallery; the rest are a size ladder                   |
| `3.O2 White`            |     7 | Three size pairs and one peel                                                                |
| `4.TimeMachine Calming` |     8 | Two size pairs, one Hyal pair, two peel frames of one subject                                |
| `5.Clinic-A`            |     7 | Three size pairs and one spot treatment                                                      |
| `6.Anti Wrinkle Care`   |     5 | Two contour products and one patch in three frames                                           |
| `7.Personal Care`       |    15 | Four size pairs, several singletons, one box-package shot                                    |
| `8.Protection`          |     2 | Korean-suffixed filenames (`신형` = "new model") — identification unresolved                 |
| `9.Mask/1.72 Capsule`   |    10 | Three colours × (retail / pouch / 1 kg bulk) plus one small pack                             |
| `9.Mask/2.Gelato`       |     3 | Three distinct masks                                                                         |
| `9.Mask/3.Sheet`        |     6 | Six distinct sheet masks                                                                     |
| `10.Anti-Red`           |     2 | Two distinct Resens Red products                                                             |

**The grouping rules used**, stated so they can be checked:

1. **Same name, different millilitres → one product, two variants.** `Clinic-A
Aqua 150ml` and `500ml` are one PDP with a size ladder.
2. **Same subject, many frames → one product, one primary and the rest
   gallery.** The ten Princess Peel photographs are a gallery, not ten products.
3. **A bulk pack is a variant, and it is professional-only.** `72 capsule mask
blue 1kg` is the salon size of the retail pouch, not a different product.
4. **A colour is a variant only where the colour names a formula.** The 72
   Capsule Mask's blue, wine and yellow are three formulas and therefore three
   products; a pouch photograph of one of them is packaging imagery.
5. **An unreadable filename is unresolved, never guessed.** The two Protection
   files stay in the manifest's `unresolved` array with the reason recorded.

---

## 3. The manifest

`content/catalogue/storyderm-manifest.json`, checked in, hand-curated, the only
input to the seed (C-16).

```jsonc
{
  "brand": "storyderm",
  "generatedBy": "hand-curated",
  "reviewedBy": null, // set when the maintainer signs off
  "products": [
    {
      "draftKey": "storyderm-clinic-a-cream",
      "slug": "clinic-a-cream",
      "line": "clinic-a",
      "category": "cream",
      "disposition": "seed", // seed | hold  (C-17)
      "audience": "home", // home | professional
      "names": {
        "form": { "fa": "کرم", "en": "Cream", "source": "packshot" },
        "product": { "value": "Clinic-A", "source": "packshot" },
      },
      "concerns": ["acne"],
      "skinStates": ["oily", "combination"],
      "phases": ["treat"],
      "variants": [
        {
          "sizeValue": 50,
          "sizeUnit": "ml",
          "source": "filename",
          "demoPriceRials": 24800000,
          "demoStock": 6,
        },
        {
          "sizeValue": 220,
          "sizeUnit": "ml",
          "source": "filename",
          "demoPriceRials": 78500000,
          "demoStock": 2,
        },
      ],
      "media": [
        { "path": "1.Ultra Lift/…png", "role": "primary" },
        { "path": "…", "role": "gallery" },
      ],
    },
  ],
  "unresolved": [
    {
      "path": "8.Protection/BB Ecocell Balm 50ml 신형.png",
      "reason": "Korean packaging suffix; product identity and current SKU not confirmed",
    },
  ],
}
```

Every field that came from a filename says so. Every field that is invented
lives under a `demo` prefix. There is no field for a claim, an ingredient, a
usage instruction or an IRC code — the manifest has no place to put one, which
is the cheapest possible enforcement of C-1.

**Concern, skin-state and phase assignments** are the one judgement in the
manifest that is not observable from a packshot. They are assigned from the
range's own name where it is unambiguous — Anti-Red to redness, O2 White to
brightening, TimeMachine Calming to sensitivity — and recorded with
`"source": "range_name"` so the maintainer can see exactly which associations
are inference rather than fact. They are taxonomy placement, not a clinical
claim: the product is _filed under_ redness, it does not _claim to treat_ it.

---

## 4. Media

### Keys

```
catalog/storyderm/<line>/<product-slug>/<role>-<width>.webp
```

C-8. The original keeps its extension under `.../original.<ext>` and is never
served.

### Derivation

`scripts/media/derive.ts`:

1. read the manifest;
2. for each `media` entry, resolve the source under
   `public/images/brands/storyderm/`, failing loudly if absent;
3. compute SHA-256, MIME, byte size, width, height from the source;
4. write `card` at 640 px and `detail` at 1600 px WebP into `public/media/`
   under the C-8 key, skipping when the derivative exists and the source
   checksum is unchanged;
5. emit `content/catalogue/storyderm-media.lock.json` — key, checksum,
   dimensions, byte size — which the seed reads so seeding never needs `sharp`
   and never touches the filesystem for measurements.

`public/media/` is gitignored; the lock file is committed. That split means a
fresh clone can seed a database without running image processing, and CI does
not carry a hundred megabytes of derivatives.

### Serving

`src/lib/media/url.ts` — `mediaUrl(objectKey)`, resolving against
`NEXT_PUBLIC_MEDIA_ORIGIN` (default `/media`). C-7. A guard test asserts no file
under `src/` builds an image path from `"/images/"` or `"/media/"` by
concatenation, in the same shape as the locale-prefix guard.

---

## 5. Phased task list

### CAT0 — Media addressing

- `src/lib/media/url.ts` and its unit tests.
- The concatenation guard test.
- `NEXT_PUBLIC_MEDIA_ORIGIN` in `.env.example` with a comment saying what it
  becomes in production.

### CAT1 — The manifest

- Curate all ninety files into products, variants, gallery frames, holds and
  unresolved entries.
- `manifest.test.ts`: every source path exists on disk; every path appears at
  most once; every product has exactly one `primary`; every slug is unique;
  every line, category, concern, skin state and phase is a real reference slug;
  the mapped + unresolved count equals ninety.

### CAT2 — Derivation

- `scripts/media/derive.ts`, `pnpm media:derive`.
- Commit `storyderm-media.lock.json`.
- Gitignore `public/media/`.

### CAT3 — Reference rows for real brands

- Storyderm as a real brand; its ten ranges as real product lines; the real
  category set (cleanser, toner/aqua, essence, ampoule, cream, contour, mask,
  peel, patch, protection, balm) with Persian and English names.
- Extend `reference-data.test.ts`'s guard: still Persian and English only.

### CAT4 — The `storyderm-draft` and `commerce-demo` profiles

- `storyderm-draft`: products, translations, taxonomy links, media rows with
  object keys and lock-file measurements. `reviewState: draft`,
  `isPublished: false`, no variants.
- `commerce-demo`: `DEMO-` variants, rial prices, inventory, and the
  publication flip. C-3, C-4.
- Retire `dev-data.ts`; move its state coverage onto real products per C-6 and
  assert each state by name.

### CAT5 — Verification

- Integration tests, §6.
- Browser pass with real imagery at 390/768/1440.
- Review log.

---

## 6. Test scenarios

1. Every manifest source path exists; every file on disk is mapped, held, or
   listed unresolved; the counts reconcile to ninety.
2. No source file is referenced by two products.
3. Every product has exactly one `primary` media row.
4. A second seed run changes no rows and creates no duplicate media.
5. Seeding refuses under `NODE_ENV=production`.
6. Every seeded variant SKU begins `DEMO-`.
7. Every seeded product is `reviewState: draft`.
8. A `hold` product never appears in any listing result.
9. An `on_request` product renders «استعلام قیمت» and is not addable to a cart.
10. A professional-only product is absent for an anonymous visitor.
11. A size ladder renders as one tile, not two.
12. Facet counts on `/shop/all` equal the number of tiles the facet yields when
    applied — the PLP-03 counting rule, now against a hundred-odd rows rather
    than ten.
13. No file under `src/` concatenates an image path.
14. Card images are served from a `card` derivative, never from a source PNG.
15. Persian RTL at 390/768/1440 with real product names, no overflow.

---

## 7. Exit gate

`/fa/shop/all` lists the seeded Storyderm catalogue with real names, real
imagery served from derivatives, and a facet rail whose every group has more
than one populated value and none of which matches everything. Size ladders
render as single tiles. Held, unpublished and professional-only rows are
provably absent. Every commercial figure on the page carries a `DEMO-` marker in
the database. The manifest reconciles to ninety files. The seed is idempotent
and refuses production. The review log is written.

---

## 8. Open and deferred

- **Forlle'd and Thalgo** — no usable imagery in the repository. The manifest
  format is brand-agnostic and takes them when assets arrive.
- **The two Protection files** — unresolved pending identification.
- **Real SKUs, barcodes, IRC codes, prices, stock** — maintainer, `docs/26`
  open items 3 and 4.
- **Image rights** — maintainer, `docs/26` open item 1. Production reads exclude
  `rights = 'unknown'` regardless.
- **Object storage** — C-10, deferred by the maintainer, configuration only.
- **PDP** — packet 9.
