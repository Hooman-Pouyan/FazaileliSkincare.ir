/**
 * The Forlle'd blossom, drawn for this repository.
 *
 * Decision L-5 adopts the *form* from `designs/references/forlled/` — a branch
 * built from parallel hairlines rather than a filled silhouette, concentric
 * blossoms, scattered secondary dots — and decision L-11 requires it to be
 * original rather than traced or downloaded. Decision L-5 also holds the
 * colour: the reference's pink is Forlle'd's, and importing it as our accent is
 * exactly the generic beauty palette `09-brand-brief.md` rejects. Here the
 * branch is champagne or gold and lives only on lapis and teal fields, where
 * `tokens.css` says those colours pass contrast.
 *
 * Everything in this file is `aria-hidden` and carries no meaning. Delete the
 * whole ornament layer and every page must still read correctly.
 */

type OrnamentProps = {
  readonly className?: string;
};

/**
 * A branch segment. Four strokes at slightly different offsets give the
 * hand-drawn contour of the reference without any fill or gradient.
 */
export function BlossomBranch({ className }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 120 420"
      fill="none"
      aria-hidden
      focusable="false"
      className={className}
      preserveAspectRatio="xMidYMin meet"
    >
      <g
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.85"
      >
        <path d="M62 0c-6 46 10 70 4 108-6 38-24 54-18 96 6 42 26 58 20 100-5 38-16 60-12 116" />
        <path d="M67 0c-6 46 10 70 4 108-6 38-24 54-18 96 6 42 26 58 20 100-5 38-16 60-12 116" />
        <path d="M72 0c-6 46 10 70 4 108-6 38-24 54-18 96 6 42 26 58 20 100-5 38-16 60-12 116" />
        <path d="M77 0c-6 46 10 70 4 108-6 38-24 54-18 96 6 42 26 58 20 100-5 38-16 60-12 116" />
        {/* Two offshoots, so the branch reads as growth rather than a rule. */}
        <path d="M69 96c-14 6-26 2-38-10" />
        <path d="M71 100c-14 6-26 2-38-10" />
        <path d="M55 250c16 4 26 14 32 30" />
        <path d="M53 254c16 4 26 14 32 30" />
      </g>
    </svg>
  );
}

/** One open blossom: concentric, the way the reference draws them. */
export function Blossom({ className }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
      className={className}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    </svg>
  );
}

/** A bud — the same mark, unopened. */
export function BlossomBud({ className }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
      className={className}
    >
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

/**
 * The diagonal slash the reference uses as rhythm between blocks. It is the
 * quietest separator available — quieter than a rule, which is the point.
 */
export function SlashMark({ className }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 12 28"
      fill="none"
      aria-hidden
      focusable="false"
      className={className}
    >
      <path
        d="M10 2 2 26"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The branch with blossoms on it, composed once so no screen assembles the
 * ornament itself. Positions are fixed rather than random: a decoration that
 * differs between the server and the client is a hydration mismatch, and
 * `Math.random()` in a component is how that happens.
 */
export function BlossomOrnament({ className }: OrnamentProps) {
  const marks = [
    { top: "4%", start: "38%", size: "size-4", open: true },
    { top: "11%", start: "60%", size: "size-3", open: false },
    { top: "22%", start: "24%", size: "size-5", open: true },
    { top: "26%", start: "52%", size: "size-3", open: false },
    { top: "44%", start: "44%", size: "size-4", open: true },
    { top: "58%", start: "66%", size: "size-3", open: false },
    { top: "71%", start: "34%", size: "size-5", open: true },
    { top: "83%", start: "58%", size: "size-4", open: true },
  ] as const;

  return (
    <div aria-hidden className={className}>
      <div className="relative size-full">
        <BlossomBranch className="size-full text-champagne" />
        {marks.map((mark) => (
          <span
            key={`${mark.top}-${mark.start}`}
            className="absolute text-gold-light"
            style={{ top: mark.top, insetInlineStart: mark.start }}
          >
            {mark.open ? (
              <Blossom className={mark.size} />
            ) : (
              <BlossomBud className={mark.size} />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
