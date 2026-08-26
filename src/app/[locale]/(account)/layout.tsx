import type { ReactNode } from "react";
import { Density } from "@/components/layout/density";

/**
 * Account is an operating surface — `D-1`'s third row. It sits in its own route
 * group with its own shell, so the density scope is applied here rather than
 * inherited from the storefront.
 */
export default function AccountLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <Density>{children}</Density>;
}
