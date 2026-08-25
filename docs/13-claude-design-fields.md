# Claude Design onboarding — what to paste where

The onboarding fields are plain textareas: **markdown tables render as raw pipes**. Everything below is prose, written to fit.

---

## Field 1 · "Company name and blurb (or name of design system)"

```
Fazaieli Design System — مؤسسه مهدیه فضائلی

A specialist skincare academy and treatment practice in Mashhad, Iran, run by
Mahdieh Fazaieli — a practitioner and a certified instructor of the Technical &
Vocational Organization, and the official representative of Forlle'd Japan.
The site is Persian-first and right-to-left; English and Arabic are secondary and switch
on later.

Three decoupled spaces share one shell and one account. Shop sells professional
skincare from Forlle'd (Japan), Storyderm (Korea) and Thalgo (France), browsed
by skin concern rather than by product type. Booking handles facials and skin
treatments across three practitioners and three treatment beds, on a Jalali
calendar. Academy runs workshops, seminars, in-person classes and online courses
for people training to become skin therapists.

The reputation is the product. She is a practitioner and teacher who also sells
what she uses — not a shop that happens to teach. The design has to make her
visible, and has to feel like a treatment room rather than a marketplace.
```

---

## Field 2 · "Any other notes?"

```
PALETTE — sampled from photographs of the institute, not chosen from a mood
board, then contrast-measured. Cool white ground #F7F8F8 (never pure white,
never warm ivory). Deep lapis ink #161B4A for all text and structure — this is
Persian ultramarine, not navy. Brand lapis #2D389A. Deep teal #24403E. Antique
gold #A27F34. Firouzeh turquoise #2BB8D4. Champagne #D9C8A8 and sand #E4D1C1.

THE RULE THAT MATTERS: gold (3.51:1), firouzeh (2.22:1) and champagne (1.54:1)
FAIL contrast on the light ground and PASS on ink (6.17, 6.91, 9.91). They are
dark-field colours. Gold is a hairline, never a fill behind text. So the site
alternates long stretches of ink-on-cool-white with deep lapis bands where gold
and turquoise finally speak — which is also exactly how the building is lit:
bright white corridors opening into indigo rooms with gold along the cornice.
On light ground, colours that carry words use their text variants:
firouzeh-text #146E82, gold-text #7A6015, stone-text #6B6863.

Each space carries one accent, ink is the constant: Shop = teal,
Booking = firouzeh, Academy = gold, account = lapis.

TYPOGRAPHY — Vazirmatn for Persian (body and display), Bodoni Moda for Latin
display only, never inside running Persian. Persian body line-height 1.8, not
1.5. Persian digits ۱۲۳ with the ٬ separator (U+066C), never a comma. Prices
display in Toman. Self-hosted fonts only — no runtime webfont fetch, because
requests to Google Fonts hang from Iranian infrastructure.

FORM — No card grid: a product tile is a borderless image with type beneath it,
no box, no border. Hairlines and tone shifts do the separating; no shadows
anywhere in customer-facing UI. Two radii only: 2px on controls, 16–24px on
images and drawers, nothing in between, never rounded-full. Asymmetric 60/40 and
70/30 splits echoing the arched niches in the treatment room. Minimum 96px
between sections on desktop. Photography carries the pages.

RTL — Persian is the source language; English and Arabic are translations. Logical
properties throughout (margin-inline-start, text-align: start), so one layout
mirrors. Directional icons mirror; the gold medallion never does.

MOTION — 480ms, cubic-bezier(0.22, 1, 0.36, 1). Fades and 8–16px rises only.
No parallax, no bounce, no autoplay carousels, and specifically no countdown
timers — urgency theatre is the opposite of this brand.

VOICE — Careful, exacting, warm. Her own words: «کیفیت یعنی هیچ مرحله‌ای سرسری
انجام نشه» — quality means no step is ever rushed. Show, never promise. Willing
to say "get a consultation before buying this."

AVOID — Generic pink/lavender beauty palettes. Card grids and drop shadows.
Permanent discount furniture: no countdown timers, no discount pills on tiles,
no "sale" in the navigation. On medical-grade product, visible permanent
discounting tells patients the price was never real. No dashboard aesthetic on
customer-facing screens (the /admin area is exempt — it is a dashboard). No
stock photography of Western models. No emoji as icons.

IN THE LINKED REPO — designs/tokens.json is the single source of truth for every
value above; designs/tokens.css is the generated CSS custom properties plus a
Tailwind v4 @theme block. designs/design-language/index.html shows the palette
with its measured contrast ratios. docs/09-brand-brief.md is the full brand
brief, docs/10-design-playbook.md the shadcn and Tailwind implementation rules,
docs/04-information-architecture.md the shell and page templates. Existing
components live in src/components/{ui,layout,commerce}. Stack is Next.js 16.3
App Router, Tailwind v4, shadcn/ui on radix-ui, next-intl.
```

---

## Field 3 · "Add fonts, logos and assets"

Worth uploading, in this order of usefulness:

1. **`Vazirmatn[wght].woff2`** — the Persian face everything is set in
2. **The gold-and-turquoise medallion logo** — highest-resolution PNG or SVG available
3. **`BodoniModa[opsz,wght].woff2`** — Latin display
4. **Three or four institute photographs** — the white corridor with bamboo, the indigo wall with gold cove lighting, the champagne treatment room with the arched niches, the teal fluted glass. These are where the palette came from, and they explain the direction better than any description.

## Already linked

The GitHub repo and the local folder are both attached in your screenshot. That
gives it `tokens.json`, the docs, and the real components — which is most of what
it needs.
