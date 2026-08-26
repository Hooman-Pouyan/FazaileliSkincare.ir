# The Landing as scroll storytelling — E-1 … E-6

**Date:** 2026-08-26 · **Packet:** 6, second pass
**Trigger:** the maintainer saw the first Landing and called it _"a normal landing"_ — not storytelling, not engaging, not using the assets already in the repository, and missing motion that had been asked for.
**Amends:** `L-2` (beat order), `L-3` and `LAND-07` (parallax), `CONTENT-03` (testimonials)

---

## Why this document exists

Three of the six decisions below **reverse or amend a decision already on the
record**, at the maintainer's instruction. `AGENTS.md` says an architectural
improvement is proposed before it is adopted and recorded in `docs/` — the same
rule applies in reverse when a decision is withdrawn. A refusal that quietly
stops being a refusal is worse than never having written it down, because the
next reader still finds the refusal and assumes it holds.

Each entry therefore states what the old decision said, who changed it, and what
now keeps the new answer from causing the harm the old one was protecting
against. The constraints are not hedging: they are the reason the reversal is
safe.

---

## E-1 · Parallax is adopted — reversing `L-3` and `LAND-07`

**What the record said.** `L-3`: parallax is refused, sticky band pinning is the
substitute. `LAND-07`: _"Sticky band pinning is the only depth device. No
parallax, no autoplay, no looping rail, no scroll hijack."_ `M-1`'s motion
contract stands behind both.

**What changed.** The maintainer, on 2026-08-26: _"you are not using parallax
effect which you must."_ It is their call, and the refusal is withdrawn.

**Why it was refused, and what that reason costs now.** Parallax was refused
because it is the standard way a landing page becomes janky on mid-range Android
hardware, and because on Iranian bandwidth a page whose composition depends on
scroll position renders wrong until everything loads. Those risks are real and
they do not disappear because the decision changed. They are answered by
constraints instead:

| Constraint                                                                         | Why                                                                                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **`transform: translate3d` only.** Never `background-position`, `top`, or `height` | Anything else lands on the layout or paint path and drops frames on exactly the hardware this site is for                 |
| **Every parallax layer is decorative** and `aria-hidden`                           | Depth is not allowed to carry a word. If the effect fails, nothing has been said that a reader missed                     |
| **Reserved space.** The layer's box is sized before the image loads                | `CLS < 0.1` is in the pre-delivery checklist and parallax is the classic way to fail it                                   |
| **Off under `prefers-reduced-motion`**, at the resting position                    | Parallax is a vestibular trigger, not a preference                                                                        |
| **No pinning, no scroll hijack, no snap.** The page scrolls normally               | This is the part of `L-3` that is **not** withdrawn. Taking the scroll away from a reader is a different thing from depth |
| **Desktop and tablet only**, above the `lg` breakpoint                             | A phone has no room for depth and the least headroom for it                                                               |

**What is still refused, unchanged:** autoplay, looping rails, scroll hijack,
sticky section navigation. `L-3` withdraws its parallax clause and nothing else.

---

## E-2 · The Landing gets more beats — amending `L-2`

**What the record said.** `L-2` fixed five beats and _"no beat added without an
amendment to this document"_. This is that amendment.

**What changed.** The maintainer's original brief asked for carousels,
horizontal draggable rails, editorial grids, brand storytelling, academy and
booking sections, the Forlle'd blossom vocabulary and scroll-driven narrative.
The five-beat page delivered the IA and none of the storytelling.

**The amended order.** The original five stay in their original order and keep
their numbering; the new beats sit between them rather than after them, because
a story does not get told by appending to it.

| #   | Beat                     | Status   | What it carries                                                                                        |
| --- | ------------------------ | -------- | ------------------------------------------------------------------------------------------------------ |
| 1   | Portrait, held           | existing | The headline over her own photograph, with the first parallax layer behind it                          |
| 1b  | **The method**           | **new**  | Three moments of the work itself — preparation, treatment, aftercare — as an editorial grid            |
| 2   | The claim                | existing | The verifiable credentials, on lapis                                                                   |
| 2b  | **The Forlle'd passage** | **new**  | Japan, the blossom vocabulary, 改善 — the one place the brand's reference is allowed to be the subject |
| 3   | Three doors              | existing | Shop, Booking, Academy with their room accents                                                         |
| 3b  | **What she teaches**     | **new**  | The academy as a rail, not a paragraph                                                                 |
| 4   | Proof                    | existing | Testimonials, now real; before/after still gated                                                       |
| 5   | Invitation               | existing | One action                                                                                             |

**The rule that keeps this from becoming a scroll of modules** — the same one
`LAND-05` already sets and it now matters more, not less: every new beat sits
beside a fact that is independently true. `1b` shows the work; `2b` states a
confirmed brand relationship; `3b` lists offerings that exist. A beat that
carries only adjectives and photography is the failure mode, and adding beats is
how a page acquires them.

**Re-review trigger.** A ninth beat, or `/about` and `/results` shipping and
pulling `1b` and `4` thinner.

---

## E-3 · Testimonials publish on the maintainer's confirmation — amending `CONTENT-03`

**What the record said.** All 43 transcriptions carry `publicationConsent:
"unknown"`, so `CONTENT-03` kept every real record unpublished and previewed the
rail with fiction. Packet 6 went further and did not import them at all.

