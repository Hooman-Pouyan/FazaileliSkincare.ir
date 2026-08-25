import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import * as schema from "./schema";
import { seedDevCatalogue } from "./seeds/dev";
import { seedReference } from "./seeds/reference";

// Same precedence Next.js uses. Plain `dotenv/config` reads .env only, so a
// standalone `pnpm db:seed` would ignore a per-machine override in .env.local
// and seed a different database than the one the app is talking to. dotenv does
// not overwrite values already in the environment, so scripts/database.sh
// passing an explicit DATABASE_URL still wins.
loadEnv({ path: [".env.local", ".env"], quiet: true });

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env, then run `pnpm db:up`. " +
        "`pnpm db:url` prints the connection string the container is actually bound to.",
    );
  }

  const input = z
    .object({
      databaseUrl: z.string().url(),
      profile: z.enum(["reference", "dev"]),
    })
    .parse({
      databaseUrl: process.env.DATABASE_URL,
      profile: process.argv[2] ?? "reference",
    });

  const client = postgres(input.databaseUrl, { max: 1, prepare: false });
  const database = drizzle(client, { schema, casing: "snake_case" });

  try {
    // The reference profile owns locales and concerns and is safe everywhere.
    // The dev profile layers fictional catalogue data on top of it and refuses
    // to run in production or beside a product it did not create.
    await seedReference(database);
    if (input.profile === "dev") {
      await seedDevCatalogue(database);
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}

void main();
