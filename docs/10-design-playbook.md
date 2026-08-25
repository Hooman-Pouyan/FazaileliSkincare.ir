# Design playbook — shadcn/ui + Tailwind v4 + the Fazaieli design system

**Read `09-brand-brief.md` first** for *why*. This document is *how*.

---

## The layer cake

```
  designs/tokens.json          source of truth — colours, space, type, motion
        ↓ generated
  designs/tokens.css           CSS custom properties + Tailwind v4 @theme block
        ↓ consumed by
  src/app/globals.css          imports tailwindcss, then tokens.css
        ↓ styled through
  shadcn/ui components         installed fresh, restyled through the tokens
        ↓ composed into
  src/modules/*/screens/       page-level compositions — where the brand lives
```

**The rule that keeps this honest: no component file contains a raw hex value.** Ever. If a colour is needed that isn't in the tokens, the token set is wrong — fix the JSON, regenerate, and carry on.

---

## Step 1 — Tailwind v4 and tokens

Tailwind v4 is CSS-first; there is no `tailwind.config.js` theme to edit.

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "../../designs/tokens.css";   /* defines :root vars AND the @theme block */
```

`tokens.css` already exposes every token as a Tailwind utility through `@theme inline` — `bg-ground`, `text-ink`, `border-gold`, `text-firouzeh-text`. Use the utilities; don't re-declare colours in component files.

### SCSS policy

SCSS Modules are the preferred format for component-scoped authored styles. Keep `src/app/globals.css` and `designs/tokens.css` as plain CSS: Tailwind v4's CSS-first `@theme` pipeline is not designed to run through Sass preprocessing. Add `sass` when the first `*.module.scss` file is introduced; until then it would be an unused dependency.

**Fonts are self-hosted. Non-negotiable.** From Iranian infrastructure a request to `fonts.googleapis.com` hangs and takes the stylesheet down with it.

```ts
// src/app/fonts.ts
import localFont from "next/font/local";

export const vazirmatn = localFont({
  src: [{ path: "../../public/fonts/Vazirmatn[wght].woff2", style: "normal" }],
  variable: "--font-fa",
  display: "swap",
});
export const bodoni = localFont({
  src: [{ path: "../../public/fonts/BodoniModa[opsz,wght].woff2", style: "normal" }],
  variable: "--font-display",
  display: "swap",
});
```

---

## Step 2 — shadcn setup

```bash
pnpm dlx shadcn@latest init
```

`components.json` for this project:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": { "css": "src/app/globals.css", "baseColor": "neutral", "cssVariables": true },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "utils": "@/lib/utils",
    "hooks": "@/hooks"
  }
}
```

Two deliberate differences from the coordeck build: **`"rsc": true`** (this is a Next.js App Router project and server components are the default), and **`baseColor: "neutral"`** — it is only a starting point, immediately overridden by our tokens.

### Mapping shadcn's semantic names to ours

shadcn components reference `--background`, `--foreground`, `--primary`, `--ring` and so on. Bind those to our tokens once, in `globals.css`, and every generated component inherits the brand for free:

```css
@layer base {
  :root {
    --background: var(--ground);
    --foreground: var(--ink);
    --card: var(--surface);
    --card-foreground: var(--ink);
    --primary: var(--ink);            /* CTAs are ink-on-sand, not a bright fill */
    --primary-foreground: var(--sand);
    --secondary: var(--surface);
    --secondary-foreground: var(--ink);
    --muted: var(--surface);
    --muted-foreground: var(--stone-text);
    --accent: var(--champagne);
    --accent-foreground: var(--ink);
    --destructive: var(--danger);
    --border: var(--hairline-soft);
    --input: var(--hairline-soft);
    --ring: var(--firouzeh-text);     /* focus ring, text-safe on light */
    --radius: var(--radius-control);
  }
}
```

> **Note `--primary: var(--ink)`.** A brand's primary button does not have to be its brand colour. Lapis and firouzeh are *fields*, not fills behind text. The primary action is deep ink with sand type — quiet, expensive, and it passes contrast without argument.

### Dark mode — a split decision

`ui-ux-pro-max` flags dark mode as an anti-pattern for this style; shadcn's own guidance says define a complete `.dark` scheme. **Both are right, for different surfaces:**

- **Storefront, booking, academy, account → light only.** The palette is sampled from a daylit white building; a dark inversion would be a different brand. Do not ship a theme toggle on customer-facing pages.
- **`/admin` → dark scheme defined.** Staff spend hours in the order and transfer queues. Define `.dark` tokens scoped to the admin route group.

---

## Step 3 — Component rules

Install only what a screen actually needs. Expected inventory is ~25 components, not 60.

| Component | Our rules |
|---|---|
| `button` | Primary = `--ink` bg / `--sand` text, **`--radius-control` (2px), never rounded-full**. Ghost = text with a `--gold` underline on hover. Min height 44px. |
| `input`, `textarea`, `select` | 1px `--hairline-soft` border, 2px radius, `--ground` fill. **Visible `<label>` above — never placeholder-as-label.** Focus: 2px `--firouzeh-text` ring, offset 2. |
| `card` | ⚠️ **Do not use for products.** shadcn's `card` is a bordered, shadowed box; a product tile here is a borderless image with type beneath. `card` is for `/admin` only. |
| `dialog`, `sheet` | `--radius-surface` (20px), `--surface` fill, **no shadow** — a 1px `--hairline` edge and a scrim instead. The cart is a `sheet`. |
| `command` | The ⌘K palette. Groups by room: فروشگاه / رزرو / آکادمی. |
| `calendar` | Booking. **`react-day-picker` is on v10** — shadcn's generated component historically targeted v9; check it the day you add it. Jalali rendering comes from our own `JalaliDate` module, not from the library. |
| `input-otp` | Phone login. 6 digits. |
| `accordion` | PDP progressive disclosure — ترکیبات / روش استفاده / برای چه پوستی / اصالت. Never tabs; tabs hide content from crawlers and from a scrolling reader. |
| `badge` | Used sparingly: «موجود»، «حرفه‌ای»، «ظرفیت محدود». **No discount badges on product tiles.** |
| `sonner` | Toasts. Persian, bottom-start. |
| `skeleton` | Reserve space to keep CLS below 0.1. |
| `table` | `/admin` only. |

