import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Price } from "./price";
import type { ProductSummary } from "./types";

/**
 * «مکمل این محصول» — not "related products".
 *
 * ZO's version of this reads as clinical duty of care rather than selling,
 * because it shows the protocol bookends (cleanser, sunscreen) instead of a
 * bigger-ticket upsell. Keep it to three, and choose them that way.
 */
export function PairsWith({
  products,
  title = "مکمل این محصول",
}: {
  products: ProductSummary[];
  title?: string;
}) {
  if (products.length === 0) return null;
  return (
    <section className="flex flex-col gap-8">
      <h2 className="text-[26px] font-bold">{title}</h2>
      <ul className="grid gap-10 md:grid-cols-3">
        {products.slice(0, 3).map((p) => (
          <li key={p.slug}>
            <Link
              href={`/shop/p/${p.slug}`}
              className="group flex items-center gap-5"
            >
              <div className="relative aspect-[4/5] w-[118px] shrink-0 overflow-hidden bg-[var(--sand)]">
                {p.imageUrl && (
                  <Image
                    src={p.imageUrl}
                    alt=""
                    fill
                    sizes="118px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[16.5px] font-medium leading-[1.6] group-hover:text-[var(--lapis)]">
                  {p.name}
                </span>
                {p.priceRials != null && (
                  <Price amountRials={p.priceRials} size="sm" />
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
