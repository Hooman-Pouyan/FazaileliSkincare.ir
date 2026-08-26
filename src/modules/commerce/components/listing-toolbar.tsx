import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ProductListingPage } from "../models/page-models";

/**
 * Sort as a **chip row, not a dropdown** — `10-design-playbook.md` Step 6.
 *
 * A dropdown hides every option but one, and on a phone it opens a native
 * picker over the results. Four options fit on a line; showing them costs
 * nothing and makes the current one legible without a tap. Each is a link, so
 * sorting is addressable like filtering.
 */
export function ListingToolbar({
  page,
  className,
}: {
  readonly page: ProductListingPage;
  readonly className?: string;
}) {
  const t = useTranslations("plp");

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 border-b border-[var(--hairline-soft)] pb-5",
        className,
      )}
    >
      <p className="text-small text-stone-text tabular-nums">
        {t("resultCount", { count: page.pagination.total })}
      </p>

      <nav
        aria-label={t("sortLabel")}
        className="flex flex-wrap items-center gap-2"
      >
        <span className="text-small text-stone-text">{t("sortLabel")}</span>
        {page.sortOptions.map((option) => (
          <Link
            scroll={false}
            key={option.value}
            href={option.href}
            aria-current={option.isCurrent ? "true" : undefined}
            className={cn(
              "rounded-control border px-3 py-1.5 text-small transition-colors duration-[var(--duration)] ease-[var(--easing)]",
              option.isCurrent
                ? "border-teal font-medium text-teal"
                : "border-[var(--hairline)] hover:bg-surface",
            )}
          >
            {t(`sort.${option.value}`)}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/**
 * Pagination as real, crawlable links.
 *
 * Not infinite scroll: a customer cannot link to page four of an infinite
 * scroll, cannot return to it with the back button, and a crawler never reaches
 * anything past the first batch. Every href comes from the query grammar, so a
 * page link carries the filters and the sort with it.
 */
export function Pagination({ page }: { readonly page: ProductListingPage }) {
  const t = useTranslations("plp");
  const { pagination } = page;

  if (pagination.pageCount <= 1) return null;

  return (
    <nav
      aria-label={t("paginationLabel")}
      className="flex flex-wrap items-center justify-center gap-2 pt-16"
    >
      <PageLink
        href={pagination.previousHref}
        label={t("previousPage")}
        disabledLabel={t("previousPage")}
      />

      {pagination.pages.map((entry) => (
        <Link
          scroll={false}
          key={entry.page}
          href={entry.href}
          aria-current={entry.isCurrent ? "page" : undefined}
          className={cn(
            "grid size-11 place-items-center rounded-control border text-small tabular-nums transition-colors duration-[var(--duration)] ease-[var(--easing)]",
            entry.isCurrent
              ? "border-teal font-bold text-teal"
              : "border-[var(--hairline)] hover:bg-surface",
          )}
        >
          {entry.page}
        </Link>
      ))}

      <PageLink
        href={pagination.nextHref}
        label={t("nextPage")}
        disabledLabel={t("nextPage")}
      />
    </nav>
  );
}

function PageLink({
  href,
  label,
  disabledLabel,
}: {
  readonly href: string | null;
  readonly label: string;
  readonly disabledLabel: string;
}) {
  const shared =
    "grid h-11 place-items-center rounded-control border border-[var(--hairline)] px-4 text-small";

  // A missing edge renders as a disabled control rather than disappearing, so
  // the row does not reflow between pages.
  if (href === null) {
    return (
      <span
        aria-label={disabledLabel}
        aria-disabled
        className={cn(shared, "opacity-30")}
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      scroll={false}
      href={href}
      className={cn(
        shared,
        "transition-colors duration-[var(--duration)] ease-[var(--easing)] hover:bg-surface",
      )}
    >
      {label}
    </Link>
  );
}
