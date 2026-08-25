import { Link } from "@/i18n/navigation";
import { LoginForm } from "../components/login-form";
import { VerifyForm } from "../components/verify-form";
import ar from "../i18n/ar.json";
import en from "../i18n/en.json";
import fa from "../i18n/fa.json";
import styles from "../auth-screen.module.css";

const copyByLocale = { ar, en, fa } as const;
export type AuthCopy = typeof fa;

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
    <main className={styles.shell}>
      <section className={styles.story} aria-labelledby="auth-story-title">
        <Link href="/" className={styles.brand}>
          {copy.brand}
        </Link>
        <div className={styles.storyCopy}>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 id="auth-story-title" className={styles.storyTitle}>
            {copy.storyTitle}
          </h1>
          <p className={styles.storyBody}>{copy.storyBody}</p>
        </div>
        <p className={styles.privacy}>{copy.privacy}</p>
      </section>

      <section className={styles.formRegion} aria-labelledby="auth-form-title">
        <div className={styles.formFrame}>
          <p className={styles.formEyebrow}>{copy.eyebrow}</p>
          <h2 id="auth-form-title" className={styles.title}>
            {isLogin ? copy.loginTitle : copy.verifyTitle}
          </h2>
          <p className={styles.intro}>
            {isLogin ? copy.loginIntro : copy.verifyIntro}
          </p>
          <hr className={styles.rule} aria-hidden="true" />
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
