# Motion, interaction and library decisions — M-1 … M-5

**Date:** 2026-08-25 · **Trigger:** the hub read as flat, and richer ecommerce blocks, carousels, a video hero and scroll effects were asked for
**Pattern:** interim decisions with re-review triggers, as used in `19-navigation-decisions.md`

---

## M-1 · The contract any interactive block must meet

Before any library or technique is judged, this is the bar. It is not a
preference; SEO is a stated priority for this project and the audience is
mobile-first on Iranian networks, so a block that fails any line below is not
shipped regardless of how it looks.

1. **The content is in the server-rendered HTML.** Not fetched, not built by a
   script, not inside a container a crawler has to execute JavaScript to open.
2. **The page is correct with JavaScript disabled.** Interaction may be poorer.
   Content may not be missing.
3. **Nothing is hidden by default and shown by script.** A reveal adds its
   hiding class from an effect, so the served markup is the finished page. This
   single rule is the difference between a scroll animation and an
   accidentally-deindexed section.
4. **No layout shift.** Every media box has reserved dimensions; CLS stays under
   0.1, which `10-design-playbook.md` already requires.
5. **`prefers-reduced-motion` is honoured** — `tokens.css` collapses `--duration`
   to 1ms, so a transition on the token needs no special case, and anything
   that is not a transition must be disabled explicitly.
6. **Nothing runs forever.** No loop, no `requestAnimationFrame` after the
   reveal, no autoplay carousel, no timer. Battery and main thread are the
   customer's, not ours.
7. **A new dependency has to earn its bytes** against what the platform already
   does, measured against a phone on a slow connection.

---

## M-2 · Richer blocks were the right ask; the hub now has them

The criticism was fair — the first hub was four headings and three lists. What
it has now, all inside M-1:

| Block             | What it is                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero band         | Asymmetric editorial split, near-full-height, display headline as real text, two actions, portrait held in a reserved box. Accepts a video source (see M-5)   |
| Concern panels    | 4:5 photographic panels with a hover wash and a teal underline; a dragged rail on phones, a grid from `md` up — same list, different container                |
| Product rail      | Draggable scroll-snap carousel with arrows and edge detection                                                                                                 |
| Authenticity band | Lapis field, the Forlle'd claim, the 日本製 mark, and the blossom ornament. Not decoration: counterfeit anxiety is this category's biggest purchase objection |
| Brand grid        | Hairline-gapped cells, display type, country from `Intl.DisplayNames`, live counts                                                                            |
| Category chips    | Real links with counts                                                                                                                                        |
| Closing band      | One question, one action                                                                                                                                      |

Rhythm alternates ground → surface → lapis → ground, which is the band pattern
`09-brand-brief.md` describes and the only field where gold and champagne pass
contrast.

---

## M-3 · Swiper is the storefront's only carousel

**Decision.** `swiper@14` behind one component, `src/components/layout/carousel.tsx`.
The hand-rolled scroll-snap rail it replaced is deleted.

**Why one and not both.** The rail was fine and Swiper is better; keeping both
would have left two answers to "how does a row of things scroll", which is the
drift `AGENTS.md` exists to prevent and how a codebase ends up with a different
rail on every screen. Swiper wins because it brings keyboard, focus management,
a11y announcements, pagination and breakpoint-aware `slidesPerView` that the
rail would have grown one patch at a time.

**How it is bounded, so M-1 still holds:**

| Concern                  | How                                                                                                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content before hydration | Swiper React server-renders `swiper-wrapper` and every `swiper-slide`. A test asserts the slides, the product name and its price are all in the static markup                                                                         |
| Usable before hydration  | `.no-js-scroll .swiper-wrapper` in `globals.css` gives the wrapper real `overflow-x`, so an un-initialised carousel is a scrollable row rather than overlapping slides. Swiper's transform takes over on init and the rule goes inert |
| Autoplay                 | The `Autoplay` module is **never imported**. It is not a prop anyone can pass; it is absent from the bundle                                                                                                                           |
| Weight                   | Modules are imported one by one — `Navigation`, `Pagination`, `Keyboard`, `A11y` — not the bundle                                                                                                                                     |
| RTL                      | Read from the resolved locale inside the component, with a remount key on direction, so no caller can get it wrong                                                                                                                    |
| Styling                  | Bullets and focus rings are redefined against the token layer in `globals.css`; Swiper's blue defaults do not ship                                                                                                                    |

