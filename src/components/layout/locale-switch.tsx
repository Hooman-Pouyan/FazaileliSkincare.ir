"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * Switching locale keeps the customer where they are.
 *
 * `usePathname` from the localized navigation returns the path without its
 * locale prefix, so the same route is requested under the new one. If that route
 * has no approved content the page itself renders `locale-unavailable` and
 * offers the Persian route.
 *
 * The alternatives were all worse (decision N-3): redirecting home loses the
 * product someone was reading, and serving Persian copy under an English URL is
 * the fallback chain the exact-locale policy exists to forbid. An honest empty
 * state that keeps the URL is the only option that neither lies nor loses their
 * place.
 */
export function LocaleSwitch({ label }: { readonly label: string }) {
  const pathname = usePathname();
  const active = useLocale();
  const others = routing.locales.filter((candidate) => candidate !== active);

  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-col items-center gap-1"
    >
      {others.map((candidate) => (
        <Link
          key={candidate}
          href={pathname}
          locale={candidate}
          hrefLang={candidate}
          className="grid size-11 place-items-center text-[length:var(--text-micro)] font-medium text-[color:var(--stone-text)]"
        >
          {candidate.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
