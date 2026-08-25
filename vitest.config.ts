import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Exists for one reason: resolve the `@/` alias the same way `tsconfig.json`
 * and Next.js do. Without it a test importing `@/lib/...` fails to resolve while
 * the identical import works at runtime, which pushes tests toward relative
 * paths that then break when a file moves.
 *
 * Suite selection stays in the package scripts — `test:unit` excludes the
 * database-backed files, `test:integration` selects them.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    exclude: ["**/node_modules/**", "**/.tmp-app*/**", "**/.next/**"],
  },
});
