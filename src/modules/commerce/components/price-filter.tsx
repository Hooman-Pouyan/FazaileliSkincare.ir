"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Slider } from "@/components/ui/slider";
import { formatToman, toRials } from "@/lib/money";
import type { PriceFacet } from "../models/page-models";

/**
 * The price range, as the design system's Slider inside a GET form.
 *
 * The first version of this used two number inputs. That was wrong: the design
 * system ships a `Slider` whose own spec says it is *"the price-range control
 * inside the facet rail — the only slider in the system"*, and it was sitting in
 * `src/components/ui/slider.tsx` already token-bound and used nowhere. Reaching
 * for the library before writing UI is the rule; I did not follow it.
 *
 * **It is still a form.** Radix renders a hidden input per thumb when `name` is
 * set, so submitting posts `price_min` and `price_max` in toman like any other
 * filter — one mechanism, an addressable URL, the back button works. The submit
 * button is real rather than an on-change navigation, which also stops a drag
 * from firing a request per pixel.
 *
 * The ends are printed beneath, because the Slider's spec is explicit that
 * *"a slider alone is not a price"* — and a range whose bounds are invisible is
 * a control you have to guess at.
 *
 * RTL comes from `DirectionProvider`, which Radix reads; the track mirrors
 * without this component knowing the direction.
 */
export function PriceFilter({ price }: { readonly price: PriceFacet }) {
  const t = useTranslations("plp");

  const [range, setRange] = useState<[number, number]>([
    price.appliedMinToman ?? price.minToman,
    price.appliedMaxToman ?? price.maxToman,
  ]);

  // A round step keeps the URL tidy: bounds land on values a person would type.
  const span = price.maxToman - price.minToman;
  const step = span > 2_000_000 ? 50_000 : span > 400_000 ? 10_000 : 1_000;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-small font-medium tracking-[0.08em] text-gold-text">
        {t("facets.price")}
      </h2>

      <form action={price.action} method="get" className="flex flex-col gap-4">
        <Slider
          min={price.minToman}
          max={price.maxToman}
          step={step}
          value={range}
          onValueChange={([min, max]) => setRange([min ?? 0, max ?? 0])}
          minStepsBetweenThumbs={1}
          aria-label={t("facets.price")}
          name="price"
        />

        {/* The two ends, as money. Rials are the storage unit and never appear. */}
        <p className="flex items-center justify-between text-small text-stone-text tabular-nums">
          <span>{formatToman(toRials(range[0]))}</span>
          <span className="text-micro">{t("currencyShort")}</span>
          <span>{formatToman(toRials(range[1]))}</span>
        </p>

        {/*
          Radix names its hidden inputs `price[]`, which is not the grammar's
          spelling. These carry the canonical parameter names instead, so the
          submitted URL is one the query grammar recognises rather than one it
          redirects away from.
        */}
        <input type="hidden" name="price_min" value={range[0]} />
        <input type="hidden" name="price_max" value={range[1]} />

        <button
          type="submit"
          className="h-10 self-start rounded-control border border-firouzeh-text px-4 text-small font-medium text-firouzeh-text transition-colors duration-[var(--duration)] ease-[var(--easing)] hover:bg-surface"
        >
          {t("applyPrice")}
        </button>
      </form>
    </section>
  );
}
