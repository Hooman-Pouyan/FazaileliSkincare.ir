"use client";

import * as React from "react";
import { Separator as SeparatorPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

/** Hairlines, not shadows. Gold for section rules; ink-soft within components. */
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  tone = "soft",
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root> & {
  tone?: "soft" | "gold";
}) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        tone === "gold" ? "bg-[var(--hairline)]" : "bg-[var(--hairline-soft)]",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
