import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MARKER_CLASSES,
  extractClassTokens,
  listSourceFiles,
  loadProjectDesignSystem,
  projectStylesheetClasses,
} from "./tailwind-candidates";

/**
 * Every class name in `src/` must compile to CSS.
 *
 * Three dead classes shipped in packet 4 and none of the existing gates could
 * see them: `inset-inline-start-3`, `inset-block-start-0` and `border-inline-end`
 * are CSS property names, not Tailwind utilities, so they produced nothing at
 * all. The rail and the mobile bar were `fixed` with no offsets and only looked
 * correct because static flow put them in roughly the right place.
 *
 * This is the gate for that class of defect, and it is a test rather than a lint
 * rule on purpose: correctness here is defined by what Tailwind actually
 * compiles against this project's theme, which only Tailwind can answer.
 */
describe("every class name in src/ compiles", () => {
  it("produces CSS for every extracted candidate", async () => {
    const projectRoot = resolve(__dirname, "../../..");
    const design = await loadProjectDesignSystem(projectRoot);

    const authored = projectStylesheetClasses(projectRoot);
    const isValid = (token: string): boolean =>
      MARKER_CLASSES.has(token) ||
      authored.has(token) ||
      design.candidatesToCss([token])[0] !== null;

    const dead = new Map<string, string[]>();
    for (const file of listSourceFiles(resolve(projectRoot, "src"))) {
      const tokens = extractClassTokens(file, readFileSync(file, "utf8"));
      for (const token of tokens) {
        if (isValid(token)) continue;
        const where = dead.get(token) ?? [];
        where.push(relative(projectRoot, file));
        dead.set(token, where);
      }
    }

    const report = [...dead.entries()]
      .map(([token, files]) => `  ${token}  —  ${files.join(", ")}`)
      .join("\n");

    expect(report, `these class names compile to nothing:\n${report}`).toBe("");
  });

  it("recognises the substitutes the house rule should be naming", async () => {
    const projectRoot = resolve(__dirname, "../../..");
    const design = await loadProjectDesignSystem(projectRoot);
    const compiles = (token: string) =>
      design.candidatesToCss([token])[0] !== null;

    // The logical utilities Tailwind does have.
    expect(compiles("start-3")).toBe(true);
    expect(compiles("end-3")).toBe(true);
    expect(compiles("inset-x-0")).toBe(true);
    expect(compiles("border-e")).toBe(true);

    // The CSS property names that read like them and are not utilities. If a
    // future Tailwind adds these, this test tells us and the house rule can
    // change deliberately rather than by accident.
    expect(compiles("inset-inline-start-3")).toBe(false);
    expect(compiles("inset-block-start-0")).toBe(false);
    expect(compiles("border-inline-end")).toBe(false);
  });

  it("accepts a class the project's own stylesheet declares", async () => {
    // `no-js-scroll` styles Swiper's internals, which a utility cannot reach.
    // Reading the stylesheet keeps this honest without a hand-kept allow-list.
    const projectRoot = resolve(__dirname, "../../..");
    const authored = projectStylesheetClasses(projectRoot);
    expect(authored.has("no-js-scroll")).toBe(true);
    expect(authored.has("carousel-dot")).toBe(true);
    expect(authored.has("not-a-class-anyone-wrote")).toBe(false);
  });

  it("resolves this project's own theme tokens, not just stock Tailwind", async () => {
    const projectRoot = resolve(__dirname, "../../..");
    const design = await loadProjectDesignSystem(projectRoot);
    const compiles = (token: string) =>
      design.candidatesToCss([token])[0] !== null;

    // If these regress, the design system stopped being loaded and the first
    // assertion above would pass for the wrong reason.
    expect(compiles("bg-sand")).toBe(true);
    expect(compiles("text-gold-text")).toBe(true);
    expect(compiles("text-h1")).toBe(true);
    expect(compiles("rounded-surface")).toBe(true);
  });
});
