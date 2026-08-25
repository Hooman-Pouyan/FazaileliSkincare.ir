# Information architecture & design language

**Updated:** 2026-08-24 (round 3 — after seeing the institute and the Instagram account)

---

## What the photographs changed

My first palette was guessed from your words: "gold, navy, turquoise, gray, white, bamboo green." Having seen the space and the brand, four of those six were slightly off, and I sampled the real values rather than keep guessing.

**The most important observation is uncomfortable but useful:** the *physical space* is considerably more elegant than the *graphic design*. The interiors — white corridors with bamboo in glass on white pebbles, a deep teal ceiling, gold cove lighting grazing an indigo wall, fluted green glass, a champagne-and-arch treatment room — are restrained, contemporary, and genuinely beautiful. The Instagram post templates — heavy gold frames, blue-to-gold gradients, outlined display type with drop shadows — are the visual language of Iranian beauty marketing generally, and they undersell the room they were shot in.

**So the website takes its cue from the architecture, not from the post templates.** That is the single decision that will make this site not look like every other skincare site in Iran. The logo stays exactly as it is — it's a strong, jewel-like mark — but it sits on quiet ground instead of competing with a gradient.

### Facts the images settled

| | |
|---|---|
| **Location** | **Mashhad**, not Tehran — «آکادمی تخصصی مراقبت از پوست در مشهد». Changes shipping (local courier is a Mashhad service), workshop venues, and Persian SEO. |
| **Brands** | **Forlle'd** (Japan — official representative, confirmed) · **Storyderm** (Korea) · **Thalgo** (France, seen in the treatment room). Forlle'd's line is **Hyalogy** — P-effect peeling lotion, AC spot essence, β serum, CLG Mask Luxury. |
| **Workshops** | Dated, city-named, sometimes **brand-sponsored and co-taught** — "Dermaplane Expert Workshop, ۳۱ تیر ۱۴۰۵, مشهد"; "O2White Workshop (Storyderm), ۳۱ خرداد ۱۴۰۵, مشهد" with a second instructor. `Cohort` therefore needs `venue`, `sponsoringBrand`, and **multiple instructors** — one more field than I had. |
| **Current funnel** | Instagram (@fazaieli_skincare, 7,409 followers, 252 posts) → **WhatsApp** (`wa.me/98930…`). The site replaces a WhatsApp queue, so the handoff from a bio link has to be excellent. |
| **Ready-made content** | The story highlights are already the site's content model: رضایت شما (testimonials) · قبل و بعد (before/after) · هنرجوها (students) · Storyderm · لحظات خاص من. |
| ⚠️ **Before/after** | Clinical photographs of identifiable clients' faces. Powerful, and the highest-consequence privacy surface on the site. Needs recorded, revocable consent per image, and no indexing without it. Treat it as health data, not marketing collateral. |

---

## The organising idea

You described what you want by analogy: *"almost the same as the Claude Mac app environment — Claude Code, Cowork, Chats: clean and decoupled yet coherent."*

That analogy is doing real work, so let's name what it means:

1. **One shell, many rooms.** A single persistent frame holds identity, language and search. Inside it, each room owns its whole layout and behaves as if it were the only thing on the site.
2. **You are always in exactly one room.** No mega-menu flattening shopping, booking and studying into one dropdown. Switching rooms is a deliberate, visible act.
3. **The rooms don't leak.** Shop language never appears in Booking. A course is never "added to cart".
4. **One account underneath.** The coherence comes from the account, not the navigation.

And "not a classic menu header and cards for body" rules out the default ecommerce template. Good — that template is why every skincare site looks interchangeable.

---

## The shell

```
┌────────────────────────────────────────────────────────────────┐
│ ▚  RAIL — 56px, fixed, cool white, hairline edge               │
│                                                                 │
│  ✳   the medallion → landing                                   │
│                                                                 │
│  ◈   Shop      ← three room marks, stacked, quiet              │
│  ◐   Booking      active room carries a 2px accent bar          │
│  ◇   Academy      in that room's colour                        │
│                                                                 │
│  ⌘   search / command                                          │
│                                        ⋯                        │
│  ﻭ   FA / EN                                                    │
│  ◯   account → My Studio                                       │
└────────────────────────────────────────────────────────────────┘
```

