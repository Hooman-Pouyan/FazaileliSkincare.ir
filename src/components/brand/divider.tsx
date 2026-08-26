import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The ornamental divider — a gold hairline broken at the centre by the
 * turquoise glyph.
 *
 * Ported from the design system's own `Divider`, whose note is worth keeping
 * verbatim: *"This is the one piece of ornament the system allows, and it earns
 * its place by being the brand's own artwork rather than a decorative
 * flourish."*
 *
 * **Where it goes.** Between major editorial sections — after a manifesto band,
 * before a closing invitation. Not between list items, not inside a form, and
 * **not more than twice on a page**. `Rule` from `components/layout/container`
 * is the default separator; this is the exception, and it stops being special
 * the third time it appears.
 *
 * The gradients fade the hairline out toward the page edges rather than running
 * it full width, so the glyph reads as the centre of a gesture rather than as a
 * bead on a wire.
 */
export function Divider({ className }: { readonly className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("flex w-full items-center gap-3.5", className)}
    >
      <span className="h-px flex-1 bg-[linear-gradient(to_left,transparent,var(--gold)_60%)]" />
      <Image
        src="/images/brand/brand-glyph-128.png"
        alt=""
        width={34}
        height={34}
        className="block size-[34px] shrink-0 object-contain"
      />
      <span className="h-px flex-1 bg-[linear-gradient(to_right,transparent,var(--gold)_60%)]" />
    </div>
  );
}
