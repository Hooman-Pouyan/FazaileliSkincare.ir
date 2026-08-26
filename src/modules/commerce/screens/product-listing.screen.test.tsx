import type { ComponentPropsWithoutRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import fa from "@/messages/fa.json";
import { emptyQuery } from "../models/catalogue-query";
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
  query: emptyQuery({ kind: "concern", slug: "lak" }),
  results: [],
  facets: [],
  appliedFilters: [],
  clearFiltersHref: null,
  price: null,
  questions: [],
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

describe("the filter rail carries the manifest's axes", () => {
  it("renders the price range as a GET form, not a script-driven slider", () => {
    const html = render({
      ...BASE,
      price: {
        minToman: 120_000,
        maxToman: 980_000,
        appliedMinToman: null,
        appliedMaxToman: null,
        action: "/shop/concern/lak",
      },
    });

    // A range cannot be enumerated as links, but it can still be a form: the
    // browser submits it, the URL carries the bounds, and the result is an
    // addressable listing like every other filter.
    expect(html).toContain('method="get"');
    expect(html).toContain('action="/shop/concern/lak"');
    expect(html).toContain('name="price_min"');
    expect(html).toContain('name="price_max"');
  });

  it("omits the price control entirely when there is no range to bound", () => {
    expect(render(BASE)).not.toContain('name="price_min"');
  });

  it("renders every manifest facet group it is given", () => {
    const html = render({
      ...BASE,
      facets: [
        {
          parameter: "skin_type",
          options: [
            {
              value: "dry",
              label: "خشک",
              count: 3,
              isApplied: false,
              href: "/shop/concern/lak?skin_type=dry",
            },
          ],
        },
        {
          parameter: "line",
          options: [
            {
              value: "ultra-lift",
              label: "اولترا لیفت",
              count: 2,
              isApplied: false,
              href: "/shop/concern/lak?line=ultra-lift",
            },
          ],
        },
      ],
    });

    expect(html).toContain(fa.plp.facets.skin_type);
    expect(html).toContain(fa.plp.facets.line);
    expect(html).toContain("خشک");
    expect(html).toContain("اولترا لیفت");
  });
});

describe("scope questions", () => {
  it("renders nothing when there are none — the state it ships in", () => {
    expect(render(BASE)).not.toContain(fa.plp.questionsTitle);
  });

  it("puts every answer in the static HTML, open panel or not", () => {
    // An accordion, not tabs: tabs hide content from a crawler and from a
    // scrolling reader.
    const html = render({
      ...BASE,
      questions: [
        { question: "لک چقدر طول می‌کشد؟", answer: "معمولاً چند ماه." },
      ],
    });
    expect(html).toContain("لک چقدر طول می‌کشد؟");
    expect(html).toContain("معمولاً چند ماه.");
  });
});
