# Shop experience - iteration plan

**Status:** Review-ready; no runtime implementation is authorized by this document
**Updated:** 2026-08-27
**Scope:** User flows, merchandising, conversion and polish for the existing shop - hub, listing, PDP, cart, checkout, account
**Depends on:** [`public-surfaces.md`](public-surfaces.md) (the content entities), [`plp.md`](plp.md), [`pdp.md`](pdp.md), [`shell-and-product-hub.md`](shell-and-product-hub.md), [`../cart-checkout-payment-fulfilment-and-returns.md`](../cart-checkout-payment-fulfilment-and-returns.md)
**Trigger:** the maintainer, 2026-08-27 - the flows are _"a little bit basic, a little bit deserted"_

---

## 1. What is actually wrong, measured

The transactional spine is strong: oversell is impossible under concurrency,
totals are server-owned, settlement is atomic, and the whole thing works with
JavaScript off. **The problems are above that line.** Each of these is a
measurement, not an impression.

| Finding                                                                                     | Evidence                                                                                                  |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Fifty products carry no Persian description, promise, usage or ingredients                  | ~250 empty translation fields, [`../../31-content-depth-findings.md`](../../31-content-depth-findings.md) |
| The hub's concern panels render empty sand plates                                           | No image on `ConcernPanel`; `R-5`, `M.6`                                                                  |
| A product page cannot be bought from without first choosing a size on a separate navigation | Size options are links carrying `?variant=`; add-to-cart appears only afterwards                          |
| There is no social proof anywhere in the shop                                               | No `testimonial`, no reviews, no ratings                                                                  |
| There is no stock signal                                                                    | `available_quantity` is read and never shown                                                              |
| Nothing tells a customer what a product is _for_ in their own terms                         | `concern` exists; `skin_state` exists and is unused entirely                                              |
| Search is exact-match over normalised text                                                  | No typo tolerance, no synonyms, no empty-result recovery                                                  |
| The cart cannot be reached without leaving the page                                         | No drawer confirmation beyond the existing component; no "continue shopping" loop                         |

---

## 2. Decisions

### SHOP-D1 - Fix the buy path before adding anything to the hub

Adding merchandising to a hub that leads to a product page you cannot buy from
in one motion moves the bottleneck rather than removing it. The size-selection
step is a full navigation today; it should be an in-page choice with the price
and stock updating beside it.

**Order matters: PDP, then listing, then hub.** Traffic flows the other way, but
value flows this way - a better hub sends more people to a page that still
fails them.

### SHOP-D2 - Every product page answers five questions in this order

A skincare customer decides in a fixed sequence, and the current page answers
roughly one and a half of them.

1. **What is it, and is it for me?** Promise, concern, skin state.
2. **What is actually in it?** Ingredients, in Persian, with the two or three
   actives explained.
3. **How do I use it, and with what?** Usage, position in a routine, pairings.
4. **Does it work?** Testimonials, before/after where they exist.
5. **Can I trust this bottle?** IRC code, brand relationship, authenticity.

Everything else - size, price, quantity - is mechanics, and mechanics belong
beside the answer to question one, not instead of it.

### SHOP-D3 - Skin state becomes a first-class browsing axis

`skin_state` and `product_skin_state` exist and nothing reads them. Concern
answers _"what is wrong"_; skin state answers _"what am I"_. Many customers
self-identify by the second and only later name the first.

Two axes that intersect - "hydration, for oily skin" - is a genuinely better
finder than either alone, and the schema already supports it.

### SHOP-D4 - Stock and price are honest signals, never manufactured urgency

Showing "only 2 left" when it is true is a service. Showing it when it is not,
or showing a countdown that resets, is the discount-culture behaviour `AGENTS.md`
and the brand positioning both reject.

So: exact remaining count only under a threshold, no timers, no "17 people are
viewing", no strike-through against a price that was never charged.

### SHOP-D5 - Empty and error states are designed first, because they are the common case

An empty search, a concern with three products, a cart with an unavailable line,
a checkout with no shipping configured. Each currently degrades to a bare
sentence. Each is a moment where a customer decides whether this shop is real.

`LAND-10` already states this principle for the Landing; it applies with more
force where money is involved.

### SHOP-D6 - The cart is a step in a journey, not a destination

Adding to cart currently ends in a drawer with a link. The stronger pattern is
confirmation plus two clear paths: continue where you were, or check out - with
the cart's contents summarised so the customer never wonders what they have.

---

## 3. The flow iterations, in priority order

### 3.1 Product page - the highest-value change

| Change                                         | Why                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Variant selection in-page**, no navigation   | The current flow costs a page load between wanting and buying                        |
| Price, stock and SKU update with the selection | Answers "can I have it" without another round trip                                   |
| **Ingredients section with actives explained** | The single most-read section on any skincare page                                    |
| **Usage and routine position**                 | "Morning, after cleansing, before sunscreen"                                         |
| **Pairs well with** from `product_pair`        | Already modelled; a practitioner's pairing, not an algorithm's                       |
| **Testimonials for this product**              | `PUB-D3`, `subject_kind = product`                                                   |
| **IRC code and authenticity block**            | `irc_code` is stored and never shown                                                 |
| Sticky buy bar on mobile                       | The action stays reachable through a long page                                       |
| **Ask about this product**                     | Deep-links a consultation booking with the product in context - the clinic-shop loop |

