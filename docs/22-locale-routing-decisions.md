# Locale routing decisions — R-1, R-2

**Date:** 2026-08-25 · **Trigger:** the rail sent a Persian reader from `/fa` to `/fa/fa/shop`
**Pattern:** interim decisions with re-review triggers, as used in `19-navigation-decisions.md`

---

## R-1 · One mechanism owns locale prefixing, and it is `@/i18n/navigation`

**Decision.** Every internal path in this application is a **locale-agnostic
pathname** — `/shop`, `/shop/concern/melasma`, `/account`. The prefix is applied
in exactly one place: `Link`, `redirect`, `useRouter` and `getPathname` from
`@/i18n/navigation`, which next-intl generates from `routing.ts`.

No navigation manifest, page model, query grammar, component or route may
interpolate a locale into a path.

**What went wrong.** `hrefFor(item, locale)` returned `` `/${locale}${item.path}` ``
and handed the result to `Link`, which prefixed it again. From `/fa`, the rail's
Shop entry pointed at `/fa/fa/shop`. Seventeen call sites had the same shape: the
read models, the catalogue query grammar, the command palette and both auth forms
all built their own prefix.

Every half of it was correct on its own. `hrefFor` returned exactly what its test
asserted. `Link` did exactly what next-intl documents. Typecheck passed, ESLint
passed, and 242 unit tests passed, because **the defect existed only where the
two met** — which is the signature of two mechanisms owning one concern, and
precisely what `AGENTS.md` forbids.

**Where each kind of URL now comes from:**

| Need                                   | Source                                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A link in a component                  | `Link` from `@/i18n/navigation` with a bare pathname                                           |
| A programmatic navigation              | `useRouter`/`redirect` from `@/i18n/navigation`                                                |
| The active room in the rail            | `usePathname` from `@/i18n/navigation` — it reports the route with the locale already stripped |
| A canonical, `hreflang` or JSON-LD URL | `localeUrl(pathname, locale)` in `src/lib/site.ts`, which wraps `getPathname`                  |
| Anything else                          | Nothing else needs one                                                                         |

**Purity is preserved by passing the resolver, not the rule.** The JSON-LD
builders take an `absolute: (pathname) => string` rather than an origin and a
locale, so they stay pure and testable and still cannot disagree with the page's
own canonical.

**The gate.** `src/lib/navigation/locale-prefix.test.ts` fails on any file that
starts a template literal with a locale interpolation, and on any file that
imports `next/navigation` for navigation rather than `@/i18n/navigation`. Both
assertions were verified to bite before being trusted. The second caught a defect
on its first run: the sign-out button used the raw router and sent every English
and Arabic customer to the Persian landing page.

**Re-review trigger.** next-intl's `pathnames` config (localised URL segments) —
`/en/shop` becoming `/en/store` — which changes what a "locale-agnostic pathname"
means but not who owns the prefix.

---

## R-2 · Persian is served without a prefix

**Decision.** `localePrefix: "as-needed"`. Persian is at `/`, `/shop`,
`/shop/concern/melasma`. English and Arabic keep `/en/...` and `/ar/...`.
`/fa/...` redirects to the bare path.

**Why.** Persian is the source language, not a translation —
`docs/00-decision-map.md` D10 — and the URL should say so. A woman arriving from
an Instagram link should see the address of a shop, not the address of a
translation of one. There is also a plain SEO argument: the default locale behind
a redundant prefix is a weaker canonical than the bare path, and it splits the
site's authority across `/` and `/fa` for no gain.

**What this touches, all of it already done:**

- `alternates.canonical` and `alternates.languages` resolve through `localeUrl`,
  so Persian emits `https://fazaieli.ir/shop` and English
  `https://fazaieli.ir/en/shop` without any route knowing that rule.
- `activeRoom` matches on the locale-stripped pathname. Matching on the raw Next
  pathname would have lit the rail in Persian and not in English, because
  `as-needed` makes it bare in one and prefixed in the other.
- The navigation manifest's landing path is `/`, not `""`.

**Verified in a running server:** `/` renders the Persian landing, `/fa` returns
a 307 to `/`, the rail's Shop entry is `href="/shop"`, the locale controls point
at `/en` and `/ar`, and no message is missing.

**Still to confirm.** `x-default` is not emitted yet. It belongs with the
Landing's SEO work in packet 6, where the question is whether `x-default` names
Persian or a language-negotiated root.

**Re-review trigger.** Evidence that Persian and English audiences want different
root behaviour, or a decision to serve a language-negotiated root.
