import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { BlossomOrnament, SlashMark } from "@/components/brand/blossom";
import { Carousel } from "@/components/layout/carousel";
import { Reveal } from "@/components/layout/reveal";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type {
  HubBrand,
  HubCategory,
  HubConcern,
  HubConcernSpotlight,
} from "../models/page-models";
import { ProductTile } from "./product-tile";

/**
 * The hub's sections. Concern first, brand second, type third — the order in
 * `docs/04-information-architecture.md` §1.
 *
 * Everything here is server-rendered; the only client boundaries are the
 * carousel and the reveal, and both receive finished markup as children.
 */

export function SectionHeading({
  title,
  lede,
  tone = "ground",
  action,
}: {
  readonly title: string;
  readonly lede?: string;
  readonly tone?: "ground" | "dark";
  readonly action?: React.ReactNode;
}) {
  return (
    <Reveal className="flex flex-wrap items-end justify-between gap-6 pb-12">
      <div className="flex max-w-[42em] flex-col gap-4">
        <SlashMark
          className={cn(
            "h-6",
            tone === "dark" ? "text-gold-light" : "text-gold",
          )}
        />
        <h2 className="text-h2 font-bold text-balance">{title}</h2>
        {lede && (
          <p
            className={cn(
              "text-lede leading-fa font-light",
              tone === "dark" ? "text-champagne" : "text-stone-text",
            )}
          >
            {lede}
          </p>
        )}
      </div>
      {action}
    </Reveal>
  );
}

/** Concern panels — a carousel on phones, a grid where there is room. */
export function ConcernTiles({
  concerns,
}: {
  readonly concerns: readonly HubConcern[];
}) {
  const t = useTranslations("shop");
  const panels = concerns.map((concern) => (
    <ConcernPanel key={concern.slug} concern={concern} />
  ));

  return (
    <>
      <Carousel
        className="md:hidden"
        label={t("concerns.railLabel")}
        previousLabel={t("rail.previous")}
        nextLabel={t("rail.next")}
        items={panels}
        slidesPerView={{ base: 1.15 }}
      />
      <Reveal
        as="ul"
        stagger
        className="hidden gap-x-8 gap-y-14 md:grid md:grid-cols-2 lg:grid-cols-3"
      >
        {panels.map((panel, index) => (
          <li key={concerns[index]?.slug}>{panel}</li>
        ))}
      </Reveal>
    </>
  );
}

function ConcernPanel({ concern }: { readonly concern: HubConcern }) {
  const t = useTranslations("shop");

  return (
    <Link href={concern.href} className="group flex h-full flex-col">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand">
        <span
          aria-hidden
          className="absolute inset-0 bg-teal opacity-0 transition-opacity duration-[var(--duration)] ease-[var(--easing)] group-hover:opacity-[0.06]"
        />
        <span
          aria-hidden
          className="absolute bottom-0 inset-x-0 h-px bg-teal opacity-0 transition-opacity duration-[var(--duration)] ease-[var(--easing)] group-hover:opacity-100"
        />
      </div>
      <div className="flex flex-col gap-2 pt-6">
        <h3 className="text-h3 font-bold">{concern.name}</h3>
        {concern.description && (
          <p className="max-w-[26em] text-body leading-fa text-stone-text">
            {concern.description}
          </p>
        )}
        <p className="pt-1 text-small font-light text-gold-text tabular-nums">
          {t("productCount", { count: concern.productCount })}
        </p>
      </div>
    </Link>
  );
}

/**
 * **B3 · Concern → product bridge.**
 *
 * A concern, one sentence about it, and the products chosen for it, side by
 * side. This is the shortest route this site has from "I have melasma" to a
 * product, and it is the argument the whole concern axis exists to make: the
 * dominant Iranian competitor has no concern browsing at all, so a customer
 * there has to already know what to buy.
 *
 * Bounded to three concerns by the read, so the hub stays a hub.
 */
export function ConcernSpotlights({
  spotlights,
}: {
  readonly spotlights: readonly HubConcernSpotlight[];
}) {
  const t = useTranslations("shop");

  return (
    <div className="flex flex-col gap-24">
      {spotlights.map(({ concern, products }) => (
        <Reveal key={concern.slug} className="flex flex-col gap-10">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--hairline-soft)] pb-6">
            <div className="flex flex-col gap-2">
              <p className="text-micro uppercase tracking-[0.16em] text-gold-text">
                {t("spotlights.eyebrow")}
              </p>
              <h3 className="text-h2 font-bold">{concern.name}</h3>
              {concern.description && (
                <p className="max-w-[40em] text-body leading-fa text-stone-text">
                  {concern.description}
                </p>
              )}
            </div>
            <Link
              href={concern.href}
              className="border-b border-firouzeh-text pb-1 text-small font-medium text-firouzeh-text"
            >
              {t("spotlights.action", { concern: concern.name })}
            </Link>
          </div>

          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <li key={product.slug}>
                <ProductTile product={product} enquiryHref={t("enquiryHref")} />
              </li>
            ))}
          </ul>
        </Reveal>
      ))}
    </div>
  );
}

/**
 * **B10 · Asymmetric photo mosaic.**
 *
 * A heading and one paragraph beside four photographs in an uneven grid. The
 * unevenness is the point — a 2×2 of equal squares is a gallery, and this is
 * meant to read as an editorial spread.
 *
 * The photography is the cleared Pexels/Unsplash set recorded in
 * `public/images/README.md`; none of it shows a Forlle'd product, so none of it
 * implies a claim about what is in stock.
 */
