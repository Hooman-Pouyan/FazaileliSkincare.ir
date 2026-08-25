import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { HubBrand, HubCategory, HubConcern } from "../models/page-models";

/**
 * The hub's three discovery axes, in the order `docs/04-information-architecture.md`
 * fixes them: concern first, brand second, type third.
 *
 * Every one of these navigates to a real URL rather than filtering in place. A
 * client-side filter has one address and can rank for one query; a concern that
 * a woman in Mashhad searches for by name needs a page of its own.
 */

export function SectionHeading({
  title,
  lede,
  action,
}: {
  title: string;
  lede?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-10">
      <div className="flex flex-col gap-3">
        <span aria-hidden className="h-px w-8 bg-teal" />
        <h2 className="text-h2 font-bold">{title}</h2>
        {lede && (
          <p className="max-w-[38em] text-body leading-fa text-stone-text">
            {lede}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/**
 * Concern tiles. Photographic panels, not boxes with icons — and the count is
 * shown because a facet without a count is what makes browsing feel like
 * guessing.
 */
export function ConcernTiles({
  concerns,
}: {
  concerns: readonly HubConcern[];
}) {
  const t = useTranslations("shop");

  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
      {concerns.map((concern) => (
        <li key={concern.slug}>
          <Link href={concern.href} className="group flex flex-col">
            <div
              aria-hidden
              className="aspect-[3/2] w-full bg-sand transition-opacity duration-[var(--duration)] ease-[var(--easing)] group-hover:opacity-90"
            />
            <div className="flex flex-col gap-2 pt-5">
              <span aria-hidden className="h-px w-8 bg-teal" />
              <h3 className="text-h3 font-bold">{concern.name}</h3>
              {concern.description && (
                <p className="max-w-[24em] text-body leading-fa text-stone-text">
                  {concern.description}
                </p>
              )}
              <p className="text-small font-light text-stone-text tabular-nums">
                {t("productCount", { count: concern.productCount })}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Brands as type, not logos. No mark is published until its image right is
 * recorded — `content/brands/README.md` leaves `imageRightsStatus` unknown on
 * every one of them, and decision L-14 makes unknown mean the name renders
 * instead.
 */
export function BrandList({
  brands,
  className,
}: {
  brands: readonly HubBrand[];
  className?: string;
}) {
  const t = useTranslations("shop");
  const locale = useLocale();
  // A country name per locale, from the platform, rather than three catalogue
  // entries per brand that would drift the moment a brand is added.
  const regionNames = new Intl.DisplayNames([locale], { type: "region" });

  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-px bg-[var(--hairline-soft)] md:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {brands.map((brand) => (
        <li key={brand.slug} className="bg-ground">
          <Link
            href={brand.href}
            className="flex h-full flex-col gap-1.5 px-6 py-8 transition-colors duration-[var(--duration)] ease-[var(--easing)] hover:bg-surface"
          >
            <span className="text-lede font-medium">{brand.name}</span>
            {brand.countryCode && (
              <span className="text-micro uppercase tracking-[0.14em] text-gold-text">
                {regionNames.of(brand.countryCode) ?? brand.countryCode}
              </span>
            )}
            <span className="text-small font-light text-stone-text tabular-nums">
              {t("productCount", { count: brand.productCount })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Product type — the third axis, and the quietest. A chip row of real links. */
export function CategoryLinks({
  categories,
}: {
  categories: readonly HubCategory[];
}) {
  const t = useTranslations("shop");

  return (
    <ul className="flex flex-wrap gap-3">
      {categories.map((category) => (
        <li key={category.slug}>
          <Link
            href={category.href}
            className="inline-flex items-baseline gap-2 rounded-control border border-[var(--hairline)] px-4 py-2 text-small transition-colors duration-[var(--duration)] ease-[var(--easing)] hover:bg-surface"
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
