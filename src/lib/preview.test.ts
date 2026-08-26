import { describe, expect, it } from "vitest";
import { PUBLIC_ONLY, resolveDraftPreview } from "./preview";

describe("draft preview is server-owned", () => {
  it("is never on in production, whatever the setting says", () => {
    for (const setting of [undefined, "on", "off", "true", "1", "yes"]) {
      expect(resolveDraftPreview("production", setting)).toEqual(PUBLIC_ONLY);
    }
  });

  it("is on by default outside production", () => {
    expect(resolveDraftPreview("development", undefined).previewDrafts).toBe(
      true,
    );
    expect(resolveDraftPreview("test", undefined).previewDrafts).toBe(true);
  });

  it("can be turned off to see exactly what a customer sees", () => {
    expect(resolveDraftPreview("development", "off").previewDrafts).toBe(false);
  });
});
