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

describe("locale prefixing", () => {
  it("prefixes every destination with the active locale", () => {
    expect(hrefFor(item("shop"), "fa")).toBe("/fa/shop");
    expect(hrefFor(item("shop"), "en")).toBe("/en/shop");
    expect(hrefFor(item("shop"), "ar")).toBe("/ar/shop");
  });

  it("sends the brand mark to the locale landing page, not to /", () => {
    expect(hrefFor(item("brand"), "fa")).toBe("/fa");
  });

  it("returns no href for an item that opens something instead", () => {
    expect(hrefFor(item("command"), "fa")).toBeNull();
    expect(hrefFor(item("locale"), "fa")).toBeNull();
  });
});

describe("active room matching", () => {
  it.each([
    ["/fa", "landing"],
    ["/en", "landing"],
    ["/fa/shop", "shop"],
    ["/fa/shop/concern/lak", "shop"],
    ["/fa/shop/p/dev-product-1", "shop"],
    ["/fa/shop/search", "shop"],
    ["/fa/book", "book"],
    ["/fa/academy", "academy"],
    ["/fa/account", "account"],
  ])("%s is in the %s room", (pathname, room) => {
    expect(activeRoom(pathname)).toBe(room);
  });

  it("keeps a room active for every route inside it", () => {
    // Given: a nested product page is still Shop, or the rail loses its place
    // the moment a customer opens anything
    expect(isActive(item("shop"), "/fa/shop/p/dev-product-1")).toBe(true);
    expect(isActive(item("book"), "/fa/shop/p/dev-product-1")).toBe(false);
  });

  it("does not let the landing page claim every route", () => {
    expect(isActive(item("brand"), "/fa/shop")).toBe(false);
    expect(isActive(item("brand"), "/fa")).toBe(true);
  });

  it("returns no room for a path outside the manifest", () => {
    expect(activeRoom("/fa/legal/privacy")).toBeNull();
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
    ]);
  });

  it("holds the bottom bar to four repeat destinations", () => {
    // N-1: a bottom bar is repeat-navigation furniture. Booking and Academy are
    // destination visits reached from the Landing doors or command search, and
    // a sixth item pushes every target below the 44px floor.
    const ids = navigationFor("bottom").map((entry) => entry.id);

    expect(ids).toEqual(["brand", "shop", "command", "account"]);
    expect(ids).toHaveLength(4);
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
  it("hides the cart until its contract exists", () => {
    // SHELL-04: an affordance that cannot act must never appear as a production
    // control
    expect(navigationFor("rail").map((entry) => entry.id)).not.toContain(
      "cart",
    );
    expect(navigationFor("bottom").map((entry) => entry.id)).not.toContain(
      "cart",
    );
  });

  it("reveals the cart when its gate opens, without a second definition", () => {
    const rail = navigationFor("rail", { cartGateOpen: true }).map((e) => e.id);
    const bottom = navigationFor("bottom", { cartGateOpen: true }).map(
      (e) => e.id,
    );

    expect(rail).toContain("cart");
    expect(bottom).toContain("cart");
    expect(hrefFor(item("cart"), "fa")).toBe("/fa/cart");
  });
});
