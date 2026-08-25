"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";

/**
 * Signing out is a server-owned cookie change, so the client asks and then
 * refreshes rather than clearing anything itself — there is nothing in the
 * browser to clear, which is the point of an httpOnly session.
 *
 * The router comes from `@/i18n/navigation`, so `/` lands on the reader's own
 * locale. The raw Next router sent an English or Arabic customer to the Persian
 * landing page on sign-out.
 */
export function SignOutButton({ label }: { readonly label: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await authClient.signOut();
          router.replace("/");
          router.refresh();
        });
      }}
      className="w-fit"
    >
      {label}
    </Button>
  );
}
