import { cn } from "@/lib/utils";

/** Reserve space. CLS below 0.1 is a delivery requirement, not a nicety. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse bg-[color-mix(in_oklab,var(--ink)_7%,var(--ground))]", className)}
      {...props}
    />
  );
}

export { Skeleton };
