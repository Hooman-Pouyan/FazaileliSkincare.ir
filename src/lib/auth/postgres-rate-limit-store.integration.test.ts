import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "../db/schema";
import { PostgresAuthRateLimitStore } from "./postgres-rate-limit-store";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("PostgreSQL auth rate-limit storage", () => {
  const key = `auth:test:${randomUUID()}`;
  const client = postgres(databaseUrl ?? "", { max: 4, prepare: false });
  const database = drizzle(client, { schema, casing: "snake_case" });
  const store = new PostgresAuthRateLimitStore(database);

  beforeAll(async () => {
    await database
      .delete(schema.authRateLimit)
      .where(eq(schema.authRateLimit.key, key));
  });

  afterAll(async () => {
    await database
      .delete(schema.authRateLimit)
      .where(eq(schema.authRateLimit.key, key));
    await client.end({ timeout: 5 });
  });

  it("atomically consumes a fixed window and resets at its boundary", async () => {
    const counts = await Promise.all(
      Array.from({ length: 10 }, () => store.consume(key, 60, 100)),
    );

    expect([...counts].sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    await expect(store.count(key, 60, 159)).resolves.toBe(10);
    await expect(store.consume(key, 60, 160)).resolves.toBe(1);
    await expect(store.count(key, 60, 160)).resolves.toBe(1);
  });
});
