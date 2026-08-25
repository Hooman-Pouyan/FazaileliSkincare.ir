import { useLocale, useTranslations } from "next-intl";
import { BlossomOrnament, SlashMark } from "@/components/brand/blossom";
import { Reveal } from "@/components/layout/reveal";
import { ScrollRail } from "@/components/layout/scroll-rail";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { HubBrand, HubCategory, HubConcern } from "../models/page-models";

/**
 * The hub's three discovery axes, in the order `docs/04-information-architecture.md`
 * fixes them: concern first, brand second, type third.
 *
 * Every one of these navigates to a real URL rather than filtering in place. A
 * client-side filter has one address and can rank for one query; a concern a
 * woman in Mashhad searches by name needs a page of its own.
 *
 * All of it is server-rendered. The rails are real lists in the document before
 * any script runs, and `Reveal` can only ever remove an opacity class it added
 * itself — no block here is hidden from a crawler or from a reader with
 * JavaScript off.
 */

export function SectionHeading({
  title,
  lede,
  tone = "ground",
}: {
  readonly title: string;
  readonly lede?: string;
  readonly tone?: "ground" | "dark";
}) {
  return (
    <Reveal className="flex max-w-[42em] flex-col gap-4 pb-12">
      <SlashMark
        className={cn("h-6", tone === "dark" ? "text-gold-light" : "text-gold")}
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
    </Reveal>
  );
}

/**
 * Concern panels. A dragged rail on narrow screens where a three-across grid
 * would crush them, a grid from `md` up where there is room to see all five at
 * once — the same list either way, only the container changes.
 */
export function ConcernTiles({
  concerns,
}: {
  readonly concerns: readonly HubConcern[];
}) {
  const t = useTranslations("shop");

  const panels = concerns.map((concern, index) => (
    <li key={concern.slug}>
      <ConcernPanel concern={concern} index={index} />
    </li>
  ));

  return (
    <>
      <ScrollRail
        className="md:hidden"
        label={t("concerns.railLabel")}
        previousLabel={t("rail.previous")}
        nextLabel={t("rail.next")}
        itemClassName="[&>li]:w-[78vw]"
      >
        {panels}
      </ScrollRail>

      <ul className="hidden gap-x-8 gap-y-14 md:grid md:grid-cols-2 lg:grid-cols-3">
        {panels}
      </ul>
    </>
  );
}

function ConcernPanel({
  concern,
  index,
}: {
  readonly concern: HubConcern;
  readonly index: number;
}) {
  const t = useTranslations("shop");

  return (
    <Reveal delay={Math.min(index, 3) * 60}>
      <Link href={concern.href} className="group flex flex-col">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand">
          {/* Photography lands here. Until it does, the panel proves layout and
              deliberately proves nothing about art direction. */}
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
    </Reveal>
  );
}

/**
 * The authenticity band. Lapis, so gold and champagne finally pass contrast —
 * and it is the one place the blossom ornament belongs, because the claim it
 * sits beside is the Forlle'd relationship itself.
 *
 * This is not decoration with a heading. `09-brand-brief.md` records counterfeit
 * anxiety as this category's biggest objection, which makes an authenticity
 * statement the most load-bearing block on the page.
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
 * Brands as type, not logos. No mark is published until its image right is
 * recorded — every one of the thirteen carries `imageRightsStatus: unknown`, and
 * decision L-14 makes unknown mean the name renders instead.
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
    <ul className="grid grid-cols-2 gap-px bg-[var(--hairline-soft)] md:grid-cols-3 lg:grid-cols-4">
      {brands.map((brand, index) => (
        <Reveal as="li" key={brand.slug} delay={Math.min(index, 5) * 40}>
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
        </Reveal>
      ))}
    </ul>
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
