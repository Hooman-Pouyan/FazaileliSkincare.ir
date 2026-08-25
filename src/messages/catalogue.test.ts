import ar from "./ar.json";
import en from "./en.json";
import fa from "./fa.json";
import { describe, expect, it } from "vitest";

/**
 * Persian is the base catalogue and every key must exist in all three.
 *
 * A missing key does not fail a build — next-intl renders `MISSING_MESSAGE` at
 * request time, which is how `nav.locale` reached a running dev server in packet
 * 4 after passing 209 unit tests. This is the gate for that.
 */
function paths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    paths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("message catalogues", () => {
  const base = paths(fa).sort();

  it.each([
    ["en", en],
    ["ar", ar],
  ])("%s has every key Persian has", (_name, catalogue) => {
    const missing = base.filter((key) => !paths(catalogue).includes(key));
    expect(missing).toEqual([]);
  });

  it.each([
    ["en", en],
    ["ar", ar],
  ])("%s has no key Persian lacks", (_name, catalogue) => {
    const extra = paths(catalogue)
      .filter((key) => !base.includes(key))
      .sort();
    expect(extra).toEqual([]);
  });
});
