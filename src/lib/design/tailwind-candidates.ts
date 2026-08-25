import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import ts from "typescript";

/**
 * Tooling for `tailwind-candidates.test.ts`. Kept beside the test rather than
 * inside it so the extraction rules can be read on their own.
 *
 * Why any of this exists: a class name Tailwind does not recognise produces no
 * CSS and no error. TypeScript sees a string; ESLint sees a string; the page
 * renders slightly wrong and the defect is findable only by looking. Several
 * reached `main` in packet 4 — `inset-inline-start-*`, `inset-block-*` and
 * `border-inline-end` read exactly like the logical properties the house rule
 * asks for, but Tailwind spells those `start-*`, `end-*`, `inset-x-*`, `border-e`.
 */

/**
 * Marker classes: real, load-bearing, and legitimately compiling to nothing.
 * `group` and `peer` are variant targets; `dark` is a scheme hook. Anything
 * added here needs a reason on the same line.
 */
export const MARKER_CLASSES: ReadonlySet<string> = new Set([
  "group",
  "peer",
  "dark",
]);

/** Call expressions whose string arguments are class lists. */
const CLASS_BUILDERS = new Set(["cn", "clsx", "cva", "twMerge", "twJoin"]);

const SOURCE_EXTENSIONS = /\.tsx?$/;
const TEST_FILE = /\.test\.tsx?$/;

export function listSourceFiles(root: string): string[] {
  const files: string[] = [];
  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (
        SOURCE_EXTENSIONS.test(entry.name) &&
        !TEST_FILE.test(entry.name)
      )
        files.push(path);
    }
  };
  walk(root);
  return files;
}

/**
 * Extraction runs on the TypeScript AST, not on a regex over the text.
 *
 * The regex version of this helper was wrong in a way worth recording: an
 * apostrophe in prose opens a string as far as a pattern is concerned, so
 * phantom literals ran through the surrounding code and captured identifiers.
 * Every false positive came from that. A lexer already ships with the project —
 * using it removes the guessing rather than tuning it.
 *
 * Only two places hold class names, and both are addressed exactly: the value of
 * a `className`/`class` JSX attribute, and the string arguments of a class
 * builder such as `cn` or `cva`. Nothing else is read, so a module specifier or
 * a translation key can never be mistaken for a utility.
 */
