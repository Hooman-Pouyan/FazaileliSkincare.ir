import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Extend with cva variants — never inline conditional classes.
 * Primary is INK on SAND, not lapis: fields are not fills behind text.
 * Radius is 2px. Never rounded-full. Min height 44px (touch target).
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] text-[15px] font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--firouzeh-text)]",
  {
    variants: {
      variant: {
        primary: "bg-[var(--ink)] text-[var(--sand)] hover:bg-[var(--lapis)]",
        secondary: "bg-transparent text-[var(--ink)] border border-[var(--hairline-soft)] hover:border-[var(--gold)]",
        ghost: "bg-transparent text-[var(--ink)] border-b border-transparent hover:border-[var(--gold)] rounded-none",
        onDark: "bg-transparent text-[var(--champagne)] border border-[var(--gold-light)] hover:bg-[var(--lapis)]",
      },
      size: {
        default: "h-11 px-7",
        sm: "h-11 px-5 text-[14px]",
        lg: "h-13 px-10 text-[16px]",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
