"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import { useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { mergeGuestCartIntoAccount } from "@/modules/cart/cart.merge";
import {
  verifySchema,
  type ParsedVerifyValues,
  type VerifyValues,
} from "../models/auth.schemas";
import type { AuthCopy } from "../screens/auth-screen";
import { pendingPhoneStorageKey, pendingReturnStorageKey } from "./login-form";
import { safeReturnTo } from "../models/return-to";

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
    sessionStorage.removeItem(pendingReturnStorageKey);
    router.push("/login");
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

      /*
        The one moment a guest cart can become an account's — `COM-D4`.

        Before this line the person is authenticated and still carrying the
        guest cookie, and that overlap is the only window in which the two carts
        exist together. It resolves its own identity from the session and the
        httpOnly cookie, so nothing about either cart crosses from the browser.

        Awaited rather than fired and forgotten: navigating first would race the
        merge against the page that renders the cart, and a customer who signed
        in to buy something should not watch it disappear and reappear.

        It cannot throw the sign-in away. A merge that conflicts leaves both
        carts intact for the customer to resolve, and a merge that fails for any
        other reason must not turn a successful sign-in into an error — they are
        signed in either way, and the cart is recoverable while the cookie is
        still there.
      */
      await mergeGuestCartIntoAccount().catch(() => undefined);

      /*
        Back to where they were going — `Phase D`. Re-validated here rather than
        trusted from storage: the value came from a query string originally, and
        an open redirect is not worth trusting one check with.
      */
      const returnTo = safeReturnTo(
        sessionStorage.getItem(pendingReturnStorageKey),
      );
      sessionStorage.removeItem(pendingReturnStorageKey);

      router.replace(returnTo);
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
      <div className="grid gap-6" role="status">
        <p className="mt-4 max-w-[34rem] text-[length:var(--text-body)] leading-[1.9] text-stone-text">
          {copy.missingPhone}
        </p>
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
      className="grid gap-8"
      onSubmit={handleSubmit(onSubmit)}
      aria-busy={isSubmitting}
      noValidate
    >
      <div className="grid gap-2">
        <Label htmlFor="auth-code">{copy.codeLabel}</Label>
        <Input
          id="auth-code"
          className="[direction:ltr] text-center text-[length:var(--text-h3)] tracking-[0.32em] [font-variant-numeric:tabular-nums]"
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
        <p
          id="auth-code-hint"
          className="m-0 text-[length:var(--text-micro)] leading-[1.9] text-stone-text"
        >
          {copy.codeHint}
        </p>
        {errors.code ? (
          <p
            id="auth-code-error"
            className="m-0 text-[length:var(--text-small)] leading-[1.7] text-danger"
            role="alert"
          >
            {copy.codeError}
          </p>
        ) : null}
      </div>

      {requestError ? (
        <p
          className="m-0 text-[length:var(--text-small)] leading-[1.7] text-danger"
          role="alert"
          aria-live="assertive"
        >
          {copy.invalidCode}
        </p>
      ) : null}

      <Button
        className="w-full"
        size="lg"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? copy.verifyingCode : copy.verifyCode}
      </Button>
      <Button
        className="min-h-12 text-[length:var(--text-small)] text-firouzeh-text underline decoration-[color:var(--hairline)] underline-offset-[0.35em]"
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
