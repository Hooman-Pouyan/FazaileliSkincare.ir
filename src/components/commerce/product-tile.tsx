import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Price, PriceOnRequest } from "./price";
import type { ProductSummary } from "./types";

/**
 * A product tile is a BORDERLESS IMAGE with type beneath it.
 * No card, no border, no shadow — that is the whole brief (docs/09, docs/10).
 */
export function ProductTile({
  product,
  enquiryHref = "#",
  priority = false,
  className,
}: {
  product: ProductSummary;
  enquiryHref?: string;
  priority?: boolean;
  className?: string;
}) {
  const eyebrow = [product.brandName, product.lineName].filter(Boolean).join(" · ");

  return (
    <article className={cn("group flex flex-col gap-4", className)}>
      <Link href={`/shop/p/${product.slug}`} className="block" tabIndex={-1} aria-hidden={false}>
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--sand)]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt=""
              fill
              priority={priority}
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 320px"
              className="object-cover transition-transform duration-[var(--duration)] ease-[var(--easing)] group-hover:scale-[1.02]"
            />
          ) : (
            <span className="grid size-full place-items-center text-[11px] tracking-[0.14em] text-[color-mix(in_oklab,var(--ink)_40%,transparent)]">
              تصویر محصول
            </span>
          )}
          {product.isProfessionalOnly && (
            <span className="absolute top-3 inset-inline-start-3 border border-[var(--hairline)] bg-[var(--ground)] px-2.5 py-1 text-[11px] text-[var(--gold-text)]">
              حرفه‌ای
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-col gap-1.5">
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.13em] text-[var(--gold-text)]">{eyebrow}</p>
        )}
        <h3 className="text-[19px] font-medium leading-[1.6]">
          <Link href={`/shop/p/${product.slug}`} className="hover:text-[var(--lapis)]">
            {product.name}
          </Link>
        </h3>
        {product.promise && (
          <p className="text-[14px] leading-[1.85] text-[var(--stone-text)]">{product.promise}</p>
        )}
        {product.sizeLabel && (
          <p className="text-[13px] text-[var(--stone-text)]">{product.sizeLabel}</p>
        )}

        <div className="mt-1.5">
          {product.priceVisibility === "on_request" || product.priceRials == null ? (
            <PriceOnRequest href={enquiryHref} />
          ) : (
            <Price amountRials={product.priceRials} compareAtRials={product.compareAtRials} />
          )}
        </div>

        {!product.inStock && (
          <p className="text-[13px] text-[var(--stone-text)]">فعلاً موجود نیست</p>
        )}
      </div>
    </article>
  );
}
