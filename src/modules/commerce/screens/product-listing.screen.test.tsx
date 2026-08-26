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
  bands: [],
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

describe("editorial bands", () => {
  const intro = {
    key: "shop.listing.intro",
    kind: "editorial",
    heading: "خرید بر اساس دغدغه",
    body: "از دغدغه شروع کنید.",
    cta: null,
    items: [],
  } as const;

  const campaign = {
    key: "shop.listing.campaign.consultation",
    kind: "campaign",
    heading: "مطمئن نیستید؟",
    body: "یک جلسه رزرو کنید.",
    cta: { label: "رزرو مشاوره", href: "/booking" },
    items: [],
  } as const;

  const gallery = {
    key: "shop.listing.gallery.storyderm",
    kind: "gallery",
    heading: "از نزدیک",
    body: null,
    cta: null,
    items: [
      {
        key: "clinic-a-cream",
        title: "Clinic-A",
        body: "برای پوست چرب",
        media: {
          url: "/media/catalog/storyderm/clinic-a/clinic-a-cream/primary-640.webp",
          alt: "کرم Clinic-A",
        },
      },
    ],
  } as const;

  it("renders nothing when there are none — absence is the designed state", () => {
    const html = render(BASE);
    expect(html).not.toContain("خرید بر اساس دغدغه");
    expect(html).not.toContain(fa.plp.gallery.label);
  });

  it("puts an intro and a campaign above the results", () => {
    const html = render({ ...BASE, bands: [campaign, intro] });
    expect(html).toContain("خرید بر اساس دغدغه");
    expect(html).toContain("یک جلسه رزرو کنید.");
    // The CTA is a locale-aware Link, so a Persian reader gets an unprefixed
    // path — R-2. It must never render as a bare foreign href.
    expect(html).toContain('href="/booking"');
    // Both sit before the h1, which is what makes them frame the results
    // rather than interrupt them. Anchored to the tag, not to the title text:
    // the scope title also appears in the breadcrumb trail above.
    expect(html.indexOf("خرید بر اساس دغدغه")).toBeLessThan(
      html.indexOf("<h1"),
    );
  });

  it("puts a gallery caption in the static HTML, before hydration", () => {
    const html = render({ ...BASE, bands: [gallery] });
    expect(html).toContain("از نزدیک");
    expect(html).toContain("Clinic-A");
    expect(html).toContain("برای پوست چرب");
  });

  it("spends the Divider once, not twice, when a page has both", () => {
    // DS-4 caps the ornament at twice a page; two in a row read as furniture.
    // Counted against a page carrying one, because next/image writes the glyph
    // path into both `src` and `srcset` — an absolute count would assert the
    // image tag's shape rather than the number of dividers.
    const questions = [{ question: "پرسش", answer: "پاسخ" }];
    const occurrences = (html: string) =>
      html.split("brand-glyph-128.png").length - 1;

    const one = occurrences(render({ ...BASE, questions }));
    const both = occurrences(render({ ...BASE, bands: [gallery], questions }));

    expect(one).toBeGreaterThan(0);
    expect(both).toBe(one);
  });
});
