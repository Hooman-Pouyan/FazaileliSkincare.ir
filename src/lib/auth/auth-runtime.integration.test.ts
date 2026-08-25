import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../db/schema";
import { createAuthRuntime } from "./auth-runtime";
import { createPlaceholderEmail } from "./identifier";
import { FakeOtpNotifier } from "./notifier";
import { resolveAuthRuntimeConfig } from "./runtime-config";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;
const phones = [
  "+989123456781",
  "+989123456782",
  "+989123456783",
  "+989123456784",
  "+989120000999",
  "+989120000998",
  "+989120000997",
] as const;

const localConfig = () =>
  resolveAuthRuntimeConfig({
    NODE_ENV: "test",
    DATABASE_URL: databaseUrl,
    BETTER_AUTH_SECRET: "auth2-integration-secret-at-least-32-characters",
    BETTER_AUTH_URL: "http://127.0.0.1:3000",
    AUTH_IDENTIFIER_PEPPER: "auth2-integration-identifier-pepper",
    AUTH_TRUSTED_ORIGINS: "http://127.0.0.1:3000",
    SMS_PROVIDER: "fake",
  });

describeWithDatabase("Better Auth AUTH2 phone OTP runtime", () => {
  const client = postgres(databaseUrl ?? "", { max: 6, prepare: false });
  const database = drizzle(client, { schema, casing: "snake_case" });

  beforeAll(async () => {
    await database
      .insert(schema.locale)
      .values({ code: "fa", direction: "rtl", isPrimary: true, isActive: true })
      .onConflictDoNothing();
  });

  beforeEach(async () => {
    await database.delete(schema.authRateLimit);
    await database
      .delete(schema.authVerification)
      .where(inArray(schema.authVerification.identifier, phones));
    await database
      .delete(schema.person)
      .where(inArray(schema.person.phone, phones));
  });

  afterAll(async () => {
    await database.delete(schema.authRateLimit);
    await database
      .delete(schema.authVerification)
      .where(inArray(schema.authVerification.identifier, phones));
    await database
      .delete(schema.person)
      .where(inArray(schema.person.phone, phones));
    await client.end({ timeout: 5 });
  });

  const createHarness = (config = localConfig()) => {
    const notifier = new FakeOtpNotifier();
    const background: Promise<unknown>[] = [];
    let now = 1_000;
    const runtime = createAuthRuntime({
      database,
      config,
      notifier,
      scheduleBackground: (promise) => background.push(promise),
      now: () => now,
    });
    return {
      ...runtime,
      notifier,
      advance(seconds: number) {
        now += seconds;
      },
      async settleBackground() {
        await Promise.all(background.splice(0));
      },
    };
  };

  const post = (
    handler: (request: Request) => Promise<Response>,
    baseURL: string,
    path: string,
    body: unknown,
    cookie?: string,
  ) =>
    handler(
      new Request(`${baseURL}/api/auth${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: baseURL,
          "x-client-ip": "203.0.113.30",
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify(body),
      }),
    );

  it("creates and returns one phone-first customer through one canonical E.164 identity", async () => {
    const harness = createHarness();
    const phone = phones[0];
    await database.delete(schema.person).where(eq(schema.person.phone, phone));

    const send = await post(
      harness.handler,
      harness.config.baseURL,
      "/phone-number/send-otp",
      { phoneNumber: "۰۹۱۲۳۴۵۶۷۸۱" },
    );
    await harness.settleBackground();

    expect(send.status).toBe(200);
    await expect(send.json()).resolves.toEqual({ status: true });
    expect(harness.notifier.deliveries).toHaveLength(1);
    const firstCode = harness.notifier.deliveries[0]?.otp;
    expect(firstCode).toMatch(/^\d{6}$/u);
    expect(harness.notifier.deliveries[0]?.phone).toBe(phone);

    const verify = await post(
      harness.handler,
      harness.config.baseURL,
      "/phone-number/verify",
      { phoneNumber: phone, code: firstCode },
    );
    const setCookie = verify.headers.get("set-cookie") ?? "";

    expect(verify.status).toBe(200);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).not.toContain("Secure");
    await expect(verify.json()).resolves.toEqual({ status: true });

    const [person] = await database
      .select()
      .from(schema.person)
      .where(eq(schema.person.phone, phone));
    expect(person).toMatchObject({
      phone,
      phoneVerified: true,
      email: createPlaceholderEmail({
        phone,
        pepper: harness.config.identifierPepper,
      }),
      emailIsPlaceholder: true,
      emailVerified: false,
    });

    harness.advance(60);
    await post(
      harness.handler,
      harness.config.baseURL,
      "/phone-number/send-otp",
      { phoneNumber: phone },
    );
    await harness.settleBackground();
    const returningCode = harness.notifier.deliveries[1]?.otp;
    const returning = await post(
      harness.handler,
      harness.config.baseURL,
      "/phone-number/verify",
      { phoneNumber: phone, code: returningCode },
    );
    expect(returning.status).toBe(200);
    const people = await database
      .select({ id: schema.person.id })
      .from(schema.person)
      .where(eq(schema.person.phone, phone));
    expect(people).toHaveLength(1);
  });

  it("makes wrong, expired, replayed, and superseded OTPs indistinguishable", async () => {
    const harness = createHarness();
    const publicFailures: string[] = [];

    const wrongPhone = phones[1];
    await post(
      harness.handler,
      harness.config.baseURL,
      "/phone-number/send-otp",
      {
        phoneNumber: wrongPhone,
      },
    );
    await harness.settleBackground();
    const correctCode = harness.notifier.deliveries.at(-1)?.otp;
    for (const code of ["000000", "111111", "222222", correctCode]) {
      const response = await post(
        harness.handler,
        harness.config.baseURL,
        "/phone-number/verify",
        { phoneNumber: wrongPhone, code },
      );
      expect(response.status).toBe(400);
      publicFailures.push(await response.text());
    }

    const expiredPhone = phones[2];
    harness.advance(60);
    await post(
      harness.handler,
      harness.config.baseURL,
      "/phone-number/send-otp",
      {
        phoneNumber: expiredPhone,
      },
    );
    await harness.settleBackground();
    const expiredCode = harness.notifier.deliveries.at(-1)?.otp;
    await database
      .update(schema.authVerification)
      .set({ expiresAt: new Date(0) })
      .where(eq(schema.authVerification.identifier, expiredPhone));
    const expired = await post(
      harness.handler,
      harness.config.baseURL,
      "/phone-number/verify",
      { phoneNumber: expiredPhone, code: expiredCode },
    );
    publicFailures.push(await expired.text());

    const supersededPhone = phones[3];
    harness.advance(60);
    await post(
      harness.handler,
      harness.config.baseURL,
      "/phone-number/send-otp",
      {
        phoneNumber: supersededPhone,
      },
    );
    await harness.settleBackground();
    const oldCode = harness.notifier.deliveries.at(-1)?.otp;
    harness.advance(60);
    await post(
      harness.handler,
      harness.config.baseURL,
      "/phone-number/send-otp",
      {
        phoneNumber: supersededPhone,
      },
    );
    await harness.settleBackground();
    const newCode = harness.notifier.deliveries.at(-1)?.otp;

    const superseded = await post(
      harness.handler,
      harness.config.baseURL,
      "/phone-number/verify",
      { phoneNumber: supersededPhone, code: oldCode },
    );
    publicFailures.push(await superseded.text());
    const accepted = await post(
      harness.handler,
      harness.config.baseURL,
      "/phone-number/verify",
      { phoneNumber: supersededPhone, code: newCode },
    );
    expect(accepted.status).toBe(200);
    const replayed = await post(
      harness.handler,
      harness.config.baseURL,
      "/phone-number/verify",
      { phoneNumber: supersededPhone, code: newCode },
    );
    publicFailures.push(await replayed.text());

    expect(new Set(publicFailures)).toEqual(
      new Set(['{"code":"AUTH_REQUEST_FAILED"}']),
    );
  });

  it("denies every customer password surface and emits a Secure production cookie", async () => {
    const config = resolveAuthRuntimeConfig({
      NODE_ENV: "production",
      DATABASE_URL: databaseUrl,
      BETTER_AUTH_SECRET: "auth2-production-secret-at-least-32-characters",
      BETTER_AUTH_URL: "https://fazaieli.ir",
      AUTH_IDENTIFIER_PEPPER: "auth2-production-identifier-pepper",
      AUTH_TRUSTED_ORIGINS: "https://fazaieli.ir",
      AUTH_CLIENT_IP_HEADER: "x-client-ip",
      AUTH_TRUSTED_PROXIES: "192.0.2.10",
      SMS_PROVIDER: "kavenegar",
      SMS_API_KEY: "test-only-key",
      SMS_TEMPLATE: "fazaieli-login",
    });
    const harness = createHarness(config);
    const phone = "+989120000999";

    for (const path of [
      "/sign-up/email",
      "/sign-in/email",
      "/request-password-reset",
      "/reset-password/arbitrary-token",
      "/sign-in/phone-number",
      "/phone-number/request-password-reset",
      "/phone-number/reset-password",
    ]) {
      const response = await post(harness.handler, config.baseURL, path, {});
      expect(response.status, path).toBe(404);
    }

    await post(harness.handler, config.baseURL, "/phone-number/send-otp", {
      phoneNumber: phone,
    });
    await harness.settleBackground();
    const code = harness.notifier.deliveries.at(-1)?.otp;
    const verified = await post(
      harness.handler,
      config.baseURL,
      "/phone-number/verify",
      { phoneNumber: phone, code },
    );
    const cookie = verified.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(await verified.text()).not.toContain("token");
  });

  it("never forwards Better Auth messages or arguments to application logs", async () => {
    const captured: unknown[] = [];
    const sensitivePhone = "+989120000997";
    const sensitiveOtp = "735291";
    const sensitiveProviderSecret = "provider-secret-must-not-be-logged";
    const config = localConfig();
    const runtime = createAuthRuntime({
      database,
      config,
      notifier: {
        async sendOtp() {
          throw new Error(
            `${sensitivePhone}:${sensitiveOtp}:${sensitiveProviderSecret}`,
          );
        },
      },
      scheduleBackground: () => undefined,
      log: (event) => captured.push(event),
    });

    const response = await post(
      runtime.handler,
      config.baseURL,
      "/phone-number/send-otp",
      { phoneNumber: sensitivePhone },
    );
    expect(response.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const serialized = JSON.stringify(captured);
    expect(serialized).not.toContain(sensitivePhone);
    expect(serialized).not.toContain(sensitiveOtp);
    expect(serialized).not.toContain(sensitiveProviderSecret);
    expect(captured).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event: "auth_runtime", level: "error" }),
      ]),
    );
  });

  it("rotates an idle session but revokes it at the 30-day absolute boundary", async () => {
    const harness = createHarness();
    const phone = "+989120000998";
    await post(
      harness.handler,
      harness.config.baseURL,
      "/phone-number/send-otp",
      {
        phoneNumber: phone,
      },
    );
    await harness.settleBackground();
    const code = harness.notifier.deliveries.at(-1)?.otp;
    const verified = await post(
      harness.handler,
      harness.config.baseURL,
      "/phone-number/verify",
      { phoneNumber: phone, code },
    );
    const cookie =
      (verified.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
    const [person] = await database
      .select({ id: schema.person.id })
      .from(schema.person)
      .where(eq(schema.person.phone, phone));
    expect(person).toBeDefined();

    await database
      .update(schema.authSession)
      .set({ expiresAt: new Date(Date.now() + 60 * 60 * 1_000) })
      .where(eq(schema.authSession.personId, person?.id ?? ""));
    const rotated = await harness.handler(
      new Request(`${harness.config.baseURL}/api/auth/get-session`, {
        headers: { cookie, "x-client-ip": "203.0.113.30" },
      }),
    );
    expect(rotated.status).toBe(200);
    expect(rotated.headers.get("set-cookie")).toBeTruthy();
    expect(await rotated.text()).not.toContain('"token"');

    await database
      .update(schema.authSession)
      .set({
        createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1_000),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1_000),
      })
      .where(eq(schema.authSession.personId, person?.id ?? ""));
    expect(harness).not.toHaveProperty("auth");
    const expired = await harness.getSession(
      new Headers({ cookie, "x-client-ip": "203.0.113.30" }),
    );
    expect(expired).toBeNull();
    const sessions = await database
      .select()
      .from(schema.authSession)
      .where(eq(schema.authSession.personId, person?.id ?? ""));
    expect(sessions).toHaveLength(0);
  });
});
