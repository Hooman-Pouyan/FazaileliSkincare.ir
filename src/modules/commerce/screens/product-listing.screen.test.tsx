import type { ComponentPropsWithoutRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import fa from "@/messages/fa.json";
import type { ProductListingPage } from "../models/page-models";
import { ProductListingScreen } from "./product-listing.screen";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    locale,
    ...props
  }: ComponentPropsWithoutRef<"a"> & { readonly locale?: string }) => {
    void locale;
    return <a {...props} />;
  },
}));

vi.mock("next/image", () => ({
  default: ({
    fill,
    ...props
  }: ComponentPropsWithoutRef<"img"> & { fill?: boolean }) => {
    void fill;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt ?? ""} {...props} />;
  },
}));

function render(page: ProductListingPage): string {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="fa" messages={fa}>
      <ProductListingScreen page={page} />
    </NextIntlClientProvider>,
  );
}

const BASE: ProductListingPage = {
  scope: { kind: "concern", title: "لک", introduction: null },
  breadcrumbs: [
    { label: "فروشگاه", href: "/shop" },
    { label: "لک", href: "/shop/concern/lak" },
  ],
  query: {
    scope: { kind: "concern", slug: "lak" },
    brands: [],
    concerns: [],
    categories: [],
    inStockOnly: false,
    minPriceRials: null,
    maxPriceRials: null,
    sort: "featured",
    page: 1,
  },
  results: [],
  facets: [],
  appliedFilters: [],
  clearFiltersHref: null,
  sortOptions: [
    { value: "featured", href: "/shop/concern/lak", isCurrent: true },
    {
      value: "price_asc",
      href: "/shop/concern/lak?sort=price_asc",
      isCurrent: false,
    },
  ],
  pagination: {
    page: 1,
    pageCount: 1,
    pageSize: 24,
    total: 0,
    pages: [{ page: 1, href: "/shop/concern/lak", isCurrent: true }],
    previousHref: null,
    nextHref: null,
  },
  meta: {
    title: "لک",
    description: null,
    canonicalPath: "/shop/concern/lak",
    robots: "index,follow",
  },
};

describe("the listing works without JavaScript", () => {
  it("renders every facet value as a link with its count", () => {
    const html = render({
      ...BASE,
      facets: [
        {
          parameter: "brand",
          options: [
            {
              value: "forlled",
              label: "فورله‌د",
              count: 4,
              isApplied: false,
              href: "/shop/concern/lak?brand=forlled",
            },
            {
              value: "thalgo",
              label: "تالگو",
              count: 0,
              isApplied: true,
              href: "/shop/concern/lak",
            },
          ],
        },
      ],
    });

    // Links, not checkboxes: a filtered listing has a real address it can be
    // shared at, returned to, and ranked for.
    expect(html).toContain('href="/shop/concern/lak?brand=forlled"');
    expect(html).toContain("فورله‌د");
    expect(html).toContain(">4<");
    // An applied value stays visible at zero, or it could never be removed.
    expect(html).toContain("تالگو");
  });

  it("renders sort as a row of links rather than a select", () => {
    const html = render(BASE);
    expect(html).not.toContain("<select");
    expect(html).toContain(fa.plp.sort.featured);
    expect(html).toContain(fa.plp.sort.price_asc);
    expect(html).toContain('href="/shop/concern/lak?sort=price_asc"');
  });

  it("marks the current page and the current sort for assistive technology", () => {
    const html = render(BASE);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-current="true"');
  });

  it("hides pagination entirely when there is one page", () => {
    const html = render(BASE);
    expect(html).not.toContain(fa.plp.paginationLabel);
  });
});

describe("the listing tells the truth about being empty", () => {
  it("distinguishes an empty filtered scope from an empty search", () => {
    const scoped = render(BASE);
    expect(scoped).toContain(fa.plp.empty.title);
    expect(scoped).not.toContain(fa.plp.empty.searchTitle);

    const searched = render({
      ...BASE,
      scope: { kind: "search", title: "سرم", introduction: null },
    });
    expect(searched).toContain(fa.plp.empty.searchTitle);
  });

  it("offers to clear filters when there are some, and the shop when there are not", () => {
    expect(render(BASE)).toContain(fa.plp.empty.action);

    const filtered = render({
      ...BASE,
      appliedFilters: [
        {
          parameter: "brand",
          value: "forlled",
          removeHref: "/shop/concern/lak",
        },
      ],
      clearFiltersHref: "/shop/concern/lak",
    });
    expect(filtered).toContain(fa.plp.clearFilters);
  });

  it("says how many results there are, including none", () => {
    expect(render(BASE)).toContain("محصولی پیدا نشد");
  });
});