**Extend with `cva`, never with inline conditionals.**

```tsx
// ✅
const buttonVariants = cva("...", {
  variants: { variant: { room: "border-b border-gold bg-transparent text-ink" } },
});
// ❌
<Button className={isActive ? "bg-teal" : "bg-transparent"} />
```

**Icons: Lucide, stroke 1.4–1.6, 16/20/24 grid.** Never emoji. Rail destinations use recognizable Lucide symbols; the brand medallion remains custom.

---

## Step 4 — RTL, which is not an afterthought

Persian is the primary locale. Every one of these is a review-blocking rule:

1. **Logical properties only.** `ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `inset-inline-*`. Tailwind v4 supports all of them.
2. **Never `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`.** Add a pre-commit grep:
   ```bash
   grep -rnE 'className="[^"]*\b(ml|mr|pl|pr|left|right|text-left|text-right)-' src/ && exit 1
   ```
3. `<html lang dir>` set per locale; wrap the tree in Radix `DirectionProvider`.
4. Directional icons mirror (arrows, chevrons, progress). The medallion never does.
5. **Every screen gets a Persian pass before it is called done.** A checkout that breaks in RTL costs a customer.

### Persian typography

| | |
|---|---|
| Body line-height | **1.8** — Persian needs more than Latin's 1.5 |
| Digits | Persian `۱۲۳` in `fa`, Latin in `en`. One formatter, used everywhere. |
| Thousands separator | `٬` (U+066C), not `,` |
| Currency | Store integer **rials**; display **تومان** (÷10). Never mix units. |
| Dates | Store UTC `timestamptz`; render **Jalali** via `Intl.DateTimeFormat('fa-IR-u-ca-persian')` + `jalaali-js` for arithmetic |
| Latin inside Persian | Brand names (`Forlle'd`, `Hyalogy`) keep Latin glyphs and the display face — set them in a `.lat` span |

---

## Step 5 — Motion

```css
--duration: 480ms;
--easing: cubic-bezier(0.22, 1, 0.36, 1);
```

Fades and 8–16px rises on scroll entry. **No parallax, no bounce, no autoplay carousels, no countdown timers.** `prefers-reduced-motion` collapses `--duration` to 1ms — already wired in `tokens.css`.

> Corroboration worth noting: the design-system search independently returned "subtle hover 200–250ms, scroll reveal with an 8–16px offset, avoid harsh animations" for this product category. Our 480ms is slower on purpose — the brand is unhurried — but the *shape* matches.

---

## Step 6 — Page templates

Five layout templates cover the whole storefront. Build them once.

1. **Editorial scroll** — landing, about. Full-bleed imagery, asymmetric splits, alternating ink-on-white and lapis bands.
2. **Hub** (PHP) — concern tiles, brands, curated routines. Line-art or photographic tiles, no shadows.
3. **Listing** (PLP) — facet rail + borderless grid. Sort as a **chip row, not a dropdown**. **Live counts on every facet value.**
4. **Detail** (PDP) — 60/40 split, then accordion disclosure, then "مکمل این محصول".
5. **Flow** — checkout, booking, enrolment. One step per screen, visible progress spine, one primary action.

`/admin` is a sixth, deliberately different: dense, tabular, `card` allowed, dark scheme available.

---

## Pre-delivery checklist

Run this before any screen is called done.

- [ ] No raw hex anywhere in `src/`
- [ ] No `ml-`/`mr-`/`left-`/`right-` — grep passes
- [ ] Persian RTL pass done on this screen, at 375px and 1440px
- [ ] Body text ≥ 4.5:1; gold/firouzeh/champagne only on dark fields or as non-text
- [ ] Focus ring visible on every interactive element; `outline: none` never used bare
- [ ] Touch targets ≥ 44×44px, ≥ 8px apart
- [ ] Visible labels on every input; errors beside the field, not only at the top
- [ ] Images have `alt`; decorative SVG has `aria-hidden`
- [ ] Space reserved for images and async content (CLS < 0.1)
- [ ] `prefers-reduced-motion` honoured
- [ ] No emoji used as an icon
- [ ] Breakpoints checked: 375 / 768 / 1024 / 1440
- [ ] Nothing on a customer-facing screen looks like an admin dashboard

---

## A note on where this guidance came from

The palette, contrast ratios and rhythm are **ours** — measured from photographs of the institute, not selected from a library. The `ui-ux-pro-max` design-system search was run and its structural output adopted (style category, motion tier, landing section order, the pre-delivery checklist). **Its palette recommendation — soft pink and lavender — was rejected**, and should stay rejected: a generic "beauty" palette is exactly the interchangeability this brand is trying to escape. Its typography mood (high-contrast serif display + clean body, "elegant, editorial, premium") independently corroborated the Bodoni Moda + Vazirmatn pairing, which is a useful confirmation rather than a source.
