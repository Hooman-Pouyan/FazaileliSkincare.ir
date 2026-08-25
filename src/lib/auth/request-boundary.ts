import { BlockList, isIP } from "node:net";
import { normalizeIranianPhone } from "./phone";
import { AuthRateLimitExceededError } from "./rate-limiter";
import { AUTH_DISABLED_PATHS } from "./runtime-config";

type CustomerRateLimiter = Readonly<{
  assertSendAllowed(input: {
    phone: string;
    ip: string;
    now: number;
  }): Promise<void>;
  assertVerificationAllowed(input: {
    phone: string;
    ip: string;
    now: number;
  }): Promise<void>;
  recordVerificationFailure(input: {
    phone: string;
    ip: string;
    now: number;
  }): Promise<void>;
}>;

export function createCustomerAuthHandler(_options: {
  handle(request: Request): Promise<Response>;
  rateLimiter: CustomerRateLimiter;
  clientIpHeader: string;
  trustedProxies: readonly string[];
  fallbackClientIp?: string;
  now?: () => number;
}): (request: Request) => Promise<Response> {
  const now = _options.now ?? (() => Math.floor(Date.now() / 1_000));
  const trustedProxies = new BlockList();
  for (const entry of _options.trustedProxies) {
    const [address, prefix] = entry.split("/");
    const family = address ? isIP(address) : 0;
    if (!address || !family) continue;
    const type = family === 4 ? "ipv4" : "ipv6";
    if (prefix === undefined) trustedProxies.addAddress(address, type);
    else trustedProxies.addSubnet(address, Number(prefix), type);
  }

  const resolveClientIp = (value: string): string | null => {
    const forwarded = value
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);
    if (forwarded.length === 0) return null;
    if (_options.trustedProxies.length === 0) {
      const direct = forwarded.length === 1 ? forwarded[0] : undefined;
      return direct && isIP(direct) ? direct : null;
    }
    for (let index = forwarded.length - 1; index >= 0; index -= 1) {
      const ip = forwarded[index];
      const family = ip ? isIP(ip) : 0;
      if (!ip || !family) return null;
      if (trustedProxies.check(ip, family === 4 ? "ipv4" : "ipv6")) continue;
      return ip;
    }
    return null;
  };

  return async (request) => {
    const path = new URL(request.url).pathname.replace(/^\/api\/auth/u, "");
    if (
      AUTH_DISABLED_PATHS.includes(
        path as (typeof AUTH_DISABLED_PATHS)[number],
      ) ||
      path.startsWith("/reset-password/")
    ) {
      return new Response("Not Found", { status: 404 });
    }

    const isSend = path === "/phone-number/send-otp";
    const isVerify = path === "/phone-number/verify";
    if (!isSend && !isVerify) return _options.handle(request);

    const publicFailure = (status: number) =>
      Response.json({ code: "AUTH_REQUEST_FAILED" }, { status });

    try {
      const headerValue = request.headers.get(_options.clientIpHeader)?.trim();
      const ip = headerValue
        ? resolveClientIp(headerValue)
        : (_options.fallbackClientIp ?? null);
      if (!ip) return publicFailure(400);
      if (
        !request.headers.get("content-type")?.startsWith("application/json")
      ) {
        return publicFailure(400);
      }

      const body: unknown = await request.json();
      if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return publicFailure(400);
      }
      const phoneValue = (body as Record<string, unknown>).phoneNumber;
      if (typeof phoneValue !== "string") return publicFailure(400);
      const phone = normalizeIranianPhone(phoneValue);
      const code = (body as Record<string, unknown>).code;
      if (isVerify && typeof code !== "string") return publicFailure(400);
      const input = { phone, ip, now: now() };

      if (isSend) await _options.rateLimiter.assertSendAllowed(input);
      else await _options.rateLimiter.assertVerificationAllowed(input);

      const headers = new Headers(request.headers);
      headers.delete("content-length");
      const forwarded = new Request(request.url, {
        method: request.method,
        headers,
        body: JSON.stringify(
          isSend ? { phoneNumber: phone } : { phoneNumber: phone, code },
        ),
        signal: request.signal,
      });
      const response = await _options.handle(forwarded);

      if (!response.ok) {
        if (isVerify && response.status < 500) {
          await _options.rateLimiter.recordVerificationFailure(input);
        }
        return publicFailure(response.status >= 500 ? 503 : 400);
      }

      return new Response(JSON.stringify({ status: true }), {
        status: response.status,
        headers: response.headers,
      });
    } catch (error) {
      if (error instanceof AuthRateLimitExceededError) {
        return publicFailure(429);
      }
      return publicFailure(400);
    }
  };
}
