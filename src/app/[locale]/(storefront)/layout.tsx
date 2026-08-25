import type { ReactNode } from "react";
import { StorefrontShell } from "@/components/layout/storefront-shell";

/**
 * Every storefront route renders inside the shared shell. The auth screens sit
 * in their own group deliberately: a full-bleed sign-in has no rail, no footer
 * and nowhere to navigate to until the customer is through it.
 */
export default function StorefrontLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
