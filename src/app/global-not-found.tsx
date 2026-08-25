import type { Metadata } from "next";
import "./globals.css";

/**
 * The 404 for URLs that match no route at all.
 *
 * `not-found.tsx` cannot serve this application: Next composes it from the root
 * layout, and this app's root layout lives under a dynamic segment
 * (`app/[locale]/layout.tsx`), which is one of the two cases the Next 16 docs
 * name for `global-not-found`. It bypasses rendering entirely, so it owns its
 * own document — including the stylesheet, because no layout runs above it.
 *
 * Persian, because a request that matched no locale prefix has told us nothing
 * about who is asking, and Persian is the primary language.
 */

export const metadata: Metadata = {
  title: "صفحه پیدا نشد",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="fa" dir="rtl">
      <body className="grid min-h-svh place-items-center bg-[color:var(--ground)] text-[color:var(--ink)]">
        <main className="flex flex-col items-center gap-6 px-6 text-center">
          <p className="text-[length:var(--text-lede)]">
            صفحه‌ای که دنبالش بودید پیدا نشد.
          </p>
          <a
            href="/fa"
            className="border-b border-solid border-[color:var(--gold)] pb-1 text-[length:var(--text-body)]"
          >
            بازگشت به صفحهٔ نخست
          </a>
        </main>
      </body>
    </html>
  );
}
