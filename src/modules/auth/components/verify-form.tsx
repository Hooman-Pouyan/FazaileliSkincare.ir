"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import {
  verifySchema,
  type ParsedVerifyValues,
  type VerifyValues,
} from "../models/auth.schemas";
import type { AuthCopy } from "../screens/auth-screen";
import styles from "../auth-screen.module.css";
import { pendingPhoneStorageKey } from "./login-form";

export function VerifyForm({
  copy,
  locale,
}: {
  copy: AuthCopy;
  locale: string;
}) {
  const router = useRouter();
  const phone = useSyncExternalStore(
    () => () => undefined,
    () => sessionStorage.getItem(pendingPhoneStorageKey),
    () => undefined,
  );
  const [requestError, setRequestError] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyValues, unknown, ParsedVerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: "" },
  });

  const returnToLogin = () => {
    sessionStorage.removeItem(pendingPhoneStorageKey);
    router.push(`/${locale}/login`);
  };

  const onSubmit = async ({ code }: ParsedVerifyValues) => {
    if (!phone) return;
    setRequestError(false);
    try {
      const result = await authClient.phoneNumber.verify({
        phoneNumber: phone,
        code,
      });
      if (result.error) throw new Error("AUTH_REQUEST_FAILED");
      sessionStorage.removeItem(pendingPhoneStorageKey);
      router.replace(`/${locale}`);
      router.refresh();
    } catch {
      setRequestError(true);
    }
  };

  if (phone === undefined) {
    return <div aria-live="polite" aria-busy="true" />;
  }

  if (phone === null) {
    return (
      <div className={styles.missing} role="status">
        <p className={styles.intro}>{copy.missingPhone}</p>
        <Button type="button" onClick={returnToLogin}>
          {copy.returnToLogin}
        </Button>
      </div>
    );
  }

  const describedBy = [
    "auth-code-hint",
    errors.code ? "auth-code-error" : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onSubmit)}
      aria-busy={isSubmitting}
      noValidate
    >
      <div className={styles.field}>
        <Label htmlFor="auth-code">{copy.codeLabel}</Label>
        <Input
          id="auth-code"
          className={styles.codeInput}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          enterKeyHint="done"
          maxLength={6}
          aria-invalid={Boolean(errors.code)}
          aria-describedby={describedBy}
          disabled={isSubmitting}
          {...register("code")}
        />
        <p id="auth-code-hint" className={styles.hint}>
          {copy.codeHint}
        </p>
        {errors.code ? (
          <p id="auth-code-error" className={styles.error} role="alert">
            {copy.codeError}
          </p>
        ) : null}
      </div>

      {requestError ? (
        <p className={styles.error} role="alert" aria-live="assertive">
          {copy.invalidCode}
        </p>
      ) : null}

      <Button
        className={styles.submit}
        size="lg"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? copy.verifyingCode : copy.verifyCode}
      </Button>
      <Button
        className={styles.secondaryAction}
        type="button"
        variant="link"
        onClick={returnToLogin}
        disabled={isSubmitting}
      >
        {copy.changePhone}
      </Button>
    </form>
  );
}
