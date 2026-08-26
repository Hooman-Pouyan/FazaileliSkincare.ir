import { useTranslations } from "next-intl";
import type { ProductTile as ProductTileModel } from "../models/page-models";
import { ProductTile } from "./product-tile";

/**
 * «مکمل این محصول» — `PDP-08`.
 *
 * Not "related products". The design system is explicit about the label and it
 * matters: *related* is a similarity claim a machine can make, *مکمل* — a
 * complement — is a claim about using two things together, which is why the
 * rows are explicit rather than inferred from a shared concern.
 *
 * Renders nothing when there are none. Every pairing is a decision someone
 * made, so an empty list means nobody has made one yet — and an empty frame
 * headed «مکمل این محصول» would say the product has no companions, which is a
 * different and untrue statement.
 *
 * The tiles are the listing's own `ProductTile` on the listing's own model, so
 * a companion cannot show a price or an offer state differently from the
 * listing it also appears in.
 */
export function PairsWith({
  products,
  enquiryHref,
}: {
  readonly products: readonly ProductTileModel[];
  readonly enquiryHref: string;
}) {
  const t = useTranslations("pdp");
  if (products.length === 0) return null;

  return (
    <section className="flex flex-col gap-10">
      <h2 className="text-h2 font-bold">{t("pairsWith.title")}</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3">
        {products.map((product) => (
          <ProductTile
            key={product.slug}
            product={product}
            enquiryHref={enquiryHref}
          />
        ))}
      </div>
    </section>
  );
}
