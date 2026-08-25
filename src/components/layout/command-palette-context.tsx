"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Open state for the command palette, shared between the rail trigger, the
 * mobile bar trigger and the dialog itself.
 *
 * Deliberately not a Zustand store: this is one boolean owned by the shell, not
 * coordinated feature state, and `data-and-state-ownership.md` reserves module
 * stores for the latter. The palette's *contents* are static canonical
 * destinations rendered on the server; nothing here holds catalogue data.
 */
type CommandPaletteValue = Readonly<{
  isOpen: boolean;
  open: () => void;
  close: () => void;
}>;

const CommandPaletteContext = createContext<CommandPaletteValue | null>(null);

export function CommandPaletteProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    <CommandPaletteContext value={value}>{children}</CommandPaletteContext>
  );
}

export function useCommandPalette(): CommandPaletteValue {
  const value = useContext(CommandPaletteContext);
  if (!value) {
    throw new Error(
      "useCommandPalette must be used inside CommandPaletteProvider. The shell layout provides it.",
    );
  }
  return value;
}
