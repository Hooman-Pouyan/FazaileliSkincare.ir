import { describe, expect, it } from "vitest";
import {
  AuthRateLimitExceededError,
  AuthRateLimiter,
  type AuthRateLimitStore,
} from "./rate-limiter";

class MemoryRateLimitStore implements AuthRateLimitStore {
  readonly rows = new Map<string, { count: number; windowStartedAt: number }>();

  async consume(
    key: string,
    windowSeconds: number,
    now: number,
  ): Promise<number> {
    const row = this.rows.get(key);
    if (!row || now - row.windowStartedAt >= windowSeconds) {
      this.rows.set(key, { count: 1, windowStartedAt: now });
      return 1;
    }

    row.count += 1;
    return row.count;
  }

  async count(
    key: string,
    windowSeconds: number,
    now: number,
  ): Promise<number> {
    const row = this.rows.get(key);
    if (!row || now - row.windowStartedAt >= windowSeconds) return 0;
    return row.count;
  }
}

const phoneAt = (index: number) => `+98912${String(index).padStart(7, "0")}`;

describe("persistent AUTH2 phone and IP limits", () => {
  it("enforces the 60-second cooldown and five sends per normalized phone", async () => {
    const store = new MemoryRateLimitStore();
    const limiter = new AuthRateLimiter(store, "test-rate-limit-pepper");

    await limiter.assertSendAllowed({
      phone: "۰۹۱۲۳۴۵۶۷۸۹",
      ip: "203.0.113.10",
      now: 0,
    });
    await expect(
      limiter.assertSendAllowed({
        phone: "+989123456789",
        ip: "203.0.113.10",
        now: 59,
      }),
    ).rejects.toBeInstanceOf(AuthRateLimitExceededError);

    for (const now of [60, 120, 180, 240]) {
      await limiter.assertSendAllowed({
        phone: "09123456789",
        ip: "203.0.113.10",
        now,
      });
    }
    await expect(
      limiter.assertSendAllowed({
        phone: "09123456789",
        ip: "203.0.113.10",
        now: 300,
      }),
    ).rejects.toBeInstanceOf(AuthRateLimitExceededError);

    expect([...store.rows.keys()].join(" ")).not.toContain("989123456789");
    expect([...store.rows.keys()].join(" ")).not.toContain("203.0.113.10");
  });

  it("enforces twenty sends per trusted client IP across distinct phones", async () => {
    const store = new MemoryRateLimitStore();
    const limiter = new AuthRateLimiter(store, "test-rate-limit-pepper");

    for (let index = 0; index < 20; index += 1) {
      await limiter.assertSendAllowed({
        phone: phoneAt(index),
        ip: "203.0.113.11",
        now: index * 60,
      });
    }

    await expect(
      limiter.assertSendAllowed({
        phone: phoneAt(20),
        ip: "203.0.113.11",
        now: 20 * 60,
      }),
    ).rejects.toBeInstanceOf(AuthRateLimitExceededError);
  });

  it("blocks after ten phone failures or thirty trusted-IP failures", async () => {
    const store = new MemoryRateLimitStore();
    const limiter = new AuthRateLimiter(store, "test-rate-limit-pepper");

    for (let index = 0; index < 10; index += 1) {
      await limiter.assertVerificationAllowed({
        phone: "09123456789",
        ip: "203.0.113.12",
        now: index,
      });
      await limiter.recordVerificationFailure({
        phone: "09123456789",
        ip: "203.0.113.12",
        now: index,
      });
    }
    await expect(
      limiter.assertVerificationAllowed({
        phone: "+989123456789",
        ip: "203.0.113.12",
        now: 10,
      }),
    ).rejects.toBeInstanceOf(AuthRateLimitExceededError);

    const secondStore = new MemoryRateLimitStore();
    const secondLimiter = new AuthRateLimiter(
      secondStore,
      "test-rate-limit-pepper",
    );
    for (let index = 0; index < 30; index += 1) {
      const phone = phoneAt(index + 100);
      await secondLimiter.assertVerificationAllowed({
        phone,
        ip: "203.0.113.13",
        now: index,
      });
      await secondLimiter.recordVerificationFailure({
        phone,
        ip: "203.0.113.13",
        now: index,
      });
    }
    await expect(
      secondLimiter.assertVerificationAllowed({
        phone: phoneAt(999),
        ip: "203.0.113.13",
        now: 30,
      }),
    ).rejects.toBeInstanceOf(AuthRateLimitExceededError);
  });
});
