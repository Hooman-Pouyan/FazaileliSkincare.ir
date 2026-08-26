import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { listSourceFiles } from "@/lib/design/tailwind-candidates";

/**
 * No source file builds a locale prefix by hand.
 *
 * `hrefFor` prepended `/${locale}` and `Link` from `@/i18n/navigation`
 * prepended one as well, so the rail sent a Persian reader from `/` to
 * `/fa/fa/shop`. Seventeen call sites had the same shape. It compiled, it
 * linted, and every unit test passed, because both halves were individually
 * correct — the defect only existed where they met.
 *
 * Decision R-1 makes prefixing next-intl's job alone. This is the gate.
 */

/**
 * A template literal that *starts* a path with a locale: `` `/${locale}/shop` ``.
 * Anchored to the opening backtick so a module specifier such as
 * `../messages/${locale}.json` — which is a filesystem path, not a route — does
 * not read as an offence.
 */
const HAND_BUILT_PREFIX = /`\/\$\{\s*(?:locale|localeCode|lang|localeParam)\b/;

/**
 * `next/navigation`'s router and pathname are locale-blind. A component that
 * imports them and then navigates has to add the prefix itself, which is the
 * mechanism this decision removes. `@/i18n/navigation` re-exports both.
 */
const RAW_NAVIGATION = /from\s+["']next\/navigation["']/;

const ALLOWED_RAW_NAVIGATION = new Set([
  // `notFound` and `redirect` here take no pathname — they are framework
  // control flow, not navigation. The localised `redirect` is used where a
  // pathname is involved.
  "src/app/[locale]/layout.tsx",
  "src/app/[locale]/(storefront)/shop/page.tsx",
  // `notFound` only. Its localised `redirect` comes from `@/i18n/navigation`.
  "src/modules/commerce/listing-route.tsx",
]);

describe("one locale-prefixing mechanism", () => {
  const projectRoot = resolve(__dirname, "../../..");
  const files = listSourceFiles(resolve(projectRoot, "src"));

  it("no file interpolates a locale into a path", () => {
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      // Comments explain the defect by name; the rule is about live code.
      const code = source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
      if (HAND_BUILT_PREFIX.test(code)) {
        offenders.push(relative(projectRoot, file));
      }
    }

    expect(
      offenders,
      `these build a locale prefix by hand; use @/i18n/navigation instead:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("no component navigates through raw next/navigation", () => {
    const offenders = files
      .map((file) => relative(projectRoot, file))
      .filter(
        (file) =>
          !ALLOWED_RAW_NAVIGATION.has(file) &&
          RAW_NAVIGATION.test(readFileSync(resolve(projectRoot, file), "utf8")),
      );

    expect(
      offenders,
      `these import next/navigation directly; use @/i18n/navigation:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
