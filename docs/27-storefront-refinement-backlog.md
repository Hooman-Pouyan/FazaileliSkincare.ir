# Shop hub and PLP — refinement backlog, R-1 … R-10

**Date:** 2026-08-26 · **Status:** recorded, **not scheduled and not started**
**Raised by:** the maintainer, after seeing the PLP and hub running against the real catalogue for the first time
**Applies to:** [`system-design/storefront/shell-and-product-hub.md`](system-design/storefront/shell-and-product-hub.md) and [`system-design/storefront/plp.md`](system-design/storefront/plp.md)

---

## How to read this file

These are **observations with a recommended shape**, not decisions. Nothing here
is implemented, and nothing here should be implemented until the remaining
packets land — Landing, PDP, cart, checkout. They are written down now because
the observations were made now, and a note taken three packets later is a note
taken from memory.

Each entry says what was seen, what it collides with, what it would cost, and
what I would do. Where an entry contradicts a decision already on the record,
the contradiction is named rather than smoothed over — several of these do.

**Ordering matters.** `R-3` changes the spacing tokens that `R-4`, `R-5` and
`R-8` all render against, so it goes first or those three get done twice.
`R-1` and `R-2` are one problem wearing two hats and should be taken together.

**Two entries are not refinements.** `R-9` may be a defect and cannot be
classified without one command being run; `R-10` is a mess I made and carries a
one-line workaround. Both are here because that is where the observation was
made, not because they should wait their turn.

---

## R-1 · Infinite scroll instead of pagination

**Observed.** Paging through a catalogue feels wrong for browsing skincare; the
maintainer wants continuous scroll.

**What it collides with.** Three things already on the record:

- `D-18-3` and `PLP0–5` make every listing state a **real URL**: shareable,
  refreshable, back-button-able, crawlable. That is the competitive argument in
  `08-competitive-research.md` — the dominant Iranian vendor's listings cannot
  be linked to, and ours can.
- `AGENTS.md` requires the storefront to work with JavaScript off. An infinite
  scroll with no pages underneath it shows twenty-four products and stops.
- Review item `7.9`: `ItemList` numbers items across the whole listing, so page
  three starts at 25. That numbering only means anything if pages exist.

**What I would do.** Not "infinite scroll _instead of_ pagination" — infinite
scroll **over** pagination. The paginated URLs stay exactly as they are and stay
the truth; a client enhancement appends the next page as the reader approaches
the end and rewrites the address bar to match what they are looking at. With
JavaScript off, the pagination control is still there and still works. A
crawler still gets discrete, numbered pages.

The one piece that needs real care is the **back button**: returning from a PDP
to a listing that had loaded five pages must not silently drop the reader at
page one. That is the same problem as `R-2`, which is why they belong together.

**Cost.** Moderate. The read layer does not change at all; this is a client
component around the existing grid plus history management.

---

## R-2 · Filters lose the scroll position

**Observed.** Applying a filter jumps the page back to the top, and it reads as
a full re-render rather than a refinement.

**Why it happens.** It is the direct cost of decision `7.3`: **every facet value
is a link, not a checkbox.** A link is a document navigation, and a document
navigation starts at the top. That decision is also the reason filtered listings
are shareable and work without JavaScript, so the fix must not undo it.

**What I would do.** Keep the links. Pass `scroll={false}` on facet, sort and
pagination links so the position is held across the navigation, and then deal
with the two things that stops being automatic:

- **Where does focus go?** Silently keeping the scroll position and moving
  nothing leaves a keyboard or screen-reader user with no idea anything
  happened. The result count needs to be a live region, or focus moves to it.
- **Does the reader know it worked?** If nothing visibly moves, the applied
  filter chip appearing is the only feedback. That may be enough; it should be
  looked at rather than assumed.

Worth evaluating alongside: Next's View Transitions would cross-fade the grid
and make the refinement legible without moving the page — but it is listed in
`AGENTS.md` under **deferred, do not build without asking**, so it is a separate
conversation, not a detail of this one.

**Cost.** Small for the scroll fix, and the accessibility work is the real
content of it.

---

## R-3 · Density — closer to Ant Design, less air

**Observed.** The designs are too spacious. The maintainer wants something
tighter and more compact, nearer Ant Design.

**What it collides with — and this one is a genuine conflict, not a detail.**
`10-design-playbook.md` and `AGENTS.md` both say: hairlines not shadows, no card
grid, asymmetric splits, **96px minimum between sections**, and — verbatim —
_"if a screen starts looking like an admin dashboard, it has gone wrong."_ Ant
Design is an enterprise system built for dense administrative data. The two are
pulling in opposite directions, and pretending otherwise would produce a
storefront that is neither.

