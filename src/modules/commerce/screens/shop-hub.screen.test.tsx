import type { ComponentPropsWithoutRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import fa from "@/messages/fa.json";
import type { OfferState } from "../models/offer";
import type { ProductTile, ShopHubPage } from "../models/page-models";
import { ShopHubScreen } from "./shop-hub.screen";

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

/**
 * The real Persian catalogue, not an echo of the keys.
 *
 * Packet 4's rail test mocked `getTranslations` to return its own key, so a
 * manifest that asked for `nav.locale` while the catalogue held `nav.language`
 * passed the test and failed on the first real request. Reading the shipped
 * JSON is what makes these assertions mean anything.
 */
/**
 * Asserts on the heading element rather than the bare word.
 *
 * The first version of these tests checked `html.not.toContain("برندها")` and
 * failed against correct output: the concerns lede says «به‌جای گشتن میان
 * برندها». A section is present when its heading is, not when its name appears
 * somewhere in the prose.
 */
function hasSection(html: string, title: string): boolean {
  return html.includes(`>${title}</h2>`);
}

function render(page: ShopHubPage): string {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="fa" messages={fa}>
      <ShopHubScreen page={page} />
    </NextIntlClientProvider>,
  );
}

const EMPTY: ShopHubPage = {
  concerns: [],
  brands: [],
  categories: [],
  featured: [],
  searchHref: "/fa/shop/search",
  meta: {
    title: "فروشگاه",
    description: null,
    canonicalHref: "/fa/shop",
    robots: "index,follow",
  },
};

function tile(
  offer: OfferState,
  price: ProductTile["price"] = null,
): ProductTile {
  return {
    slug: "serum",
    href: "/fa/shop/p/serum",
    name: "سرم هیالورونیک",
    brandName: "فورله‌د",
    brandHref: "/fa/shop/brand/forlled",
    promise: null,
    image: null,
    offer,
    price,
  };
}

const PRICE = { amountRials: 4_800_000n, label: "۴۸۰٬۰۰۰" };

describe("shop hub — sections appear only when they have something behind them", () => {
  it("renders the whole-page empty state when every axis is empty", () => {
    const html = render(EMPTY);
    expect(html).toContain(fa.shop.empty.title);
    expect(html).toContain(fa.shop.empty.action);
  });

  it("omits the concerns section rather than rendering an empty heading", () => {
    const html = render(EMPTY);
    expect(hasSection(html, fa.shop.concerns.title)).toBe(false);
    expect(hasSection(html, fa.shop.brands.title)).toBe(false);
    expect(hasSection(html, fa.shop.categories.title)).toBe(false);
    expect(hasSection(html, fa.shop.featured.title)).toBe(false);
  });

  it("renders a section as soon as it has one entry, and leaves the others out", () => {
    const html = render({
      ...EMPTY,
      concerns: [
        {
          slug: "melasma",
          name: "لک",
          description: "لک‌های ناشی از آفتاب و بارداری",
          href: "/fa/shop/concern/melasma",
          productCount: 3,
        },
      ],
    });

    expect(hasSection(html, fa.shop.concerns.title)).toBe(true);
    expect(html).toContain("لک");
    expect(html).toContain("/fa/shop/concern/melasma");
    expect(hasSection(html, fa.shop.brands.title)).toBe(false);
    expect(hasSection(html, fa.shop.categories.title)).toBe(false);
    expect(html).not.toContain(fa.shop.empty.title);
  });

  it("uses the hrefs the page model supplies and builds none of its own", () => {
    const html = render({
      ...EMPTY,
      featured: [
        tile(
          {
            kind: "purchasable",
            variantId: "v1",
            amountRials: 4_800_000n,
            onHand: 5,
          },
          PRICE,
        ),
      ],
    });
    expect(html).toContain('href="/fa/shop/p/serum"');
    expect(html).toContain('href="/fa/shop/brand/forlled"');
  });
});

describe("shop hub — every offer state renders its own truth", () => {
  it("shows the price for a purchasable product", () => {
    const html = render({
      ...EMPTY,
      featured: [
        tile(
          {
            kind: "purchasable",
            variantId: "v1",
            amountRials: 4_800_000n,
            onHand: 5,
          },
          PRICE,
        ),
      ],
    });
    expect(html).toContain("۴۸۰٬۰۰۰");
    expect(html).toContain(fa.shop.offer.currency);
    expect(html).not.toContain(fa.shop.offer.outOfStock);
  });

  it("marks a professional-only product visibly and gives it no price and no action", () => {
    const html = render({
      ...EMPTY,
      featured: [tile({ kind: "professional_only" }, PRICE)],
    });

    // Visible — decision D-18-2 keeps it on the shelf.
    expect(html).toContain(fa.shop.offer.professionalMark);
    expect(html).toContain(fa.shop.offer.professionalOnly);
    // Not purchasable, and not priced: no amount, no enquiry link.
    expect(html).not.toContain("۴۸۰٬۰۰۰");
    expect(html).not.toContain(fa.shop.offer.onRequest);
  });

  it("offers an enquiry and never a price for an on-request product", () => {
    const html = render({
      ...EMPTY,
      featured: [tile({ kind: "on_request" }, PRICE)],
    });
    expect(html).toContain(fa.shop.offer.onRequest);
    expect(html).not.toContain("۴۸۰٬۰۰۰");
  });

  it("says out of stock and still shows the real price", () => {
    const html = render({
      ...EMPTY,
      featured: [tile({ kind: "out_of_stock" }, PRICE)],
    });
    expect(html).toContain(fa.shop.offer.outOfStock);
    expect(html).toContain("۴۸۰٬۰۰۰");
  });

  it("sends a variant-required product to the product page to choose", () => {
    const html = render({
      ...EMPTY,
      featured: [
        tile({ kind: "variant_required", variantIds: ["v1", "v2"] }, PRICE),
      ],
    });
    expect(html).toContain(fa.shop.offer.variantRequired);
  });

  it("says unavailable and shows nothing else for an unavailable product", () => {
    const html = render({
      ...EMPTY,
      featured: [tile({ kind: "unavailable" }, PRICE)],
    });
    expect(html).toContain(fa.shop.offer.unavailable);
    expect(html).not.toContain("۴۸۰٬۰۰۰");
    expect(html).not.toContain(fa.shop.offer.onRequest);
  });
});
