import { normalizeIranianPhone } from "./phone";
import { AUTH_OTP_POLICY, createAuthRateLimitKey } from "./rate-limit-key";

export interface AuthRateLimitStore {
  consume(key: string, windowSeconds: number, now: number): Promise<number>;
  count(key: string, windowSeconds: number, now: number): Promise<number>;
}

export class AuthRateLimitExceededError extends Error {
  readonly code = "AUTH_RATE_LIMITED";

  constructor() {
    super("AUTH_RATE_LIMITED");
    this.name = "AuthRateLimitExceededError";
  }
}

type RateLimitInput = Readonly<{
  phone: string;
  ip: string;
  now: number;
}>;

export class AuthRateLimiter {
  constructor(
    private readonly store: AuthRateLimitStore,
    private readonly pepper: string,
  ) {}

  private key(
    scope: "send:phone" | "send:ip" | "verify:phone" | "verify:ip",
    identifier: string,
  ): string {
    return createAuthRateLimitKey({ scope, identifier, pepper: this.pepper });
  }

  async assertSendAllowed(input: RateLimitInput): Promise<void> {
    const phone = normalizeIranianPhone(input.phone);
    const cooldownCount = await this.store.consume(
      this.key("send:phone", `cooldown:${phone}`),
      AUTH_OTP_POLICY.sendCooldownSeconds,
      input.now,
    );
    if (cooldownCount > 1) throw new AuthRateLimitExceededError();

    const phoneCount = await this.store.consume(
      this.key("send:phone", `window:${phone}`),
      AUTH_OTP_POLICY.rollingWindowSeconds,
      input.now,
    );
    if (phoneCount > AUTH_OTP_POLICY.maxSendsPerPhone) {
      throw new AuthRateLimitExceededError();
    }

    const ipCount = await this.store.consume(
      this.key("send:ip", input.ip),
      AUTH_OTP_POLICY.rollingWindowSeconds,
      input.now,
    );
    if (ipCount > AUTH_OTP_POLICY.maxSendsPerIp) {
      throw new AuthRateLimitExceededError();
    }
  }

  async assertVerificationAllowed(input: RateLimitInput): Promise<void> {
    const phone = normalizeIranianPhone(input.phone);
    const [phoneFailures, ipFailures] = await Promise.all([
      this.store.count(
        this.key("verify:phone", phone),
        AUTH_OTP_POLICY.rollingWindowSeconds,
        input.now,
      ),
      this.store.count(
        this.key("verify:ip", input.ip),
        AUTH_OTP_POLICY.rollingWindowSeconds,
        input.now,
      ),
    ]);

    if (
      phoneFailures >= AUTH_OTP_POLICY.maxFailedVerificationsPerPhone ||
      ipFailures >= AUTH_OTP_POLICY.maxFailedVerificationsPerIp
    ) {
      throw new AuthRateLimitExceededError();
    }
  }

  async recordVerificationFailure(input: RateLimitInput): Promise<void> {
    const phone = normalizeIranianPhone(input.phone);
    await Promise.all([
      this.store.consume(
        this.key("verify:phone", phone),
        AUTH_OTP_POLICY.rollingWindowSeconds,
        input.now,
      ),
      this.store.consume(
        this.key("verify:ip", input.ip),
        AUTH_OTP_POLICY.rollingWindowSeconds,
        input.now,
      ),
    ]);
  }
}
