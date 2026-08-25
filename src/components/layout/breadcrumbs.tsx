import { Link } from "@/i18n/navigation";
import { Container } from "./container";

export interface Crumb {
  label: string;
  href?: string;
}

/** Directional separators mirror automatically because the glyph is neutral. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <Container className="pt-8">
      <nav
        aria-label="مسیر"
        className="flex flex-wrap items-center gap-2 text-[13px] text-[var(--stone-text)]"
      >
        {items.map((c, i) => (
          <span key={`${c.label}-${i}`} className="flex items-center gap-2">
            {c.href ? (
              <Link href={c.href} className="hover:text-[var(--ink)]">
                {c.label}
              </Link>
            ) : (
              <span className="text-[var(--ink)]" aria-current="page">
                {c.label}
              </span>
            )}
            {i < items.length - 1 && (
              <span aria-hidden className="opacity-50">
                /
              </span>
            )}
          </span>
        ))}
      </nav>
    </Container>
  );
}
