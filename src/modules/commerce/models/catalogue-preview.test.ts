import { describe, expect, it } from "vitest";
import { PUBLIC_CATALOGUE, resolveCataloguePreview } from "./catalogue-preview";

describe("draft preview is server-owned", () => {
  it("is never on in production, whatever the setting says", () => {
    for (const setting of [undefined, "on", "off", "true", "1", "yes"]) {
      expect(resolveCataloguePreview("production", setting)).toEqual(
        PUBLIC_CATALOGUE,
      );
    }
  });

  it("is on by default outside production", () => {
    expect(
      resolveCataloguePreview("development", undefined).previewDrafts,
    ).toBe(true);
    expect(resolveCataloguePreview("test", undefined).previewDrafts).toBe(true);
  });

  it("can be turned off to see exactly what a customer sees", () => {
    expect(resolveCataloguePreview("development", "off").previewDrafts).toBe(
      false,
    );
  });
});
