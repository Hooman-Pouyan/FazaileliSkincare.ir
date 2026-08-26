import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ProductTile as ProductTileModel } from "../models/page-models";
import { OfferLine, ProfessionalMark } from "./offer-line";

/**
 * A product tile is a borderless image with type beneath it — no card, no
 * border, no shadow. That is the brief in `docs/09-brand-brief.md`, and the
 * reason is that a card grid is what makes a skincare site look like every
 * other skincare site.
 *
 * **`object-contain`, not `cover` — `R-4`.** The Storyderm packshots are
 * 1916 × 3547, so `cover` in a 4:5 box cropped roughly the middle third of a
 * bottle. The maintainer saw it and said the packshot should sit smaller and
 * centred; `GalleryBand` had been using `contain` all along, which is why its
 * images looked right and these did not. The padding is what makes the product
 * float on the field rather than touch its edges.
 *
 * The whole model arrives finished from `getShopHub`/`listProducts`: `href`,
 * `brandHref` and `price.label` are already correct. The tile builds no URL and
 * formats no money, so it cannot format either differently from the page it
 * links to.
 */
export function ProductTile({
  product,
  enquiryHref,
  priority = false,
  className,
}: {
  product: ProductTileModel;
  enquiryHref: string;
  priority?: boolean;
  className?: string;
}) {
  const t = useTranslations("shop");

  return (
    <article className={cn("group flex flex-col gap-4", className)}>
      <div className="relative aspect-[4/5] mx-auto max-w-[var(--media-tile-max-w)] w-full overflow-hidden bg-sand">
        {/*
          `relative` because `<Image fill>` positions against its *immediate*
          parent, and this link sits between the image and the aspect box. It
          rendered correctly by accident — absolute resolved to the grandparent
          — while Next warned about it on every tile on every page. Correct by
          construction now rather than by luck.
        */}
        <Link
          href={product.href}
          tabIndex={-1}
          className="relative block size-full"
        >
          {product.image ? (
            <Image
              src={product.image.src}
              alt={product.image.alt}
              fill
              priority={priority}
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 320px"
              className="object-contain p-4 transition-transform duration-[var(--duration)] ease-[var(--easing)] group-hover:scale-[1.02]"
            />
          ) : (
            <span className="grid size-full place-items-center text-micro tracking-[0.14em] text-stone-text">
              {t("imagePending")}
            </span>
          )}
        </Link>
        <ProfessionalMark offer={product.offer} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Link
          href={product.brandHref}
          // `py-1` is a tap target, not spacing: at the micro size this link
          // is 22px tall, under the 24×24 floor in WCAG 2.2 AA (2.5.8), and
          // the "inline in a sentence" exception does not cover a standalone
          // link. Measured at 390 during packet 8's browser pass.
          className="inline-flex min-h-6 items-center py-1 text-micro uppercase tracking-[0.13em] text-gold-text hover:underline"
        >
          {product.brandName}
        </Link>

        <h3 className="text-h3 font-medium leading-fa">
          <Link href={product.href} className="hover:text-teal">
            {product.name}
          </Link>
        </h3>

        {product.promise && (
          <p className="text-body leading-fa text-stone-text">
            {product.promise}
          </p>
        )}

        <div className="mt-1.5">
          <OfferLine
            offer={product.offer}
            price={product.price}
            enquiryHref={enquiryHref}
          />
        </div>
      </div>
    </article>
  );
}

/**
 * The grid a tile lives in. Borderless, so the rhythm comes from the gap rather
 * than from rules between cells.
 */
export function ProductGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
