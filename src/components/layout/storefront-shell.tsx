import type { ReactNode } from "react";
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
 */
export function StorefrontShell({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
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
    </div>
  );
}
