import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isObjectKey } from "@/lib/media/url";
import {
  REFERENCE_CATEGORIES,
  REFERENCE_CONCERNS,
  REFERENCE_PROTOCOL,
  REFERENCE_SKIN_STATES,
} from "./reference-data";
import {
  loadStorydermManifest,
  loadStorydermMediaLock,
  resolveMedia,
} from "./storyderm-manifest";

/**
 * `docs/14`'s P0 gate, made executable — `C-16`.
 *
 * _"every usable file is mapped, deliberately excluded, or marked unresolved;
 * no file count is presented as product count."_ A glob cannot satisfy that
 * gate. These assertions can, and they run on every commit rather than on the
 * day someone remembers to check.
 */

const projectRoot = resolve(__dirname, "../../../..");
const manifest = loadStorydermManifest();
const lock = loadStorydermMediaLock();

const claimed = manifest.products.flatMap((product) =>
  product.media.map((media) => media.path),
);
const unresolved = manifest.unresolved.map((entry) => entry.path);

describe("the manifest reconciles to the source set", () => {
  it("counts what it says it counts", () => {
    expect(claimed).toHaveLength(manifest.reconciliation.mapped);
    expect(unresolved).toHaveLength(manifest.reconciliation.unresolved);
    expect(claimed.length + unresolved.length).toBe(
      manifest.reconciliation.filesOnDisk,
    );
  });

  it("references only files that exist", () => {
    const missing = [...claimed, ...unresolved].filter(
      (path) => !existsSync(resolve(projectRoot, manifest.sourceRoot, path)),
    );
    expect(missing).toEqual([]);
  });

  it("never lets two products claim the same file", () => {
    const seen = new Set<string>();
    const duplicated = claimed.filter((path) =>
      seen.has(path) ? true : (seen.add(path), false),
    );
    expect(duplicated).toEqual([]);
  });

  it("never both maps and abandons the same file", () => {
    expect(claimed.filter((path) => unresolved.includes(path))).toEqual([]);
  });

  it("gives every unresolved file a reason someone can act on", () => {
    for (const entry of manifest.unresolved) {
      expect(entry.reason.length, entry.path).toBeGreaterThan(40);
    }
  });
});

describe("product shape", () => {
  it("has one primary image per product and no more", () => {
    for (const product of manifest.products) {
      const primaries = product.media.filter(
        (media) => media.role === "primary",
      );
      expect(primaries, product.slug).toHaveLength(1);
    }
  });

  it("uses each slug once", () => {
    const slugs = manifest.products.map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses each SKU once, and marks every one of them demo", () => {
    const skus = manifest.products.flatMap((product) =>
      product.variants.map((variant) => variant.sku),
    );
    expect(new Set(skus).size).toBe(skus.length);
    expect(skus.every((sku) => sku.startsWith("DEMO-"))).toBe(true);
  });

  it("places every product in a line the manifest declares", () => {
    const lines = new Set(manifest.lines.map((line) => line.slug));
    for (const product of manifest.products) {
      expect(lines.has(product.line), product.slug).toBe(true);
    }
  });

  it("places every product in a reviewed category", () => {
    const categories = new Set(REFERENCE_CATEGORIES.map((one) => one.slug));
    for (const product of manifest.products) {
      expect(categories.has(product.category), product.slug).toBe(true);
    }
  });

  it("references only reviewed concerns, skin states and phases", () => {
    const concerns = new Set<string>(REFERENCE_CONCERNS.map((one) => one.slug));
    const states = new Set<string>(
      REFERENCE_SKIN_STATES.map((one) => one.slug),
    );
    const phases = new Set<string>(
      REFERENCE_PROTOCOL.phases.map((one) => one.slug),
    );

    for (const product of manifest.products) {
      for (const slug of product.taxonomy.concerns) {
        expect(concerns.has(slug), `${product.slug} → ${slug}`).toBe(true);
      }
      for (const slug of product.taxonomy.skinStates) {
        expect(states.has(slug), `${product.slug} → ${slug}`).toBe(true);
      }
      for (const slug of product.taxonomy.phases) {
        expect(phases.has(slug), `${product.slug} → ${slug}`).toBe(true);
      }
    }
  });

  it("says why, whenever a product is held back", () => {
    for (const product of manifest.products) {
      if (product.disposition !== "hold") continue;
      expect(product.note, product.slug).toBeTruthy();
      expect(product.note ?? "", product.slug).toMatch(/HELD/);
    }
  });

  it("gives an on-request product no price at all", () => {
    for (const product of manifest.products) {
      if (product.priceVisibility !== "on_request") continue;
      for (const variant of product.variants) {
        expect(variant.demoPriceRials, product.slug).toBeNull();
      }
    }
  });

  it("prices every purchasable variant", () => {
    for (const product of manifest.products) {
      if (product.priceVisibility === "on_request") continue;
      if (product.disposition === "hold") continue;
      for (const variant of product.variants) {
        expect(variant.demoPriceRials, product.slug).toBeGreaterThan(0);
      }
    }
  });
});

