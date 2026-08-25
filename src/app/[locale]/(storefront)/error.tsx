"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { RouteState } from "@/components/layout/route-state";

/**
 * Operational failures only. A database outage reaches here rather than
 * rendering as an empty catalogue, which is how a shop quietly stops selling.
 *
 * `digest` is Next's opaque reference for the server-side error. It is shown so
 * a customer can quote it and staff can find the log line, and it carries no
 * detail of its own — the message itself never reaches the browser.
 */
export default function StorefrontError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const t = useTranslations("states");

  return (
    <RouteState
      title={t("errorTitle")}
      body={t("errorBody")}
      action={
        <Button type="button" onClick={reset}>
          {t("retry")}
        </Button>
      }
      reference={
        error.digest ? `${t("reference")}: ${error.digest}` : undefined
      }
    />
  );
}
