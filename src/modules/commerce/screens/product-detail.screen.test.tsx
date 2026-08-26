import type { ComponentPropsWithoutRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import fa from "@/messages/fa.json";
import type { OfferState } from "../models/offer";
import type { ProductDetailPage } from "../models/page-models";
import { QueryProvider } from "@/lib/query/query-provider";
import { CartStoreProvider } from "@/modules/cart/cart.store-provider";
import { ProductDetailScreen } from "./product-detail.screen";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    locale,
    scroll,
    ...props
  }: ComponentPropsWithoutRef<"a"> & {
    readonly locale?: string;
    readonly scroll?: boolean;
  }) => {
    void locale;
    void scroll;
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
 * The real boundaries, not mocks. `AddToCart` is a Query consumer inside a
 * Zustand provider, and rendering it without them would test a component the
 * application never mounts.
 */
function render(page: ProductDetailPage): string {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="fa" messages={fa}>
      <QueryProvider>
        <CartStoreProvider>
          <ProductDetailScreen page={page} />
        </CartStoreProvider>
      </QueryProvider>
    </NextIntlClientProvider>,
  );
}

const PURCHASABLE: OfferState = {
  kind: "purchasable",
  variantId: "v1",
  amountRials: 41_800_000n,
  onHand: 4,
};

const BASE: ProductDetailPage = {
  slug: "ultra-a-z-cream",
  name: "کرم Ultra A-Z",
  promise: "مرطوب‌کننده روزانه",
  description: null,
  ingredients: null,
  usage: null,
  suitableFor: null,
  brand: {
    slug: "storyderm",
    name: "استوری‌درم",
    href: "/shop/brand/storyderm",
    countryCode: "KR",
  },
  category: { slug: "cream", name: "کرم", href: "/shop/c/cream" },
  concerns: [],
  media: [
    {
      src: "/media/a-1600.webp",
      alt: "کرم Ultra A-Z",
      width: 1600,
      height: 2000,
    },
  ],
  variants: [
    {
      id: "v1",
      sku: "DEMO-1",
      sizeLabel: "۵۰ میلی‌لیتر",
      isAvailable: true,
      price: { amountRials: 41_800_000n, label: "۴٬۱۸۰٬۰۰۰" },
      href: "/shop/p/ultra-a-z-cream?variant=v1",
    },
  ],
  offer: PURCHASABLE,
  price: { amountRials: 41_800_000n, label: "۴٬۱۸۰٬۰۰۰" },
  disclosures: [],
  pairsWith: [],
  breadcrumbs: [
    { label: "فروشگاه", href: "/shop" },
    { label: "کرم Ultra A-Z", href: "/shop/p/ultra-a-z-cream" },
  ],
  meta: {
    title: "کرم Ultra A-Z",
    description: "مرطوب‌کننده روزانه",
    canonicalPath: "/shop/p/ultra-a-z-cream",
    robots: "index,follow",
  },
};