**How I would resolve it.** Not globally, and not by loosening the playbook.
Split it by surface, because the surfaces are doing different jobs:

| Surface                     | Job                              | Density               |
| --------------------------- | -------------------------------- | --------------------- |
| Landing, brand storytelling | Persuade, set tone, be looked at | Editorial — unchanged |
| Shop hub, PLP, PDP, cart    | Compare, decide, buy             | **Compact**           |
| Account, studio             | Operate                          | Compact               |

Then implement the compact end **as tokens and component variants, not as
per-page overrides**. Concretely: a second spacing step set (`--space-compact-*`
or a `data-density="compact"` scope on the shop routes) that the existing
components read, so tightening the PLP is a token change rather than fifty
`className` edits. Anything else is the drift `AGENTS.md` exists to prevent —
one page tightened by hand is one page that will drift back.

What must survive the compaction: hairlines rather than shadows and boxes, and
the editorial type scale. Compact should mean _less air between things_, not
_more chrome around things_.

**Also needs updating when this lands:** `10-design-playbook.md` (the 96px rule
becomes surface-conditional), `25-design-system-adherence.md` (the room table
grows a density column), `designs/tokens.css`, and the design-system handoff
components that hardcode spacing.

**Cost.** Large, and it is the reason this entry is first: `R-4`, `R-5` and
`R-8` all render against whatever this decides.

---

## R-4 · The product card is too plain, and its image is cropped too close

**Observed.** Cards are simple, lack brand character, and the packshot inside
them is zoomed in; it should sit smaller and centred.

**The image half has a cause, and it is one line.**
`product-tile.tsx` renders into `aspect-[4/5]` with **`object-cover`**. The
Storyderm packshots are tall — 1916 × 3547 — so `cover` fills the box by
cropping roughly the middle third of the bottle. `object-contain` on a neutral
field is the correct treatment for a packshot, with padding so the product
floats rather than touching the edges. `GalleryBand` already uses `contain`,
which is why its images look right and the tiles do not.

**The elegance half is a design question**, not a fix. Things worth considering,
in the order I would try them: a hairline base under the price rather than a
bordered card; the brand's own glyph as a small mark on hover; the range name as
an overline in gold; the size ladder shown as «۵۰ / ۲۲۰ میلی‌لیتر» instead of
hidden behind the tile. All of these belong in the design system's `ProductTile`
component, whose `.prompt.md` should be read first — `DS-1` exists because that
step was skipped once already.

**Cost.** The image fix is trivial. The card design is a design pass.

---

## R-4a · Three.js product spin — deferred, with conditions

**The idea.** Products that rotate in the card, hologram-like.

**Where it already stands.** `L-12` defers 3D and WebGL brand storytelling to
Phase 5 at the earliest, as a lazy-loaded route. `M-1`'s motion contract already
sets the terms any such thing has to meet: content present in the SSR HTML,
correct with JavaScript off, nothing hidden by default, no layout shift,
reduced-motion honoured, nothing running forever, and the dependency has to earn
its bytes.

**The specific reason not to put it in a listing card.** A PLP shows
twenty-four tiles. Twenty-four WebGL contexts is not a performance risk, it is a
guaranteed failure — browsers cap the number of live contexts, and each one
carries its own memory and paint cost. On mid-range Iranian Android hardware
over Iranian bandwidth this would be the slowest page on the site by an order of
magnitude, and the SEO cost lands on the page that has the most to lose.

**Where it could work, if it is ever wanted.** The PDP, one product, one canvas,
behind an explicit interaction — the static packshot renders first and stays as
the fallback, and the viewer opts into the 3D view. That also matches what the
asset would actually cost: a spin needs either a real 3D model per product or a
turntable photo sequence per product, neither of which exists and both of which
are per-SKU work the supplier would have to supply.

**Recommendation.** Keep it on the list, keep it off the PLP, and treat it as a
PDP enhancement after launch. Revisit only when there is an asset to show.

---

## R-5 · The shop hub still runs on placeholders

**Observed.** The hub is not using the real database rows and media now that
they exist, and its cards are as oversized as the PLP's.

