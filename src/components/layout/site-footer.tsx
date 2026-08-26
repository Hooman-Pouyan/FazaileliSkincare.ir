import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { hrefFor, navigationFor } from "@/lib/navigation/manifest";

/**
 * One semantic footer, from the same manifest as the rail and the bottom bar.
 *
 * `SHELL-05` governs what may appear here, and the constraint is mostly about
 * what may not: no invented opening hours, delivery promises, representative
 * claims or social metrics. Legal copy is the owner's, not implementation's.
 *
 * So the address and telephone are absent rather than placeheld — the storefront
 * canvas marks both as `[براکت]`, its notation for a fact nobody has supplied,
 * and shipping a bracket to a customer is worse than shipping nothing. The terms,
 * privacy and returns links are present although those pages are not written:
 * `SHELL-05` requires them visible, and eNamad will not certify the domain
 * without them, so a dead link here is a standing reminder rather than an
 * oversight.
 */
export async function SiteFooter() {
  const t = await getTranslations("footer");
  const brand = await getTranslations("brand");
  const nav = await getTranslations("nav");
  const locale = await getLocale();

  const rooms = navigationFor("rail").filter((item) => item.room !== null);

  const legal = [
    { key: "terms", href: "/legal/terms" },
    { key: "privacy", href: "/legal/privacy" },
    { key: "returns", href: "/legal/returns" },
  ] as const;

  return (
    <footer className="border-t border-solid border-[color:var(--hairline)] bg-[color:var(--ground)] px-6 py-12 lg:px-16 lg:py-16">
      <div className="mx-auto grid w-full max-w-[76rem] gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" aria-label={nav("home")} className="mb-4 inline-flex">
            <Logo form="medallion" size={96} />
          </Link>
          <p className="m-0 text-[length:var(--text-body)] font-semibold text-[color:var(--ink)]">
            {brand("name")}
          </p>
          <p className="mt-2 m-0 max-w-[28rem] text-[length:var(--text-small)] text-[color:var(--stone-text)]">
            {brand("tagline")}
          </p>
        </div>

        <nav aria-label={t("roomsHeading")}>
          <h2 className="m-0 text-[length:var(--text-micro)] font-semibold tracking-[0.12em] text-[color:var(--gold-text)]">
            {t("roomsHeading")}
          </h2>
          <ul className="mt-4 grid gap-3">
            {rooms.map((item) => {
              const href = hrefFor(item);
              if (href === null || item.path === null) return null;
              return (
                <li key={item.id}>
                  <Link
                    href={item.path}
                    className="text-[length:var(--text-small)] text-[color:var(--ink)]"
                  >
                    {nav(item.labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <nav aria-label={t("legalHeading")}>
          <h2 className="m-0 text-[length:var(--text-micro)] font-semibold tracking-[0.12em] text-[color:var(--gold-text)]">
            {t("legalHeading")}
          </h2>
          <ul className="mt-4 grid gap-3">
            {legal.map((entry) => (
              <li key={entry.key}>
                <Link
                  href={entry.href}
                  className="text-[length:var(--text-small)] text-[color:var(--ink)]"
                >
                  {t(entry.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-12 flex w-full max-w-[76rem] flex-wrap items-center justify-between gap-4 border-t border-solid border-[color:var(--hairline)] pt-6">
        <p className="m-0 text-[length:var(--text-micro)] text-[color:var(--stone-text)]">
          {t("copyright", { year: "۱۴۰۵", name: brand("name") })}
        </p>
        {/*
          The eNamad seal is issued by the certifying body and cannot be drawn
          here. The slot holds its place so the layout does not shift when the
          real badge arrives; it renders nothing until then.
        */}
        <div
          aria-hidden
          data-slot="enamad"
          className="h-14 w-14 border border-dashed border-[color:var(--hairline)]"
        />
      </div>
    </footer>
  );
}
