import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface ConcernModel {
  slug: string;
  label: string;
  count?: number;
  description?: string | null;
}

/**
 * Concern-first browsing — the primary axis, and the gap in the market.
 * The dominant Iranian vendor has NO concern filter at all; its nearest
 * equivalent («کاربرد») describes what the *product does*, not what the
 * *customer has*. See docs/08-competitive-research.md.
 *
 * These NAVIGATE — one real URL per concern — they do not filter in place.
 * A client-side filter has one URL and can rank for one query.
 */
export function ConcernRail({
  concerns,
  activeSlug,
  className,
}: {
  concerns: ConcernModel[];
  activeSlug?: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="دغدغهٔ پوست"
      className={cn("border-t border-[var(--hairline)]", className)}
    >
      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {concerns.map((c) => {
          const on = c.slug === activeSlug;
          return (
            <li
              key={c.slug}
              className="border-s border-[var(--hairline-soft)] first:border-s-0"
            >
              <Link
                href={`/shop/concern/${c.slug}`}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex h-full flex-col gap-2 px-5 pb-8 pt-7 transition-colors",
                  on ? "bg-[var(--surface)]" : "hover:bg-[var(--surface)]",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-block-start-0 inset-inline-0 h-0.5",
                    on ? "bg-[var(--teal)]" : "bg-transparent",
                  )}
                />
                <span
                  className={cn(
                    "text-[17.5px] leading-[1.6]",
                    on
                      ? "font-bold"
                      : "font-light text-[color-mix(in_oklab,var(--ink)_62%,transparent)]",
                  )}
                >
                  {c.label}
                </span>
                {c.count != null && (
                  <span className="text-[12.5px] font-light text-[var(--stone-text)] tabular-nums">
                    {c.count} محصول
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** PHP hub tile — a photographic panel, not a box with an icon. */
export function ConcernTile({
  concern,
  imageUrl,
}: {
  concern: ConcernModel;
  imageUrl?: string | null;
}) {
  return (
    <Link
      href={`/shop/concern/${concern.slug}`}
      className="group flex flex-col"
    >
      <div
        className="aspect-[3/2] w-full bg-[var(--sand)] bg-cover bg-center"
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
        aria-hidden
      />
      <div className="flex flex-col gap-2 pt-5">
        <span aria-hidden className="h-px w-8 bg-[var(--teal)]" />
        <h3 className="text-[24px] font-bold">{concern.label}</h3>
        {concern.description && (
          <p className="max-w-[24em] text-[14.5px] leading-[1.9] text-[var(--stone-text)]">
            {concern.description}
          </p>
        )}
      </div>
    </Link>
  );
}
