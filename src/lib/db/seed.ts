import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import * as schema from "./schema";
import { seedContent } from "./seeds/content";
import { seedDevCatalogue } from "./seeds/dev";
import { seedReference } from "./seeds/reference";
import { seedCommerceDemo, seedStorydermCatalogue } from "./seeds/storyderm";

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
      profile: z.enum(["reference", "dev", "storyderm", "demo"]),
    })
    .parse({
      databaseUrl: process.env.DATABASE_URL,
      profile: process.argv[2] ?? "reference",
    });

  const client = postgres(input.databaseUrl, { max: 1, prepare: false });
  const database = drizzle(client, { schema, casing: "snake_case" });

  try {
    /*
      Four profiles, and only the first is safe everywhere.

        reference   locales, concerns, skin states, protocol phases and the
                    reviewed product categories. Real, publishable, and the
                    prerequisite for every other profile.
        storyderm   the curated Storyderm catalogue: real brand, lines,
                    products and media, all `reviewState: draft` and
                    unpublished, with no variant, price or stock.
        demo        the invented commercial half — `DEMO-` variants, rial
                    prices and stock — layered onto `storyderm`.

      Both `storyderm` and `demo` also seed the editorial content spine: FAQ
      sets, the listing intro, a dated campaign and a gallery. All draft, all
      unpublishable, all visible only through the draft preview.
        dev         the older fictional catalogue. Retired by C-6 once the
                    Storyderm integration suite is green; see docs/26.

      `dev` and `storyderm` are ALTERNATIVES, not layers. Each refuses a
      database holding the other's products, so a mixed catalogue is a loud
      failure rather than a confusing page.
    */
    await seedReference(database);
    if (input.profile === "dev") {
      await seedDevCatalogue(database);
    }
    if (input.profile === "storyderm" || input.profile === "demo") {
      await seedStorydermCatalogue(database);
    }
    if (input.profile === "demo") {
      await seedCommerceDemo(database);
    }
    // Content last: a block that targets a brand or a concern checks that slug
    // against the taxonomy, so the catalogue it refers to has to exist first.
    if (input.profile === "storyderm" || input.profile === "demo") {
      await seedContent(database);
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}

void main();
