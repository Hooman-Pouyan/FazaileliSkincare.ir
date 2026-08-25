import { after } from "next/server";
import { db } from "@/lib/db";
import { createAuthRuntime } from "./auth-runtime";
import { createOtpNotifier } from "./notifier";
import { resolveAuthRuntimeConfig } from "./runtime-config";

const config = resolveAuthRuntimeConfig(process.env);
const runtime = createAuthRuntime({
  database: db,
  config,
  notifier: createOtpNotifier(config.sms),
  scheduleBackground: (promise) => {
    after(async () => {
      await promise;
    });
  },
});

export const authHandler = runtime.handler;
export const getSession = runtime.getSession;