**Confirmed.** `hub-sections.tsx` carries four hardcoded editorial image paths
(`/images/editorial/…`). Those were the right call when there was nothing real
to show. There now is: fifty products with derivatives, ten ranges, thirteen
categories, and — since packet 7B — a content spine with a `shop.hub` surface
already in its enum and nothing seeded against it.

**What I would do.**

1. Seed `shop.hub` content blocks, the same way `shop.listing` was seeded. The
   spine already supports it; nobody has written the rows.
2. Have the hub's editorial sections read from `resolveBlocks({ surface: "shop.hub" })`
   instead of from a literal array — `CONTENT-01`, which says hub and Landing
   reads come from PostgreSQL, always.
3. Let the concern panels use real product imagery from the concern's own
   products rather than stock photography.
4. Density per `R-3`.

**The constraint the maintainer named, and it is the right one.** None of this
gets hand-rolled. The hub's blocks come from `src/components/ui`, the design
system's handoff components, or a properly added shadcn/Base UI primitive —
tuned and refined, not reinvented. `DS-1` and `AGENTS.md` both already say this;
it is repeated here because this is exactly the packet where the temptation to
"just adjust the markup" is strongest.

---

## R-6 · The price filter's Apply button

**Observed.** «اعمال قیمت» should go. Either price applies live like every other
filter, or _every_ filter waits behind one Apply.

**Why it exists today.** Price is the only facet that is not a set of discrete
values. Every other facet is a link (`7.3`) because a link is a URL and works
with JavaScript off. A range has no finite set of links, so it is a `GET` form
with a submit — which is the no-JS-correct answer and the reason the button is
there. It is not decoration.

**The two coherent designs, and they are genuinely different products:**

- **Everything live.** The slider commits on release via a client navigation to
  the same URL a link would have produced. The `GET` form stays underneath as
  the no-JS path, so nothing is lost — the button simply stops being the only
  way to commit. This keeps the rail feeling immediate and keeps every state
  addressable.
- **Everything batched.** Facets become checkboxes inside one form with a single
  Apply. Fewer navigations, better on a slow connection, and a familiar
  ecommerce pattern — but it gives up the linkable-facet advantage that `7.3`
  was chosen for, and every filter combination stops being a page a crawler can
  reach.

**Recommendation: everything live.** It gets the maintainer what they asked for
without surrendering the thing that makes these listings rank. Mixing the two —
some filters instant, one behind a button — is the state we are in now and is
the only option that is clearly wrong.

**Cost.** Small, once the choice is made.

---

## R-7 · The filter rail should be sticky

**Observed.** The rail scrolls away with the results instead of staying put.

**What I would do.** `position: sticky` under the header offset, with
`max-height: calc(100dvh - <offset>)` and `overflow-y: auto` so a rail taller
than the viewport scrolls inside itself rather than truncating. Two details that
are easy to get wrong and expensive to notice late:

- On mobile the rail is deliberately **below** the results (`7.8`), so sticky
  must be a desktop-breakpoint behaviour only or it will pin the wrong thing.
- The scrollbar inside a sticky container needs the logical-property treatment
  the rest of the codebase uses; a hardcoded `right` will put it on the wrong
  edge in Persian.

**Cost.** Small.

---

## R-8 · The top of the PLP is doing nothing useful

**Observed.** The space above the grid is not designed and not earning itself.

**What is up there now.** Breadcrumb, the new editorial band and campaign band
from `CONTENT4`, an `h1`, the scope introduction, then the toolbar. It reads as
a stack of separate things because that is what it is — each was added by a
different packet without anyone composing them.

**Options worth putting in front of a design pass**, roughly cheapest first:

1. **Compose what is there.** Breadcrumb, title, count and sort on one line;
   introduction beside rather than beneath; applied filters as a chip row under
   it. Costs nothing but layout and probably wins most of the ground.
2. **A scope band.** The concern's own imagery behind the title on concern
   pages — the concern already owns a description, and `F-5` calls it the
   highest-value SEO text on the page.
3. **Quick entries.** A skin-type or routine-step chip row above the grid, so
   the two axes the practice can answer better than a marketplace are visible
   without opening the rail.
4. **Merchandising.** A single dated campaign slot — which `C-13`'s window
   already makes safe to have, and `L-6` already refuses to let become
   permanent furniture.

**Recommendation.** 1 and 3 together, after `R-3` settles the density. 2 needs
photography that is cleared, which is `7B.9`'s question.

---

## R-9 · The server-rendered document looks empty — **verify before believing either answer**

