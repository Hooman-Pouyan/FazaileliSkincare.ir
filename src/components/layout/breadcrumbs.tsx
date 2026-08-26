import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type Crumb = Readonly<{ label: string; href: string }>;

/**
 * The trail from the Shop's front door to this page.
 *
 * Takes the page model's own `breadcrumbs` — the same array the `BreadcrumbList`
 * JSON-LD is built from — so what a reader sees and what a crawler is told
 * cannot disagree. The last entry is the current page and renders as text with
 * `aria-current`, not as a link to where the reader already is.
 *
 * It lays out no gutter of its own; the screen decides where it sits.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  readonly items: readonly Crumb[];
  readonly className?: string;
}) {
  const t = useTranslations("plp");

  if (items.length === 0) return null;

  return (
    <nav
      aria-label={t("breadcrumbLabel")}
      className={cn(
        "flex flex-wrap items-center gap-2 text-small text-stone-text",
        className,
      )}
    >
      {items.map((crumb, index) => {
        const isCurrent = index === items.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-2">
            {isCurrent ? (
              <span className="text-ink" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="hover:text-ink">
                {crumb.label}
              </Link>
            )}
            {!isCurrent && (
              <span aria-hidden className="opacity-40">
                /
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
