"use client";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";

const Collapsible = (
  p: React.ComponentProps<typeof CollapsiblePrimitive.Root>,
) => <CollapsiblePrimitive.Root data-slot="collapsible" {...p} />;
const CollapsibleTrigger = (
  p: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>,
) => (
  <CollapsiblePrimitive.CollapsibleTrigger
    data-slot="collapsible-trigger"
    {...p}
  />
);
const CollapsibleContent = (
  p: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>,
) => (
  <CollapsiblePrimitive.CollapsibleContent
    data-slot="collapsible-content"
    {...p}
  />
);
export { Collapsible, CollapsibleTrigger, CollapsibleContent };
