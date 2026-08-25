import { config as loadEnv } from "dotenv";

/**
 * Loads `.env.local` then `.env` into `process.env` before any test module is
 * evaluated.
 *
 * Vitest does not do this on its own, and Vite only exposes `VITE_`-prefixed
 * values to `import.meta.env` — neither populates `process.env.DATABASE_URL`.
 * The database-backed suites guard themselves with
 * `const describeWithDatabase = databaseUrl ? describe : describe.skip`, so
 * without this file that guard was always false and the entire auth integration
 * suite skipped while the run still reported green.
 *
 * A skipped test in a passing run reads as coverage. The guard now means what it
 * says: skip only when there is genuinely no database configured.
 */
loadEnv({ path: [".env.local", ".env"], quiet: true });
