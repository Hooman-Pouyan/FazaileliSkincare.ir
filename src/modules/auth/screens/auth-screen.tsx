import { Link } from "@/i18n/navigation";
import { LoginForm } from "../components/login-form";
import { VerifyForm } from "../components/verify-form";
import ar from "../i18n/ar.json";
import en from "../i18n/en.json";
import fa from "../i18n/fa.json";

const copyByLocale = { ar, en, fa } as const;
export type AuthCopy = typeof fa;

/**
 * The editorial split: an ink story panel beside the form.
 *
 * Styled through Tailwind on the token layer, like everything else in `src/`.
 * Spacing uses Tailwind's numeric scale, which `designs/tokens.css` documents as
 * landing on the same pixel values as `--space-N`; colours come from the
 * `@theme inline` bindings, so `bg-ink` is the token and not a literal.
 */
export function AuthScreen({
  locale,
  mode,
}: {
  locale: string;
  mode: "login" | "verify";
}) {
  const copy =
    copyByLocale[locale as keyof typeof copyByLocale] ?? copyByLocale.fa;
  const isLogin = mode === "login";

  return (
    <main className="grid min-h-svh grid-cols-1 bg-ground md:grid-cols-[minmax(19rem,0.88fr)_minmax(0,1.12fr)]">
      <section
        aria-labelledby="auth-story-title"
        className="flex min-h-56 flex-col justify-between gap-4 border-b border-solid border-gold-light bg-ink px-6 py-8 text-sand md:min-h-svh md:gap-16 md:border-b-0 md:border-e md:px-6 md:py-16 lg:gap-24 lg:px-16 lg:py-24"
      >
        <Link
          href="/"
          className="w-fit text-[length:var(--text-small)] font-semibold tracking-[0.08em] text-champagne no-underline"
        >
          {copy.brand}
        </Link>

        <div className="max-w-[31rem]">
          <p className="m-0 text-[length:var(--text-micro)] font-semibold tracking-[0.12em] text-gold-light">
            {copy.eyebrow}
          </p>
          <h1
            id="auth-story-title"
            className="mt-3 max-w-[12ch] text-balance text-[length:var(--text-display-2)] font-black leading-[1.28] lg:mt-6 lg:text-[length:var(--text-display-1)]"
          >
            {copy.storyTitle}
          </h1>
          <p className="mt-6 hidden max-w-[34rem] text-[length:var(--text-body)] leading-[1.9] text-[color:color-mix(in_oklab,var(--sand)_86%,transparent)] md:block">
            {copy.storyBody}
          </p>
        </div>

        <p className="m-0 hidden max-w-[31rem] border-t border-solid border-t-[color:color-mix(in_oklab,var(--gold-light)_42%,transparent)] pt-6 text-[length:var(--text-small)] leading-[1.9] text-[color:color-mix(in_oklab,var(--champagne)_86%,transparent)] md:block">
          {copy.privacy}
        </p>
      </section>

      <section
        aria-labelledby="auth-form-title"
        className="flex items-start px-6 py-12 md:items-center md:px-8 md:py-16 lg:px-24"
      >
        <div className="mx-auto w-[min(100%,32rem)]">
          <p className="m-0 text-[length:var(--text-micro)] font-semibold tracking-[0.12em] text-gold-text">
            {copy.eyebrow}
          </p>
          <h2
            id="auth-form-title"
            className="mt-4 text-balance text-[length:var(--text-h1)] font-black leading-[1.35] text-ink"
          >
            {isLogin ? copy.loginTitle : copy.verifyTitle}
          </h2>
          <p className="mt-4 max-w-[34rem] text-[length:var(--text-body)] leading-[1.9] text-stone-text">
            {isLogin ? copy.loginIntro : copy.verifyIntro}
          </p>
          <hr
            aria-hidden="true"
            className="my-8 h-px border-0 bg-[color:var(--hairline)] lg:my-12"
          />
          {isLogin ? (
            <LoginForm copy={copy} locale={locale} />
          ) : (
            <VerifyForm copy={copy} locale={locale} />
          )}
        </div>
      </section>
    </main>
  );
}