**Observed.** In DevTools → Network → the `all` document → **Preview**, the
response shows the footer, the skip links and «در حال بارگذاری…», and none of
the catalogue, the FAQ or the SEO content. The page itself renders fine.

**The mechanism, and why the Preview pane is not evidence.**
`src/app/[locale]/(storefront)/loading.tsx` exists. In the App Router a
`loading.tsx` wraps its route segment in a Suspense boundary, so the response is
**streamed**: the first flush carries the shell and the loading fallback, and
the real markup arrives later **in the same response body**. DevTools' Preview
tab renders the parsed document as it stood at that first flush, which is
exactly what a streamed page looks like there. The **Response** tab shows the
raw body, and that is the one that answers the question.

**One command settles it.** With the dev server running:

```bash
curl -s http://localhost:3000/shop/all | grep -c "Ultra A-Z"
curl -s http://localhost:3000/shop/all | grep -c "FAQPage"
curl -s http://localhost:3000/shop/all | grep -c "ItemList"
```

- **All non-zero** → SSR is working and this is a streaming artefact. Googlebot
  processes the full streamed response, so the ranking argument in
  `08-competitive-research.md` survives intact. There is still a decision to
  make (below), but it is a preference, not a defect.
- **Any of them zero** → a real defect, and a serious one. Everything the
  storefront is competitively _for_ — crawlable Persian listings that the
  dominant vendor cannot match — depends on that markup being in the response.
  It would become the highest-priority item in this file, ahead of every other
  entry, and it would move out of a backlog and into a packet.

**The decision that exists either way.** Should a listing route have a loading
boundary at all? A `loading.tsx` on the storefront segment means the first byte
of every listing is a shell, and the reader on Iranian infrastructure waits for
the stream to catch up before seeing a product. Removing it for the listing
routes makes the response a single fully-rendered document — slower to first
byte, complete on arrival, and trivially verifiable by anyone who views source.
For a Persian-SEO-first storefront where the database is in the same datacentre
as the app, that trade may well be the right one.

It also interacts with something already deferred: `cacheComponents` is
commented out in `next.config.ts`, and `AGENTS.md` lists Cache Components and
Instant Navigations under **deferred, do not build without asking**. Whatever is
decided here should be decided with that, not before it.

**Needs the maintainer:** run the three commands and paste the numbers. Nothing
else in this entry can be settled without them.

---

## R-10 · The integration suite mutates the development database

**Observed, in the same screenshot.** The first tile — «پودر Ultra Lift» —
renders the «تصویر محصول» placeholder instead of a packshot, and
«پاک‌کننده Ultra Essence Clean» is missing from the Persian listing entirely.

**That is my doing, and it is not a data problem.**
`commerce.reads.integration.test.ts` needs two states the manifest deliberately
cannot express, because they are failures rather than curation decisions: a
product whose Persian copy is missing, and a product whose imagery is gone. It
makes them in `beforeAll` by **deleting rows** — the `fa` translation of the
first single-variant product, and every media row of the next one. The seed
does not put them back, so the development database keeps the damage after the
suite finishes, and the dev server shows it.

The mechanism is sound; leaving the wreckage is not. Three ways out, cheapest
first:

1. **Restore in `afterAll`.** Honest and local, but a crashed run still leaves
   the database altered, which is the case that matters.
2. **Re-seed at the end of the suite.** Both seeds are idempotent and refuse
   production, so this is one call and it repairs a crashed run on the next
   pass too.
3. **Run integration tests against their own database.** The correct long-term
   answer — CI already does exactly this — and the most work locally.

**Recommendation: 2 now, 3 when the local database story is revisited.** Until
then the workaround is one command: `pnpm db:reset && pnpm db:seed demo` after
running the integration suite.

**Not scheduled**, but unlike everything else in this file this one has a
one-line workaround and should be mentioned in
[`runbooks/local-development.md`](runbooks/local-development.md) rather than
waiting for a packet.

---

## What this file does not change

Nothing here alters a decision already made. `R-1`, `R-2`, `R-3` and `R-6` each
sit against one — the URL contract, the linkable facet, the editorial spacing
rule, the no-JS form — and each is written as _how to get what was asked for
without giving that up_. If a trade turns out to be unavoidable, it becomes a
numbered decision in its own document with the cost stated, not a quiet edit
here.

**Scheduling.** After Landing, PDP, cart and checkout. `R-3` first among these,
then `R-1`/`R-2` together, then `R-4`, `R-5`, `R-8`. `R-6` and `R-7` are small
enough to ride along with whichever pass touches the rail.
