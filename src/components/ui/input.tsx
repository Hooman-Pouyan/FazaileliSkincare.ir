import * as React from "react";
import { cn } from "@/lib/utils";

/** Visible <Label> above. Never placeholder-as-label. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full rounded-[var(--radius-control)] border border-[var(--hairline-soft)] bg-[var(--ground)] px-4 py-2 text-[15px] outline-none transition-colors",
        "placeholder:text-[var(--stone-text)]",
        "focus-visible:border-[var(--firouzeh-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--firouzeh-text)]",
        "aria-invalid:border-[var(--danger)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
