"use client";

import { Direction } from "radix-ui";

/**
 * Radix reads direction from context, not from the DOM. Without this, menus,
 * sheets and sliders open from the wrong edge in Persian even though the CSS
 * is correct — a bug that is invisible until someone actually uses the site.
 */
export function DirectionProvider({
  dir,
  children,
}: {
  dir: "rtl" | "ltr";
  children: React.ReactNode;
}) {
  return <Direction.DirectionProvider dir={dir}>{children}</Direction.DirectionProvider>;
}
