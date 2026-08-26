import type { ReactNode } from "react";
import { Density } from "@/components/layout/density";

/**
 * Every shop surface is compact — `docs/33-density-decisions.md`, `D-4`.
 *
 * The hub, every listing and the product page sit under this. The Landing is a
 * sibling of this segment, not a child, so it is untouched and stays editorial
 * — which is exactly the boundary the decision draws.
 */
export default function ShopLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <Density>{children}</Density>;
}
