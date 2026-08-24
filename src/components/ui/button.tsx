import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * shadcn/ui button, restyled through our tokens.
 *
 * Primary is INK on SAND — not lapis. Lapis and firouzeh are *fields*, not
 * fills behind text (they fail contrast on light ground). See docs/10.
 * Radius is 2px, never rounded-full. Min height 44px for touch.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] text-[15px] font-medium outline-none transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--firouzeh-text)] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[var(--ink)] text-[var(--sand)] hover:bg-[var(--lapis)]",
        outline:
          "border border-[var(--hairline-soft)] bg-transparent text-[var(--ink)] hover:border-[var(--gold)]",
        ghost:
          "rounded-none border-b border-transparent bg-transparent text-[var(--ink)] hover:border-[var(--gold)]",
        onDark:
          "border border-[var(--gold-light)] bg-transparent text-[var(--champagne)] hover:bg-[var(--lapis)]",
        destructive:
          "bg-[var(--danger)] text-[var(--surface)] hover:opacity-90",
        link: "bg-transparent p-0 text-[var(--firouzeh-text)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-7",
        sm: "h-11 px-5 text-[14px]",
        lg: "h-13 px-10 text-[16px]",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
