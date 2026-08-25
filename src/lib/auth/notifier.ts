import { maskIranianPhone, normalizeIranianPhone } from "./phone";
import { AUTH_OTP_POLICY } from "./rate-limit-key";
import type { SmsConfig } from "./runtime-config";

export type OtpDeliveryLog = Readonly<{
  event: "otp_delivery";
  provider: "fake" | "kavenegar";
  recipient: string;
  status: "accepted" | "failed";
}>;

export type OtpDeliveryRequest = Readonly<{ phone: string; otp: string }>;
export type OtpDeliveryResult = Readonly<{
  provider: "fake" | "kavenegar";
  status: "accepted";
}>;
type OtpDeliveryLogger = (event: OtpDeliveryLog) => void;

export interface OtpNotifier {
  sendOtp(input: OtpDeliveryRequest): Promise<OtpDeliveryResult>;
}

export class NotifierInputError extends Error {
  readonly code = "INVALID_OTP";

  constructor() {
    super("INVALID_OTP");
    this.name = "NotifierInputError";
  }
}

export class SmsDeliveryError extends Error {
  readonly code = "SMS_DELIVERY_FAILED";

  constructor() {
    super("SMS_DELIVERY_FAILED");
    this.name = "SmsDeliveryError";
  }
}

function assertOtp(otp: string): void {
  const expectedShape = new RegExp(
    `^[0-9]{${AUTH_OTP_POLICY.codeLength}}$`,
    "u",
  );

  if (!expectedShape.test(otp)) throw new NotifierInputError();
}

function logDelivery(
  log: OtpDeliveryLogger | undefined,
  provider: OtpDeliveryLog["provider"],
  phone: string,
  status: OtpDeliveryLog["status"],
): void {
  log?.({
    event: "otp_delivery",
    provider,
    recipient: maskIranianPhone(phone),
    status,
  });
}

export class FakeOtpNotifier implements OtpNotifier {
  readonly deliveries: OtpDeliveryRequest[] = [];

  constructor(private readonly log?: OtpDeliveryLogger) {}

  async sendOtp(input: OtpDeliveryRequest): Promise<OtpDeliveryResult> {
    const phone = normalizeIranianPhone(input.phone);
    assertOtp(input.otp);
    this.deliveries.push({ phone, otp: input.otp });
    logDelivery(this.log, "fake", phone, "accepted");
    return { provider: "fake", status: "accepted" };
  }
}

function isAcceptedKavenegarResponse(input: unknown): boolean {
  if (typeof input !== "object" || input === null) return false;
  if (!("return" in input)) return false;

  const providerResult = input.return;
  return (
    typeof providerResult === "object" &&
    providerResult !== null &&
    "status" in providerResult &&
    providerResult.status === 200
  );
}

export class KavenegarOtpNotifier implements OtpNotifier {
  private readonly fetchImplementation: typeof fetch;

  constructor(
    private readonly options: Readonly<{
      apiKey: string;
      template: string;
      fetchImplementation?: typeof fetch;
      log?: OtpDeliveryLogger;
    }>,
  ) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  async sendOtp(input: OtpDeliveryRequest): Promise<OtpDeliveryResult> {
    const phone = normalizeIranianPhone(input.phone);
    assertOtp(input.otp);

    if (!this.options.apiKey || !this.options.template) {
      throw new SmsDeliveryError();
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const endpoint = `https://api.kavenegar.com/v1/${encodeURIComponent(
      this.options.apiKey,
    )}/verify/lookup.json`;
    const body = new URLSearchParams({
      receptor: phone,
      token: input.otp,
      template: this.options.template,
    });

    try {
      const response = await this.fetchImplementation(endpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        signal: controller.signal,
      });
      const payload: unknown = await response.json();

      if (!response.ok || !isAcceptedKavenegarResponse(payload)) {
        throw new SmsDeliveryError();
      }
    } catch {
      logDelivery(this.options.log, "kavenegar", phone, "failed");
      throw new SmsDeliveryError();
    } finally {
      clearTimeout(timeout);
    }

    logDelivery(this.options.log, "kavenegar", phone, "accepted");
    return { provider: "kavenegar", status: "accepted" };
  }
}

export function createOtpNotifier(
  config: SmsConfig,
  log?: OtpDeliveryLogger,
): OtpNotifier {
  if (config.provider === "fake") return new FakeOtpNotifier(log);
  return new KavenegarOtpNotifier({
    apiKey: config.apiKey,
    template: config.template,
    log,
  });
}
