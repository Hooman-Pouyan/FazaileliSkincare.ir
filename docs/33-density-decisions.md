# Density — D-1 … D-5

**Date:** 2026-08-26 · **Packet:** 11 · **Closes:** `R-3` in [`27-storefront-refinement-backlog.md`](27-storefront-refinement-backlog.md)
**Amends:** [`10-design-playbook.md`](10-design-playbook.md) (the 96px rule) and [`25-design-system-adherence.md`](25-design-system-adherence.md) (the room table)
**Trigger:** the maintainer, twice — _"the cards on the PLP look way too big"_ and _"things in general are way too spacious"_, with Ant Design named as the reference.

---

## D-1 · The conflict is resolved by surface, not by compromise

`R-3` named this honestly and it has not gone away. `10-design-playbook.md` and
`AGENTS.md` both say hairlines not shadows, no card grid, asymmetric splits,
**96px minimum between sections**, and — verbatim — _"if a screen starts looking
like an admin dashboard, it has gone wrong."_ Ant Design is an enterprise system
built for dense administrative data. Splitting the difference globally would
produce a storefront that is neither editorial nor efficient.

**Decision.** Density is a property of the **surface**, because the surfaces are
doing different jobs:

| Surface                     | Job                              | Density       |
| --------------------------- | -------------------------------- | ------------- |
| Landing, brand storytelling | Persuade, set tone, be looked at | **Editorial** |
| Shop hub, PLP, PDP, cart    | Compare, decide, buy             | **Compact**   |
| Account, and later studio   | Operate                          | **Compact**   |

The 96px rule in `10-design-playbook.md` becomes **surface-conditional**: it
still governs editorial surfaces, and compact surfaces use 48px. It is not
withdrawn, because the Landing is the surface it was written for.

**What must survive**, from `R-3` and unchanged: hairlines rather than shadows
and boxes, no card grid, and **the editorial type scale**. Compact means _less
air between things_, never _more chrome around things_.

---

## D-2 · One mechanism — a density scope that redefines Tailwind's own spacing base

`R-3` offered two options and required exactly one be chosen: a parallel
`--space-compact-*` set, or a `data-density` scope. **The scope, and here is the
measurement that decided it.**

The shop surfaces do not read the semantic tokens. Counted across the listing,
hub, PDP, tile, facet rail and container: **5 uses of `var(--space-N)` against
77 raw Tailwind utilities** — `gap-2`, `gap-y-14`, `py-24`, `gap-x-6`. A
parallel token set would therefore have changed almost nothing, and closing that
gap would have meant the fifty `className` edits `R-3` explicitly refuses.

Tailwind v4 makes a better answer available. Its entire numeric spacing scale is
**derived from one variable**. In the compiled stylesheet:

```css
:root,
:host {
  --spacing: 0.25rem;
}

.gap-10 {
  gap: calc(var(--spacing) * 10);
}
.py-24 {
  padding-block: calc(var(--spacing) * 24);
}
.gap-y-14 {
  row-gap: calc(var(--spacing) * 14);
}
```

176 `calc(var(--spacing) * N)` references, all inheriting from `:root`. So a
descendant scope that redefines `--spacing` retunes **every spacing utility
beneath it**, with no component changed and no `className` touched.

```css
[data-density="compact"] {
  --spacing: 0.1875rem; /* 3px base — 0.75× */
  --space-7: 36px;
  --space-8: 44px;
  --space-9: 48px;
  --space-10: 64px;
}
```

Two token families inside **one** scope: the Tailwind base for the many small
and medium gaps, and the semantic `--space-*` for the section rhythm, which is
where the ratio needs to be steeper than a uniform multiplier can give. Both are
tokens, both live in `designs/tokens.css`, and a surface opts in by carrying one
attribute.

**Ratios, and why they are not uniform.** The design system's own
`previews/density-3-compact-48.html` — labelled _"COMPACT (48px, Ant-like)"_, so
the reference the maintainer named is the reference the designer used — does not
scale uniformly either: section rhythm 96 → 48 (0.5), grid column gap 24 → 20
(0.83), row gap 56 → 32 (0.57), panel padding 24 → 18 (0.75). A single
multiplier cannot express that. 0.75 on the base plus an explicit 48px section
step lands close to the study without fifty exceptions.

