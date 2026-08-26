/**
 * The Landing's ornament set — `LAND-06`.
 *
 * Five pieces the growth spine composes: three branch segments, a bud, an open
 * blossom and a petal. Contour hairlines only — no fill, no gradient, no
 * shadow, no frame — because the brand's rule is hairlines rather than boxes,
 * and an ornament that needs a shadow to read is decoration pretending to be
 * structure.
 *
 * **`slash` is deliberately absent** from this set, though `LAND-06` lists it.
 * The design system already owns the section-rhythm mark: `Divider`, whose own
 * note calls it _"the one piece of ornament the system allows"_. Drawing a
 * second one is exactly the mistake `DS-2` recorded — a `SlashMark` was
 * invented once already while `Divider` sat unused.
 *
 * **Provenance.** Drawn for this repository, from the geometry of a plum branch
 * rather than by tracing anything. Not derived from `designs/references/forlled/`,
 * which is Forlle'd's artwork and carries no licence to us, and not taken from a
 * third-party sakura set — `L-11` is why origin matters here more than usual.
 *
 * **Colour.** Stroke is `currentColor`, so the tone comes from the band the
 * piece sits in rather than from a hardcoded value. `tokens.css` line 6 records
 * that gold, firouzeh, champagne and sand all fail contrast on `--ground`;
 * champagne and gold are therefore used only on the lapis and teal bands, and
 * the spine passes the hairline colour on light ground. That is enforced by the
 * caller choosing a tone, not by this file.
 *
 * Every piece is `aria-hidden` and carries no text alternative: none of them
 * says anything a reader would miss.
 */

type PieceProps = {
  readonly className?: string;
  /** Stroke weight in user units. One hairline at every size. */
  readonly weight?: number;
};

const HAIRLINE = 1.1;

function frame(props: PieceProps) {
  return {
    className: props.className,
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: props.weight ?? HAIRLINE,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false as const,
  };
}

/**
 * One length of branch. Three variants, so a long spine does not read as a
 * ruled line: `straight` carries distance, `curve` gives it a bend, and `fork`
 * is the division at beat 3 where the page opens into three rooms.
 */
export function BranchSegment({
  variant = "straight",
  ...props
}: PieceProps & { readonly variant?: "straight" | "curve" | "fork" }) {
  const path =
    variant === "straight"
      ? "M12 0 C 12 22, 11 44, 12 72"
      : variant === "curve"
        ? "M12 0 C 12 20, 18 32, 15 48 C 13 60, 11 64, 12 72"
        : "M12 0 C 12 18, 12 26, 12 34 M12 34 C 12 44, 5 52, 2 62 M12 34 C 12 46, 19 54, 22 64";

  return (
    <svg viewBox="0 0 24 72" width="24" height="72" {...frame(props)}>
      <path d={path} />
    </svg>
  );
}

/** Beat 2. Closed, angled off the branch — the page has not opened yet. */
export function Bud(props: PieceProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" {...frame(props)}>
      <path d="M12 22 C 12 18, 12 15, 12 13" />
      <path d="M12 13 C 8 12, 6.5 8.5, 8 5 C 10.5 6, 12 9, 12 13 Z" />
      <path d="M12 13 C 16 12, 17.5 8.5, 16 5 C 13.5 6, 12 9, 12 13 Z" />
    </svg>
  );
}

/**
 * Beats 4 and 5. Five petals, because a plum blossom has five — a six-petal
 * flower is a different plant and this brand's reference is specific.
 *
 * The centre is drawn as its own element so the caller can tint it
 * `--gold-light` against the stroke without a second component.
 */
export function BlossomOpen(props: PieceProps) {
  const petals = [0, 72, 144, 216, 288].map((angle) => (
    <path
      key={angle}
      d="M12 12 C 8.5 9, 8.5 4.5, 12 2 C 15.5 4.5, 15.5 9, 12 12 Z"
      transform={`rotate(${angle} 12 12)`}
    />
  ));

  return (
    <svg viewBox="0 0 24 24" width="24" height="24" {...frame(props)}>
      {petals}
      <circle cx="12" cy="12" r="1.6" />
    </svg>
  );
}

/** The resting mark at the end of beat 5. One petal, fallen, at an angle. */
export function Petal(props: PieceProps) {
  return (
    <svg viewBox="0 0 24 16" width="24" height="16" {...frame(props)}>
      <path d="M3 11 C 6 4, 14 2, 21 5 C 18 12, 10 14, 3 11 Z" />
      <path d="M3 11 C 9 9, 15 7, 21 5" />
    </svg>
  );
}
