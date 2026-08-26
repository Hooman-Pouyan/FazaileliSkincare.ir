# Design-system adherence — DS-1 … DS-5

**Date:** 2026-08-26 · **Trigger:** a hand-rolled price control shipped while the design system's own `Slider` sat unused, and the Shop room's teal accent was absent from the Shop
**Pattern:** interim decisions with re-review triggers

---

## Why this document exists

`AGENTS.md` already says _"Reach for the design system before writing UI."_ That
rule was not followed, and the reason is worth recording rather than
apologising for: **the design system's component library was never opened.**

`design-system/Fazaieli Design System-handoff.zip` holds 228 files — a full
component library with a `.prompt.md` beside every component stating its
purpose and its rules, plus `SKILL.md`, `_adherence.oxlintrc.json`, brand assets
and icons. Work proceeded from `designs/tokens.css` and
`docs/10-design-playbook.md` alone, which are the _foundations_ rather than the
_components_. The tokens were followed; the components were reinvented.

Three consequences reached `main` before anyone looked:

| What shipped                                            | What the design system already had                                                                                                                                                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A price filter built from two `<input type="number">`   | `Slider`, whose own spec reads _"the price-range control inside the facet rail — the only slider in the system"_ — already ported to `src/components/ui/slider.tsx`, token-bound, **imported by nothing** |
| A `SlashMark` SVG invented as a section ornament        | `Divider` — a gold hairline broken by the turquoise glyph, _"the one piece of ornament the system allows"_                                                                                                |
| Lapis as the active/selected colour throughout the Shop | Teal `#24403E` is the **Shop room's accent**. Lapis belongs to My Studio                                                                                                                                  |

---

## DS-1 · The handoff library is read before a component is written

**Decision.** Before building any UI, read the component's `.prompt.md` in the
handoff zip. If a component exists there, port it or use the existing port; do
not write a second one.

**Why this is a rule and not advice.** The failure mode is invisible from
inside: a hand-rolled control looks fine, passes every gate, and only reveals
itself when someone who knows the system looks at it. Nothing in typecheck,
eslint or the test suite could have caught the price filter — it was correct
code implementing the wrong thing.

**The inventory, so the next reader does not have to unzip it:**

| Group    | Components                                                                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| brand    | `Divider`, `Logo`                                                                                                                                                            |
| commerce | `ConcernRail`, `FacetRail`, `Pagination`, `PairsWith`, `PlpToolbar`, `Price`, `ProductDisclosure`, `ProductGallery`, `ProductGrid`, `ProductTile`, `SortChips`, `StockBadge` |
| core     | `Accordion`, `Badge`, `Button`, `Icon`, `Rule`, `Skeleton`                                                                                                                   |
| forms    | `Checkbox`, `Input`, `Label`, `QuantityStepper`, `Slider`                                                                                                                    |
| layout   | `Breadcrumbs`, `Container`, `EmptyState`, `EvidenceRow`, `PageHeader`, `Rail`                                                                                                |
| overlays | `CartDrawer`, `Dialog`, `FilterDrawer`, `SearchCommand`, `Sheet`, `Toast`                                                                                                    |

`EvidenceRow` and `PairsWith` have no port yet and belong to the PDP.
`FilterDrawer` belongs to the PLP's mobile treatment and is not built.

---

## DS-2 · Price is the Slider, and it stays a form

**Decision.** `PriceFilter` uses the design system's `Slider` inside a GET form.

The Slider's spec adds a rule that is easy to skip: _"Always print the two ends
as Toman text beneath it; a slider alone is not a price."_ Both ends are printed.

**How it stays addressable.** The slider is a client control, but the submit is
still a form: two hidden inputs carry `price_min` and `price_max` in toman, so
the URL is one the query grammar recognises and the result is a normal
shareable listing. A real submit button rather than navigation on change also
stops a drag from firing a request per pixel.

**The hidden inputs are not a workaround.** Radix names its own hidden inputs
`price[]`, which is not the grammar's spelling. Two named inputs are how the
control speaks the URL contract rather than the library's.

---

## DS-3 · Room accents are used, and each room uses its own

**Decision.** Every room asserts its accent on its own surfaces:

| Room               | Accent                 | Where it appears                                                                                        |
| ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Shop `/shop`       | **teal** `#24403E`     | Active facet values and their marks, current sort chip, current page, product-name hover, section rules |
| Booking `/book`    | **firouzeh** `#2BB8D4` | Its own surfaces, and — everywhere — focus rings and enquiry links, via `firouzeh-text`                 |
| Academy `/academy` | **gold** `#A27F34`     | Its own surfaces; the hairline and ornament colour everywhere                                           |
| My Studio          | **lapis** `#2D389A`    | Its own surfaces only                                                                                   |

**What went wrong.** Lapis was used as the generic "selected" colour across the
Shop, which is My Studio's accent — so the Shop looked like the account area and
the room accents said nothing.

**The contrast rule that constrains this**, from `tokens.css` line 6 and the
system's own three-rule summary: _gold, firouzeh and champagne carry text only
on the ink field, never on cool white._ Teal is the exception that makes the
Shop workable — 10.51:1 on cool white — which is why it can be the active state
on a light listing while firouzeh cannot. On light ground the text variants
`firouzeh-text` and `gold-text` are used instead.

---

## DS-4 · The Divider is the one ornament, twice per page at most

**Decision.** `Divider` — the gold hairline broken by the turquoise glyph —
separates major editorial sections. `Rule` remains the default separator.

Its own note: _"Not between list items, not inside a form, not more than twice
on a page. A plain Rule is the default; this is the exception."_

Current use: the Shop hub places two, before the editorial mosaic and before the
closing invitation. The PLP places one, above the questions block, and only when
there are questions.

**The `SlashMark` invented earlier stays** as the small section-heading mark —
it does a different job at a different size, and it comes from the Forlle'd
reference rather than being decoration. It is not a substitute for the Divider
and never spans a page.

---

## DS-5 · The catalogue is health care, not only skin care

**Decision.** The domain is professional **health and skin care**. The facet
manifest, taxonomy and copy are written so a non-skincare product line does not
need a schema change to arrive.

**What this already survives.** `concern`, `skin_type`, `category`, `line`,
`phase` and `audience` are all reference tables with slugs and translations —
none of them hardcodes a skincare value. Adding supplements or devices is rows,
not migrations.

**What it changes.** `skin_type` is the one facet whose _name_ assumes skin. It
keeps that name while the catalogue is skincare, because a customer reading
«نوع پوست» understands it and «نوع» alone would not. When a product line arrives
that has no skin type, the honest move is a second facet rather than a renamed
one — `PLP-10` requires an owner per facet, and a facet that means two things
has none.

**Re-review trigger.** The first non-skincare product line. At that point re-read
F-1 with it in hand: the question is whether each facet still has one meaning.