describe("ProductDetailScreen", () => {
  it("names the product once, as the page heading", () => {
    // Given: a purchasable product
    // When: the page renders
    const html = render(BASE);

    // Then: exactly one h1, and it is the product
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("کرم Ultra A-Z");
  });

  it("offers the add control for a purchasable product", () => {
    const html = render(BASE);
    expect(html).toContain(fa.cart.addToCart);
  });

  /**
   * `PDP-05`, and the reason there is no disabled branch: a greyed-out button
   * tells a customer the product cannot be bought, when the truth is that they
   * must choose a size, or ask, or that it is for professionals. `OfferLine`
   * says which; the button simply is not there.
   */
  it.each([
    ["professional_only", { kind: "professional_only" } as const],
    ["on_request", { kind: "on_request" } as const],
    ["out_of_stock", { kind: "out_of_stock" } as const],
    ["unavailable", { kind: "unavailable" } as const],
    ["variant_required", { kind: "variant_required", variantIds: [] } as const],
  ])("offers no add control for %s", (_label, offer) => {
    const html = render({ ...BASE, offer, price: null });
    expect(html).not.toContain(fa.cart.addToCart);
  });

  /** `CART-05`: "do not ship a dead button." Checkout is a later programme. */
  it("ships no checkout control anywhere on the page", () => {
    const html = render(BASE);
    expect(html).not.toContain("پرداخت");
  });

  /**
   * `PDP-05`: a restricted product must not leak a protected price. The trade
   * price is not the public one, which is the whole reason the state exists.
   */
  it("shows no price for a professional-only product", () => {
    const html = render({
      ...BASE,
      offer: { kind: "professional_only" },
      price: null,
      variants: [],
    });

    expect(html).not.toContain("۴٬۱۸۰٬۰۰۰");
    expect(html).toContain(fa.shop.offer.professionalOnly);
    expect(html).toContain(fa.pdp.professionalNote);
  });

  /**
   * `PDP-09` and review item `5.3`. `shop.enquiryHref` is `https://wa.me/`
   * with no number, which opens WhatsApp with nobody in it.
   */
  it("offers no enquiry link while the destination goes nowhere", () => {
    const html = render({
      ...BASE,
      offer: { kind: "on_request" },
      price: null,
    });

    expect(html).toContain(fa.shop.offer.onRequest);
    expect(html).not.toContain('href="https://wa.me/"');
  });

  /**
   * `PDP-08`. An empty companion list means nobody has chosen one — a heading
   * over nothing would instead claim the product has no companions.
   */
  it("omits «مکمل این محصول» entirely when there are no pairings", () => {
    const html = render(BASE);
    expect(html).not.toContain(fa.pdp.pairsWith.title);
  });

  it("renders companions as listing tiles when there are some", () => {
    const html = render({
      ...BASE,
      pairsWith: [
        {
          slug: "ultra-essence-clean",
          href: "/shop/p/ultra-essence-clean",
          name: "پاک‌کننده Ultra Essence",
          brandName: "استوری‌درم",
          brandHref: "/shop/brand/storyderm",
          promise: null,
          image: null,
          offer: { kind: "out_of_stock" },
          price: null,
        },
      ],
    });

    expect(html).toContain(fa.pdp.pairsWith.title);
    expect(html).toContain("پاک‌کننده Ultra Essence");
  });

  /**
   * `PDP-07`. An accordion heading that opens onto nothing reads as a fault,
   * so a product with no approved copy shows no disclosure section at all —
   * which is every product today, since no row carries ingredients or usage.
   */
  it("omits the disclosure accordion when nothing has been written", () => {
    const html = render(BASE);
    expect(html).not.toContain(fa.pdp.disclosure.title);
  });

  it("keeps every disclosure in the document even when its panel is shut", () => {
    const html = render({
      ...BASE,
      disclosures: [
        { key: "usage", body: "شب، روی پوست تمیز." },
        { key: "ingredients", body: "نیاسینامید ۴٪." },
      ],
    });

    // Both bodies are present, in the design system's fixed order, whatever
    // the panel state — the reason it is an accordion and never tabs.
    expect(html).toContain("شب، روی پوست تمیز.");
    expect(html).toContain("نیاسینامید ۴٪.");
    expect(html.indexOf(fa.pdp.disclosure.ingredients)).toBeLessThan(
      html.indexOf(fa.pdp.disclosure.usage),
    );
  });

  /**
   * «اصالت کالا» is the counterfeit answer, and it is the section most likely
   * to be filled with a reassuring sentence nobody is entitled to write.
   */
  it("shows the authenticity section only when a real IRC code exists", () => {
    const without = render(BASE);
    expect(without).not.toContain(fa.pdp.disclosure.authenticity);

    const withCode = render({
      ...BASE,
      disclosures: [{ key: "authenticity", body: "1234567890" }],
    });
    expect(withCode).toContain(fa.pdp.disclosure.authenticity);
    expect(withCode).toContain("1234567890");
  });

  /** `E-6`: the shell owns the rail offset; a screen never compensates. */
  it("does not re-add the rail offset", () => {
    expect(render(BASE)).not.toContain("ms-14");
  });

  it("offers a consultation without promising a duration or a place", () => {
    const html = render(BASE);
    expect(html).toContain(fa.pdp.consult.action);
    expect(html).toContain('href="/book"');
  });
});
