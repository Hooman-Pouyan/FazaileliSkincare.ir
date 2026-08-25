import { createHmac } from "node:crypto";

export const AUTH_OTP_POLICY = {
  codeLength: 6,
  expiresInSeconds: 120,
  maxAttemptsPerCode: 3,
  sendCooldownSeconds: 60,
  rollingWindowSeconds: 3_600,
  maxSendsPerPhone: 5,
  maxSendsPerIp: 20,
  maxFailedVerificationsPerPhone: 10,
  maxFailedVerificationsPerIp: 30,
} as const;

export type AuthRateLimitScope =
  | "send:phone"
  | "send:ip"
  | "verify:phone"
  | "verify:ip";

export function createAuthRateLimitKey(input: {
  scope: AuthRateLimitScope;
  identifier: string;
  pepper: string;
}): string {
  if (!input.pepper || !input.identifier) {
    throw new Error("RATE_LIMIT_KEY_UNAVAILABLE");
  }

  const digest = createHmac("sha256", input.pepper)
    .update(`${input.scope}:${input.identifier}`)
    .digest("hex");

  return `auth:${input.scope}:${digest}`;
}

type AuthRateLimitOutcome = "allowed" | "rate_limited";

export function evaluateOtpSendLimit(input: {
  secondsSinceLastSend: number | null;
  phoneSendsInWindow: number;
  ipSendsInWindow: number;
}): AuthRateLimitOutcome {
  const cooldownActive =
    input.secondsSinceLastSend !== null &&
    input.secondsSinceLastSend < AUTH_OTP_POLICY.sendCooldownSeconds;
  const phoneLimitReached =
    input.phoneSendsInWindow >= AUTH_OTP_POLICY.maxSendsPerPhone;
  const ipLimitReached = input.ipSendsInWindow >= AUTH_OTP_POLICY.maxSendsPerIp;

  return cooldownActive || phoneLimitReached || ipLimitReached
    ? "rate_limited"
    : "allowed";
}

export function evaluateOtpVerificationLimit(input: {
  attemptsForCode: number;
  phoneFailuresInWindow: number;
  ipFailuresInWindow: number;
}): AuthRateLimitOutcome {
  const codeLimitReached =
    input.attemptsForCode >= AUTH_OTP_POLICY.maxAttemptsPerCode;
  const phoneLimitReached =
    input.phoneFailuresInWindow >=
    AUTH_OTP_POLICY.maxFailedVerificationsPerPhone;
  const ipLimitReached =
    input.ipFailuresInWindow >= AUTH_OTP_POLICY.maxFailedVerificationsPerIp;

  return codeLimitReached || phoneLimitReached || ipLimitReached
    ? "rate_limited"
    : "allowed";
}
