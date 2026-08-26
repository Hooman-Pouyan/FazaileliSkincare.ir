import { useTranslations } from "next-intl";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container, Section } from "@/components/layout/container";
import { Reveal } from "@/components/layout/reveal";
import { Link } from "@/i18n/navigation";
import { AddToCart } from "@/modules/cart/components/add-to-cart";
import { OfferLine } from "../components/offer-line";
import { PairsWith } from "../components/pairs-with";
import { ProductDisclosure } from "../components/product-disclosure";
import { ProductGallery } from "../components/product-gallery";
import type { ProductDetailPage } from "../models/page-models";

/**
 * The product page — `PDP-02`.
 *
 * Composition comes from the design system's `ui_kits/storefront/Product.jsx`:
 * a 60/40 editorial split, then a second 60/40 row pairing the disclosure
 * accordion with a consultation panel, then «مکمل این محصول» on a surface band.
 * An editorial spread, not a spec sheet — and no card around any of it, which
 * is `10-design-playbook.md` and the reason the whole site does not look like
 * every other skincare site.
 *
 * **`OfferLine` renders the money and the state**, the same component the hub
 * tile and the listing tile use, on the same `resolveOfferState` output. A
 * product page that computed its own availability is exactly how a shopper
 * reaches an add-to-cart button for something that cannot be sold, and it is
 * the failure `offer.ts` exists to make impossible.
 *
 * **There is no add-to-cart control yet, deliberately.** The cart is the next
 * packet and `CART-05` is explicit: *"do not ship a dead button."* Every offer
 * state below is truthful without one.
 */
export function ProductDetailScreen({
  page,
}: {
  readonly page: ProductDetailPage;
}) {
  const t = useTranslations("pdp");
  const shop = useTranslations("shop");
  const enquiryHref = shop("enquiryHref");

  const selectedVariantId =
    page.offer.kind === "purchasable" ? page.offer.variantId : null;

  return (
    <main>
      <Container className="pt-14">
        <Breadcrumbs items={page.breadcrumbs} />

        <Reveal className="grid grid-cols-1 gap-10 pt-8 lg:grid-cols-[6fr_4fr] lg:items-start lg:gap-[var(--space-8)]">
          <ProductGallery media={page.media} />

          <div className="flex flex-col gap-4 lg:pt-1">
            <p className="m-0 text-micro uppercase tracking-[0.13em] text-gold-text">
              {/* `min-h-6` clears the WCAG 2.2 AA target-size floor — see the
                  same note on `ProductTile`. */}
              <Link
                href={page.brand.href}
                className="inline-flex min-h-6 items-center hover:underline"
              >
                {page.brand.name}
              </Link>
            </p>

            <h1 className="m-0 text-h1 leading-fa font-bold">{page.name}</h1>

            {page.promise && (
              <p className="m-0 max-w-[32em] text-lede leading-fa font-light text-stone-text">
                {page.promise}
              </p>
            )}

            {/* A hairline, not a card edge — `10-design-playbook.md`. */}
            <div className="h-px bg-[var(--hairline)]" role="presentation" />

            <OfferLine
              offer={page.offer}
              price={page.price}
              enquiryHref={enquiryHref}
              size="large"
            />

            {/*
              Sizes are links, not client state. `getProduct` already takes the
              selected variant, so the server decides the offer for the chosen
              size rather than the browser recomputing a price — which is
              `PDP-04`, and which also keeps the page correct with JavaScript
              off. `scroll={false}` is `R-2`'s recommendation applied here
              rather than repeated as a defect: changing size must not throw the
              reader back to the top of the page.
            */}
            {page.variants.length > 1 && (
              <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
                <legend className="p-0 text-small text-stone-text">
                  {t("variants.label")}
                </legend>
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {page.variants.map((entry) => {
                    const isSelected = entry.id === selectedVariantId;
                    return (
                      <li key={entry.id}>
                        <Link
                          href={entry.href}
                          scroll={false}
                          aria-current={isSelected ? "true" : undefined}
                          className={
                            isSelected
                              ? "inline-flex min-h-11 items-center border border-[color:var(--gold)] px-4 text-small font-medium text-ink"
                              : "inline-flex min-h-11 items-center border border-[var(--hairline-soft)] px-4 text-small text-stone-text hover:border-[color:var(--gold)] hover:text-ink"
                          }
                        >
                          {entry.sizeLabel ?? entry.sku}
                          {!entry.isAvailable && (
                            <span className="ms-2 text-micro text-stone-text">
                              {t("variants.unavailable")}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            )}

            {/*
              The one purchase control, and only for a `purchasable` offer.
              Every other state is refused before this renders, so there is no
              disabled branch: a greyed-out button says "you cannot buy this",
              where the truth is usually "choose a size", "ask us", or "this is
              for professionals" — which `OfferLine` above has already said.
            */}
            {page.offer.kind === "purchasable" && (
              <AddToCart variantId={page.offer.variantId} />
            )}

            {page.offer.kind === "professional_only" && (
              <p className="m-0 text-small leading-fa text-stone-text">
                {t("professionalNote")}
              </p>
            )}
          </div>
        </Reveal>
      </Container>

      <Container className="pt-[var(--space-8)] pb-[var(--space-9)]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[6fr_4fr] lg:gap-[var(--space-8)]">
          <ProductDisclosure sections={page.disclosures} />

          {/*
            `PDP-09`'s escalation, and the one piece of this page that is not
            about the product. Someone who is unsure should be able to ask
            rather than guess, and the answer is a consultation rather than a
            purchase. It says nothing about duration, place or price — those are
            the maintainer's facts and none of them is recorded.
          */}
          <aside className="flex h-fit flex-col gap-3 rounded-[var(--radius-surface)] bg-linen p-6">
            <p className="m-0 text-micro uppercase tracking-[0.13em] text-gold-text">
              {t("consult.eyebrow")}
            </p>
            <p className="m-0 text-body leading-fa">{t("consult.body")}</p>
            <Link
              href="/book"
              className="mt-2 inline-flex min-h-11 items-center self-start border-b border-[color:var(--gold)] pb-1 text-small font-medium text-ink"
            >
              {t("consult.action")}
            </Link>
          </aside>
        </div>
      </Container>

      {page.pairsWith.length > 0 && (
        <Section tone="surface">
          <Container>
            <PairsWith products={page.pairsWith} enquiryHref={enquiryHref} />
          </Container>
        </Section>
      )}
    </main>
  );
}