### 3.2 Listing and search

| Change                                     | Why                                                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Skin-state facet** alongside concern     | `SHOP-D3`                                                                                           |
| Sort by relevance, price, newest           | Currently one order                                                                                 |
| **Typo tolerance and synonyms** in Persian | <span dir="rtl">آبرسان</span> / <span dir="rtl">آبرسانی</span> should not be two different searches |
| **Empty search that recovers**             | Nearest matches, popular concerns, and a consultation offer - never a dead end                      |
| Result count announced to assistive tech   | Already done in `R-2`; keep it as facets grow                                                       |
| Persist scroll and facets on back          | The most common navigation in a shop                                                                |

### 3.3 Hub

Covered in [`public-surfaces.md`](public-surfaces.md) §6.1. In flow terms the hub's
job is to route by intent within two taps: concern, skin state, or her
recommendation.

### 3.4 Cart and checkout

| Change                                        | Why                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------- |
| **Add-to-cart confirmation with two paths**   | `SHOP-D6`                                                            |
| Line-level issue explanations                 | A blocked line currently says little about what to do                |
| **Shipping estimate before the address step** | "From 80,000 toman" removes the largest unknown in Iranian ecommerce |
| Order summary persistent through checkout     | Standard, absent                                                     |
| **Guest checkout**                            | `order_access_token` exists for it; `14.12`                          |
| Save-for-later from the cart                  | Recovers the "not this month" basket                                 |
| **Instalment option on large baskets**        | The discovery document's strongest commercial recommendation         |

### 3.5 Account and post-purchase

| Change                               | Why                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------- |
| **Order confirmation actually sent** | The outbox has no drain; this is the largest single hole in the experience |
| Fulfilment states with tracking      | `shipment` is unused                                                       |
| **Reorder in one action**            | Skincare is repeat-purchase by nature                                      |
| Replenishment prompt                 | Derived from size and history, only when confident                         |
| Returns request                      | `return_request` is unused                                                 |

---

## 4. Design and polish

These are the _"more catchy, more customised"_ items, and they are deliberately
last: polish applied to empty pages is polish nobody sees.

- **Photography over placeholders.** The concern panels, the hub mosaic and the
  room galleries are all currently plates. No visual treatment survives
  placeholder imagery.
- **A storytelling PDP.** The current page is a specification sheet. The
  editorial treatment the Landing uses - a claim, then evidence, then mechanics -
  applies here too.
- **Motion with intent.** The reveal primitive exists. Use it to sequence a
  reading order, not to decorate every element.
- **Density already resolved.** `D-1`…`D-5` settled spacing and media size; this
  document does not reopen it.
- **A recognisable empty state vocabulary.** One visual language for "nothing
  here yet", used everywhere, so absence looks designed rather than broken.

---

## 5. Phased delivery

### SHOPX0 - The buy path

- [ ] In-page variant selection with live price and stock; sticky mobile buy bar;
      add-to-cart confirmation with two paths.

**Exit gate:** a product is chosen, sized and added without a page navigation,
and the whole flow still works with JavaScript disabled.

### SHOPX1 - The content sections on the PDP

- [ ] Ingredients with actives, usage, routine position, pairings, IRC and
      authenticity, product testimonials.

**Exit gate:** a PDP answers all five questions in `SHOP-D2` for at least one
fully-written product.

### SHOPX2 - Finding

- [ ] Skin-state facet, sorting, typo tolerance, synonyms, a recovering empty
      search.

**Exit gate:** two axes intersect correctly, and a misspelled Persian query
returns the right product.

### SHOPX3 - Checkout confidence

- [ ] Shipping estimate before the address step, persistent summary, guest
      checkout, line-issue explanations.

**Exit gate:** a guest completes a purchase without an account, using the
existing order access token.

### SHOPX4 - Post-purchase

- [ ] Confirmation through the outbox worker, fulfilment states, tracking,
      reorder, returns request.

**Exit gate:** placing an order sends exactly one confirmation, and the order
reaches `completed` through real states.

### SHOPX5 - Polish

- [ ] Photography, editorial PDP treatment, motion sequencing, the empty-state
      vocabulary.

**Exit gate:** a visual pass at 390, 768 and 1440 in all three locales with no
placeholder imagery remaining.

---

## 6. What the maintainer must supply

1. **Product copy** - or approval of AI-drafted copy through the existing
   `draft → verified → approved` workflow. Nothing else here matters as much.
2. **Product and lifestyle photography** beyond the packshots.
3. **Which products she personally recommends**, for the curated section.
4. **Ingredient explanations** for the actives she considers important.
5. **Shipping rates and bank details**, still outstanding from `12.5` and
   `15.10`.
6. **Whether instalments are offered**, and on what terms.

---

## 7. Capability catalogue

**In v1** - the buy path, PDP content sections, two-axis finding, checkout
confidence, post-purchase, polish.

**Deliberately later** - reviews with verified purchase and photographs; wishlist
and save-for-later; recently viewed; back-in-stock and price alerts; price
history; comparison; a wallet; gift cards; loyalty; a journal for organic search;
Telegram order status; Arabic launch.

**Rejected** - flash sales and countdown timers; manufactured scarcity;
review-score averages as the primary product signal; a multi-seller marketplace;
any pattern that trains customers to wait for a discount.
