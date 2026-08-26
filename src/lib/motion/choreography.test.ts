import { afterEach, describe, expect, it } from "vitest";
import { parallaxLayer } from "./choreography";

/*
  There is no jsdom in this project and adding one to test three window members
  would be the kind of drift AGENTS.md exists to stop. `parallaxLayer` touches a
  small, known surface — `matchMedia`, `addEventListener`, `requestAnimationFrame`,
  `innerHeight` — so the surface is stubbed instead. Anything the function starts
  reaching for beyond it will fail loudly here, which is the correct outcome.
*/

type Handler = () => void;

interface FakeMedia {
  matches: boolean;
  readonly listeners: Set<Handler>;
  addEventListener(type: "change", handler: Handler): void;
  removeEventListener(type: "change", handler: Handler): void;
}

function installWindow(options: {
  readonly wide: boolean;
  readonly reducedMotion?: boolean;
}) {
  const media = new Map<string, FakeMedia>();
  const events = new Map<string, Set<Handler>>();
  const frames: Handler[] = [];

  const queryFor = (query: string): FakeMedia => {
    const existing = media.get(query);
    if (existing) return existing;
    const created: FakeMedia = {
      matches: query.includes("prefers-reduced-motion")
        ? (options.reducedMotion ?? false)
        : options.wide,
      listeners: new Set<Handler>(),
      addEventListener(_type, handler) {
        this.listeners.add(handler);
      },
      removeEventListener(_type, handler) {
        this.listeners.delete(handler);
      },
    };
    media.set(query, created);
    return created;
  };

  const fake = {
    innerHeight: 900,
    matchMedia: queryFor,
    requestAnimationFrame: (handler: Handler) => {
      frames.push(handler);
      return frames.length;
    },
    cancelAnimationFrame: () => {},
    addEventListener: (type: string, handler: Handler) => {
      const set = events.get(type) ?? new Set<Handler>();
      set.add(handler);
      events.set(type, set);
    },
    removeEventListener: (type: string, handler: Handler) => {
      events.get(type)?.delete(handler);
    },
  };

  (globalThis as { window?: unknown }).window = fake;

  return {
    scrollListenerCount: () => events.get("scroll")?.size ?? 0,
    /** Every media query the implementation actually asked about. */
    queried: () => [...media.keys()],
    /**
     * Cross the breakpoint the way a real resize or rotation would — driven by
     * whichever width query the implementation asked for, not by a copy of it
     * hardcoded here. A fake that answers a question nobody asked proves
     * nothing, which is how the first version of this file passed while the
     * breakpoint value went unasserted.
     */
    setWide(wide: boolean) {
      const width = [...media.keys()].find((query) =>
        query.includes("min-width"),
      );
      if (!width) throw new Error("no width query was ever requested");
      const query = queryFor(width);
      query.matches = wide;
      for (const listener of [...query.listeners]) listener();
    },
  };
}

function fakeLayer() {
  return {
    style: { transform: "" },
    getBoundingClientRect: () => ({ top: 400, height: 600 }),
  } as unknown as HTMLElement;
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

/**
 * `E-1` permits parallax on desktop and tablet only — "a phone has no room for
 * depth and the least headroom for it". Both call sites carry `hidden lg:block`,
 * which hides the layer but does not stop the scroll listener, so the cost was
 * still being paid on the hardware the constraint was written to protect.
 */
describe("parallaxLayer, above the lg breakpoint only", () => {
  it("does not attach to the page on a phone-width viewport", () => {
    // Given: a viewport below `lg`
    const environment = installWindow({ wide: false });
    const layer = fakeLayer();

    // When: a parallax layer is created
    parallaxLayer(layer);

    // Then: nothing listens to scroll and the layer sits at its resting position
    expect(environment.scrollListenerCount()).toBe(0);
    expect(layer.style.transform).toBe("");
  });

  it("gates on lg itself, not on some other width", () => {
    // Given: any viewport
    const environment = installWindow({ wide: true });

    // When: a parallax layer is created
    parallaxLayer(fakeLayer());

    // Then: the breakpoint it asks about is Tailwind's `lg`, which is what
    // `E-1` names and what `hidden lg:block` at the call sites agrees with
    expect(environment.queried()).toContain("(min-width: 64rem)");
  });

  it("drives the layer with translate3d on a desktop viewport", () => {
    // Given: a viewport at or above `lg`
    const environment = installWindow({ wide: true });
    const layer = fakeLayer();

    // When: a parallax layer is created
    parallaxLayer(layer);

    // Then: it is driven, and only ever through the compositor
    expect(environment.scrollListenerCount()).toBe(1);
    expect(layer.style.transform).toMatch(/^translate3d\(0, -?[\d.]+px, 0\)$/);
  });

  it("returns the layer to rest when the viewport drops below lg", () => {
    // Given: a running parallax layer on a desktop viewport
    const environment = installWindow({ wide: true });
    const layer = fakeLayer();
    parallaxLayer(layer);

    // When: the viewport crosses the breakpoint downwards
    environment.setWide(false);

    // Then: it detaches and resets rather than freezing mid-drift
    expect(environment.scrollListenerCount()).toBe(0);
    expect(layer.style.transform).toBe("");
  });

  it("stays inert under prefers-reduced-motion at any width", () => {
    // Given: a desktop viewport belonging to someone who asked for less motion
    const environment = installWindow({ wide: true, reducedMotion: true });
    const layer = fakeLayer();

    // When: a parallax layer is created
    parallaxLayer(layer);

    // Then: parallax is a vestibular trigger, so it never starts
    expect(environment.scrollListenerCount()).toBe(0);
    expect(layer.style.transform).toBe("");
  });

  it("removes every listener it added when cleaned up", () => {
    // Given: a running parallax layer
    const environment = installWindow({ wide: true });
    const layer = fakeLayer();

    // When: React unmounts the component
    parallaxLayer(layer)();

    // Then: no listener survives the layer that owned it
    expect(environment.scrollListenerCount()).toBe(0);
    expect(layer.style.transform).toBe("");
  });
});
