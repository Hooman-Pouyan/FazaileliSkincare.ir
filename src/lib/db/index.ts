import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

/**
 * One Postgres, hosted in Iran beside the app. Reuse the client across hot
 * reloads in dev so we don't exhaust connections.
 */
const globalForDb = globalThis as unknown as {
  pg?: ReturnType<typeof postgres>;
};
const client =
  globalForDb.pg ?? postgres(connectionString, { max: 10, prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
export { schema };