**What changed.** The maintainer, on 2026-08-26: _"we got all their consents,
the OCR just couldn't capture them."_ Consent is a fact about their business, and
they are the only person who can know it — the same standing they have over
prices, credentials and brand relationships. The field was never evidence of
absence; it was evidence that the transcription could not see it.

**How that is recorded.** Not by overwriting `unknown` in place. The consent
becomes `granted` with the assertion attributed:

```jsonc
"publicationConsent": "granted",
"consentSource": "owner_confirmation_2026-08-26"
```

Same discipline as `nameSource` on a product and `authorNote` on a block: a value
someone asserted is stored with who asserted it. If it is ever questioned, the
answer is in the row rather than in a chat log.

**The caveat, which is not about consent.** 20 of the 43 records carry
`outcome_claim` and 6 carry `medical_appearance_claim`. Those flags were raised
by the transcription pass and they are a **different question** — Iranian
advertising rules cover implied medical results regardless of who consented to
being quoted. A customer saying a treatment cured something is a medical claim
the business is publishing, and consent from the speaker does not make the
business's use of it compliant.

So the rule is split:

| Record                                                                | Publishes                                                                        |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| No safety flag                                                        | **Yes**, on the owner's confirmation                                             |
| `outcome_claim` only                                                  | **Yes**, with the display quote edited to the experience rather than the outcome |
| `medical_appearance_claim`, `injectable_reference`, `aftercare_claim` | **Held** — needs the maintainer's explicit decision, per record                  |
| `third_party_claim`, `third_party_reference`                          | **Held** — the speaker is quoting someone who did not consent                    |

**Display quotes are edited, and that is normal.** `displayQuoteFa` is null on
every record and the raw transcription is a WhatsApp message — elongated letters,
emoji, greetings. The display quote is trimmed to the person's own sentence,
their words kept, their meaning unchanged. The transcription stays in the row
beside it, so what was edited is always visible.

**Needs the maintainer:** the six medical-appearance records, individually.

---

## E-4 · The cleared photography gets slots

**What the record said.** `public/images/README.md`, verbatim: the Japanese
reference photography _"is cleared for use and is genuinely on-brand. It is
unused only because no slot has been designed for it yet."_

**Now designed.**

| Asset                                      | Beat  | Role                                                        |
| ------------------------------------------ | ----- | ----------------------------------------------------------- |
| `s01-sakura-airy-branch`                   | 2b    | The parallax layer behind the Forlle'd passage              |
| `s02-ryoanji-raked-garden`                 | 1b    | "Preparation" — the raked garden is method made visible     |
| `s03-nara-tea-ritual`                      | 1b    | "Care" — ritual, not product                                |
| `s09-tokyo-stepping-stones`                | 3     | Behind the three doors: a path that divides                 |
| `s08-bamboo-leaf-silhouette`, `botanical/` | spine | Ornament, at low opacity on dark bands                      |
| `p03`, `p04`, `p05`, `p08`                 | 1b    | The product still-lifes, as the treatment grid              |
| `p01`, `heroes/forlled-stone-products`     | 2b    | Forlle'd's own product photography, on the brand's own beat |

`p01` and the transparent hero remain **Permission not verified**. They render
under the same narrow reasoning the Shop hero already uses — a retailer showing
a manufacturer's product photograph, for the one brand relationship recorded as
confirmed — and they still need the one sentence from the distributor before
launch.

---

## E-5 · The motion vocabulary grows, and `M-1`'s contract does not

**Three additions**, all through `@/lib/motion/choreography` so there is still
one place motion lives:

1. **`parallaxLayer`** — a decorative layer translating on scroll, per `E-1`.
2. **`scrubReveal`** — a section whose entrance is tied to scroll position
   rather than fired once at a threshold. This is what "storytelling on scroll"
   actually means: the reader controls the pace, which is the opposite of a
   scroll hijack.
3. **`hoverLift`** — the pointer choreography the first pass had none of.

**`M-1` is unchanged and every addition obeys it:** content is in the SSR HTML,
the page is correct with JavaScript off, nothing is hidden by default, no layout
shift, `prefers-reduced-motion` renders resting states, nothing runs forever, and
the dependency earns its bytes — anime.js is already installed and is where SVG
and timeline choreography belongs under `M-4`.

**The boundary from `M-4` still holds.** CSS owns state changes; anime.js owns
choreography. `hoverLift` is the exception that proves it: a hover is a state
change, so it is CSS, and it is listed here only because the first pass had no
hover states at all.

---

## E-6 · `<main>` may not offset itself past the rail

**The defect.** `storefront-shell.tsx` already offsets the page for the rail
with `md:ps-14`, and `product-listing.screen.tsx` and `landing.screen.tsx` each
added `ms-14` on top of it. Two offsets, 112px, and a visible gap between the
content and the rail on every listing and on the Landing.

**It was already known.** `shop-hub.screen.test.tsx` asserts that its own
`<main>` does not contain `ms-14`. The rule was learned, written as a test, and
scoped to one screen — so the next two screens reintroduced it, and one of those
was written today by the same author as the test.

**The fix, and the rule.** The shell owns the rail offset; a screen never
compensates for it. The guard moves out of the hub's test into one that walks
every screen file, because a test that protects one file is not a rule.
