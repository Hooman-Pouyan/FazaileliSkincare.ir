import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { facetToggleHref } from "../utils/facets";
import type { FacetGroup, ProductListingPage } from "../models/page-models";

/**
 * The facet rail. Every value is a **link**, not a checkbox.
 *
 * A link means the filtered listing has a real address: it can be shared, it
 * survives a refresh, the back button undoes it, and — the reason the
 * competitive research cared — it can rank. A checkbox that mutates hidden
 * state has one URL for every combination, which is why the dominant Iranian
 * competitor's filters cannot be linked to.
 *
 * Every value carries a **live count**, computed with its own group's
 * selections removed (`PLP-03`). Their absence is what makes small-brand
 * filtering feel broken: a shopper clicks and lands on nothing.
 *
 * No JavaScript is involved. This works with scripting disabled.
 */
export function FacetRail({
  page,
  className,
}: {
  readonly page: ProductListingPage;
  readonly className?: string;
}) {
  const t = useTranslations("plp");
  const facets = page.facets;

  return (
    <div className={cn("flex flex-col gap-10", className)}>
      <AudienceFilter page={page} />

      {facets.map((group) => (
        <section key={group.parameter} className="flex flex-col gap-4">
          <h2 className="text-small font-medium tracking-[0.08em] text-gold-text">
            {t(`facets.${group.parameter}`)}
          </h2>
          <ul className="flex flex-col">
            {group.options.map((option) => (
              <li key={option.value}>
                <Link
                  href={option.href}
                  aria-current={option.isApplied ? "true" : undefined}
                  className={cn(
                    "flex items-baseline justify-between gap-3 border-b border-[var(--hairline-soft)] py-2.5",
                    "transition-colors duration-[var(--duration)] ease-[var(--easing)] hover:text-teal",
                    // Teal is the Shop room's accent, and it passes contrast on
                    // cool white where gold and firouzeh do not.
                    option.isApplied && "font-bold text-teal",
                  )}
                >
                  <span className="flex items-baseline gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        "inline-block size-2 shrink-0 translate-y-px border border-[var(--hairline)]",
                        option.isApplied && "border-teal bg-teal",
                      )}
                    />
                    {option.label}
                  </span>
                  <span className="text-small font-light text-stone-text tabular-nums">
                    {option.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * Who the product is for. Single-select with two named values rather than a
 * "professional only" toggle — a checkbox answers one question and leaves the
 * other unaskable, and "show me only what I can buy" is the more common need on
 * a site that shows professional stock it will not sell. See F-3.
 *
 * It narrows on request and never hides by default: `D-18-2` puts that stock on
 * the shelf deliberately, and the competitive research lists hiding eligibility
 * under things to avoid.
 */
function AudienceFilter({ page }: { readonly page: ProductListingPage }) {
  const t = useTranslations("plp");
  const values = ["home", "professional"] as const;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-small font-medium tracking-[0.08em] text-gold-text">
        {t("audience.label")}
      </h2>
      <ul className="flex flex-col">
        {values.map((value) => {
          const isApplied = page.query.audience === value;
          return (
            <li key={value}>
              <Link
                href={facetToggleHref(page.query, "audience", value)}
                aria-current={isApplied ? "true" : undefined}
                className={cn(
                  "flex items-baseline gap-2 border-b border-[var(--hairline-soft)] py-2.5",
                  "transition-colors duration-[var(--duration)] ease-[var(--easing)] hover:text-teal",
                  isApplied && "font-bold text-teal",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "inline-block size-2 shrink-0 translate-y-px rounded-full border border-[var(--hairline)]",
                    isApplied && "border-teal bg-teal",
                  )}
                />
                {t(`audience.${value}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * The filters currently in force, each removable on its own, plus one control
 * that clears everything.
 *
 * This exists because a facet rail alone leaves a customer guessing why a
 * listing is short — especially after arriving on a filtered URL from a link,
 * where nothing they did explains the state.
 */
export function AppliedFilters({
  page,
}: {
  readonly page: ProductListingPage;
}) {
  const t = useTranslations("plp");

  if (page.appliedFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-small text-stone-text">{t("appliedLabel")}</span>

      {page.appliedFilters.map((filter) => (
        <Link
          key={`${filter.parameter}-${filter.value}`}
          href={filter.removeHref}
          className="inline-flex items-center gap-2 rounded-control border border-[var(--hairline)] py-1.5 ps-3 pe-2 text-small transition-colors duration-[var(--duration)] ease-[var(--easing)] hover:bg-surface"
        >
          {filter.value}
          <XIcon className="size-3.5" strokeWidth={1.5} aria-hidden />
          <span className="sr-only">{t("removeFilter")}</span>
        </Link>
      ))}

      {page.clearFiltersHref && (
        <Link
          href={page.clearFiltersHref}
          className="ms-1 border-b border-firouzeh-text pb-0.5 text-small font-medium text-firouzeh-text"
        >
          {t("clearFilters")}
        </Link>
      )}
    </div>
  );
}
