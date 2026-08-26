import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { MEDIA_ROLES } from "@/lib/media/roles";
import { derivativeKey, mediaSlot, originalKey } from "@/lib/media/url";

/**
 * The curated Storyderm manifest, parsed.
 *
 * `content/catalogue/storyderm-manifest.json` is the only input to the
 * catalogue seed — `C-16`. The seeder resolves files from it and never globs a
 * directory, never infers a product from a filename, and never creates a row
 * for a file the manifest does not mention.
 *
 * Parsed with Zod rather than cast. A JSON file edited by hand between two
 * releases is exactly the kind of input the repository's own rule was written
 * for; a cast would let a renamed field arrive as `undefined` and be seeded as
 * a null column.
 */

const Translated = z.object({ fa: z.string().min(1), en: z.string().min(1) });

const NameSource = z.enum(["packshot", "filename", "product_sheet", "owner"]);

const Variant = z.object({
  /**
   * `DEMO-` is not decoration. `C-3`: every invented commercial value carries a
   * marker a query can see, so `sku not like 'DEMO-%'` answers "which of these
   * figures were ever real" at any point in the project's life.
   */
  sku: z.string().regex(/^DEMO-/, "seeded SKUs must be marked as demo — C-3"),
  sizeValue: z.number().positive(),
  sizeUnit: z.enum(["ml", "g", "unit", "sheet", "capsule", "kit", "pair"]),
  sizeSource: NameSource,
  labels: Translated,
  /** Null for an on-request product: no price row is created at all. */
  demoPriceRials: z.number().int().positive().nullable(),
  demoStock: z.number().int().nonnegative(),
});

const Media = z.object({
  path: z.string().min(1),
  role: z.enum(MEDIA_ROLES),
  ordinal: z.number().int().positive(),
});

const Product = z.object({
  draftKey: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  line: z.string().regex(/^[a-z0-9-]+$/),
  category: z.string().regex(/^[a-z0-9-]+$/),
  /** `seed` renders; `hold` is seeded unpublished with a recorded reason — `C-17`. */
  disposition: z.enum(["seed", "hold"]),
  audience: z.enum(["home", "professional"]),
  priceVisibility: z.enum(["public", "on_request"]),
  merchandisingRank: z.number().int(),
  names: z.object({
    form: Translated.extend({ source: NameSource }),
    product: z.object({ value: z.string().min(1), source: NameSource }),
  }),
  taxonomy: z.object({
    concerns: z.array(z.string()),
    skinStates: z.array(z.string()),
    phases: z.array(z.string()),
    /**
     * `range_name` means the placement follows the range the product ships in;
     * `inference` means it does not, and a reviewer should look. Taxonomy
     * placement is not a clinical claim — the product is *filed under* redness,
     * it does not *claim to treat* it.
     */
    source: z.enum(["range_name", "form", "inference", "owner"]),
  }),
  variants: z.array(Variant),
  media: z.array(Media).min(1),
  note: z.string().nullable(),
});

const Manifest = z.object({
  brand: z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    countryCode: z.string().regex(/^[A-Z]{2}$/),
    isOfficialRepresentative: z.boolean(),
    names: Translated,
  }),
  sourceRoot: z.string().min(1),
  /** Set when the maintainer signs the manifest off. Null until then. */
  reviewedBy: z.string().nullable(),
  reconciliation: z.object({
    filesOnDisk: z.number().int(),
    mapped: z.number().int(),
    unresolved: z.number().int(),
  }),
  lines: z.array(
    z.object({
      slug: z.string().regex(/^[a-z0-9-]+$/),
      sourceFolder: z.string().min(1),
      names: Translated,
      sortOrder: z.number().int(),
    }),
  ),
  products: z.array(Product).min(1),
  unresolved: z.array(
    z.object({ path: z.string().min(1), reason: z.string().min(20) }),
  ),
});

const LockEntry = z.object({
  sourcePath: z.string().min(1),
  sourceFilename: z.string().min(1),
  objectKeys: z.object({
    original: z.string().min(1),
    card: z.string().min(1),
    detail: z.string().min(1),
  }),
  checksumSha256: z.string().regex(/^[0-9a-f]{64}$/),
  mimeType: z.string().min(1),
  byteSize: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  derivatives: z.object({
    card: z.object({ width: z.number().int(), height: z.number().int() }),
    detail: z.object({ width: z.number().int(), height: z.number().int() }),
  }),
});

const Lock = z.object({
  sourceRoot: z.string().min(1),
  entries: z.array(LockEntry).min(1),
});

export type StorydermManifest = z.infer<typeof Manifest>;
export type StorydermProduct = z.infer<typeof Product>;
export type StorydermMediaLock = z.infer<typeof Lock>;
export type StorydermMediaLockEntry = z.infer<typeof LockEntry>;

const CONTENT = resolve(__dirname, "../../../../content/catalogue");

function readJson(filename: string): unknown {
  return JSON.parse(readFileSync(resolve(CONTENT, filename), "utf8"));
}

export function loadStorydermManifest(): StorydermManifest {
  return Manifest.parse(readJson("storyderm-manifest.json"));
}

export function loadStorydermMediaLock(): StorydermMediaLock {
  return Lock.parse(readJson("storyderm-media.lock.json"));
}

/**
 * One media row, ready to insert: the manifest's mapping joined to the lock's
 * measurements, with the object keys recomputed here rather than trusted.
 *
 * `scripts/media/derive.py` builds the same keys in Python because it has to
 * write the files. Two implementations of one convention need a gate, not
 * trust: `storyderm-manifest.test.ts` asserts that every key in the lock equals
 * the key this function derives, and fails on any disagreement.
 */
export type ResolvedMedia = Readonly<{
  role: StorydermProduct["media"][number]["role"];
  sortOrder: number;
  sourcePath: string;
  sourceFilename: string;
  checksumSha256: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  /** Null until an original has actually been uploaded — see `C-9`. */
  originalObjectKey: string | null;
  expectedOriginalObjectKey: string;
  cardObjectKey: string;
  detailObjectKey: string;
}>;

export function resolveMedia(
  manifest: StorydermManifest,
  product: StorydermProduct,
  lock: StorydermMediaLock,
): readonly ResolvedMedia[] {
  const byPath = new Map(
    lock.entries.map((entry) => [entry.sourcePath, entry]),
  );

  return product.media.map((media, index) => {
    const entry = byPath.get(media.path);
    if (!entry) {
      throw new Error(
        `No lock entry for ${media.path}. Run \`pnpm media:derive\` — the ` +
          `seed reads measurements from the lock, never from the image.`,
      );
    }

    const parts = {
      brandSlug: manifest.brand.slug,
      lineSlug: product.line,
      productSlug: product.slug,
      slot: mediaSlot(media.role, media.ordinal),
    };

    return {
      role: media.role,
      sortOrder: index * 10,
      sourcePath: `${manifest.sourceRoot}/${entry.sourcePath}`,
      sourceFilename: entry.sourceFilename,
      checksumSha256: entry.checksumSha256,
      mimeType: entry.mimeType,
      byteSize: entry.byteSize,
      width: entry.width,
      height: entry.height,
      originalObjectKey: null,
      expectedOriginalObjectKey: originalKey(
        parts,
        entry.sourceFilename.slice(entry.sourceFilename.lastIndexOf(".")),
      ),
      cardObjectKey: derivativeKey(parts, "card"),
      detailObjectKey: derivativeKey(parts, "detail"),
    };
  });
}
