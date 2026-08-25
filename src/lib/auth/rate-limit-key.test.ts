import { describe, expect, it } from "vitest";
import {
  AUTH_OTP_POLICY,
  createAuthRateLimitKey,
  evaluateOtpSendLimit,
  evaluateOtpVerificationLimit,
} from "./rate-limit-key";

describe("authentication rate-limit policy", () => {
  it("locks every approved OTP and abuse boundary into one shared policy", () => {
    expect(AUTH_OTP_POLICY).toEqual({
      codeLength: 6,
      expiresInSeconds: 120,
      maxAttemptsPerCode: 3,
      sendCooldownSeconds: 60,
      rollingWindowSeconds: 3_600,
      maxSendsPerPhone: 5,
      maxSendsPerIp: 20,
      maxFailedVerificationsPerPhone: 10,
      maxFailedVerificationsPerIp: 30,
    });
  });

  it("allows a send only while every phone and IP boundary has capacity", () => {
    expect(
      evaluateOtpSendLimit({
        secondsSinceLastSend: 60,
        phoneSendsInWindow: 4,
        ipSendsInWindow: 19,
      }),
    ).toBe("allowed");
  });

  it.each([
    {
      secondsSinceLastSend: 59,
      phoneSendsInWindow: 0,
      ipSendsInWindow: 0,
    },
    {
      secondsSinceLastSend: null,
      phoneSendsInWindow: 5,
      ipSendsInWindow: 0,
    },
    {
      secondsSinceLastSend: null,
      phoneSendsInWindow: 0,
      ipSendsInWindow: 20,
    },
  ])("returns the same generic outcome for every send limit", (state) => {
    expect(evaluateOtpSendLimit(state)).toBe("rate_limited");
  });

  it("allows verification only while every code, phone, and IP boundary has capacity", () => {
    expect(
      evaluateOtpVerificationLimit({
        attemptsForCode: 2,
        phoneFailuresInWindow: 9,
        ipFailuresInWindow: 29,
      }),
    ).toBe("allowed");
  });

  it.each([
    { attemptsForCode: 3, phoneFailuresInWindow: 0, ipFailuresInWindow: 0 },
    { attemptsForCode: 0, phoneFailuresInWindow: 10, ipFailuresInWindow: 0 },
    { attemptsForCode: 0, phoneFailuresInWindow: 0, ipFailuresInWindow: 30 },
  ])(
    "returns the same generic outcome for every verification limit",
    (state) => {
      expect(evaluateOtpVerificationLimit(state)).toBe("rate_limited");
    },
  );
});

describe("authentication rate-limit keys", () => {
  it("uses a deterministic HMAC-SHA256 key without exposing the identifier", () => {
    const key = createAuthRateLimitKey({
      scope: "send:phone",
      identifier: "+989123456789",
      pepper: "test-pepper",
    });

    expect(key).toBe(
      "auth:send:phone:35701facc6c4673d2ee4a4fc5cea27b9dd135da06cf716acbf912f504f8589ac",
    );
    expect(key).not.toContain("+989123456789");
  });

  it("separates phone, IP, send, and verification namespaces", () => {
    const identifier = "shared-identifier";
    const pepper = "test-pepper";
    const scopes = [
      "send:phone",
      "send:ip",
      "verify:phone",
      "verify:ip",
    ] as const;
    const keys = scopes.map((scope) =>
      createAuthRateLimitKey({
        scope,
        identifier,
        pepper,
      }),
    );

    expect(new Set(keys)).toHaveLength(4);
  });

  it("fails closed when the server pepper is missing", () => {
    expect(() =>
      createAuthRateLimitKey({
        scope: "send:phone",
        identifier: "+989123456789",
        pepper: "",
      }),
    ).toThrowError("RATE_LIMIT_KEY_UNAVAILABLE");
  });
});