A **56px vertical rail** instead of a horizontal header. On desktop it sits at the inline-start edge — right in Persian and Arabic, left in English, mirrored automatically by logical properties. On mobile it collapses to a bottom bar with the same marks.

Why a rail: it removes the header entirely, gives every page full width for the photography (which is the best asset this brand has), and makes "which room am I in" ambient rather than inferred. The logo medallion at the top is the one place the ornate mark gets to be itself.

**The command palette (`⌘K`)** is the coherence layer and the replacement for a mega-menu:

```
  ┌──────────────────────────────────────────┐
  │  لک                                       │
  ├──────────────────────────────────────────┤
  │  فروشگاه                                  │
  │    Hyalogy AC Spot Essence     ۱٬۸۵۰٬۰۰۰ │
  │  رزرو                                     │
  │    فیشال روشن‌کننده · ۱۲۰ دقیقه           │
  │  آکادمی                                   │
  │    کارگاه O2White                        │
  └──────────────────────────────────────────┘
```

---

## The five surfaces

### 0 · Landing — the front door · `/`
A **scroll-composed introduction** to Mahdieh Fazaieli, not a homepage with a product grid.

Portrait, held for a beat → the claim (years of practice, hundreds of students trained, official representative of Forlle'd Japan) → three quiet doors into the rooms → proof (before/after, student work, testimonials — the highlight buckets, already written) → one closing invitation.

Full-bleed interior photography, asymmetric splits, large editorial type. The doors are three tall panels with a photograph and one line each — not three boxes with icons.

### 1 · Shop · `/shop` — accent **teal**
Browse by **concern** first (لک · جوش و آکنه · آبرسانی · ترمیم سد پوستی · ضدپیری), brand second, type third.

Product page as an editorial spread: hero image, the one-line promise, then ingredients / how to use / who it's for as progressive disclosure. "Pairs with", not "related products". Cart is a side drawer. Checkout is one page. Guest checkout allowed.

### 2 · Booking · `/book` — accent **firouzeh**
Calendar-first, and the only room where the Shamsi calendar is the primary object.

Service → a **Jalali week strip** with real availability across practitioners and beds → slot → intake questions → deposit → SMS confirmation. Four steps, one screen each. The cancellation policy is shown *before* payment.

### 3 · Academy · `/academy` — accent **gold**
Two clearly separated shelves: **dated workshops and cohorts** (venue, capacity, sponsoring brand, instructors — urgency is real) and **online courses** (start anytime).

A course page reads like a syllabus. Enrolled students get a different view entirely — player, lesson list, progress, materials — with no marketing on it.

### 4 · My Studio · `/studio` — accent **lapis**
The room that makes three businesses feel like one. Appointments · Orders · Learning, as three bands. Read-only aggregation; every action deep-links back into its own room.

---

## Design language

### Palette — sampled from the space, not invented

| Token | Value | Where it came from | Role |
|---|---|---|---|
| `--ground` | `#F7F8F8` | The corridors — **cool** white under daylight, not warm ivory | Page background |
| `--surface` | `#FFFFFF` | | Raised surfaces, sparingly |
| `--ink` | `#161B4A` | The deep indigo walls | All text and structure |
| `--lapis` | `#2D389A` | The lit logo wall | Brand blue — the one saturated field |
| `--gold` | `#A27F34` | The illuminated medallion | Hairlines, rules, marks |
| `--gold-light` | `#C2994F` | Cove lighting on indigo | Gold **on dark only** |
| `--firouzeh` | `#2BB8D4` | The turquoise gems in the logo | Interactive, Booking |
| `--teal` | `#24403E` | The fluted glass and green ceiling | Shop, calm fields |
| `--champagne` | `#D9C8A8` | The treatment room | Warm counterweight |
| `--sand` | `#E4D1C1` | Arched niches | Large soft fields |
| `--stone` | `#8A8781` | | Borders, secondary |

Two corrections worth naming, because they're the difference between a site that looks like the room and one that doesn't:

- **The blue is lapis, not navy.** Measured `#2D389A` lit and `#161B4A` deep — hue 235, high saturation. Navy is a corporate colour; this is Persian ultramarine, and paired with gold and firouzeh it's the classic Isfahani triad. That's a much better story than "navy and gold", and it's already true of your logo.
- **The green is deep teal, not bamboo sage.** The fluted glass and ceiling measured hue 177 at `#273B3A`. The literal bamboo in the corridors reads as an accent of living green against white — a *photographic* motif, not a UI colour. Use real plants in photography; use teal in the interface.

### The gold rule, now with a measured reason

| | On `#F7F8F8` | On `#161B4A` |
|---|---|---|
| gold `#A27F34` | **3.51 : 1** ✗ | — |
| gold-light `#C2994F` | 2.48 : 1 ✗ | **6.17 : 1** ✓ |
| firouzeh `#2BB8D4` | 2.22 : 1 ✗ | **6.91 : 1** ✓ |
| champagne `#D9C8A8` | 1.54 : 1 ✗ | **9.91 : 1** ✓ |
| ink `#161B4A` | **15.30 : 1** ✓ | — |
| lapis `#2D389A` | **9.21 : 1** ✓ | — |
| teal `#24403E` | **10.51 : 1** ✓ | — |

**Gold, firouzeh and champagne are dark-field colours.** They cannot carry text on white — which is exactly why your Instagram posts put gold on blue and look right doing it. So the site alternates: long stretches of ink-on-cool-white, punctuated by deep lapis sections where gold and turquoise finally get to speak. That rhythm is the design, and it's derived from the building rather than imposed on it.

On light ground, text-safe substitutes: `--firouzeh-text #146E82` (5.51:1) and `--stone-text #6B6863` (5.21:1). Teal and lapis need no substitute.

### Type
- **FA:** Vazirmatn or Estedad for body · Morabba for display. **Self-hosted** — see ADR-001's font warning.
- **EN:** an editorial serif for display · Inter or Manrope for body.
- Persian body line-height **1.8** — Persian needs more than Latin. Persian digits (`۱۲۳`) in FA.

### Form
- **No card grid.** Content sits on the ground plane, separated by whitespace and hairlines. A product tile is a borderless image with type beneath — no box, no shadow.
- **Hairlines over shadows.** Shadows are what make a site look like a template. `1px` rules in `--gold` at low opacity do the separating — the one place gold is unambiguously right.
- Radii `2px` on inputs, `16–24px` on images and drawers. Nothing between.
- Asymmetric 60/40 and 70/30 splits, echoing the arched niches. This is most of what reads as considered rather than corporate.
- Minimum 96px between sections on desktop. Crowding kills this look, and the space itself is not crowded.

### Motion
`400–600ms`, `cubic-bezier(0.22, 1, 0.36, 1)`. Fades and 8–16px rises. No parallax, no bounce, no autoplay carousels. `prefers-reduced-motion` honoured everywhere.

---

## Bilingual & RTL

- Locale-prefixed routes `/fa/...`, `/en/...` and `/ar/...`, with `fa` as the default. `<html lang dir>` per locale.
- **Every** spacing property logical: `margin-inline-start`, `padding-inline`, `text-align: start`. Grep for `left`/`right` in CSS as a pre-commit check.
- Directional icons mirror; the medallion never does.
- Numbers, currency and dates through locale formatters. Never concatenate a price.
- **Persian is the source text**; English and Arabic are translations. Writing a translation first produces stilted Persian.
- ⚠️ RTL is verified **screen by screen as each is built** (the gallery harness is deferred). Every screen gets a Persian pass before it is called done — a checkout that breaks in RTL costs a customer, and Persian is the primary locale, not the afterthought.

## Accessibility floor
Visible focus rings (2px `--firouzeh` on dark, `--firouzeh-text` on light — never `outline: none`), 44px minimum targets, keyboard-navigable Jalali calendar and command palette, real `<label>` on every input.
