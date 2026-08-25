import { MessageCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { OfferState } from "../models/offer";
import type { PriceView } from "../models/page-models";

/**
 * The single presentation of what a customer may do with a product.
 *
 * `resolveOfferState` decides the truth once, in one pure function, for the hub
 * tile, the listing tile and the product page. This component is the other half
 * of that guarantee: every surface renders the same state the same way, so a
 * tile cannot promise something the page it links to refuses.
 *
 * There is deliberately no `inStock` boolean and no `isProfessionalOnly` flag in
 * these props. A pair of booleans can contradict the resolver; a discriminated
 * union cannot.
 *
 * `professional_only` renders visibly and without any purchase affordance, per
 * decision D-18-2: the product exists, its audience is stated, and no control
 * suggests otherwise.
 */
export function OfferLine({
  offer,
  price,
  enquiryHref,
  size = "default",
}: {
  offer: OfferState;
  price: PriceView | null;
  /** Where an `on_request` enquiry goes. */
  enquiryHref: string;
  size?: "default" | "large";
}) {
  const t = useTranslations("shop.offer");

  const priceClass =
    size === "large"
      ? "text-h2 font-medium tabular-nums"
      : "text-lede font-medium tabular-nums";

  switch (offer.kind) {
    case "purchasable":
    case "variant_required":
      return (
        <div className="flex flex-col gap-1.5">
          {price && (
            <p className="flex items-baseline gap-2">
              <span className={priceClass}>{price.label}</span>
              <span className="text-small font-light text-stone-text">
                {t("currency")}
              </span>
            </p>
          )}
          {offer.kind === "variant_required" && (
            <p className="text-small text-stone-text">{t("variantRequired")}</p>
          )}
        </div>
      );

    case "out_of_stock":
      return (
        <div className="flex flex-col gap-1.5">
          {price && (
            <p className="flex items-baseline gap-2 opacity-60">
              <span className={priceClass}>{price.label}</span>
              <span className="text-small font-light text-stone-text">
                {t("currency")}
              </span>
            </p>
          )}
          <p className="text-small text-stone-text">{t("outOfStock")}</p>
        </div>
      );

    case "on_request":
      // Never a price and never a cart control: taking an order at a price
      // nobody agreed is worse than asking the customer to write.
      return (
        <a
          href={enquiryHref}
          className="inline-flex items-center gap-2 self-start border-b border-firouzeh-text pb-1 text-small font-medium text-firouzeh-text"
        >
          {t("onRequest")}
          <MessageCircleIcon className="size-4" strokeWidth={1.5} aria-hidden />
        </a>
      );

    case "professional_only":
      return (
        <p className="text-small text-gold-text">{t("professionalOnly")}</p>
      );

    case "unavailable":
      return <p className="text-small text-stone-text">{t("unavailable")}</p>;
  }
}

/**
 * The professional-only mark that sits on the image. Separate from `OfferLine`
 * because it is a different position on the tile, not a different truth — both
 * read the same `OfferState`.
 */
export function ProfessionalMark({ offer }: { offer: OfferState }) {
  const t = useTranslations("shop.offer");
  if (offer.kind !== "professional_only") return null;

  return (
    <span className="absolute top-3 start-3 border border-[var(--hairline)] bg-ground px-2.5 py-1 text-micro text-gold-text">
      {t("professionalMark")}
    </span>
  );
}
