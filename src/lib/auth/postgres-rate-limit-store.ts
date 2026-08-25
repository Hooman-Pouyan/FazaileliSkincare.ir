import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import * as schema from "../db/schema";
import type { AuthRateLimitStore } from "./rate-limiter";

export class PostgresAuthRateLimitStore implements AuthRateLimitStore {
  constructor(private readonly database: PostgresJsDatabase<typeof schema>) {}

  async consume(
    key: string,
    windowSeconds: number,
    now: number,
  ): Promise<number> {
    const nowMilliseconds = Math.trunc(now * 1_000);
    const windowMilliseconds = windowSeconds * 1_000;
    const [row] = await this.database
      .insert(schema.authRateLimit)
      .values({ key, count: 1, lastRequest: nowMilliseconds })
      .onConflictDoUpdate({
        target: schema.authRateLimit.key,
        set: {
          count: sql<number>`case
            when ${nowMilliseconds} - ${schema.authRateLimit.lastRequest} >= ${windowMilliseconds}
              then 1
            else ${schema.authRateLimit.count} + 1
          end`,
          lastRequest: sql<number>`case
            when ${nowMilliseconds} - ${schema.authRateLimit.lastRequest} >= ${windowMilliseconds}
              then ${nowMilliseconds}
            else ${schema.authRateLimit.lastRequest}
          end`,
        },
      })
      .returning({ count: schema.authRateLimit.count });

    if (!row) throw new Error("AUTH_RATE_LIMIT_STORE_UNAVAILABLE");
    return row.count;
  }

  async count(
    key: string,
    windowSeconds: number,
    now: number,
  ): Promise<number> {
    const [row] = await this.database
      .select({
        count: schema.authRateLimit.count,
        lastRequest: schema.authRateLimit.lastRequest,
      })
      .from(schema.authRateLimit)
      .where(eq(schema.authRateLimit.key, key))
      .limit(1);
    if (!row) return 0;

    return now * 1_000 - row.lastRequest >= windowSeconds * 1_000
      ? 0
      : row.count;
  }
}
