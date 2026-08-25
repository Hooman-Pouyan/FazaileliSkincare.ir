import { describe, expect, it, vi } from "vitest";
import { AuthRateLimitExceededError } from "./rate-limiter";
import { createCustomerAuthHandler } from "./request-boundary";

const request = (path: string, body: unknown, ip = "203.0.113.20") =>
  new Request(`http://127.0.0.1:3000/api/auth${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-client-ip": ip,
    },
    body: JSON.stringify(body),
  });

describe("customer auth request boundary", () => {
  it("canonicalizes one phone before rate limiting and Better Auth", async () => {
    let forwardedBody: unknown;
    const handle = vi.fn(async (forwarded: Request) => {
      forwardedBody = await forwarded.json();
      return Response.json({ message: "code sent" });
    });
    const rateLimiter = {
      assertSendAllowed: vi.fn(async () => undefined),
      assertVerificationAllowed: vi.fn(async () => undefined),
      recordVerificationFailure: vi.fn(async () => undefined),
    };
    const handler = createCustomerAuthHandler({
      handle,
      rateLimiter,
      clientIpHeader: "x-client-ip",
      trustedProxies: [],
      now: () => 100,
    });

    const response = await handler(
      request("/phone-number/send-otp", { phoneNumber: "۰۹۱۲۳۴۵۶۷۸۹" }),
    );

    expect(response.status).toBe(200);
    expect(forwardedBody).toEqual({ phoneNumber: "+989123456789" });
    expect(rateLimiter.assertSendAllowed).toHaveBeenCalledWith({
      phone: "+989123456789",
      ip: "203.0.113.20",
      now: 100,
    });
  });

  it("returns one generic public error for invalid OTP outcomes and records failure", async () => {
    let forwardedBody: unknown;
    const handle = vi.fn(async (forwarded: Request) => {
      forwardedBody = await forwarded.json();
      return Response.json(
        {
          code: "OTP_EXPIRED",
          message: "OTP 123456 expired for +989123456789",
        },
        { status: 400 },
      );
    });
    const rateLimiter = {
      assertSendAllowed: vi.fn(async () => undefined),
      assertVerificationAllowed: vi.fn(async () => undefined),
      recordVerificationFailure: vi.fn(async () => undefined),
    };
    const handler = createCustomerAuthHandler({
      handle,
      rateLimiter,
      clientIpHeader: "x-client-ip",
      trustedProxies: [],
      now: () => 101,
    });

    const response = await handler(
      request("/phone-number/verify", {
        phoneNumber: "09123456789",
        code: "123456",
        updatePhoneNumber: true,
        disableSession: true,
      }),
    );
    const publicBody = await response.text();

    expect(response.status).toBe(400);
    expect(publicBody).toBe('{"code":"AUTH_REQUEST_FAILED"}');
    expect(publicBody).not.toContain("123456");
    expect(publicBody).not.toContain("989123456789");
    expect(forwardedBody).toEqual({
      phoneNumber: "+989123456789",
      code: "123456",
    });
    expect(rateLimiter.recordVerificationFailure).toHaveBeenCalledWith({
      phone: "+989123456789",
      ip: "203.0.113.20",
      now: 101,
    });
  });

  it("preserves a successful session cookie without exposing the token in JSON", async () => {
    const handle = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: true, token: "server-token" }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "set-cookie":
              "__Secure-fazaieli.session_token=signed; Path=/; HttpOnly; Secure; SameSite=Lax",
          },
        }),
    );
    const rateLimiter = {
      assertSendAllowed: vi.fn(async () => undefined),
      assertVerificationAllowed: vi.fn(async () => undefined),
      recordVerificationFailure: vi.fn(async () => undefined),
    };
    const handler = createCustomerAuthHandler({
      handle,
      rateLimiter,
      clientIpHeader: "x-client-ip",
      trustedProxies: [],
      now: () => 102,
    });

    const response = await handler(
      request("/phone-number/verify", {
        phoneNumber: "+989123456789",
        code: "654321",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    await expect(response.json()).resolves.toEqual({ status: true });
  });

  it("fails closed for spoofable IP chains, limits, and every password path", async () => {
    const handle = vi.fn(async () => Response.json({ ok: true }));
    const rateLimiter = {
      assertSendAllowed: vi.fn(async () => {
        throw new AuthRateLimitExceededError();
      }),
      assertVerificationAllowed: vi.fn(async () => undefined),
      recordVerificationFailure: vi.fn(async () => undefined),
    };
    const handler = createCustomerAuthHandler({
      handle,
      rateLimiter,
      clientIpHeader: "x-client-ip",
      trustedProxies: [],
      now: () => 103,
    });

    const spoofed = await handler(
      request(
        "/phone-number/send-otp",
        { phoneNumber: "09123456789" },
        "198.51.100.2, 203.0.113.1",
      ),
    );
    expect(spoofed.status).toBe(400);

    const limited = await handler(
      request("/phone-number/send-otp", { phoneNumber: "09123456789" }),
    );
    expect(limited.status).toBe(429);
    await expect(limited.json()).resolves.toEqual({
      code: "AUTH_REQUEST_FAILED",
    });

    for (const path of [
      "/sign-up/email",
      "/sign-in/email",
      "/reset-password/arbitrary-token",
      "/sign-in/phone-number",
      "/phone-number/request-password-reset",
      "/phone-number/reset-password",
    ]) {
      const response = await handler(request(path, {}));
      expect(response.status, path).toBe(404);
    }
    expect(handle).not.toHaveBeenCalled();
  });

  it("walks a trusted proxy chain from the ingress side", async () => {
    const handle = vi.fn(async () => Response.json({ ok: true }));
    const rateLimiter = {
      assertSendAllowed: vi.fn(async () => undefined),
      assertVerificationAllowed: vi.fn(async () => undefined),
      recordVerificationFailure: vi.fn(async () => undefined),
    };
    const handler = createCustomerAuthHandler({
      handle,
      rateLimiter,
      clientIpHeader: "x-client-ip",
      trustedProxies: ["10.0.0.0/8", "192.0.2.10/32"],
      now: () => 104,
    });

    const response = await handler(
      request(
        "/phone-number/send-otp",
        { phoneNumber: "09123456789" },
        "198.51.100.9, 203.0.113.8, 10.0.0.3, 192.0.2.10",
      ),
    );

    expect(response.status).toBe(200);
    expect(rateLimiter.assertSendAllowed).toHaveBeenCalledWith({
      phone: "+989123456789",
      ip: "203.0.113.8",
      now: 104,
    });
  });

  it("uses the explicit loopback fallback only for local development", async () => {
    const handle = vi.fn(async () => Response.json({ ok: true }));
    const rateLimiter = {
      assertSendAllowed: vi.fn(async () => undefined),
      assertVerificationAllowed: vi.fn(async () => undefined),
      recordVerificationFailure: vi.fn(async () => undefined),
    };
    const handler = createCustomerAuthHandler({
      handle,
      rateLimiter,
      clientIpHeader: "x-client-ip",
      trustedProxies: [],
      fallbackClientIp: "127.0.0.1",
      now: () => 105,
    });
    const localRequest = request("/phone-number/send-otp", {
      phoneNumber: "09123456789",
    });
    localRequest.headers.delete("x-client-ip");

    expect((await handler(localRequest)).status).toBe(200);
    expect(rateLimiter.assertSendAllowed).toHaveBeenCalledWith({
      phone: "+989123456789",
      ip: "127.0.0.1",
      now: 105,
    });
  });
});