**Re-review trigger.** A surface that needs a rail with none of Swiper's
features — a plain overflow row — in which case plain CSS is right _there_ and
this decision does not force a library onto it.

---

## M-4 · anime.js owns choreography; CSS keeps state

**Decision.** `animejs@4` behind `src/lib/motion/choreography.ts`. The boundary,
which is the whole point of adopting it deliberately:

| Kind of motion                                                                       | Mechanism                                                                                 |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Hover, focus, open/closed, active — one element between two states                   | **CSS transitions** on `--duration`/`--easing`. Declarative, no script, already tokenised |
| A group entering in sequence; an SVG stroke drawing itself; anything with a timeline | **anime.js**, through a helper in `choreography.ts`                                       |

If a new animation is one element moving between two states, it does not go in
`choreography.ts`. That sentence is the rule; everything else here follows from
it.

**What it actually bought.** `stagger` means a group can enter in sequence
without every caller inventing its own delays — the previous `Reveal` took a
`delay` prop and each caller computed `Math.min(index, 3) * 60`, which is a
convention that survives exactly as long as everyone remembers it.
`svg.createDrawable` measures every path in a group and handles the dash
bookkeeping, which by hand is `getTotalLength` plus two custom properties per
path — that is what makes the blossom able to draw itself.

**What it must never become.** A second way to do hover. A scroll-linked
timeline that runs continuously. A reason to hide content in markup. v4 is
modular ESM, so `animate`, `stagger`, `svg` and `utils` are what ship; importing
the default bundle would undo the reason it was affordable.

**Reduced motion is a skip, not a shortening.** Every helper returns early under
`prefers-reduced-motion` and leaves the finished state alone. A stagger of 1ms
steps is still a stagger.

**Still refused, and why the trigger matters.** GSAP, AOS and Swiper's own
effect modules stay out: each would be a third mechanism for something the two
above already cover. Three.js stays deferred per L-12. The library that is
_added_ is added because a requirement named it — that order is the rule, not
the specific answer.

---

## M-5 · The video hero: poster first, video behind, never load-bearing

**Decision.** `HubHero` accepts an optional video and renders it _behind_ the
still image, never instead of it.

- The poster is a real `next/image` with `priority`; it is the LCP element and
  stays if the video never loads.
- The video is `muted`, `loop`, `playsInline`, `preload="none"`, and hidden
  below `md` — a phone downloads a photograph and nothing else.
- The headline and both actions sit _beside_ the media, not inside it, so no
  text depends on a decoded frame.
- `motion-reduce:hidden` removes it for readers who asked for less motion, from
  CSS rather than script, so it holds before hydration.

**Why this shape.** A video background costs LCP and SEO when the text lives
inside it or the poster is a frame the browser must decode the video to obtain.
Both are avoided by construction here rather than by tuning.

**Gap carried.** No video asset exists. The hero ships with the photograph and
takes a source the day there is one — ideally the corridor or the treatment
room, which is what "the calm of the corridor, not the noise of the marketplace"
actually looks like.

---

## M-6 · Voice: the copy is written to be spoken, not scripted

**Decision.** Persian copy on customer-facing surfaces is warm, direct and
second-person, and it names the thing the reader is worried about. English and
Arabic are written to the same brief rather than translated word for word.

**What changed on the hub.** «فروشگاه — مراقبت از پوست، بر پایهٔ دغدغهٔ شما»
became «از همان چیزی شروع کنید که در آینه می‌بینید». Product availability went
from «فعلاً موجود نیست» to «الان موجود نیست»; the enquiry action from «استعلام
قیمت» to «قیمت را بپرسید»; the closing band asks «مطمئن نیستید کدام برای پوست
شماست؟» and offers help _whether or not_ the reader buys.

**Why it matters commercially, not only tonally.** `09-brand-brief.md` describes
a woman arriving from Instagram who needs to believe a real specialist is behind
this within ten seconds. Marketing register is exactly what makes that
unbelievable — it is the voice of every other skincare site in the market. Hers
is the voice of someone who has looked at a lot of skin.

