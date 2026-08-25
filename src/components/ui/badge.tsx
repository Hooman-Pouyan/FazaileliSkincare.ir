import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Used sparingly: «موجود» · «حرفه‌ای» · «ظرفیت محدود».
 * NO discount badges on product tiles — see docs/08-competitive-research.md.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-[var(--radius-control)] border px-3 py-1 text-[12px] font-medium",
  {
    variants: {
      variant: {
        default:
          "border-[var(--hairline)] bg-transparent text-[var(--gold-text)]",
        stock: "border-transparent bg-transparent text-[var(--teal)] p-0",
        professional:
          "border-[var(--hairline-soft)] bg-transparent text-[var(--stone-text)]",
        onDark:
          "border-[var(--gold-light)] bg-transparent text-[var(--champagne)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
