import { cn } from "@/lib/utils";

/**
 * Page gutter. The rail occupies 56px at the inline-start edge, so main
 * content is offset with `ms-14` at the layout level, not here.
 */
export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1440px] px-6 md:px-12 lg:px-20", className)} {...props} />;
}

/**
 * Vertical rhythm. --space-9 (96px) is the MINIMUM between sections on desktop;
 * crowding is what kills this look. `tone="lapis"` is the dark band where gold,
 * firouzeh and champagne finally pass contrast.
 */
export function Section({
  className,
  tone = "ground",
  bleed = false,
  ...props
}: React.ComponentProps<"section"> & { tone?: "ground" | "surface" | "lapis"; bleed?: boolean }) {
  return (
    <section
      data-tone={tone}
      className={cn(
        "py-[var(--space-9)]",
        tone === "surface" && "bg-[var(--surface)]",
        tone === "lapis" && "bg-[var(--ink)] text-[var(--sand)]",
        bleed && "py-0",
        className,
      )}
      {...props}
    />
  );
}

/** A gold hairline. Separation comes from these, never from shadows. */
export function Rule({ className, tone = "gold" }: { className?: string; tone?: "gold" | "soft" }) {
  return (
    <hr
      className={cn("h-px border-0", tone === "gold" ? "bg-[var(--hairline)]" : "bg-[var(--hairline-soft)]", className)}
      aria-hidden
    />
  );
}
