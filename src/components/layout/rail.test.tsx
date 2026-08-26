import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getLocale: async () => "fa",
  getTranslations: async () => (key: string) => `nav.${key}`,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    locale,
    ...props
  }: ComponentPropsWithoutRef<"a"> & { readonly locale?: string }) => {
    void locale;
    return <a {...props} />;
  },
}));

// The client leaves own interaction, not structure. Rendering them here would
// test React's hooks rather than the rail's composition.
vi.mock("./rail-link", () => ({
  RailLink: ({
    href,
    label,
    children,
  }: {
    href: string;
    label: string;
    children: ReactNode;
  }) => (
    <a href={href} data-rail-link>
      {children}
      <span>{label}</span>
    </a>
  ),
}));
vi.mock("./command-trigger", () => ({
  CommandTrigger: ({ label }: { label: string }) => (
    <button type="button" data-command-trigger>
      {label}
    </button>
  ),
}));
vi.mock("./locale-switch", () => ({
  LocaleSwitch: ({ label }: { label: string }) => (
    <div data-locale-switch>{label}</div>
  ),
}));

import { Rail } from "./rail";

async function markup(): Promise<string> {
  return renderToStaticMarkup(await Rail());
}

describe("Rail", () => {
  it("renders every rail destination from the manifest, in order", async () => {
    const html = await markup();

    const order = ["shop", "book", "academy"].map((room) =>
      html.indexOf(`/${room}`),
    );
    expect(order.every((index) => index > -1)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("uses the official compact glyph to link to the locale landing page", async () => {
    const html = await markup();

    expect(html).toContain('href="/"');
    expect(html).toContain("brand-glyph-128.png");
    expect(html).toContain('alt=""');
  });

  it("points the identity entry at /account, not /studio", async () => {
    // Decision N-2: /studio is the planned cross-room aggregate and is not built
    const html = await markup();

    expect(html).toContain("/account");
    expect(html).not.toContain("/studio");
  });

  it("carries the command and locale utilities", async () => {
    const html = await markup();

    expect(html).toContain("data-command-trigger");
    expect(html).toContain("data-locale-switch");
  });

  it("omits the cart until its gate opens", async () => {
    // SHELL-04: an affordance that cannot act is not a production control
    expect(await markup()).not.toContain("/cart");
  });

  it("names the navigation for assistive technology", async () => {
    // The previous rail used the Shop label as the whole nav's accessible name
    const html = await markup();

    expect(html).toContain('aria-label="nav.primary"');
  });

  it("uses recognizable icons from one family", async () => {
    const html = await markup();

    for (const icon of [
      "lucide-shopping-bag",
      "lucide-calendar-days",
      "lucide-graduation-cap",
      "lucide-user-round",
    ]) {
      expect(html, icon).toContain(icon);
    }
  });

  it("contains no physical direction or literal colour", async () => {
    // AGENTS.md rules 5 and 6. The previous rail hardcoded rgba(22,27,74,.34).
    const html = await markup();

    expect(html).not.toMatch(/rgba?\(/u);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b/u);
    expect(html).not.toMatch(/\b(margin|padding|border|inset)-(left|right)\b/u);
  });
});
