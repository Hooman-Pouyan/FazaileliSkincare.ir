"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The cart is a sheet. `side="start"|"end"` are LOGICAL — they follow the
 * document direction, so the cart opens from the correct edge in both locales
 * with no second stylesheet. No shadow: a hairline edge and a scrim instead.
 */
function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}
const SheetTrigger = (
  p: React.ComponentProps<typeof SheetPrimitive.Trigger>,
) => <SheetPrimitive.Trigger data-slot="sheet-trigger" {...p} />;
const SheetClose = (p: React.ComponentProps<typeof SheetPrimitive.Close>) => (
  <SheetPrimitive.Close data-slot="sheet-close" {...p} />
);

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-[color-mix(in_oklab,var(--ink)_38%,transparent)]",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "end",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "start" | "end" | "top" | "bottom";
}) {
  return (
    <SheetPrimitive.Portal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-[var(--surface)] transition-transform ease-[var(--easing)]",
          side === "end" &&
            "inset-block-0 inset-inline-end-0 h-full w-4/5 max-w-md border-s border-[var(--hairline)]",
          side === "start" &&
            "inset-block-0 inset-inline-start-0 h-full w-4/5 max-w-md border-e border-[var(--hairline)]",
          side === "bottom" &&
            "inset-inline-0 bottom-0 h-auto rounded-t-[var(--radius-surface)] border-t border-[var(--hairline)]",
          side === "top" &&
            "inset-inline-0 top-0 h-auto border-b border-[var(--hairline)]",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          className="absolute top-5 inset-inline-end-5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-[var(--firouzeh-text)]"
          aria-label="بستن"
        >
          <XIcon className="size-5" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

const SheetHeader = ({ className, ...p }: React.ComponentProps<"div">) => (
  <div
    data-slot="sheet-header"
    className={cn("flex flex-col gap-1.5 p-6 pb-2", className)}
    {...p}
  />
);
const SheetFooter = ({ className, ...p }: React.ComponentProps<"div">) => (
  <div
    data-slot="sheet-footer"
    className={cn("mt-auto flex flex-col gap-2 p-6", className)}
    {...p}
  />
);
const SheetTitle = ({
  className,
  ...p
}: React.ComponentProps<typeof SheetPrimitive.Title>) => (
  <SheetPrimitive.Title
    data-slot="sheet-title"
    className={cn("text-lg font-bold text-[var(--ink)]", className)}
    {...p}
  />
);
const SheetDescription = ({
  className,
  ...p
}: React.ComponentProps<typeof SheetPrimitive.Description>) => (
  <SheetPrimitive.Description
    data-slot="sheet-description"
    className={cn("text-[14px] text-[var(--stone-text)]", className)}
    {...p}
  />
);

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