export function extractClassTokens(fileName: string, source: string): string[] {
  const file = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const tokens: string[] = [];

  /**
   * Walks only the positions that can *hold* a class list, never a whole
   * subtree. The distinction matters for the two idioms this codebase uses
   * constantly:
   *
   *   cn(tone === "surface" && "bg-surface", ...)
   *   cn(isActive ? "font-bold" : "font-light")
   *
   * A blanket walk collects `"surface"` from the comparison and reports it as a
   * dead class. Guards and conditions are tests, not class lists; only the
   * branches are.
   */
  const collect = (node: ts.Node): void => {
    if (ts.isStringLiteralLike(node)) {
      for (const token of node.text.split(/\s+/)) if (token) tokens.push(token);
      return;
    }

    if (ts.isTemplateExpression(node)) {
      for (const token of node.head.text.split(/\s+/))
        if (token) tokens.push(token);
      for (const span of node.templateSpans) {
        for (const token of span.literal.text.split(/\s+/))
          if (token) tokens.push(token);
        collect(span.expression);
      }
      return;
    }

    if (ts.isParenthesizedExpression(node)) {
      collect(node.expression);
      return;
    }

    if (ts.isJsxExpression(node)) {
      if (node.expression) collect(node.expression);
      return;
    }

    if (ts.isConditionalExpression(node)) {
      collect(node.whenTrue);
      collect(node.whenFalse);
      return;
    }

    if (ts.isBinaryExpression(node)) {
      const kind = node.operatorToken.kind;
      if (
        kind === ts.SyntaxKind.AmpersandAmpersandToken ||
        kind === ts.SyntaxKind.BarBarToken ||
        kind === ts.SyntaxKind.QuestionQuestionToken
      ) {
        // The left side is the guard; only the right side is a class list.
        collect(node.right);
      } else if (kind === ts.SyntaxKind.PlusToken) {
        collect(node.left);
        collect(node.right);
      }
      return;
    }

    if (ts.isArrayLiteralExpression(node)) {
      for (const element of node.elements) collect(element);
      return;
    }

    if (ts.isObjectLiteralExpression(node)) {
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property)) collect(property.initializer);
      }
      return;
    }
    // Anything else — an identifier, a call, a spread — is not a class list we
    // can read statically, and guessing at it is what produced false failures.
  };

  /**
   * `cva` is read structurally rather than wholesale. Its config object mixes
   * class lists with variant *names* — `defaultVariants: { tone: "surface" }`
   * names a variant, it is not a utility — so only the base argument, the leaf
   * values under `variants`, and each compound variant's `class`/`className`
   * are class lists. Reading the whole call reported every default variant as a
   * dead class.
   */
  const collectFromCva = (node: ts.CallExpression): void => {
    const [base, config] = node.arguments;
    if (base) collect(base);
    if (!config || !ts.isObjectLiteralExpression(config)) return;

    for (const property of config.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      const key = property.name.getText(file);

      if (key === "variants") {
        collect(property.initializer);
      } else if (
        key === "compoundVariants" &&
        ts.isArrayLiteralExpression(property.initializer)
      ) {
        for (const element of property.initializer.elements) {
          if (!ts.isObjectLiteralExpression(element)) continue;
          for (const entry of element.properties) {
            if (!ts.isPropertyAssignment(entry)) continue;
            const entryKey = entry.name.getText(file);
            if (entryKey === "class" || entryKey === "className") {
              collect(entry.initializer);
            }
          }
        }
      }
      // `defaultVariants` names variants; it holds no class names.
    }
  };

  const visit = (node: ts.Node): void => {
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(file);
      if ((name === "className" || name === "class") && node.initializer) {
        collect(node.initializer);
      }
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const callee = node.expression.text;
      if (callee === "cva") {
        collectFromCva(node);
      } else if (CLASS_BUILDERS.has(callee)) {
        for (const argument of node.arguments) collect(argument);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(file);
  return tokens;
}

/**
 * Resolves a bare stylesheet import the way a bundler would: through the
 * package's own `exports` map, then `style`, then `main`. Guessing file names is
 * how an earlier version of this helper silently loaded the wrong sheet.
 */
function resolveModuleStylesheet(projectRoot: string, id: string): string {
  const packageRoot = resolve(projectRoot, "node_modules", id);
  const manifestPath = resolve(packageRoot, "package.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`${id} is not installed`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    exports?: Record<string, { style?: string } | string>;
    style?: string;
    main?: string;
  };

  const entry = manifest.exports?.["."];
  const relativePath =
    (typeof entry === "string" ? entry : entry?.style) ??
    manifest.style ??
    manifest.main;

  if (!relativePath)
    throw new Error(`${id} declares no stylesheet entry point`);
  return resolve(packageRoot, relativePath);
}

/**
 * Compiles the project's real stylesheet — `globals.css`, and therefore
 * `tokens.css` with its `@theme inline` block — so `bg-sand` and `text-h1`
 * resolve as they do in the application. Compiling bare `tailwindcss` would
 * report every project token as dead.
 */
export async function loadProjectDesignSystem(projectRoot: string) {
  const { __unstable__loadDesignSystem } = await import("tailwindcss");
  const entry = resolve(projectRoot, "src/app/globals.css");

  return __unstable__loadDesignSystem(readFileSync(entry, "utf8"), {
    base: dirname(entry),
    loadStylesheet: async (id: string, base: string) => {
      const path =
        id === "tailwindcss"
          ? resolve(projectRoot, "node_modules/tailwindcss/index.css")
          : id.startsWith(".")
            ? resolve(base, id)
            : resolveModuleStylesheet(projectRoot, id);
      return { path, base: dirname(path), content: readFileSync(path, "utf8") };
    },
  });
}
