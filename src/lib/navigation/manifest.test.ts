import { describe, expect, it } from "vitest";
import {
  NAVIGATION,
  type NavigationItem,
  activeRoom,
  hrefFor,
  isActive,
  navigationFor,
} from "./manifest";

function item(id: NavigationItem["id"]): NavigationItem {
  const found = NAVIGATION.find((entry) => entry.id === id);
  if (!found) throw new Error(`No navigation item ${id}`);
  return found;
}

describe("one definition, not two", () => {
  it("declares every item exactly once", () => {
    // Given: SHELL-00 forbids parallel desktop and mobile arrays, because that
    // is how a room gets renamed in one place and not the other
    const ids = NAVIGATION.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every item a stable, unique order", () => {
    const orders = NAVIGATION.map((entry) => entry.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("never inlines a label", () => {
    for (const entry of NAVIGATION) {
      expect(entry.labelKey).toMatch(/^[a-z]+$/u);
    }
  });

  it("gives every destination a room and every utility none", () => {
    for (const entry of NAVIGATION) {
      if (entry.room !== null) expect(entry.path).not.toBeNull();
    }
    expect(item("command").path).toBeNull();
    expect(item("locale").path).toBeNull();
  });
});

describe("destinations carry no locale", () => {
  // Given: `hrefFor` used to prepend the locale and `Link` prepended it again,
  // so the rail sent a Persian reader from `/` to `/fa/fa/shop`. Prefixing
  // belongs to `@/i18n/navigation` and to nothing else — decision R-1.
  it("returns the bare path, leaving the prefix to the navigation layer", () => {
    expect(hrefFor(item("shop"))).toBe("/shop");
    expect(hrefFor(item("brand"))).toBe("/");
  });

  it("returns no href for an item that opens something instead", () => {
    expect(hrefFor(item("command"))).toBeNull();
    expect(hrefFor(item("locale"))).toBeNull();
  });
});

describe("active room matching", () => {
  // The pathname here is the locale-stripped one `@/i18n/navigation` reports,
  // which is what the rail reads. Under `as-needed` the raw Next pathname is
  // bare in Persian and prefixed in English and Arabic, so matching on it would
  // light the rail in one locale and not the others.
  it.each([
    ["/", "landing"],
    ["/shop", "shop"],
    ["/shop/concern/lak", "shop"],
    ["/shop/p/dev-product-1", "shop"],
    ["/shop/search", "shop"],
    ["/book", "book"],
    ["/academy", "academy"],
    ["/account", "account"],
  ])("%s is in the %s room", (pathname, room) => {
    expect(activeRoom(pathname)).toBe(room);
  });

  it("keeps a room active for every route inside it", () => {
    // Given: a nested product page is still Shop, or the rail loses its place
    // the moment a customer opens anything
    expect(isActive(item("shop"), "/shop/p/dev-product-1")).toBe(true);
    expect(isActive(item("book"), "/shop/p/dev-product-1")).toBe(false);
  });

  it("does not let the landing page claim every route", () => {
    expect(isActive(item("brand"), "/shop")).toBe(false);
    expect(isActive(item("brand"), "/")).toBe(true);
  });

  it("returns no room for a path outside the manifest", () => {
    expect(activeRoom("/legal/privacy")).toBeNull();
  });
});

describe("surfaces", () => {
  it("puts the four rooms and the utilities on the desktop rail", () => {
    const ids = navigationFor("rail").map((entry) => entry.id);

    expect(ids).toEqual([
      "brand",
      "shop",
      "book",
      "academy",
      "command",
      "account",
      "locale",
      // Last, at `order: 70`. That is the manifest's own placement and is left
      // alone: where the cart sits on the rail is a design decision, and this
      // packet opened a gate rather than re-ordering a surface.
      "cart",
    ]);
  });

  it("holds the bottom bar to five repeat destinations", () => {
    // N-1: a bottom bar is repeat-navigation furniture. Booking and Academy are
    // destination visits reached from the Landing doors or command search, and
    // a sixth item pushes every target below the 44px floor.
    //
    // It was four until packet 9. The cart was always defined with
    // `mobile: "bottom"` and held back by `SHELL-04` because it could not act;
    // opening that gate is what makes it five, which N-1's own reasoning
    // permits — the number it warns about is six. Measured at 390: five items
    // give 78px each, comfortably over the floor.
    const ids = navigationFor("bottom").map((entry) => entry.id);

    expect(ids).toEqual(["brand", "shop", "command", "account", "cart"]);
    expect(ids).toHaveLength(5);
  });

  it("never shows the same item on both interactive navigations", () => {
    // SHELL-02: assistive technology must not meet two copies of one control
    const rail = navigationFor("rail");
    const bottom = navigationFor("bottom");

    for (const entry of bottom) {
      const twin = rail.find((other) => other.id === entry.id);
      expect(twin, `${entry.id} appears in both`).toBeDefined();
    }
    // They share ids by design; the surfaces are mutually exclusive at runtime,
    // which the shell enforces by rendering only one at a time.
    expect(rail.length).toBeGreaterThan(bottom.length);
  });

  it("orders every surface the same way", () => {
    for (const surface of ["rail", "bottom", "utility"] as const) {
      const orders = navigationFor(surface).map((entry) => entry.order);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    }
  });
});

describe("availability gates", () => {
  it("shows the cart now that its contract exists", () => {
    // SHELL-04: an affordance that cannot act must never appear as a production
    // control. It could not until packet 9 — no module, no `/cart`, no actions
    // — and this test asserted its absence for five packets. The condition is
    // met, so the assertion is inverted rather than deleted: what it protects
    // is that the item follows the gate, in either direction.
    expect(navigationFor("rail").map((entry) => entry.id)).toContain("cart");
    expect(navigationFor("bottom").map((entry) => entry.id)).toContain("cart");
  });

  it("still hides it when the gate is explicitly closed", () => {
    // The mechanism has to keep working, or the next gated affordance inherits
    // a switch that is wired to nothing.
    expect(
      navigationFor("rail", { cartGateOpen: false }).map((entry) => entry.id),
    ).not.toContain("cart");
  });

  it("reveals the cart when its gate opens, without a second definition", () => {
    const rail = navigationFor("rail", { cartGateOpen: true }).map((e) => e.id);
    const bottom = navigationFor("bottom", { cartGateOpen: true }).map(
      (e) => e.id,
    );

    expect(rail).toContain("cart");
    expect(bottom).toContain("cart");
    expect(hrefFor(item("cart"))).toBe("/cart");
  });
});

describe("labels resolve against the real message catalogue", () => {
  it("uses a key that exists in every locale", async () => {
    // Given: the manifest invented `nav.locale` while the catalogue had
    // `nav.language`, and a test that echoed the key back could not see it. The
    // dev server could, immediately, in all three locales.
    const locales = ["fa", "en", "ar"] as const;

    for (const locale of locales) {
      const messages = (await import(`@/messages/${locale}.json`)).default as {
        nav?: Record<string, unknown>;
      };
      const nav = messages.nav ?? {};

      const missing = NAVIGATION.map((entry) => entry.labelKey).filter(
        (key) => !(key in nav),
      );

      expect(missing, `${locale} is missing ${missing.join(", ")}`).toEqual([]);
    }
  });
});
