# Internationalization and direction

**Status:** Accepted  
**Accepted:** 2026-08-24  
**Primary locale:** Persian (`fa`)

## Locale policy

- Public routes are locale-prefixed.
- Persian is authored and verified first; English and Arabic are translations.
- Interface messages may exist in all supported locales, but commerce content publishes only when that exact locale has canonical approved content.
- Missing product/catalogue translation never falls back to another locale.
- A known entity without exact-locale content produces `locale-unavailable`; it does not silently disappear or render Persian/English copy.

## Message ownership

Shared shell and truly cross-cutting messages may remain in `src/messages/<locale>.json`. Feature messages live beside their module:

```text
src/modules/<module>/i18n/fa.json
src/modules/<module>/i18n/en.json
src/modules/<module>/i18n/ar.json
```

The request-time message loader assembles the known canonical catalogues. Do not maintain a second manual list that can drift from the filesystem. Message keys are stable semantic paths, not copied English sentences.

Database content and interface messages are separate authorities. A translation file cannot substitute for missing canonical product content.

## Direction ownership

The locale layout sets `lang` and `dir` once. Direction-aware primitives consume that context. All authored spacing/alignment uses logical properties:

- `margin-inline-*`, `padding-inline-*`;
- `inset-inline-*`, `border-inline-*`;
- `text-align: start/end`;
- `inline-size`/`block-size` where they improve direction safety.

Physical `left`/`right` is permitted only for direction-independent geometry or media cropping and requires an explanatory comment when non-obvious. Pre-commit review searches authored CSS/TSX for accidental physical-direction layout.

Icons that communicate direction mirror in RTL; universal symbols do not. Do not mirror brand marks, media, clocks, checkmarks, playback icons, or numeric glyphs merely because the page is RTL.

## Mixed-direction content

- User-entered or external free text uses `dir="auto"` at the smallest safe boundary.
- Phone numbers, email addresses, URLs, SKUs, payment references, and technical identifiers use an explicit LTR/isolation treatment inside the surrounding RTL sentence.
- Do not concatenate Persian labels and Latin values into ambiguous strings; render separate elements or use Unicode bidi isolation through an approved utility.
- Screen-reader order follows semantic DOM order, not visual mirroring hacks.

## Numbers, money, and dates

- Formatting uses locale-aware utilities; do not concatenate currency/date strings in components.
- Money stays integer `bigint` rials in storage/domain/server boundaries.
- A branded base-10 `RialString` crosses client/JSON boundaries.
- Toman conversion exists only in the approved view formatter.
- Persian views use approved Persian digits and grouping; identifiers that customers must copy exactly may retain Latin digits with explicit direction.
- Store timestamps as UTC `timestamptz`.
- Format Persian dates through the canonical Jalali utility using `Intl.DateTimeFormat('fa-IR-u-ca-persian')`; use `jalaali-js` only for calendar arithmetic.

## Content and accessibility

- Persian is reviewed for meaning, tone, line breaks, truncation, and action clarity; translation presence alone is not acceptance.
- Inputs have visible localized labels, descriptions, and errors.
- Dynamic result counts and action outcomes are announced in the active locale.
- Alt text comes from approved ordered media data; filenames are never alt-text sources.
- Claims, suitability, safety, delivery, and return copy must use their approved canonical source.

## Testing gate

Each screen verifies:

- root `lang`/`dir` and locale-aware navigation;
- logical layout at the required viewports;
- keyboard and screen-reader order;
- mixed Persian/Latin values;
- Persian and Latin numeral cases;
- money and Jalali output only through canonical utilities;
- long copy and validation/error messages;
- exact-locale unavailable behavior with no fallback data.
