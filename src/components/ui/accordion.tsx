"use client";

import * as React from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PDP progressive disclosure: ترکیبات / روش استفاده / برای چه پوستی / اصالت.
 * Accordion, never tabs — tabs hide content from crawlers and from a reader
 * who is simply scrolling.
 */
const Accordion = (p: React.ComponentProps<typeof AccordionPrimitive.Root>) => (
  <AccordionPrimitive.Root data-slot="accordion" {...p} />
);

const AccordionItem = ({ className, ...p }: React.ComponentProps<typeof AccordionPrimitive.Item>) => (
  <AccordionPrimitive.Item data-slot="accordion-item" className={cn("border-b border-[var(--hairline-soft)]", className)} {...p} />
);

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-start justify-between gap-4 py-6 text-start text-[19px] font-bold outline-none transition-all",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--firouzeh-text)]",
          "[&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="pointer-events-none size-5 shrink-0 translate-y-0.5 text-[var(--gold)] transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("pb-6 text-[16px] leading-[2.05] text-[color-mix(in_oklab,var(--ink)_78%,transparent)]", className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
