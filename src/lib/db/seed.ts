import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import * as schema from "./schema";
import { seedReference } from "./seeds/reference";

async function main(): Promise<void> {
  const input = z.object({
    databaseUrl: z.string().url(),
    profile: z.literal("reference"),
  }).parse({
    databaseUrl: process.env.DATABASE_URL,
    profile: process.argv[2] ?? "reference",
  });

  const client = postgres(input.databaseUrl, { max: 1, prepare: false });
  const database = drizzle(client, { schema, casing: "snake_case" });

  try {
    await seedReference(database);
  } finally {
    await client.end({ timeout: 5 });
  }
}

void main();
