import Image from "next/image";
import { useTranslations } from "next-intl";
import { Carousel } from "@/components/layout/carousel";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { ProductTile as ProductTileModel } from "../models/page-models";
import { OfferLine, ProfessionalMark } from "./offer-line";

/**
 * **B1 · Product spotlight, paginated.**
 *
 * One product at a time, large: the image on an offset panel, the name, its
 * promise, its true offer state, one action, and previous/next through a
 * curated set. It is the strongest block on the Forlle'd site and it costs
 * nothing new here, because `getShopHub().featured` already supplies exactly
 * this list.
 *
 * The overlap between the image panel and the text panel is what makes it read
 * as composed rather than as a slide. It is done with a negative inline-start
 * margin on the text at `lg`, which mirrors correctly in Persian because the
 * margin is logical.
 *
 * One slide per view, deliberately. A spotlight that shows two products at once
 * is a rail, and there is already a rail on this page.
 */
export function ProductSpotlight({
  products,
}: {
  readonly products: readonly ProductTileModel[];
}) {
  const t = useTranslations("shop");

  const slides = products.map((product) => (
    <SpotlightSlide key={product.slug} product={product} />
  ));

  return (
    <Carousel
      items={slides}
      label={t("spotlight.railLabel")}
      previousLabel={t("rail.previous")}
      nextLabel={t("rail.next")}
      slidesPerView={{ base: 1 }}
      showPagination
    />
  );
}

function SpotlightSlide({ product }: { readonly product: ProductTileModel }) {
  const t = useTranslations("shop");

  return (
    <article className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:gap-0">
      <div className="relative aspect-[4/5] mx-auto max-w-[var(--media-hero-max-w)] w-full bg-ground">
        {product.image ? (
          <Image
            src={product.image.src}
            alt={product.image.alt}
            fill
            sizes="(max-width: 1024px) 90vw, 40vw"
            className="object-contain p-10"
          />
        ) : (
          <span className="grid size-full place-items-center text-micro tracking-[0.14em] text-stone-text">
            {t("imagePending")}
          </span>
        )}
        <ProfessionalMark offer={product.offer} />
      </div>

      <div className="flex flex-col gap-6 bg-ground p-8 lg:-ms-16 lg:p-14">
        <Link
          href={product.brandHref}
          className="text-micro uppercase tracking-[0.16em] text-gold-text hover:underline"
        >
          {product.brandName}
        </Link>
        <h3 className="text-h2 font-bold text-balance">
          <Link href={product.href} className="hover:text-teal">
            {product.name}
          </Link>
        </h3>
        {product.promise && (
          <p className="max-w-[38em] text-lede leading-fa font-light text-stone-text">
            {product.promise}
          </p>
        )}

        <OfferLine
          offer={product.offer}
          price={product.price}
          enquiryHref={t("enquiryHref")}
          size="large"
        />

        <Button asChild size="lg" className="mt-2 w-fit">
          <Link href={product.href}>{t("spotlight.action")}</Link>
        </Button>
      </div>
    </article>
  );
}
