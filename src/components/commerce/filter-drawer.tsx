"use client";
import * as React from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Mobile facets. Iranian beauty traffic is overwhelmingly mobile, so the rail
 * becomes a sheet below lg — never a cramped inline accordion.
 */
export function FilterDrawer({
  activeCount = 0,
  resultCount,
  children,
  className,
}: {
  activeCount?: number;
  resultCount?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("lg:hidden", className)}
        >
          <SlidersHorizontalIcon />
          فیلترها
          {activeCount > 0 && (
            <span className="tabular-nums">({activeCount})</span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="end" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>فیلترها</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6">{children}</div>
        <SheetFooter>
          <SheetClose asChild>
            <Button className="w-full">
              نمایش {resultCount != null ? `${resultCount} ` : ""}محصول
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
