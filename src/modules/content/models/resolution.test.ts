import { describe, expect, it } from "vitest";
import { PUBLIC_ONLY } from "@/lib/preview";
import { type PlacementInput, isLive, selectScoped } from "./resolution";

const PREVIEW = { previewDrafts: true } as const;
const NOW = new Date("2026-08-26T12:00:00Z");

const approved: PlacementInput = {
  scopeKind: null,
  scopeSlug: null,
  reviewState: "approved",
  isPublished: true,
  effectiveFrom: null,
  effectiveUntil: null,
};

describe("isLive", () => {
  it("shows an approved, published, always-on block", () => {
    expect(isLive(approved, NOW, PUBLIC_ONLY)).toBe(true);
  });

  it("hides a draft from a customer and shows it under preview", () => {
    const draft = {
      ...approved,
      reviewState: "draft",
      isPublished: false,
    } as const;
    expect(isLive(draft, NOW, PUBLIC_ONLY)).toBe(false);
    expect(isLive(draft, NOW, PREVIEW)).toBe(true);
  });

  it("hides a block whose window has not opened", () => {
    const future = {
      ...approved,
      effectiveFrom: new Date("2026-09-01T00:00:00Z"),
    };
    expect(isLive(future, NOW, PUBLIC_ONLY)).toBe(false);
  });

  it("hides a block whose window has closed", () => {
    const past = {
      ...approved,
      effectiveUntil: new Date("2026-08-20T00:00:00Z"),
    };
    expect(isLive(past, NOW, PUBLIC_ONLY)).toBe(false);
  });

  it("does not let preview resurrect an expired campaign", () => {
    const past = {
      ...approved,
      reviewState: "draft",
      isPublished: false,
      effectiveUntil: new Date("2026-08-20T00:00:00Z"),
    } as const;
    // L-6 refused permanent promotional furniture. A campaign that outlives its
    // end date in development is that furniture, one environment removed.
    expect(isLive(past, NOW, PREVIEW)).toBe(false);
  });

  it("treats the end of the window as exclusive and its start as inclusive", () => {
    expect(isLive({ ...approved, effectiveUntil: NOW }, NOW, PUBLIC_ONLY)).toBe(
      false,
    );
    expect(isLive({ ...approved, effectiveFrom: NOW }, NOW, PUBLIC_ONLY)).toBe(
      true,
    );
  });
});

describe("selectScoped — specific replaces generic", () => {
  const generic = { scopeKind: null, scopeSlug: null, key: "generic" } as const;
  const lak = { scopeKind: "concern", scopeSlug: "lak", key: "lak" } as const;
  const acne = {
    scopeKind: "concern",
    scopeSlug: "acne",
    key: "acne",
  } as const;
  const all = [generic, lak, acne];

  it("returns a scope's own blocks alone, never merged with the generic set", () => {
    expect(selectScoped(all, { kind: "concern", slug: "lak" })).toEqual([lak]);
  });

  it("falls back to the generic set when a scope has none of its own", () => {
    expect(selectScoped(all, { kind: "concern", slug: "barrier" })).toEqual([
      generic,
    ]);
  });

  it("returns the generic set for an unscoped request", () => {
    expect(selectScoped(all, null)).toEqual([generic]);
  });

  it("does not match a slug across scope kinds", () => {
    expect(selectScoped(all, { kind: "brand", slug: "lak" })).toEqual([
      generic,
    ]);
  });

  it("returns nothing when there is nothing — the section then disappears", () => {
    expect(selectScoped([lak], { kind: "concern", slug: "acne" })).toEqual([]);
  });
});
