import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/layout/reveal";

/**
 * A paragraph a page carries beside its results — an intro, or a dated
 * campaign.
 *
 * One component for both kinds because they are the same shape: a heading, a
 * paragraph, and sometimes somewhere to go. What separates them is the
 * publication window on the row, not the markup — `C-13`. A campaign whose
 * window has closed never reaches this component at all.
 *
 * **Not a promotional strip.** `L-6` refused permanent promotional furniture,
 * and this respects that by having nothing to render when there is no content:
 * absence is the designed state, not an empty frame.
 *
 * Teal is the Shop room's accent (`DS-3`). The rule is set on the inline start
 * edge so it follows the reading direction rather than the viewport.
 */
export function EditorialBand({
  heading,
  body,
  cta,
  tone = "plain",
}: {
  readonly heading: string | null;
  readonly body: string | null;
  readonly cta: Readonly<{ label: string; href: string }> | null;
  readonly tone?: "plain" | "accented";
}) {
  if (!heading && !body) return null;

  return (
    <Reveal
      as="section"
      className={
        tone === "accented"
          ? "flex flex-col gap-3 border-s-2 border-teal ps-6"
          : "flex flex-col gap-3"
      }
    >
      {heading && <h2 className="text-lede font-medium text-ink">{heading}</h2>}
      {body && (
        <p className="max-w-[52em] text-body leading-fa text-stone-text">
          {body}
        </p>
      )}
      {cta && (
        <Link
          href={cta.href}
          className="self-start border-b border-teal pb-1 text-small font-medium text-teal"
        >
          {cta.label}
        </Link>
      )}
    </Reveal>
  );
}
