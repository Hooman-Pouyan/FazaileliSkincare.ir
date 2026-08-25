"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";

/**
 * Signing out is a server-owned cookie change, so the client asks and then
 * refreshes rather than clearing anything itself — there is nothing in the
 * browser to clear, which is the point of an httpOnly session.
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
