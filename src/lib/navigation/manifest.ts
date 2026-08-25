/**
 * The one navigation definition.
 *
 * `SHELL-00` requires it: the desktop rail, the mobile bottom bar, the command
 * palette and the footer all render from this array. Rendering variants may omit
 * or regroup items for a viewport, but a label, a destination, an availability
 * rule or an active-room rule exists exactly once. Two arrays is how a room gets
 * renamed in one place and not the other.
 *
 * Placement decisions are recorded in `docs/19-navigation-decisions.md`.
 */

export type NavigationRoom =
  | "landing"
  | "shop"
  | "book"
  | "academy"
  | "account";

export type NavigationItemId =
  | "brand"
  | "shop"
  | "book"
  | "academy"
  | "command"
  | "locale"
  | "account"
  | "cart";

/** Where an item may appear. `none` means the surface does not carry it. */
export type DesktopPlacement = "rail" | "none";
export type MobilePlacement = "bottom" | "utility" | "none";

/**
 * `cart-gate` items are defined here so the manifest stays the single source,
 * but stay hidden until the Cart contract exists. `SHELL-04` is explicit that an
 * affordance which cannot act must not appear as a production control.
 */
export type AvailabilityGate = "always" | "cart-gate";

export type NavigationItem = Readonly<{
  id: NavigationItemId;
  /** Key within the `nav` translation namespace. Labels are never inlined. */
  labelKey: string;
  /** Locale-less path for destinations; `null` for items that open something. */
  path: string | null;
  /** The room this item enters, for active matching. `null` for utilities. */
  room: NavigationRoom | null;
  order: number;
  desktop: DesktopPlacement;
  mobile: MobilePlacement;
  availability: AvailabilityGate;
}>;

export const NAVIGATION: readonly NavigationItem[] = [
  {
    id: "brand",
    labelKey: "home",
    path: "",
    room: "landing",
    order: 0,
    desktop: "rail",
    mobile: "bottom",
    availability: "always",
  },
  {
    id: "shop",
    labelKey: "shop",
    path: "/shop",
    room: "shop",
    order: 10,
    desktop: "rail",
    mobile: "bottom",
    availability: "always",
  },
  {
    id: "book",
    labelKey: "book",
    path: "/book",
    room: "book",
    order: 20,
    desktop: "rail",
    // N-1: a bottom bar is repeat-navigation furniture, and Booking is a
    // destination visit reached from the Landing doors or command search.
    mobile: "none",
    availability: "always",
  },
  {
    id: "academy",
    labelKey: "academy",
    path: "/academy",
    room: "academy",
    order: 30,
    desktop: "rail",
    mobile: "none",
    availability: "always",
  },
  {
    id: "command",
    labelKey: "search",
    path: null,
    room: null,
    order: 40,
    desktop: "rail",
    mobile: "bottom",
    availability: "always",
  },
  {
    id: "account",
    labelKey: "account",
    path: "/account",
    room: "account",
    order: 50,
    desktop: "rail",
    mobile: "bottom",
    availability: "always",
  },
  {
    id: "locale",
    labelKey: "locale",
    path: null,
    room: null,
    order: 60,
    desktop: "rail",
    mobile: "utility",
    availability: "always",
  },
  {
    id: "cart",
    labelKey: "cart",
    path: "/cart",
    room: null,
    order: 70,
    desktop: "rail",
    mobile: "bottom",
    availability: "cart-gate",
  },
] as const;

export type NavigationSurface = "rail" | "bottom" | "utility";

export type NavigationOptions = Readonly<{
  /** Opens the cart entry. Closed until the Cart contract exists. */
  cartGateOpen?: boolean;
}>;

function isAvailable(
  item: NavigationItem,
  options: NavigationOptions,
): boolean {
  return item.availability === "always" || options.cartGateOpen === true;
}

export function navigationFor(
  surface: NavigationSurface,
  options: NavigationOptions = {},
): readonly NavigationItem[] {
  return NAVIGATION.filter((item) => {
    if (!isAvailable(item, options)) return false;
    return surface === "rail"
      ? item.desktop === "rail"
      : item.mobile === surface;
  }).toSorted((a, b) => a.order - b.order);
}

export function hrefFor(item: NavigationItem, locale: string): string | null {
  return item.path === null ? null : `/${locale}${item.path}`;
}

/**
 * The room a pathname belongs to.
 *
 * Matched on the segment after the locale, so every route inside a room stays
 * active — `/fa/shop/p/x` is still Shop. The landing page is the only exact
 * match, or it would claim every route in the application.
 */
export function activeRoom(pathname: string): NavigationRoom | null {
  const segments = pathname.split("/").filter(Boolean);
  const [, room] = segments;
  if (room === undefined) return segments.length === 1 ? "landing" : null;

  const match = NAVIGATION.find(
    (item) => item.room !== null && item.path === `/${room}`,
  );
  return match?.room ?? null;
}

export function isActive(item: NavigationItem, pathname: string): boolean {
  return item.room !== null && item.room === activeRoom(pathname);
}
