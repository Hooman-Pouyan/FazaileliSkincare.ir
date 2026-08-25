import { isIP } from "node:net";

export const AUTH_SESSION_POLICY = {
  inactivityExpiresInSeconds: 60 * 60 * 24 * 7,
  absoluteExpiresInSeconds: 60 * 60 * 24 * 30,
  rotationAgeSeconds: 60 * 60 * 24,
} as const;

export const AUTH_DISABLED_PATHS = [
  "/sign-up/email",
  "/sign-in/email",
  "/request-password-reset",
  "/reset-password",
  "/sign-in/phone-number",
  "/phone-number/request-password-reset",
  "/phone-number/reset-password",
] as const;

type CookieAttributes = Readonly<{
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
}>;

export type SmsConfig =
  | Readonly<{ provider: "fake" }>
  | Readonly<{
      provider: "kavenegar";
      apiKey: string;
      template: string;
    }>;

export type AuthRuntimeConfig = Readonly<{
  databaseUrl: string;
  secret: string;
  baseURL: string;
  identifierPepper: string;
  trustedOrigins: readonly string[];
  clientIp: Readonly<{
    header: string;
    trustedProxies: readonly string[];
  }>;
  cookieAttributes: CookieAttributes;
  sms: SmsConfig;
}>;

/**
 * The thrown code is stable and safe to surface; the reason is appended only
 * outside production so a developer sees which key is wrong instead of an
 * opaque 500. Reasons name environment keys, never their values.
 */
function invalidConfig(reason?: string): never {
  const production = process.env.NODE_ENV === "production";
  throw new Error(
    reason && !production
      ? `AUTH_RUNTIME_CONFIG_INVALID: ${reason}`
      : "AUTH_RUNTIME_CONFIG_INVALID",
  );
}

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) invalidConfig(`${key} is missing or empty`);
  return value;
}

function parseOrigin(
  value: string,
  production: boolean,
  label: string,
): string {
  if (value.includes("*") || value.includes("?"))
    invalidConfig(`${label} is not a valid origin`);

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return invalidConfig(`${label} is not a valid origin`);
  }

  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    invalidConfig(`${label} is not a valid origin`);
  }
  if (production && url.protocol !== "https:")
    invalidConfig(`${label} is not a valid origin`);
  if (
    !production &&
    url.protocol === "http:" &&
    url.hostname !== "127.0.0.1" &&
    url.hostname !== "localhost"
  ) {
    invalidConfig(`${label} is not a valid origin`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:")
    invalidConfig(`${label} is not a valid origin`);

  return url.origin;
}

function parseTrustedProxy(value: string): string {
  const [address, prefix, ...rest] = value.split("/");
  const version = address ? isIP(address) : 0;
  if (!version || rest.length > 0)
    invalidConfig("AUTH_TRUSTED_PROXIES contains an invalid CIDR or address");
  if (prefix === undefined) return value;

  const parsedPrefix = Number(prefix);
  const maxPrefix = version === 4 ? 32 : 128;
  if (
    !Number.isInteger(parsedPrefix) ||
    parsedPrefix < 0 ||
    parsedPrefix > maxPrefix
  ) {
    invalidConfig("AUTH_TRUSTED_PROXIES contains an invalid CIDR or address");
  }
  return value;
}

export function resolveAuthRuntimeConfig(
  env: NodeJS.ProcessEnv,
): AuthRuntimeConfig {
  const production = env.NODE_ENV === "production";
  const databaseUrl = required(env, "DATABASE_URL");
  const secret = required(env, "BETTER_AUTH_SECRET");
  const identifierPepper = required(env, "AUTH_IDENTIFIER_PEPPER");
  if (secret.length < 32) {
    invalidConfig("BETTER_AUTH_SECRET must be at least 32 characters");
  }

  const baseURL = parseOrigin(
    required(env, "BETTER_AUTH_URL"),
    production,
    "BETTER_AUTH_URL",
  );
  const trustedOrigins = required(env, "AUTH_TRUSTED_ORIGINS")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => parseOrigin(origin, production, "AUTH_TRUSTED_ORIGINS"));
  if (trustedOrigins.length === 0 || !trustedOrigins.includes(baseURL)) {
    invalidConfig("AUTH_TRUSTED_ORIGINS must include BETTER_AUTH_URL");
  }

  const header = (
    env.AUTH_CLIENT_IP_HEADER?.trim() || "x-client-ip"
  ).toLowerCase();
  if (!/^[a-z0-9-]+$/u.test(header)) {
    invalidConfig("AUTH_CLIENT_IP_HEADER is not a valid header name");
  }
  const trustedProxies = (env.AUTH_TRUSTED_PROXIES ?? "")
    .split(",")
    .map((proxy) => proxy.trim())
    .filter(Boolean)
    .map(parseTrustedProxy);
  if (
    production &&
    (!env.AUTH_CLIENT_IP_HEADER?.trim() || trustedProxies.length === 0)
  ) {
    invalidConfig(
      "AUTH_CLIENT_IP_HEADER and AUTH_TRUSTED_PROXIES are required in production",
    );
  }

  const provider = env.SMS_PROVIDER?.trim();
  let sms: SmsConfig;
  if (provider === "fake") {
    if (production)
      invalidConfig('SMS_PROVIDER="fake" is not allowed in production');
    sms = { provider: "fake" };
  } else if (provider === "kavenegar") {
    sms = {
      provider,
      apiKey: required(env, "SMS_API_KEY"),
      template: required(env, "SMS_TEMPLATE"),
    };
  } else {
    return invalidConfig('SMS_PROVIDER must be "fake" or "kavenegar"');
  }

  return {
    databaseUrl,
    secret,
    baseURL,
    identifierPepper,
    trustedOrigins,
    clientIp: { header, trustedProxies },
    cookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: production,
      path: "/",
    },
    sms,
  };
}
