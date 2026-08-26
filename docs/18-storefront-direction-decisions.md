# Storefront direction — decisions

**Date:** 2026-08-25 · **Decided by:** Hooman Pouyan, in session · **Binds:** ledger packets 3–9

Three decisions taken while packet 2 landed. They are recorded here because each
one is expensive to reverse once routes exist, and because two of them resolve a
`research-blocked` item the page plans could not close on their own.

---

## D-18-1 · Design authority and where invention is allowed

**Decision.** The design system is binding and must not be drifted from. Where a
surface has no design, invent one that obeys it — using shadcn/ui primitives
restyled through the token layer — rather than waiting for a mockup.

The catalogue was drafted before an ecommerce feature list existed, so it does
not cover the mega-menu or Relay, navigation bars, the product hub, listing and
search results, the product page's commerce blocks, brand landing pages, cart,
or most standard ecommerce UI. Those gaps are filled, not blocked on.

### Order of authority

| Rank | Source                                                                                                                                   | Standing                                                                                                                                                                                                                                    |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `designs/tokens.json` → `designs/tokens.css`, and the four `design-system/foundations/*.html` cards (colour, type, space/radius, motion) | **Settled and measured.** Never drift. Colour, type scale, the 1.8 line-height rule, the ten-step space scale, two radii, one duration and one easing are not open.                                                                         |
| 2    | `Fazaieli Storefront (offline).html`                                                                                                     | The most recent full composition. Treated as the current intent for the landing surface and for anything it does show.                                                                                                                      |
| 3    | `designs/storefront-canvas/*.dc.html` — Main, Shop, Product, Checkout, Mobile                                                            | Structural reference for intent and section order. **Not authoritative** — see the discrepancy below.                                                                                                                                       |
| 4    | `04-information-architecture.md`, `09-brand-brief.md`, `10-design-playbook.md`                                                           | The stated rules: hairlines not shadows, no card grid, asymmetric splits, 96px minimum between sections, gold as a hairline and never a fill behind text, and the standing test that a screen resembling an admin dashboard has gone wrong. |
| 5    | shadcn/ui primitives, restyled through the tokens                                                                                        | The vocabulary for everything above that has no design.                                                                                                                                                                                     |

### Discrepancy on the record

`designs/storefront-canvas/README.md` states the artboards are **"Not approved —
drafted before competitor references and a feature list were available, and due
for a rework."** They also predate the offline composition. They are therefore
read for section order and intent, not copied. Where the two disagree, the
offline composition wins; where both are silent, rank 4 and 5 decide.

`design-system/README.md` is equally explicit that the bundle is **foundations
only, deliberately** — components were never built. So there is no component
library to conform to, only a token layer, and the components produced in
packets 4–8 become the first real ones.

### Not negotiable regardless

Every screen gets a Persian RTL pass before it is called done. Logical
properties only. No webfont, script or stylesheet fetched from a foreign host at
runtime — note that the offline composition currently loads Vazirmatn and Bodoni
Moda from `jsdelivr` and `fonts.gstatic.com` and carries its own warning about
it; the implementation self-hosts. `public/fonts/` holds Vazirmatn today and is
still missing Bodoni Moda, so Latin display type falls back until that file
arrives.

---

## D-18-2 · Professional-only products are visible and not purchasable

**Decision.** A professional-only product appears in listings and search, has a
full product page, is clearly marked as professional use, shows no add-to-cart,
and offers an escalation route instead — contact, or a consultation booking.

**Why.** It serves the institute's authority and Persian SEO, and it matches the
restricted state the PDP plan already describes. Hiding them would make a real
part of the catalogue invisible until staff authentication exists, which is
deferred.

**Consequences for the read model.** An anonymous visitor is always the `public`
customer group; there is no role to elevate them until `AUTH3`. So a
professional-group price is never an eligible price for an anonymous request,
and the product resolves to a non-purchasable offer state with an escalation
action. `on_request` products behave the same way for a different reason: no
price row exists at all. Both are asserted by the development seed — products 4
and 5 in `seeds/dev-data.ts`.

**Still open, and the owner's to answer:** whether Iranian rules or a brand
agreement restrict advertising professional product _pricing_ to the public. The
implementation shows no price to an anonymous visitor either way, since no
public price row exists for these products, so nothing changes if the answer
arrives later.

---

## D-18-3 · SEO is a first-class requirement, not a later pass

**Decision.** Persian SEO is high priority and is built into every route as it is
written: per-page metadata, canonical policy, JSON-LD, and server-rendered
content. This closes the SEO half of the gate-5 deferral.

**Why it is decided now.** URL grammar and canonical policy are the single most
expensive thing to change after a page is indexed, and `08-competitive-research.md`
records that every competitor studied — ZO and Khanoumi included — renders concern
pages client-side and returns empty grids to crawlers. Server-rendering them is a
cheap, decisive advantage, and it is only cheap if it is done from the start.

### The rules every route implements

| Concern            | Rule                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rendering          | Every catalogue route is server-rendered and must produce its complete result set with JavaScript disabled. This is a test, not an aspiration.                                                                                                                                                                                                                                                                            |
| Canonical          | A scope page — `/fa/shop`, `/fa/shop/concern/[slug]`, `/fa/shop/brand/[slug]`, `/fa/shop/c/[category]`, `/fa/shop/p/[slug]` — is self-canonical. Applying a filter or a sort canonicals back to the clean scope URL. Pagination is self-canonical, because page 2 holds products page 1 does not and hiding them wastes crawl budget.                                                                                     |
| Indexing           | Scope and paginated pages are indexable. Filter and sort permutations are `noindex, follow` — they are crawl-budget dilution, not content. Search result pages are `noindex, follow`, which is the standard treatment for user-generated queries.                                                                                                                                                                         |
| Metadata           | Every page owns a Persian title and description from canonical data, never a template with a slug interpolated into it. Open Graph and Twitter cards on product and scope pages. `hreflang` across `fa`, `en` and `ar` for pages that genuinely exist in each — a locale without catalogue content emits no alternate.                                                                                                    |
| JSON-LD            | `Organization` and `WebSite` on the landing page. `BreadcrumbList` on every scope and product page. `ItemList` on listing pages. `Product` with `Offer` on product pages — and **only** where the offer is real: an `on_request` or professional-only product emits no `price`, and nothing emits an `aggregateRating` until real reviews exist. Fabricated structured data is a manual-action risk, not a growth tactic. |
| Robots and sitemap | A generated `sitemap.xml` covering published scope and product pages per locale, and a `robots.txt` that does not block what the canonical policy already handles.                                                                                                                                                                                                                                                        |
| Semantics          | One `h1` per page, heading order that reflects structure, descriptive `alt` from `product_media_translation`, and Persian text as real text — never baked into an image.                                                                                                                                                                                                                                                  |

### Scope note — the blog

A blog was named as part of the SEO surface. It does not exist in any current
plan: there is no content model, no route, and no editorial workflow. It is
recorded here as **accepted in principle, unscheduled**, and needs its own slice
after the storefront block — content source, authoring path, taxonomy shared with
concerns, and its own structured data. It is not folded into packets 3–9.
