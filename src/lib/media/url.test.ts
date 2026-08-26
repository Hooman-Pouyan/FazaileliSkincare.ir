import { describe, expect, it } from "vitest";
import { mediaRoleEnum } from "@/lib/db/schema/enums";
import { MEDIA_ROLES } from "./roles";
import {
  DERIVATIVE_WIDTHS,
  MEDIA_ORIGIN,
  derivativeKey,
  isObjectKey,
  mediaSlot,
  mediaUrl,
  mediaUrlOrNull,
  originalKey,
} from "./url";

const PARTS = {
  brandSlug: "storyderm",
  lineSlug: "clinic-a",
  productSlug: "clinic-a-cream",
  slot: "primary",
};

describe("media roles stay in step with the database enum", () => {
  it("lists exactly the values the media_role enum defines", () => {
    expect([...MEDIA_ROLES]).toEqual([...mediaRoleEnum.enumValues]);
  });
});

describe("object keys", () => {
  it("accepts the shape C-8 defines", () => {
    expect(
      isObjectKey("catalog/storyderm/clinic-a/clinic-a-cream/primary-640.webp"),
    ).toBe(true);
  });

  it.each([
    ["a leading slash", "/catalog/storyderm/x/y/primary-640.webp"],
    ["traversal", "catalog/../../etc/passwd"],
    ["a double slash", "catalog//storyderm/x-640.webp"],
    ["whitespace", "catalog/storyderm/Clinic-A Cream 50ml.png"],
    ["uppercase", "catalog/Storyderm/x/y/primary-640.webp"],
    ["an absolute URL", "https://cdn.example.com/x.webp"],
    ["nothing", ""],
  ])("rejects %s", (_label, value) => {
    expect(isObjectKey(value)).toBe(false);
  });
});

describe("mediaUrl", () => {
  it("joins the configured origin to the key", () => {
    expect(mediaUrl("catalog/storyderm/clinic-a/x/primary-640.webp")).toBe(
      `${MEDIA_ORIGIN}/catalog/storyderm/clinic-a/x/primary-640.webp`,
    );
  });

  it("never emits a double slash, whatever the origin's trailing form", () => {
    expect(MEDIA_ORIGIN.endsWith("/")).toBe(false);
  });

  it("throws on a malformed key rather than emitting a broken src", () => {
    expect(() => mediaUrl("/images/whatever.png")).toThrow(/object key/i);
  });
});

describe("key builders", () => {
  it("puts the width in the derivative name so the file is immutable", () => {
    expect(derivativeKey(PARTS, "card")).toBe(
      `catalog/storyderm/clinic-a/clinic-a-cream/primary-${DERIVATIVE_WIDTHS.card}.webp`,
    );
    expect(derivativeKey(PARTS, "detail")).toBe(
      `catalog/storyderm/clinic-a/clinic-a-cream/primary-${DERIVATIVE_WIDTHS.detail}.webp`,
    );
  });

  it("keeps the original under its own name and extension", () => {
    expect(originalKey(PARTS, ".PNG")).toBe(
      "catalog/storyderm/clinic-a/clinic-a-cream/primary-original.png",
    );
  });

  it("builds only valid keys", () => {
    for (const key of [
      derivativeKey(PARTS, "card"),
      derivativeKey(PARTS, "detail"),
      originalKey(PARTS, "png"),
    ]) {
      expect(isObjectKey(key), key).toBe(true);
    }
  });

  it("numbers every slot except the single primary", () => {
    expect(mediaSlot("primary", 1)).toBe("primary");
    expect(mediaSlot("gallery", 2)).toBe("gallery-2");
    expect(mediaSlot("package", 1)).toBe("package-1");
  });

  it("gives two gallery frames of one product distinct keys", () => {
    const first = derivativeKey(
      { ...PARTS, slot: mediaSlot("gallery", 1) },
      "card",
    );
    const second = derivativeKey(
      { ...PARTS, slot: mediaSlot("gallery", 2) },
      "card",
    );
    expect(first).not.toBe(second);
  });
});

describe("mediaUrlOrNull", () => {
  it("resolves a usable key", () => {
    expect(mediaUrlOrNull("catalog/storyderm/x/y/primary-640.webp")).toBe(
      `${MEDIA_ORIGIN}/catalog/storyderm/x/y/primary-640.webp`,
    );
  });

  it("returns null rather than throwing on a stored value that is not a key", () => {
    // A malformed key in the seed is a programming error and should be loud.
    // A malformed key in a *row* is a broken image, and the storefront's answer
    // to that is already settled: degrade, never make stock unbuyable (LOW-8).
    expect(mediaUrlOrNull(null)).toBeNull();
    expect(mediaUrlOrNull("")).toBeNull();
    expect(mediaUrlOrNull("/images/dev/legacy-path.svg")).toBeNull();
    expect(mediaUrlOrNull("https://cdn.example.com/x.webp")).toBeNull();
  });
});
