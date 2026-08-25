import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { phoneNumber } from "better-auth/plugins";
import * as schema from "../db/schema";
import { createPlaceholderEmail } from "./identifier";
import type { OtpNotifier } from "./notifier";
import { normalizeIranianPhone } from "./phone";
import { PostgresAuthRateLimitStore } from "./postgres-rate-limit-store";
import { AuthRateLimiter } from "./rate-limiter";
import { createCustomerAuthHandler } from "./request-boundary";
import {
  AUTH_DISABLED_PATHS,
  AUTH_SESSION_POLICY,
  type AuthRuntimeConfig,
} from "./runtime-config";

type SessionResponse = Readonly<{
  session: Record<string, unknown>;
  user: unknown;
}>;

export type AuthRuntimeLog = Readonly<{
  event: "auth_runtime";
  level: "error" | "warn" | "info" | "debug";
}>;

function readSessionResponse(value: unknown): SessionResponse | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const session = (value as Record<string, unknown>).session;
  if (
    typeof session !== "object" ||
    session === null ||
    Array.isArray(session)
  ) {
    return null;
  }
  return {
    session: session as Record<string, unknown>,
    user: (value as Record<string, unknown>).user,
  };
}

export function createAuthRuntime(options: {
  database: PostgresJsDatabase<typeof schema>;
  config: AuthRuntimeConfig;
  notifier: OtpNotifier;
  scheduleBackground(promise: Promise<unknown>): void;
  now?: () => number;
  log?: (event: AuthRuntimeLog) => void;
}) {
  const auth = betterAuth({
    appName: "fazaieli",
    baseURL: options.config.baseURL,
    secret: options.config.secret,
    database: drizzleAdapter(options.database, {
      provider: "pg",
      schema,
    }),
    trustedOrigins: [...options.config.trustedOrigins],
    disabledPaths: [...AUTH_DISABLED_PATHS],
    rateLimit: { enabled: false },
    logger: {
      log: (level) => {
        options.log?.({ event: "auth_runtime", level });
      },
    },
    advanced: {
      database: { generateId: false },
      useSecureCookies: options.config.cookieAttributes.secure,
      defaultCookieAttributes: options.config.cookieAttributes,
      trustedProxyHeaders: false,
      ipAddress: {
        ipAddressHeaders: [options.config.clientIp.header],
        trustedProxies: [...options.config.clientIp.trustedProxies],
      },
      backgroundTasks: { handler: options.scheduleBackground },
    },
    user: {
      modelName: "person",
      fields: { name: "displayName" },
      additionalFields: {
        emailIsPlaceholder: {
          type: "boolean",
          required: false,
          defaultValue: true,
          input: false,
        },
      },
    },
    session: {
      modelName: "authSession",
      fields: { userId: "personId" },
      expiresIn: AUTH_SESSION_POLICY.inactivityExpiresInSeconds,
      updateAge: AUTH_SESSION_POLICY.rotationAgeSeconds,
    },
    account: {
      modelName: "authAccount",
      fields: { userId: "personId" },
    },
    verification: { modelName: "authVerification" },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: {
              ...user,
              emailIsPlaceholder: true,
              emailVerified: false,
            },
          }),
        },
      },
    },
    plugins: [
      phoneNumber({
        otpLength: 6,
        expiresIn: 120,
        allowedAttempts: 3,
        phoneNumberValidator: (phone) => {
          try {
            return normalizeIranianPhone(phone) === phone;
          } catch {
            return false;
          }
        },
        sendOTP: async ({ phoneNumber: phone, code }) => {
          await options.notifier.sendOtp({ phone, otp: code });
        },
        signUpOnVerification: {
          getTempEmail: (phone) =>
            createPlaceholderEmail({
              phone,
              pepper: options.config.identifierPepper,
            }),
          getTempName: () => "مشتری فاضلی",
        },
        schema: {
          user: {
            fields: {
              phoneNumber: "phone",
              phoneNumberVerified: "phoneVerified",
            },
          },
        },
      }),
      nextCookies(),
    ],
  });

  const rawHandler = (request: Request) => auth.handler(request);
  const rateLimiter = new AuthRateLimiter(
    new PostgresAuthRateLimitStore(options.database),
    options.config.identifierPepper,
  );
  const customerHandler = createCustomerAuthHandler({
    handle: rawHandler,
    rateLimiter,
    clientIpHeader: options.config.clientIp.header,
    trustedProxies: options.config.clientIp.trustedProxies,
    fallbackClientIp: options.config.cookieAttributes.secure
      ? undefined
      : "127.0.0.1",
    now: options.now,
  });

  const handler = async (request: Request): Promise<Response> => {
    const response = await customerHandler(request);
    const path = new URL(request.url).pathname;
    if (path !== "/api/auth/get-session" || !response.ok) return response;

    let body: unknown;
    try {
      body = await response.clone().json();
    } catch {
      return response;
    }
    const sessionBody = readSessionResponse(body);
    if (!sessionBody) return response;

    const createdAt = sessionBody.session.createdAt;
    const createdAtMilliseconds =
      typeof createdAt === "string" || createdAt instanceof Date
        ? new Date(createdAt).getTime()
        : Number.NaN;
    if (
      !Number.isFinite(createdAtMilliseconds) ||
      Date.now() - createdAtMilliseconds >=
        AUTH_SESSION_POLICY.absoluteExpiresInSeconds * 1_000
    ) {
      const signOutHeaders = new Headers({
        "content-type": "application/json",
        origin: options.config.baseURL,
      });
      const cookie = request.headers.get("cookie");
      if (cookie) signOutHeaders.set("cookie", cookie);
      const clientIp = request.headers.get(options.config.clientIp.header);
      if (clientIp) {
        signOutHeaders.set(options.config.clientIp.header, clientIp);
      }
      const signOut = await rawHandler(
        new Request(`${options.config.baseURL}/api/auth/sign-out`, {
          method: "POST",
          headers: signOutHeaders,
          body: "{}",
        }),
      );
      const headers = new Headers({ "content-type": "application/json" });
      const clearingCookie = signOut.headers.get("set-cookie");
      if (clearingCookie) headers.set("set-cookie", clearingCookie);
      return new Response("null", { status: 200, headers });
    }

    const { token: _token, ...safeSession } = sessionBody.session;
    return new Response(
      JSON.stringify({ session: safeSession, user: sessionBody.user }),
      { status: response.status, headers: response.headers },
    );
  };

  const getSession = async (
    headers: HeadersInit,
  ): Promise<SessionResponse | null> => {
    const response = await handler(
      new Request(`${options.config.baseURL}/api/auth/get-session`, {
        headers,
      }),
    );
    if (!response.ok) return null;
    try {
      return readSessionResponse(await response.json());
    } catch {
      return null;
    }
  };

  return { config: options.config, getSession, handler };
}
