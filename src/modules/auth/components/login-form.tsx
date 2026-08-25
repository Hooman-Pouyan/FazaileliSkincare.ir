"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import {
  loginSchema,
  type LoginValues,
  type ParsedLoginValues,
} from "../models/auth.schemas";
import type { AuthCopy } from "../screens/auth-screen";
import styles from "../auth-screen.module.css";

export const pendingPhoneStorageKey = "fazaieli.auth.pending-phone";

export function LoginForm({
  copy,
  locale,
}: {
  copy: AuthCopy;
  locale: string;
}) {
  const router = useRouter();
  const [requestError, setRequestError] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues, unknown, ParsedLoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "" },
  });

  const onSubmit = async ({ phone }: ParsedLoginValues) => {
    setRequestError(false);
    try {
      const result = await authClient.phoneNumber.sendOtp({
        phoneNumber: phone,
      });
      if (result.error) throw new Error("AUTH_REQUEST_FAILED");
      sessionStorage.setItem(pendingPhoneStorageKey, phone);
      router.push(`/${locale}/verify`);
    } catch {
      setRequestError(true);
    }
  };

  const describedBy = [
    "auth-phone-hint",
    errors.phone ? "auth-phone-error" : undefined,
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
        <Label htmlFor="auth-phone">{copy.phoneLabel}</Label>
        <Input
          id="auth-phone"
          className={styles.phoneInput}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={copy.phonePlaceholder}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={describedBy}
          disabled={isSubmitting}
          {...register("phone")}
        />
        <p id="auth-phone-hint" className={styles.hint}>
          {copy.phoneHint}
        </p>
        {errors.phone ? (
          <p id="auth-phone-error" className={styles.error} role="alert">
            {copy.phoneError}
          </p>
        ) : null}
      </div>

      {requestError ? (
        <p className={styles.error} role="alert" aria-live="assertive">
          {copy.genericError}
        </p>
      ) : null}

      <Button
        className={styles.submit}
        size="lg"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? copy.sendingCode : copy.sendCode}
      </Button>
    </form>
  );
}
