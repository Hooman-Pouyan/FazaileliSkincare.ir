# Content depth — the measurement, and what it implies

**Date:** 2026-08-26
**Status:** **findings and options only. Nothing here is decided, and nothing here is scheduled.**
**Raised by:** the maintainer, on seeing the storefront running — the pages "look way too deserted … as a commercial ecommerce platform there is way too little data, sections, content, copywriting or product detail".
**Deliberately not acted on:** [`30-next-block-plan.md`](30-next-block-plan.md) guardrails every phase in the current block against adding page sections, content kinds or taxonomy. This document exists so the observation survives until that conversation happens, rather than being fixed piecemeal by whoever notices it next.

---

## Why this is written down instead of built

The instinct on seeing a thin page is to add sections. That instinct is wrong
here, and the measurement below is why: **the sections are not missing, the
data behind them is empty.** A richer layout over the same rows produces empty
frames, and `L-4`'s rule — unapproved content is _absent_, not empty-framed —
would then have to be broken to make the page look full.

It is also the single most expensive thing to get wrong, because sections
designed against imagined content have to be unpicked when the real content
turns out to have a different shape.

---

## The measurement

Taken against the seeded development database on 2026-08-26, all fifty
Storyderm products, Persian:

| Field                             | Populated  | What it feeds                                  |
| --------------------------------- | ---------- | ---------------------------------------------- |
| `product_translation.promise`     | **0 / 50** | The one line under every tile and the PDP lede |
| `product_translation.description` | **0 / 50** | PDP editorial body                             |
| `product_translation.ingredients` | **0 / 50** | «ترکیبات کلیدی» disclosure                     |
| `product_translation.usage`       | **0 / 50** | «روش استفاده» disclosure                       |
| `product_translation.suitableFor` | **0 / 50** | «برای چه پوستی» disclosure                     |
| `product.ircCode`                 | **0 / 50** | «اصالت کالا» disclosure                        |

And the content spine, whole site:

| Surface        | Blocks                                                         |
| -------------- | -------------------------------------------------------------- |
| `landing`      | 3 editorial, 2 gallery, 1 testimonial                          |
| `shop.listing` | 7 FAQ, 1 editorial, 1 campaign, 1 gallery                      |
| `shop.hub`     | **none** — it still runs on `R-5`'s four hardcoded image paths |
| `product`      | **the surface does not exist**                                 |

Sixteen `content_block` rows for the entire site. 73 `content_item` rows,
which is almost entirely the 33 published testimonials and the FAQ.

**So a product tile renders a name, a brand and a price, because that is all
there is.** The PDP's disclosure accordion is correctly absent on all fifty
products — it has nothing to open onto. The behaviour is right; the shelf is
bare.

---

## The reframe: those five fields do not belong to one person

"Who writes 250 pieces of copy" is the wrong question, and answering it as one
question is why it has been the bottleneck since packet 2. The fields divide
by **whose fact it is**, which is the same division `AGENTS.md` and standing
instruction 6 already draw everywhere else in this repository:

| Field         | Whose fact                           | Risk                                                           | Blocked by                         |
| ------------- | ------------------------------------ | -------------------------------------------------------------- | ---------------------------------- |
| `ingredients` | **Storyderm's** — printed on the box | Low. Transcription and translation, not authorship             | Having the manufacturer's material |
| `usage`       | **Storyderm's** — printed on the box | Low. Same                                                      | Same                               |
| `promise`     | The business's                       | Medium — a marketing claim under Iranian advertising rules     | A writer, and the owner's voice    |
| `description` | The business's                       | Medium — editorial                                             | Same                               |
| `suitableFor` | **Mahdieh's alone**                  | **High** — a clinical judgement about who should use a product | Only her                           |

That split turns one impossible task into three tractable ones, and it means
roughly **a hundred of the two hundred and fifty fields are unblocked today**
if the Storyderm product sheets can be obtained. Ingredients and usage are
facts about a product, not claims about her practice, so they do not sit behind
the same gate as prices, credentials and consent.

`suitableFor` is the one nobody but her may fill. It is advice.

---

## The option I would argue for, if asked

**Populate eight products properly rather than fifty thinly.**

Skincare retail runs on hero SKUs. Eight products carrying full ingredients,
usage, suitability, a real photograph set and a routine — with forty-two honest
catalogue entries beside them showing name, size, price and packshot — reads as
a curated practice. Fifty products at forty per cent depth reads as a
dropshipper. The taxonomy already exists to make a thin entry look deliberate.

It also makes «مکمل این محصول» real. All 137 pairings currently carry
`source: development` because a seeder generated them mechanically from the
Storyderm range (`8.x`, packet 8). Eight hero products is roughly twenty-four
pairings — a number Mahdieh could choose herself in an afternoon, which turns
them from invented into authored.

---

## The question underneath all of it

**What is a product page for, in this business?**

- If it is for someone **choosing between two creams**, it needs comparison,
  suitability and depth on every SKU, and the content investment is enormous.
- If it is for someone **who already trusts her and wants what she recommended
  in the clinic**, the product page needs very little — and the depth belongs on
  the **concern pages**, which is where `F-5` already says the highest-value SEO
  text on the site lives, and where `08-competitive-research.md` locates the
  competitive argument.

These are different products, not different amounts of effort. The second is
cheaper, more defensible and closer to what the practice actually is — but it
is a bet about her customers, and that is the maintainer's to make, not
engineering's.

---

## What this changes if the second answer is right

Nothing is being proposed here. But it is worth recording that if the concern
page is the centre of gravity rather than the PDP, the consequences reach the
data model:

- `shop.hub` needs its own content blocks (`R-5` already says so, for a
  different reason).
- A `product` surface may not need to exist in the content spine at all.
- Concern pages would want kinds the spine does not have — a routine, an
  ordered protocol, a before/after set already gated by `L-16`.
- Which means **the four-table content spine may need a fifth table, or a
  richer `content_item`** — and that is a schema decision that should be made
  once, with the section design in front of it, rather than incrementally.

---

## Re-review trigger

The maintainer's content and copy decision. When that lands, this file becomes
the input to the section design rather than a standing observation, and the
guardrail in [`30-next-block-plan.md`](30-next-block-plan.md) can be lifted for
whichever phase carries it.
