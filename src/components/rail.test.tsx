import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentPropsWithoutRef } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getLocale: async () => "fa",
  getTranslations: async () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ locale, ...props }: ComponentPropsWithoutRef<"a"> & { readonly locale?: string }) => {
    void locale;
    return <a {...props} />;
  },
}));

vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["fa", "en", "ar"] },
}));

import { Rail } from "./rail";

describe("Rail", () => {
  it("renders recognizable navigation icons", async () => {
    // Given: the storefront rail with the shop room active
    // When: the server component is rendered
    const markup = renderToStaticMarkup(await Rail({ active: "shop" }));

    // Then: every destination uses a recognizable icon from one family
    expect(markup).toContain("lucide-shopping-bag");
    expect(markup).toContain("lucide-calendar-days");
    expect(markup).toContain("lucide-graduation-cap");
    expect(markup).toContain("lucide-user-round");
  });
});
