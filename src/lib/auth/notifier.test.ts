import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FakeOtpNotifier,
  KavenegarOtpNotifier,
  NotifierInputError,
  SmsDeliveryError,
  type OtpDeliveryLog,
} from "./notifier";

const PHONE = "+989123456789";
const OTP = "123456";

afterEach(() => {
  vi.useRealTimers();
});

describe("fake OTP notifier", () => {
  it("normalizes delivery input but logs only a redacted result", async () => {
    const logs: OtpDeliveryLog[] = [];
    const notifier = new FakeOtpNotifier((event) => logs.push(event));

    const result = await notifier.sendOtp({ phone: "۰۹۱۲۳۴۵۶۷۸۹", otp: OTP });

    expect(result).toEqual({ provider: "fake", status: "accepted" });
    expect(notifier.deliveries).toEqual([{ phone: PHONE, otp: OTP }]);
    expect(logs).toEqual([
      {
        event: "otp_delivery",
        provider: "fake",
        recipient: "+98******6789",
        status: "accepted",
      },
    ]);
    expect(JSON.stringify(logs)).not.toContain(PHONE);
    expect(JSON.stringify(logs)).not.toContain(OTP);
  });
});

describe("Kavenegar OTP notifier", () => {
  it("posts the normalized phone and OTP through VerifyLookup", async () => {
    const logs: OtpDeliveryLog[] = [];
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          return: { status: 200, message: "accepted" },
          entries: [{ messageid: 42 }],
        }),
        { status: 200 },
      ),
    );
    const notifier = new KavenegarOtpNotifier({
      apiKey: "test-api-key",
      template: "login",
      fetchImplementation,
      log: (event) => logs.push(event),
    });

    const result = await notifier.sendOtp({ phone: "09123456789", otp: OTP });

    expect(result).toEqual({ provider: "kavenegar", status: "accepted" });
    expect(fetchImplementation).toHaveBeenCalledOnce();
    const [request, init] = fetchImplementation.mock.calls[0] ?? [];
    expect(String(request)).toBe(
      "https://api.kavenegar.com/v1/test-api-key/verify/lookup.json",
    );
    expect(init?.method).toBe("POST");
    expect(new URLSearchParams(String(init?.body))).toEqual(
      new URLSearchParams({ receptor: PHONE, token: OTP, template: "login" }),
    );
    expect(logs).toEqual([
      {
        event: "otp_delivery",
        provider: "kavenegar",
        recipient: "+98******6789",
        status: "accepted",
      },
    ]);
  });

  it("maps provider failures to one error without leaking provider data", async () => {
    const logs: OtpDeliveryLog[] = [];
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          return: {
            status: 429,
            message: `rejected ${PHONE} ${OTP} test-api-key`,
          },
          entries: [],
        }),
        { status: 429 },
      ),
    );
    const notifier = new KavenegarOtpNotifier({
      apiKey: "test-api-key",
      template: "login",
      fetchImplementation,
      log: (event) => logs.push(event),
    });

    const delivery = notifier.sendOtp({ phone: PHONE, otp: OTP });

    await expect(delivery).rejects.toMatchObject({
      code: "SMS_DELIVERY_FAILED",
      message: "SMS_DELIVERY_FAILED",
    });
    expect(logs).toEqual([
      {
        event: "otp_delivery",
        provider: "kavenegar",
        recipient: "+98******6789",
        status: "failed",
      },
    ]);
    const serializedLogs = JSON.stringify(logs);
    expect(serializedLogs).not.toContain(PHONE);
    expect(serializedLogs).not.toContain(OTP);
    expect(serializedLogs).not.toContain("test-api-key");
  });

  it("aborts provider delivery at the ten-second boundary", async () => {
    vi.useFakeTimers();
    const fetchImplementation = vi.fn<typeof fetch>(
      (_request, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("provider details", "AbortError")),
            { once: true },
          );
        }),
    );
    const notifier = new KavenegarOtpNotifier({
      apiKey: "test-api-key",
      template: "login",
      fetchImplementation,
    });

    const delivery = notifier.sendOtp({ phone: PHONE, otp: OTP });
    const rejection = expect(delivery).rejects.toBeInstanceOf(SmsDeliveryError);
    await vi.advanceTimersByTimeAsync(9_999);
    expect(fetchImplementation.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    await rejection;
  });

  it("rejects malformed OTP input before contacting the provider", async () => {
    const fetchImplementation = vi.fn<typeof fetch>();
    const notifier = new KavenegarOtpNotifier({
      apiKey: "test-api-key",
      template: "login",
      fetchImplementation,
    });

    await expect(
      notifier.sendOtp({ phone: PHONE, otp: "12345" }),
    ).rejects.toBeInstanceOf(NotifierInputError);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });
});
