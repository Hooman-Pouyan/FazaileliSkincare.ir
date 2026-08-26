import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/query/query-provider";
import { CartDrawer } from "@/modules/cart/components/cart-drawer";
import { CartStoreProvider } from "@/modules/cart/cart.store-provider";
import { BottomNavigation } from "./bottom-navigation";
import { CommandPalette } from "./command-palette";
import { Rail } from "./rail";
import { SiteFooter } from "./site-footer";

/**
 * The shared shell every storefront route renders inside.
 *
 * Exactly one interactive navigation reaches assistive technology at a time:
 * the rail is hidden below the breakpoint and the bottom bar above it, so the
 * two are alternatives rather than duplicates (`SHELL-02`).
 *
 * Content reserves the rail's width with a logical property, so it mirrors with
 * the document instead of needing a Persian and an English rule.
 *
 * The two client boundaries live here rather than in the root layout, and that
 * is deliberate. `QueryProvider` is bounded to the storefront because
 * `data-and-state-ownership.md` refuses to let PLP, PDP, SEO and server-owned
 * facets become Query reads *"merely for consistency"* — they stay server
 * rendered, which is the site's competitive argument. What crosses this
 * boundary is the cart, which the drawer must keep in step across navigations.
 *
 * The drawer is mounted once, here, for the same reason: it outlives every
 * route, so it belongs to the shell rather than to whichever page happened to
 * open it.
 */
export function StorefrontShell({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <QueryProvider>
      <CartStoreProvider>
        <div className="min-h-svh bg-[color:var(--ground)]">
          <div className="hidden md:block">
            <Rail />
          </div>

          <div className="flex min-h-svh flex-col pb-20 md:pb-0 md:ps-14">
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>

          <BottomNavigation />
          <CommandPalette />
          <CartDrawer />
        </div>
      </CartStoreProvider>
    </QueryProvider>
  );
}