**SEO is served by the same sentences, not by a separate layer.** The terms
Iranian customers actually type — لک، جوش، آبرسانی، ترمیم سد پوستی، ضدپیری،
نمایندهٔ رسمی فورله‌د، خرید اینترنتی — appear in headings, ledes and meta
descriptions because they are what the sentences are about. Keyword furniture
bolted onto copy reads as bolted on to a reader and, increasingly, to a search
engine.

**Needs the maintainer.** This is her voice and I am approximating it. Read the
Persian on the hub and tell me where it sounds like me rather than like her —
that correction is worth more than another pass from me.

---

## Appendix · The block library — proposed, awaiting selection

⚠️ **Nothing here is decided.** These are the section types available to the
storefront, offered so the maintainer can choose rather than react. Each row
says what it needs before it can be built, because most of them are blocked on
content rather than on code.

Ordering is by what the business gets, not by visual appeal.

### Blocks that sell

| #   | Block                            | What it is                                                                                                                                                           | Needs                                                              | Surface                |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------- |
| B1  | **Product spotlight, paginated** | One product at a time, large image against an offset panel, name, promise, one action, previous/next through a curated set. The Forlle'd reference's strongest block | Nothing — `getShopHub().featured` already supplies it              | Shop hub               |
| B2  | **Routine builder**              | Three or four numbered steps — cleanse, treat, protect — each naming a real product, as one composed row rather than a grid                                          | A `routine` relation, or an editorial list of product slugs        | Shop hub, PDP          |
| B3  | **Concern → product bridge**     | A concern's name, one sentence about it, and the three products for it side by side. Repeats per concern                                                             | Nothing new; a per-concern read                                    | Shop hub               |
| B4  | **Before / after**               | Reader-controlled pair or divider. Structure already specified in `landing.md` `LAND-09`                                                                             | Consent per person **and** the Iranian advertising question — L-15 | Landing, concern pages |
| B5  | **Pairs with**                   | Two or three products that genuinely go together, from the PDP's own relation                                                                                        | The PDP's pairing data                                             | PDP                    |

### Blocks that answer objections

| #   | Block                  | What it is                                                                                                                                                    | Needs                                                                  | Surface              |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------- |
| B6  | **Mechanism diagram**  | One drawn diagram explaining how something works — the Forlle'd reference uses a molecule. Ours would be the skin barrier, or how a peel differs from an acid | A drawn SVG and copy that makes **no medical claim** we cannot support | Shop hub, brand page |
| B7  | **Authenticity proof** | Built. The 日本製 mark, the representation, the offer to check a package                                                                                      | Done                                                                   | Shop hub             |
| B8  | **Practitioner note**  | A short signed paragraph in her own voice beside a product or concern — "why I use this"                                                                      | Her words, per product or concern                                      | PDP, concern pages   |
| B9  | **Testimonial rail**   | Reader-paced RTL scroll-snap rail                                                                                                                             | Consent on the 42 records — L-4                                        | Landing              |

### Blocks that carry the brand

| #   | Block                         | What it is                                                                                                              | Needs                                                                 | Surface                  |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------ |
| B10 | **Asymmetric photo mosaic**   | Three or four photographs in an uneven grid beside a heading and one paragraph. The Forlle'd reference's fourth section | Cleared photography — **available now**, the Pexels/Unsplash/CC0 sets | Shop hub, Landing        |
| B11 | **Full-bleed quiet band**     | One photograph edge to edge with one line over it. A breath between dense sections                                      | Cleared photography — available now                                   | Between any two sections |
| B12 | **Ritual / garden interlude** | The Japanese reference photography — raked garden, tea, stone path — with one line tying it to how she actually works   | Copy that earns it, per L-9: a real method, not atmosphere            | Landing                  |
| B13 | **Sticky-pinned statement**   | A lapis band that holds while content scrolls past it. The parallax substitute from L-3                                 | Nothing                                                               | Landing                  |

### What is deliberately absent

A countdown, a discount ribbon, a newsletter interstitial, a "customers also
bought" strip driven by nothing, a star-rating summary, an autoplay carousel,
and a values row of icons and adjectives. The first six are refused by
`09-brand-brief.md` or D-18-3; the last by L-12.

### Recommendation if only three are chosen

**B1**, because it makes the hub's merchandising feel intentional and needs no
new content. **B3**, because it is the shortest path from a concern to a
purchase and the concern axis is this site's whole competitive argument.
**B10**, because cleared photography is sitting unused and it is the cheapest
change with the largest effect on how the page feels.
