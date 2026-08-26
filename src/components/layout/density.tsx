import type { ReactNode } from "react";

/**
 * The density scope — `docs/33-density-decisions.md`, `D-2` and `D-4`.
 *
 * Density is a property of the surface, not of the site. A Landing is read; a
 * listing is compared. `10-design-playbook.md`'s 96px rule still governs the
 * first and is surface-conditional for the second.
 *
 * This exists so the attribute has **one home and one spelling**. It renders a
 * plain `div` carrying `data-density`, and `designs/tokens.css` does the rest by
 * redefining Tailwind's `--spacing` base and the semantic `--space-*` steps
 * beneath it. No component reads this, no `className` changes, and a surface
 * opts in by wrapping rather than by being edited.
 *
 * The Landing wraps in nothing and inherits `:root`, which is the condition
 * worth protecting: compact must not leak into the editorial surfaces, and the
 * cheapest way to guarantee that is for them to have no opinion at all.
 */
export function Density({
  children,
  mode = "compact",
}: {
  readonly children: ReactNode;
  readonly mode?: "compact";
}) {
  return (
    <div data-density={mode} className="contents">
      {children}
    </div>
  );
}
