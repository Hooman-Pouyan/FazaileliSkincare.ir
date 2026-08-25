import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/money";

/**
 * Numbered pagination, not infinite scroll. Every page is a real URL a crawler
 * can reach — the same reason PHP and PLP are separate routes.
 */
export function Pagination({
  page,
  pageCount,
  hrefFor,
  className,
}: {
  page: number;
  pageCount: number;
  hrefFor: (p: number) => string;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  const window = 2;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= window,
  );

  return (
    <nav
      aria-label="صفحه‌بندی"
      className={cn(
        "flex items-center justify-center gap-1.5 py-12",
        className,
      )}
    >
      {pages.map((p, i) => {
        const gap = i > 0 && p - pages[i - 1]! > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap && (
              <span className="px-1 text-[var(--stone-text)]" aria-hidden>
                …
              </span>
            )}
            <Link
              href={hrefFor(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "grid size-11 place-items-center rounded-[var(--radius-control)] border text-[14px] tabular-nums transition-colors",
                p === page
                  ? "border-[var(--ink)] font-medium"
                  : "border-transparent text-[var(--stone-text)] hover:border-[var(--hairline-soft)]",
              )}
            >
              {toPersianDigits(String(p))}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