/**
 * `C-6`. Replacing a fictional catalogue with a realistic one is a regression
 * if the realistic one happens to be uniform: the fictional set existed to make
 * every branch of the route render. These are the branches, asserted by name.
 */
describe("the catalogue still covers every state a route must handle", () => {
  const seeded = manifest.products.filter(
    (product) => product.disposition === "seed",
  );

  it("has purchasable, in-stock products", () => {
    expect(
      seeded.filter(
        (product) =>
          product.priceVisibility === "public" &&
          product.audience === "home" &&
          product.variants.some((variant) => variant.demoStock > 0),
      ).length,
    ).toBeGreaterThan(20);
  });

  it("has a published, priced product that is out of stock in every size", () => {
    expect(
      seeded.filter(
        (product) =>
          product.variants.length > 0 &&
          product.variants.every((variant) => variant.demoStock === 0),
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("has an on-request product", () => {
    expect(
      seeded.some((product) => product.priceVisibility === "on_request"),
    ).toBe(true);
  });

  it("has a professional-only product", () => {
    expect(seeded.some((product) => product.audience === "professional")).toBe(
      true,
    );
  });

  it("has held products, which must never reach a listing", () => {
    expect(
      manifest.products.filter((product) => product.disposition === "hold")
        .length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("has a product with no variant at all", () => {
    expect(
      manifest.products.some((product) => product.variants.length === 0),
    ).toBe(true);
  });

  it("has size ladders, which must render as one tile and not two", () => {
    expect(
      manifest.products.filter((product) => product.variants.length > 1).length,
    ).toBeGreaterThan(10);
  });

  it("populates every facet value, and lets none of them match everything", () => {
    const axes: readonly [
      "concerns" | "skinStates" | "phases",
      readonly string[],
    ][] = [
      ["concerns", REFERENCE_CONCERNS.map((one) => one.slug)],
      ["skinStates", REFERENCE_SKIN_STATES.map((one) => one.slug)],
      ["phases", REFERENCE_PROTOCOL.phases.map((one) => one.slug)],
    ];

    for (const [axis, slugs] of axes) {
      for (const slug of slugs) {
        const matching = seeded.filter((product) =>
          product.taxonomy[axis].includes(slug),
        ).length;
        // F-8: a facet with no data and a broken facet look identical from
        // outside, and a value that matches everything teaches nothing.
        expect(matching, `${axis}/${slug} matches nothing`).toBeGreaterThan(0);
        expect(matching, `${axis}/${slug} matches everything`).toBeLessThan(
          seeded.length,
        );
      }
    }
  });
});

/**
 * Two implementations of one key convention — `scripts/media/derive.py` writes
 * the files, `src/lib/media/url.ts` addresses them. This is the gate that keeps
 * them equal, and it is the reason the duplication is acceptable.
 */
describe("the lock file agrees with the TypeScript key builders", () => {
  it("covers every mapped source and nothing else", () => {
    expect(lock.entries.map((entry) => entry.sourcePath).sort()).toEqual(
      [...claimed].sort(),
    );
  });

  it("derives the same keys Python wrote", () => {
    const byPath = new Map(
      lock.entries.map((entry) => [entry.sourcePath, entry]),
    );

    for (const product of manifest.products) {
      const resolved = resolveMedia(manifest, product, lock);
      resolved.forEach((media, index) => {
        const source = product.media[index];
        expect(source, `${product.slug}[${index}]`).toBeDefined();
        const entry = byPath.get(source!.path);
        expect(entry, source!.path).toBeDefined();
        expect(media.cardObjectKey).toBe(entry!.objectKeys.card);
        expect(media.detailObjectKey).toBe(entry!.objectKeys.detail);
        expect(media.expectedOriginalObjectKey).toBe(
          entry!.objectKeys.original,
        );
      });
    }
  });

  it("produces keys that are keys", () => {
    for (const entry of lock.entries) {
      for (const key of Object.values(entry.objectKeys)) {
        expect(isObjectKey(key), key).toBe(true);
      }
    }
  });

  it("never derives a file larger than its source", () => {
    for (const entry of lock.entries) {
      expect(entry.derivatives.detail.width).toBeLessThanOrEqual(entry.width);
      expect(entry.derivatives.card.width).toBeLessThanOrEqual(
        entry.derivatives.detail.width,
      );
    }
  });

  it("leaves originalObjectKey unset until an original is uploaded", () => {
    const product = manifest.products[0];
    expect(product).toBeDefined();
    for (const media of resolveMedia(manifest, product!, lock)) {
      expect(media.originalObjectKey).toBeNull();
    }
  });
});
