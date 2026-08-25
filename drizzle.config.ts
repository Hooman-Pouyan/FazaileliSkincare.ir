import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js reads .env.local automatically; dotenv does not. Load it first so a
// standalone `pnpm db:migrate` or `db:studio` sees the same database as the
// running app, and fall back to .env for CI.
loadEnv({ path: [".env.local", ".env"], quiet: true });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local, then run `pnpm db:up`. " +
      "`pnpm db:url` prints the connection string the container is actually bound to.",
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  casing: "snake_case",
  verbose: true,
  strict: true,
});
