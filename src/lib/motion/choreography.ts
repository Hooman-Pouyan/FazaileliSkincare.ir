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

/**
 * Tailwind's `lg`, as a media query, in one place.
 *
 * `E-1` puts parallax on desktop and tablet and nowhere else: "a phone has no
 * room for depth and the least headroom for it." Both call sites already carry
 * `hidden lg:block`, which satisfies the *room* half — but `display: none` does
 * not stop a scroll listener, so the *headroom* half was still being paid on
 * exactly the mid-range hardware the constraint was written for.
 *
 * It is enforced here rather than at the call sites for the reason `E-6`
 * records: a rule that lives in one caller is not a rule, it is a habit, and
 * the next caller will not have it.
 */
const PARALLAX_VIEWPORT = "(min-width: 64rem)";

/**
 * A decorative layer that drifts against the scroll — `E-1`.
 *
 * Parallax was refused by `L-3` and the refusal was withdrawn by the maintainer
 * on 2026-08-26. The reasons for refusing it did not go away, so they are
 * answered here instead of argued with:
 *
 * - **`translate3d` only.** Never `background-position`, `top` or `height`.
 *   Anything on the layout or paint path drops frames on exactly the mid-range
 *   hardware this site is built for.
 * - **Driven by `requestAnimationFrame` off a passive scroll listener**, not by
 *   a scroll handler doing work. The listener records; the frame renders.
 * - **Inert under `prefers-reduced-motion`**, at the resting position. Parallax
 *   is a vestibular trigger rather than a preference.
 * - **No pinning and no scroll hijack.** The page scrolls at the speed the
 *   reader chose. That half of `L-3` is not withdrawn.
 * - **Above `lg` only**, re-evaluated as the viewport crosses the breakpoint,
 *   so a layer that stops qualifying is returned to its resting position
 *   rather than frozen mid-drift.
 *
 * `depth` is the fraction of the scrolled distance the layer keeps: 0.2 drifts
 * gently, 0.5 is already too much for a photograph with a subject in it.
 */
export function parallaxLayer(
  target: HTMLElement,
  options: { readonly depth?: number } = {},
): () => void {
  if (prefersReducedMotion()) return () => {};
  if (typeof window === "undefined") return () => {};

  const depth = options.depth ?? 0.18;
  const wideEnough = window.matchMedia(PARALLAX_VIEWPORT);
  let frame = 0;
  let running = false;

  const render = () => {
    frame = 0;
    // Measured against the viewport centre, so a layer is at rest when its
    // section is centred rather than when the document happens to be at zero.
    const box = target.getBoundingClientRect();
    const distance = box.top + box.height / 2 - window.innerHeight / 2;
    target.style.transform = `translate3d(0, ${(-distance * depth).toFixed(2)}px, 0)`;
  };

  const onScroll = () => {
    if (frame === 0) frame = window.requestAnimationFrame(render);
  };

  const start = () => {
    if (running) return;
    running = true;
    render();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  };

  const stop = () => {
    if (!running) return;
    running = false;
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    if (frame !== 0) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    // Back to the resting position, which is where the layer belongs whenever
    // the effect is not running — the same state reduced motion gets.
    target.style.transform = "";
  };

  const sync = () => (wideEnough.matches ? start() : stop());

  sync();
  wideEnough.addEventListener("change", sync);

  return () => {
    wideEnough.removeEventListener("change", sync);
    stop();
  };
}

/**
 * A section whose entrance is tied to scroll position rather than fired once at
 * a threshold — `E-5`.
 *
 * This is what "storytelling on scroll" means in practice, and it is the
 * opposite of a scroll hijack: the reader sets the pace and the page follows.
 * Nothing is pinned, nothing is snapped, and scrolling back runs it backwards
 * because the state is a function of position rather than of an event that
 * already fired.
 *
 * **It cannot hide content.** The starting state is applied in the browser one
 * frame before the first update, so the server-rendered HTML is the finished
 * section — the same rule `revealSequence` follows and the reason both live
 * here rather than in a component.
 */
export function scrubReveal(
  targets: readonly Element[],
  options: { readonly distance?: number; readonly span?: number } = {},
): () => void {
  const list = [...targets].filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
  if (list.length === 0 || prefersReducedMotion()) return () => {};
  if (typeof window === "undefined") return () => {};

  const distance = options.distance ?? 28;
  // How much of the viewport the reader crosses before the section is fully
  // resolved. Below about a third it reads as a jump; above two thirds the
  // reader has scrolled past before it finishes.
  const span = options.span ?? 0.45;

  let frame = 0;
  const render = () => {
    frame = 0;
    for (const [index, node] of list.entries()) {
      const box = node.getBoundingClientRect();
      const entered = window.innerHeight - box.top;
      const progress = Math.min(
        1,
        Math.max(0, entered / (window.innerHeight * span)),
      );
      // A small per-element offset makes a group resolve in reading order
      // without any element ever being fully hidden.
      const own = Math.min(1, Math.max(0, progress * 1.15 - index * 0.08));
      node.style.opacity = String(0.25 + own * 0.75);
      node.style.transform = `translate3d(0, ${((1 - own) * distance).toFixed(2)}px, 0)`;
    }
  };

  const onScroll = () => {
    if (frame === 0) frame = window.requestAnimationFrame(render);
  };

  render();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    if (frame !== 0) window.cancelAnimationFrame(frame);
    for (const node of list) {
      node.style.opacity = "";
      node.style.transform = "";
    }
  };
}
