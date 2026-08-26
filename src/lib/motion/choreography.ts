import { animate, stagger, svg, utils } from "animejs";

/**
 * The project's choreography helpers, over anime.js v4.
 *
 * **Where the boundary sits, so there is one mechanism per concern:**
 *
 * - **CSS transitions** own *state changes* — hover, focus, open/closed,
 *   active. They are declarative, they need no script, and they already read
 *   `--duration`/`--easing` from the token layer.
 * - **anime.js** owns *choreography* — a sequence of elements entering in
 *   order, an SVG stroke drawing itself, anything with a timeline. Those are
 *   things CSS either cannot express or expresses as a pile of nth-child
 *   delays that nobody can change later.
 *
 * If a new animation is one element moving between two states, it does not
 * belong here.
 *
 * **Every helper is inert when the reader asked for less motion.** They check
 * `prefers-reduced-motion` and leave the finished state alone rather than
 * running a 1ms version, because a stagger of 1ms steps is still a stagger.
 *
 * **Nothing here may hide content.** A helper sets its own hidden state
 * immediately before animating out of it, so the server-rendered HTML is always
 * the finished page — `M-1` in `docs/23-motion-and-interaction-decisions.md`.
 */

/** One duration and one easing, read from the token layer rather than restated. */
function tokens(): { duration: number; easing: string } {
  if (typeof window === "undefined")
    return { duration: 480, easing: "outExpo" };
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--duration")
    .trim();
  const duration = Number.parseFloat(raw);
  return {
    duration: Number.isFinite(duration) && duration > 1 ? duration : 480,
    easing: "outExpo",
  };
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * A group of elements entering together, each a beat behind the last.
 *
 * Returns a cleanup that removes the inline styles anime left behind, so a
 * re-render never inherits a half-finished transform.
 */
export function revealSequence(
  targets: readonly Element[],
  options: { readonly step?: number; readonly distance?: number } = {},
): () => void {
  const list = [...targets];
  if (list.length === 0 || prefersReducedMotion()) return () => {};

  const { duration, easing } = tokens();
  const { step = 70, distance = 14 } = options;

  utils.set(list, { opacity: 0, translateY: distance });
  const animation = animate(list, {
    opacity: 1,
    translateY: 0,
    duration,
    ease: easing,
    delay: stagger(step),
  });

  return () => {
    animation.pause();
    // Takes the animation, not the elements: it knows which properties it wrote
    // and removes only those, so a class-driven transform is left alone.
    utils.cleanInlineStyles(animation);
  };
}

/**
 * Draws an SVG stroke on, the way a branch grows.
 *
 * This is the case that justified the dependency: `createDrawable` measures
 * every path in a group and handles the dash bookkeeping, which by hand is
 * `getTotalLength` and two custom properties per path.
 */
export function drawStrokes(
  root: SVGElement,
  options: { readonly duration?: number; readonly step?: number } = {},
): () => void {
  if (prefersReducedMotion()) return () => {};

  const paths = svg.createDrawable(root.querySelectorAll("path"));
  if (paths.length === 0) return () => {};

  const { easing } = tokens();
  const animation = animate(paths, {
    draw: "0 1",
    duration: options.duration ?? 1400,
    ease: easing,
    delay: stagger(options.step ?? 90),
  });

  return () => animation.pause();
}
