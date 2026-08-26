import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { listSourceFiles } from "@/lib/design/tailwind-candidates";

/**
 * No source file builds an image address out of parts.
 *
 * `product_media` stores an object key; `mediaUrl` turns it into a URL. One
 * function, so the CDN switch is `NEXT_PUBLIC_MEDIA_ORIGIN` and nothing else —
 * `C-7`.
 *
 * What is NOT an offence: a static literal such as
 * `src="/images/brand/brand-glyph-128.png"`. Brand chrome ships in `public/`,
 * is versioned with the code, and is not catalogue media. The rule is about
 * *computed* paths, which are the ones that go stale when the origin moves.
 */

/** `` `/images/${slug}.png` `` or `` `/media/${key}` `` — a computed asset path. */
const COMPUTED_ASSET_PATH = /`\/(?:images|media)\/[^`]*\$\{/;

/** `"/images/" + slug` — the same defect spelled with an operator. */
const CONCATENATED_ASSET_PATH = /["']\/(?:images|media)\/[^"']*["']\s*\+/;

/** Only `url.ts` reads the origin. Everything else calls `mediaUrl`. */
const READS_ORIGIN = /NEXT_PUBLIC_MEDIA_ORIGIN/;

/**
 * Empty, and it should stay that way. It briefly held the fictional seed, which
 * painted its own placeholder SVG paths because it had no real media; that file
 * is gone and the manifest-derived seed carries object keys.
 */
const ALLOWED_COMPUTED = new Set<string>([]);

const ALLOWED_ORIGIN_READERS = new Set([
  "src/lib/media/url.ts",
  "src/lib/media/url.guard.test.ts",
]);

describe("one media addressing mechanism", () => {
  const projectRoot = resolve(__dirname, "../../..");
  const files = listSourceFiles(resolve(projectRoot, "src")).map((file) =>
    relative(projectRoot, file),
  );

  const read = (file: string) => {
    const source = readFileSync(resolve(projectRoot, file), "utf8");
    // Comments name the defect on purpose; the rule is about live code.
    return source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
  };

  it("no file computes an image path", () => {
    const offenders = files.filter((file) => {
      if (ALLOWED_COMPUTED.has(file)) return false;
      const code = read(file);
      return (
        COMPUTED_ASSET_PATH.test(code) || CONCATENATED_ASSET_PATH.test(code)
      );
    });

    expect(
      offenders,
      `these build an image path from parts; store an object key and call mediaUrl:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("only the media module reads the origin", () => {
    const offenders = files.filter(
      (file) =>
        !ALLOWED_ORIGIN_READERS.has(file) && READS_ORIGIN.test(read(file)),
    );

    expect(
      offenders,
      `these read NEXT_PUBLIC_MEDIA_ORIGIN directly; call mediaUrl:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
