import type { ReactNode } from "react";
import { Density } from "@/components/layout/density";

/**
 * The cart is a working surface, not an editorial one — `D-1`. Someone here is
 * checking quantities and a total, and the air that suits a Landing gets in the
 * way of that.
 */
export default function CartLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <Density>{children}</Density>;
}
