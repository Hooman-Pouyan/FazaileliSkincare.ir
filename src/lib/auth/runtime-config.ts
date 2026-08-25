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

function invalidConfig(): never {
  throw new Error("AUTH_RUNTIME_CONFIG_INVALID");
}

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) invalidConfig();
  return value;
}

function parseOrigin(value: string, production: boolean): string {
  if (value.includes("*") || value.includes("?")) invalidConfig();

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return invalidConfig();
  }

  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    invalidConfig();
  }
  if (production && url.protocol !== "https:") invalidConfig();
  if (
    !production &&
    url.protocol === "http:" &&
    url.hostname !== "127.0.0.1" &&
    url.hostname !== "localhost"
  ) {
    invalidConfig();
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") invalidConfig();

  return url.origin;
}

function parseTrustedProxy(value: string): string {
  const [address, prefix, ...rest] = value.split("/");
  const version = address ? isIP(address) : 0;
  if (!version || rest.length > 0) invalidConfig();
  if (prefix === undefined) return value;

  const parsedPrefix = Number(prefix);
  const maxPrefix = version === 4 ? 32 : 128;
  if (
    !Number.isInteger(parsedPrefix) ||
    parsedPrefix < 0 ||
    parsedPrefix > maxPrefix
  ) {
    invalidConfig();
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
  if (secret.length < 32) invalidConfig();

  const baseURL = parseOrigin(required(env, "BETTER_AUTH_URL"), production);
  const trustedOrigins = required(env, "AUTH_TRUSTED_ORIGINS")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => parseOrigin(origin, production));
  if (trustedOrigins.length === 0 || !trustedOrigins.includes(baseURL)) {
    invalidConfig();
  }

  const header = (
    env.AUTH_CLIENT_IP_HEADER?.trim() || "x-client-ip"
  ).toLowerCase();
  if (!/^[a-z0-9-]+$/u.test(header)) invalidConfig();
  const trustedProxies = (env.AUTH_TRUSTED_PROXIES ?? "")
    .split(",")
    .map((proxy) => proxy.trim())
    .filter(Boolean)
    .map(parseTrustedProxy);
  if (
    production &&
    (!env.AUTH_CLIENT_IP_HEADER?.trim() || trustedProxies.length === 0)
  ) {
    invalidConfig();
  }

  const provider = env.SMS_PROVIDER?.trim();
  let sms: SmsConfig;
  if (provider === "fake") {
    if (production) invalidConfig();
    sms = { provider: "fake" };
  } else if (provider === "kavenegar") {
    sms = {
      provider,
      apiKey: required(env, "SMS_API_KEY"),
      template: required(env, "SMS_TEMPLATE"),
    };
  } else {
    return invalidConfig();
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
