import { after } from "next/server";
import { db } from "@/lib/db";
import { createAuthRuntime } from "./auth-runtime";
import {
  createOtpNotifier,
  type OtpDeliveryLog,
  type OtpDeliveryRequest,
} from "./notifier";
import { resolveAuthRuntimeConfig } from "./runtime-config";

const config = resolveAuthRuntimeConfig(process.env);
const development = process.env.NODE_ENV !== "production";

/** Masked, OTP-free, and safe in every environment. */
function logDelivery(event: OtpDeliveryLog): void {
  console.info(JSON.stringify(event));
}

/**
 * Development only, and only reachable when SMS_PROVIDER="fake" — which
 * `resolveAuthRuntimeConfig` rejects under NODE_ENV=production. Prints the code
 * to the dev server console so a local sign-in can complete without SMS.
 */
function revealOtpForDevelopment({ phone, otp }: OtpDeliveryRequest): void {
  console.info(
    `\n  ┌─ dev OTP ─────────────────\n  │  ${phone}  →  ${otp}\n  └───────────────────────────\n`,
  );
}

const runtime = createAuthRuntime({
  database: db,
  config,
  notifier: createOtpNotifier(
    config.sms,
    logDelivery,
    development ? revealOtpForDevelopment : undefined,
  ),
  scheduleBackground: (promise) => {
    after(async () => {
      await promise;
    });
  },
});

export const authHandler = runtime.handler;
export const getSession = runtime.getSession;
