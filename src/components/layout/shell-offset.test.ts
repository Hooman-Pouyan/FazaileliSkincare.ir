import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { listSourceFiles } from "@/lib/design/tailwind-candidates";

/**
 * A screen never compensates for the rail.
 *
 * `storefront-shell.tsx` already offsets the page with `md:ps-14`. A screen
 * that adds `ms-14` on top of it produces two offsets, 112px, and a visible gap
 * between the content and the rail — `E-6`.
 *
 * **Why this file exists rather than one more assertion in a screen test.**
 * The rule was already known: `shop-hub.screen.test.tsx` asserted its own
 * `<main>` did not carry `ms-14`. Scoped to one file, it protected one file,
 * and the next two screens reintroduced the defect — one of them written by the
 * same author as the test. A rule that lives inside one subject's test is not a
 * rule, it is a note.
 */

const RAIL_OFFSETS = /\b(?:ms|ps|ml|pl)-14\b/;

/** The shell owns the offset. It is the only file allowed to state it. */
const ALLOWED = new Set(["src/components/layout/storefront-shell.tsx"]);

describe("the shell owns the rail offset", () => {
  const projectRoot = resolve(__dirname, "../../..");
  const files = listSourceFiles(resolve(projectRoot, "src")).map((file) =>
    relative(projectRoot, file),
  );

  it("is stated in exactly one place", () => {
    const offenders = files.filter((file) => {
      if (ALLOWED.has(file)) return false;
      if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) return false;
      return RAIL_OFFSETS.test(
        readFileSync(resolve(projectRoot, file), "utf8"),
      );
    });

    expect(
      offenders,
      `these offset past the rail themselves; the shell already did it:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