export function EditorialMosaic() {
  const t = useTranslations("shop.mosaic");

  const plates = [
    {
      src: "/images/editorial/p03-mist-and-white-stone.webp",
      className: "row-span-2 aspect-[3/4]",
    },
    {
      src: "/images/editorial/p05-cream-and-plaster.webp",
      className: "aspect-[4/3]",
    },
    {
      src: "/images/editorial/s08-bamboo-leaf-silhouette.webp",
      className: "aspect-square",
    },
    {
      src: "/images/editorial/p02-unbranded-stone-duo.webp",
      className: "aspect-[4/3]",
    },
  ] as const;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-20">
      <Reveal className="flex flex-col justify-center gap-6">
        <SlashMark className="h-6 text-gold" />
        <h2 className="max-w-[16ch] text-h2 font-bold text-balance">
          {t("title")}
        </h2>
        <p className="max-w-[36em] text-lede leading-fa font-light text-stone-text">
          {t("body")}
        </p>
      </Reveal>

      <Reveal stagger step={90} className="grid grid-cols-2 gap-4 sm:gap-6">
        {plates.map((plate, index) => (
          <div
            key={plate.src}
            className={cn("relative overflow-hidden bg-sand", plate.className)}
          >
            <Image
              src={plate.src}
              alt=""
              fill
              sizes="(max-width: 1024px) 45vw, 24vw"
              loading="lazy"
              className="object-cover"
            />
            {index === 0 && (
              <span
                aria-hidden
                className="absolute bottom-0 inset-x-0 h-px bg-gold opacity-50"
              />
            )}
          </div>
        ))}
      </Reveal>
    </div>
  );
}

/**
 * The authenticity band. Lapis, so gold and champagne finally pass contrast —
 * and the one place the blossom belongs, because the claim beside it is the
 * Forlle'd relationship itself.
 *
 * Not decoration with a heading: `09-brand-brief.md` records counterfeit anxiety
 * as this category's biggest objection, which makes this the most load-bearing
 * block on the page.
 */
export function AuthenticityBand() {
  const t = useTranslations("shop.authenticity");

  return (
    <div className="relative overflow-hidden">
      <BlossomOrnament className="pointer-events-none absolute -top-8 bottom-0 hidden w-40 opacity-70 md:block md:end-8" />

      <Reveal className="flex max-w-[46em] flex-col gap-6">
        <p className="text-micro uppercase tracking-[0.18em] text-gold-light">
          {t("eyebrow")}
        </p>
        <h2 className="text-h1 font-black leading-[1.3] text-balance text-sand">
          {t("title")}
        </h2>
        <p className="text-lede leading-fa font-light text-champagne">
          {t("body")}
        </p>

        <div className="flex flex-wrap items-center gap-6 pt-2">
          <span
            className="inline-flex items-center gap-2 border border-gold px-4 py-2 text-small text-gold-light"
            lang="ja"
          >
            日本製
            <span lang="fa" className="text-champagne">
              {t("madeIn")}
            </span>
          </span>
          <Link
            href="/about"
            className="border-b border-gold pb-1 text-small font-medium text-champagne"
          >
            {t("action")}
          </Link>
        </div>
      </Reveal>
    </div>
  );
}

/**
 * Brands as type, not logos. No mark renders until its image right is recorded —
 * all thirteen carry `imageRightsStatus: unknown`, and decision L-14 makes
 * unknown mean the name renders instead.
 */
export function BrandList({
  brands,
}: {
  readonly brands: readonly HubBrand[];
}) {
  const t = useTranslations("shop");
  const locale = useLocale();
  // A country name per locale from the platform, rather than three catalogue
  // entries per brand that would drift the moment a brand is added.
  const regionNames = new Intl.DisplayNames([locale], { type: "region" });

  return (
    <Reveal
      as="ul"
      stagger
      step={50}
      className="grid grid-cols-2 gap-px bg-[var(--hairline-soft)] md:grid-cols-3 lg:grid-cols-4"
    >
      {brands.map((brand) => (
        <li key={brand.slug}>
          <Link
            href={brand.href}
            className="flex h-full flex-col gap-1.5 bg-ground px-6 py-10 transition-colors duration-[var(--duration)] ease-[var(--easing)] hover:bg-surface"
          >
            <span className="font-display text-h3">{brand.name}</span>
            {brand.countryCode && (
              <span className="text-micro uppercase tracking-[0.14em] text-gold-text">
                {regionNames.of(brand.countryCode) ?? brand.countryCode}
              </span>
            )}
            <span className="pt-2 text-small font-light text-stone-text tabular-nums">
              {t("productCount", { count: brand.productCount })}
            </span>
          </Link>
        </li>
      ))}
    </Reveal>
  );
}

/** Product type — the third axis, and the quietest. A chip row of real links. */
export function CategoryLinks({
  categories,
}: {
  readonly categories: readonly HubCategory[];
}) {
  const t = useTranslations("shop");

  return (
    <ul className="flex flex-wrap gap-3">
      {categories.map((category) => (
        <li key={category.slug}>
          <Link
            href={category.href}
            className="inline-flex items-baseline gap-2 rounded-control border border-[var(--hairline)] px-5 py-2.5 text-small transition-colors duration-[var(--duration)] ease-[var(--easing)] hover:bg-surface"
          >
            {category.name}
            <span className="text-micro font-light text-stone-text tabular-nums">
              {t("countBare", { count: category.productCount })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
