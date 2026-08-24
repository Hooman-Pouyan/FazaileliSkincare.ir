import { afterEach, describe, expect, it, vi } from "vitest";

const originalVercel = process.env.VERCEL;

async function loadConfig(vercel: string | undefined) {
  if (vercel === undefined) {
    delete process.env.VERCEL;
  } else {
    process.env.VERCEL = vercel;
  }

  vi.resetModules();
  const { default: config } = await import("./next.config");
  return config;
}

afterEach(() => {
  if (originalVercel === undefined) {
    delete process.env.VERCEL;
  } else {
    process.env.VERCEL = originalVercel;
  }

  vi.resetModules();
});

describe("deployment output", () => {
  it("omits standalone output for Vercel adapter builds", async () => {
    const config = await loadConfig("1");

    expect(config).not.toHaveProperty("output");
  });

  it("keeps standalone output for Liara builds", async () => {
    const config = await loadConfig(undefined);

    expect(config).toHaveProperty("output", "standalone");
  });
});
