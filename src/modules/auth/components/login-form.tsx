"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { safeReturnTo } from "../models/return-to";
import {
  loginSchema,
  type LoginValues,
  type ParsedLoginValues,
} from "../models/auth.schemas";
import type { AuthCopy } from "../screens/auth-screen";

export const pendingPhoneStorageKey = "fazaieli.auth.pending-phone";

/**
 * Where to go once the code is verified — `Phase D`.
 *
 * Carried in `sessionStorage` beside the phone rather than through the URL,
 * because `/verify` is reached by a client navigation and a query string there
 * would survive in history after the code was used. It is validated on the way
 * in *and* on the way out: `safeReturnTo` is cheap, and an open redirect is not
 * a bug worth trusting one check with.
 */
export const pendingReturnStorageKey = "fazaieli.auth.pending-return";

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
      sessionStorage.setItem(
        pendingReturnStorageKey,
        safeReturnTo(new URLSearchParams(window.location.search).get("next")),
      );
      router.push("/verify");
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
      className="grid gap-8"
      onSubmit={handleSubmit(onSubmit)}
      aria-busy={isSubmitting}
      noValidate
    >
      <div className="grid gap-2">
        <Label htmlFor="auth-phone">{copy.phoneLabel}</Label>
        <Input
          id="auth-phone"
          className="[direction:ltr] text-start"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={copy.phonePlaceholder}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={describedBy}
          disabled={isSubmitting}
          {...register("phone")}
        />
        <p
          id="auth-phone-hint"
          className="m-0 text-[length:var(--text-micro)] leading-[1.9] text-stone-text"
        >
          {copy.phoneHint}
        </p>
        {errors.phone ? (
          <p
            id="auth-phone-error"
            className="m-0 text-[length:var(--text-small)] leading-[1.7] text-danger"
            role="alert"
          >
            {copy.phoneError}
          </p>
        ) : null}
      </div>

      {requestError ? (
        <p
          className="m-0 text-[length:var(--text-small)] leading-[1.7] text-danger"
          role="alert"
          aria-live="assertive"
        >
          {copy.genericError}
        </p>
      ) : null}

      <Button
        className="w-full"
        size="lg"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? copy.sendingCode : copy.sendCode}
      </Button>
    </form>
  );
}