---

## D-3 · Type is not part of this change, and that is a deliberate departure from the study

The design system's compact study also reduces type — `h1` 46 → 32, `h2` 34 →
20, lede 19 → 15. **This packet does not.**

`R-3` is the decision on the record and it protects the type scale by name:
_"what must survive the compaction … the editorial type scale."_ The complaint
was about air and card size, both of which are spacing. Changing type at the
same time would make it impossible to tell which change did the work.

**Needs the maintainer.** The study is his design system's own answer and it
disagrees with `R-3` on this point. If the shop still reads as too large once
the spacing lands, the study's type scale is the next lever and it is one token
block — but it is a second decision, with the first one's result visible first.

---

## D-4 · Where the scope is applied

`src/components/layout/density.tsx` exists so the attribute has one home and one
documented meaning, rather than being an attribute anyone can spell differently.

| Route group                       | Density              |
| --------------------------------- | -------------------- |
| `(storefront)/page.tsx` — Landing | Editorial (no scope) |
| `(storefront)/shop/**`            | Compact              |
| `(storefront)/cart`               | Compact              |
| `(account)/**`                    | Compact              |

The Landing gets no attribute at all, so it inherits `:root` and is untouched —
which is the exit-gate condition and the thing most worth protecting.

---

## D-5 · Media boxes are capped, because a ratio is not a size

**Added 2026-08-26, after the maintainer saw `D-2` running.** His words: the hub
and PDP media are _"still way too big … their height is way too much and are
crazy huge."_ He is right, and `D-2` could not have fixed it.

**Why the spacing change did not touch this.** `D-2` retunes gaps and padding.
An image box is `aspect-ratio` multiplied by whatever the grid column is wide,
and neither of those is spacing. Measured at 1440:

| Component        | Box            | Columns          | Rendered         |
| ---------------- | -------------- | ---------------- | ---------------- |
| `ConcernPanel`   | `aspect-[4/5]` | `lg:grid-cols-3` | ~380 × **475px** |
| `SpotlightSlide` | `aspect-[4/5]` | `[0.9fr_1fr]`    | ~570 × **712px** |
| Concern rail     | `aspect-[4/5]` | `lg:grid-cols-3` | ~380 × **475px** |

The design system's `density-3-compact-48` study uses 4:5 as well — but on a
**900px canvas at three columns**, so ~280 wide and ~350 tall. **The ratio was
inherited without the canvas it assumed.** On a 1200px content width the same
ratio produces something half again as tall as the study ever showed.

**Decision.** Cap the height rather than change the ratio, through one token
under the same density scope:

```css
:root {
  --media-max-h: none;
}
[data-density="compact"] {
  --media-max-h: 22rem;
} /* 352px */
```

Capping rather than re-ratioing, for three reasons:

- **It is width-independent.** A ratio that looks right at 1440 is wrong at
  1920 and wrong again at 1280. A cap is the same everywhere, which is what
  "not proportionate relative to the page" was actually describing.
- **`object-contain` makes it free.** The packshots already letterbox on a
  neutral field (`R-4`, `8.3`), so a shorter, wider box simply gives the bottle
  more air around it — which is the treatment the maintainer asked for on the
  tile: _"it should sit smaller and centred."_
- **One number, one place.** Four components carry `aspect-[4/5]`; changing the
  ratio means four decisions that drift. A cap is one token they all read.

Editorial surfaces get `none`, so the Landing is untouched — the same boundary
`D-4` draws.

**Needs the maintainer.** 22rem is a judgement, not a measurement. It is the
first value that makes the three surfaces above look proportionate at 1440 while
leaving a packshot legible at 390; if it is still too large, this is one token.

---

## What this unblocks

`R-4`, `R-5`, `R-7` and `R-8` all render against whatever this decides, which is
why `30-next-block-plan.md` put density second rather than last. `R-4`'s tile
crop, `R-7`'s sticky rail, `R-6`'s price filter and `R-2`'s scroll position ride
along with this packet.

---

## Re-review trigger

The shop reading as still too spacious after this lands — in which case `D-3`'s
type question is the next lever, not a further spacing reduction. Or a surface
that is neither editorial nor operational appearing, which would mean the
two-value table needs a third.
