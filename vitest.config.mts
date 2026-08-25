import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * `.mts` rather than `.ts`: the package is CommonJS, so Vite loaded a `.ts`
 * config as CJS and warned that ESM syntax there will stop working. The explicit
 * module extension settles it without making the whole package ESM, which would
 * disturb the PostCSS and ESLint configs.
 *
 * Two responsibilities only — resolve the `@/` alias the way `tsconfig.json` and
 * Next.js do, and load the environment before test modules evaluate. Suite
 * selection stays in the package scripts.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    setupFiles: ["./vitest.setup.mts"],
    exclude: ["**/node_modules/**", "**/.tmp-app*/**", "**/.next/**"],
  },
});
