import { describe, expect, it } from "vitest";
import {
  AUTH_DISABLED_PATHS,
  AUTH_SESSION_POLICY,
  resolveAuthRuntimeConfig,
} from "./runtime-config";

const productionEnv = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://auth2.invalid/fazaieli",
  BETTER_AUTH_SECRET: "a-production-secret-at-least-32-characters",
  BETTER_AUTH_URL: "https://fazaieli.ir",
  AUTH_IDENTIFIER_PEPPER: "a-separate-production-identifier-pepper",
  AUTH_TRUSTED_ORIGINS: "https://fazaieli.ir,https://staging.fazaieli.ir",
  AUTH_CLIENT_IP_HEADER: "x-client-ip",
  AUTH_TRUSTED_PROXIES: "192.0.2.10,198.51.100.0/24",
  SMS_PROVIDER: "kavenegar",
  SMS_API_KEY: "test-only-api-key",
  SMS_TEMPLATE: "fazaieli-login",
} satisfies NodeJS.ProcessEnv;

describe("AUTH2 runtime policy", () => {
  it("locks the approved OTP, session, cookie, and disabled-password policy", () => {
    expect(AUTH_SESSION_POLICY).toEqual({
      inactivityExpiresInSeconds: 60 * 60 * 24 * 7,
      absoluteExpiresInSeconds: 60 * 60 * 24 * 30,
      rotationAgeSeconds: 60 * 60 * 24,
    });
    expect(AUTH_DISABLED_PATHS).toEqual(
      expect.arrayContaining([
        "/sign-up/email",
        "/sign-in/email",
        "/request-password-reset",
        "/reset-password",
        "/sign-in/phone-number",
        "/phone-number/request-password-reset",
        "/phone-number/reset-password",
      ]),
    );

    const config = resolveAuthRuntimeConfig(productionEnv);
    expect(config.cookieAttributes).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
  });

  it("accepts only explicit HTTPS production origins and an approved proxy boundary", () => {
    const config = resolveAuthRuntimeConfig(productionEnv);

    expect(config.trustedOrigins).toEqual([
      "https://fazaieli.ir",
      "https://staging.fazaieli.ir",
    ]);
    expect(config.clientIp).toEqual({
      header: "x-client-ip",
      trustedProxies: ["192.0.2.10", "198.51.100.0/24"],
    });

    expect(() =>
      resolveAuthRuntimeConfig({
        ...productionEnv,
        AUTH_TRUSTED_ORIGINS: "https://*.fazaieli.ir",
      }),
    ).toThrowError("AUTH_RUNTIME_CONFIG_INVALID");
    expect(() =>
      resolveAuthRuntimeConfig({
        ...productionEnv,
        AUTH_TRUSTED_ORIGINS: "http://fazaieli.ir",
      }),
    ).toThrowError("AUTH_RUNTIME_CONFIG_INVALID");
  });

  it("fails closed when production security or VerifyLookup settings are absent", () => {
    for (const key of [
      "AUTH_IDENTIFIER_PEPPER",
      "AUTH_CLIENT_IP_HEADER",
      "AUTH_TRUSTED_PROXIES",
      "SMS_API_KEY",
      "SMS_TEMPLATE",
    ] as const) {
      expect(() =>
        resolveAuthRuntimeConfig({ ...productionEnv, [key]: "" }),
      ).toThrowError("AUTH_RUNTIME_CONFIG_INVALID");
    }

    expect(() =>
      resolveAuthRuntimeConfig({ ...productionEnv, SMS_PROVIDER: "fake" }),
    ).toThrowError("AUTH_RUNTIME_CONFIG_INVALID");
  });

  it("permits explicit local HTTP and fake delivery without weakening production", () => {
    const config = resolveAuthRuntimeConfig({
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://auth2.invalid/fazaieli",
      BETTER_AUTH_SECRET: "a-local-secret-at-least-32-characters",
      BETTER_AUTH_URL: "http://127.0.0.1:3000",
      AUTH_IDENTIFIER_PEPPER: "a-local-identifier-pepper",
      AUTH_TRUSTED_ORIGINS: "http://127.0.0.1:3000",
      SMS_PROVIDER: "fake",
    });

    expect(config.cookieAttributes.secure).toBe(false);
    expect(config.sms).toEqual({ provider: "fake" });
    expect(config.clientIp).toEqual({
      header: "x-client-ip",
      trustedProxies: [],
    });
  });
});
