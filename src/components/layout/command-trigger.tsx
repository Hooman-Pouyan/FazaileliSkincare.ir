"use client";

import type { ReactNode } from "react";
import { useCommandPalette } from "./command-palette-context";

/**
 * Opens the command palette. It is a real button rather than a link because it
 * opens something rather than going somewhere, and assistive technology should
 * hear the difference.
 */
export function CommandTrigger({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  const { open } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={open}
      title={label}
      aria-haspopup="dialog"
      className="grid size-11 place-items-center text-[color:var(--stone)]"
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
