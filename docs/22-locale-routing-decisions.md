# Locale routing decisions — R-1, R-2, R-3

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

**Settled by `R-3`.** This said `x-default` was not emitted yet, and that the
question was whether it names Persian or a language-negotiated root. `R-3`
decided there is no negotiated root, so `x-default` names Persian. It is
emitted. Review item `R.4` closes with it.

**Re-review trigger.** Evidence that Persian and English audiences want different
root behaviour, or a decision to serve a language-negotiated root.

---

## R-3 · The unprefixed root is Persian for everyone, not negotiated

**Decision.** `localeDetection: false` in `src/i18n/routing.ts`. `/` serves the
Persian document to every client regardless of `Accept-Language`. English and
Arabic are reached by their own URLs — `/en`, `/ar` — and by the locale control,
which is a link. No request header ever decides which document a URL returns.

`x-default` follows from it and names the Persian URL, which is the same address
`fa` gets and the same address the canonical names.

**What was actually happening.** next-intl defaults `localeDetection` to `true`,
and nobody chose that — it arrived with `defineRouting` and no one had reason to
look. The effect, measured on 2026-08-26:

| Request to `/`                       | Response          |
| ------------------------------------ | ----------------- |
| No `Accept-Language`                 | `200`, Persian    |
| `Accept-Language: fa-IR`             | `200`, Persian    |
| `Accept-Language: en-US`             | **`307` → `/en`** |
| `Accept-Language: ar`                | **`307` → `/ar`** |
| Googlebot with `Accept-Language: en` | **`307` → `/en`** |

**Why that is worse than it looks.** `R-2` chose the bare path _because_ it is
the strongest canonical the site has, and detection quietly took that back. The
site's single most important URL was serving two different documents depending
on who asked, which is the definition of a URL that cannot be canonicalised.
Google's own guidance is that automatic redirection by `Accept-Language`
prevents users and crawlers from seeing all versions of a site; here the version
being hidden was the Persian one, from a crawler that had asked for the home
page of a Persian business. Every argument in `08-competitive-research.md` rests
on Persian listings being the thing that gets indexed.

It also cost a real reader something. A Persian speaker in Mashhad on a phone
sold with an English system locale — which is most of them — clicked an
Instagram link to a Persian skincare institute and got an English page. Nothing
in the codebase was wrong; the default simply assumed the browser knows better
than the URL, and for this audience it does not.

**Why detection is the wrong mechanism here even in principle.** Locale is a
choice, and `R-1` already established that in this codebase a choice is a URL.
`Accept-Language` is not a choice — it is a system setting most people have
never seen, frequently wrong, and unrelated to what someone wants to read. The
locale control already exists, it is a link, it works without JavaScript, and it
is addressable. Detection is a second mechanism owning the same concern, which
is what `AGENTS.md` forbids and what produced `/fa/fa/shop` in `R-1`.

**What this touches:**

- `src/i18n/routing.ts` — the one option, with the reasoning beside it.
- `localeAlternates` in `src/lib/site.ts` now emits `x-default`, so it lands on
  every route through the one function rather than per route.
- Nothing else. `localePrefix: "as-needed"` is unchanged, `/fa` still redirects
  to `/`, and no component learned anything new.

**The gate.** `src/i18n/routing.test.ts` asserts `localeDetection === false`.
That assertion exists because the value is a _default_ — it comes back on its
own the moment someone rewrites the config from next-intl's documentation, and
nothing else in the suite can see it, since every other test runs without an
`Accept-Language` and therefore always gets Persian. `src/lib/site.test.ts`
asserts `x-default` equals the Persian URL.

**Verified in a running server**, after the change: `/` returns `200` with
`<html lang="fa">` for `en-US`, `ar`, `fa-IR`, no header at all, and for
Googlebot sending `Accept-Language: en`. `/en` and `/ar` still return `200` when
asked for directly, `/fa` still returns `307` to `/`, and `/` and `/shop/all`
both emit four `hreflang` links whose `x-default` matches their canonical.

**What this does not do.** It does not detect, suggest, or remember a locale. A
first-time English speaker on `/` sees Persian and uses the locale control. If
that ever proves to be a real cost, the answer is an _in-page invitation_ — a
dismissible line offering the English URL — never a redirect, because the
redirect is the part that breaks canonicalisation.

**Re-review trigger.** Evidence of a real non-Persian audience arriving at `/`
and leaving, which would justify the in-page invitation above. A cookie that
remembers an explicit choice is also acceptable under this decision, because a
choice the reader made is not a header the browser sent — but it must never
change what a crawler or a first-time visitor receives at `/`.
