# Competitive research — skincare e-commerce

**Date:** 2026-08-24 · **Method:** international sites read directly; Iranian sites driven through the user's own Chrome, because none of them respond to requests originating outside Iran.

---

## Coverage, stated honestly

| Site                                              | Depth           | Note                                                                                                                               |
| ------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Ulta** (US mass-prestige)                       | Deep            | Search results pages served a queue page; search findings limited                                                                  |
| **Aveda** (prestige single-brand)                 | Deep            | Mega-menu and search are client-rendered                                                                                           |
| **ZO Skin Health** (clinical/physician-dispensed) | Deep            | **The closest analogue to this business of the whole set**                                                                         |
| **koreanskincare.com** (K-beauty multi-brand)     | Deep            | Several pages 404'd or errored                                                                                                     |
| **Khanoumi** (Iran, dominant)                     | Deep            | Full facet rail captured                                                                                                           |
| **Poosteman** (Iran)                              | Deep            | Homepage and merchandising captured                                                                                                |
| **Neshatrokh** (Iran)                             | Deep            | Richest domestic feature set                                                                                                       |
| **Hiland Beauty** (Iran)                          | Medium          | PLP and facets captured                                                                                                            |
| **Elanza · Rojashop · Lookperfect**               | **Not reached** | The Chrome extension refused navigation — those domains aren't in its allowed list. Grant them in the extension and I'll add them. |

---

## The shape of the market, in one paragraph

The eleven sites fall into four camps, and the useful insight is that **nobody occupies the position this business is standing in.** International clinical (ZO) has authority and protocol but no local presence. International retail (Ulta, Aveda, KSC) has polish and merchandising machinery but no clinician. Iranian mass-market (Khanoumi, Neshatrokh, Poosteman) has enormous catalogues, aggressive discounting and genuinely sophisticated commerce features — and no expertise whatsoever. Iranian premium (Hiland) has restraint and taste but no differentiated authority either. **A named practitioner with a treatment room, a training academy, and an official Forlle'd representation is a category of one against all of them** — provided the site is built to make that visible rather than imitating a discount retailer.

---

## 1 · Navigation and browse axis

| Site           | Primary axis                                                                            | Secondary                                                              |
| -------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Ulta           | Product **type**                                                                        | Brand (co-equal), concern as editorial rails only                      |
| Aveda          | **Collection** (sub-brand)                                                              | "Best for" (concern)                                                   |
| **ZO**         | **Protocol** — `Getting Skin Ready` → `Prevent + Correct` → `Protect` → `Supplementary` | Concern ("By Solution"), type, ingredient — four parallel axes at once |
| koreanskincare | Product type                                                                            | Concern demoted to one item _inside_ the type menu                     |
| **Khanoumi**   | Product **type**, 9 sub-categories with live counts                                     | Attributes; **no concern axis at all**                                 |
| Neshatrokh     | Product **type**                                                                        | Skin type, as a merchandising row                                      |
| Poosteman      | Product **type**                                                                        | Category banners                                                       |
| Hiland         | Product **type** — but the **first tile is «بر اساس نوع پوست»**                         | Country of origin                                                      |

**The single most transferable idea in the entire study is ZO's protocol-as-IA.** `Getting Skin Ready®` is one idea — cleanse, exfoliate, tone — and it appears as a nav item, a homepage module, an education article, **a PLP filter value**, a PDP module and a SKU name (`Daily GSR + Skin Barrier Defense Program`). That single repetition converts "products I resell" into "my method, which requires these products," and it is the one asset a multi-brand reseller structurally cannot copy. Khanoumi has 11,781 skincare SKUs and no method; the institute has a method and needs perhaps 60 SKUs.

---

## 2 · PLP filters — the real vocabularies

### Khanoumi, all 14 facets in order

`فقط کالاهای موجود` (toggle) · `برند` · `قیمت` · `رنگ‌ها` · `مواد تشکیل دهنده` · `نوع بسته بندی` · `بافت` · `جلوه نهایی` · `جنسیت` · `پوشش دهی` · `SPF` · `کاربرد` · `رده سنی` · `نوع پوست`

**«کاربرد» values** (position 12 — this is their nearest thing to a concern filter):
آبرسانی · مرطوب‌کنندگی · ضدپیری و جوان‌ساز · تسکین‌دهنده و ضدالتهاب · نرم‌کنندگی · آنتی‌اکسیدان · روشن‌کننده و ضدتیرگی · ترمیم‌کننده و بازسازی‌کننده

**«نوع پوست» values** (position 14, last): خشک · چرب · حساس · آکنه‌ای/مستعد جوش · نرمال · مختلط

> **This is the gap, and it is a big one.** «کاربرد» describes what the _product does_. It does not describe what the _customer has_. A woman with melasma does not think "I need a برightening agent" — she thinks «لک». Notice too that `رنگ‌ها`, `جلوه نهایی` and `پوشش دهی` are makeup facets leaking into skincare — the same shared-vocabulary bug Ulta has, where its serum `Concern` filter offers `Frizz-Free` and `Volume`. **Keep one vocabulary per category from day one.**

### Hiland — two facets worth stealing outright

`بر اساس قیمت` (range slider) · `وضعیت موجودی` · `حجم` (with a search box inside the facet) · **`کشور مبدا`** — country of origin, searchable: استرالیا، کانادا، فرانسه، آلمان، یونان، ایتالیا، ایران، ژاپن…

**Country of origin is a first-class buying criterion for imported skincare in Iran**, and it maps directly onto the Forlle'd (Japan) / Storyderm (Korea) / Thalgo (France) positioning. None of the international sites has it; it is a local insight. Take it.

Hiland also puts a **search box inside long facets** — right at ~10 values, essential above 20.

### ZO — three facets, and two of them are doing strategy

`Skin Type` — including **`Post-Treatment`** · `Solution` — including **`Getting Skin Ready®`** · `Ingredients`

`Post-Treatment` as a _skin type_ means "you just had a procedure" is a shoppable state. For a business that performs the procedures, that facet is worth more than any other on this page.

### Ulta — the one mechanic to copy at small scale

**Live counts on every facet value:** `Fragrance Free (354)`, `Retinoid (7)`. It prevents dead-end filtering, and its absence is what makes most small-brand filters feel broken. Cheap to implement.

### Sort options

Khanoumi and Ulta use dropdowns; **Hiland uses a horizontal row of text links** — پربازدیدترین · بیشترین تخفیف · جدیدترین · ارزان‌ترین · گران‌ترین · الفبا — with the active one as a filled pill. For six options this is better than a dropdown: zero clicks to see what's available. Take Hiland's pattern with our own labels.

---

## 3 · Product cards

| Element                   | Ulta | Aveda      | ZO            | Khanoumi     | Hiland |
| ------------------------- | ---- | ---------- | ------------- | ------------ | ------ |
| Brand line                | ✅   | —          | —             | ✅           | ✗      |
| **One-line benefit**      | ✗    | ✅         | partial       | ✗            | ✗      |
| Rating + count            | ✅   | count only | ✗             | ✗            | ✗      |
| Discount % badge          | ✅   | ✗          | ✗             | ✅ prominent | ✗      |
| Struck-through price      | ✅   | ✗          | value on kits | ✅           | ✗      |
| Skin-type / solution tags | ✗    | ✗          | ✅            | ✗            | ✗      |
| Size selector on card     | ✗    | ✅         | ✗             | ✗            | ✗      |
| Add to cart on card       | ✅   | ✅         | ✅            | ✗            | ✗      |

**Aveda's one-line descriptor is the highest-leverage single field in this entire study.** _"Cream-to-foam cleanser that removes makeup, oil, and impurities."_ Ulta's cards force a click to learn what anything does — fine when you already know the brand, useless for products nobody has heard of. For a catalogue where every SKU needs explaining, one CMS field does more conversion work than any badge.

**Khanoumi runs paid ads inside its own grid** (`ویژه‌آگهی`) and a lottery mechanic (`شانس`). Both are marketplace economics. Not applicable, and worth understanding as _why_ their grid feels cluttered.

---

## 4 · What the Iranian sites do that the international ones don't

Three genuinely local patterns, all worth taking seriously:

**1. BNPL is a headline, not a footnote.** Snapp Pay appears on Poosteman and Neshatrokh as a full-width band, a hero badge (`خرید ۴ قسطه با اسنپ‌پی`), _and_ a top-level nav item (`خرید اقساطی لوازم آرایشی`). Instalments in Iran are not a checkout option — they are a reason to visit. We had instalments planned only for academy packages; **product instalments deserve the same weight.**

**2. Neshatrokh's circular "story" rail** — 15 round icons directly under the header, each a service: دیدگاه‌ها · نفرات برتر · نشاط‌انگیزها · خرید عمده · **مشاوره رایگان** · **نشاط لایو** · مقایسه محصول · تحویل حضوری · خرید اقساطی · دعوت دوستان · ارسال رایگان · **قیمت قبل** · اپلیکیشن · کد تخفیف. It borrows Instagram's visual grammar to expose fifteen capabilities in one glance — instantly legible to an Iranian audience. Note that **free consultation** and **live shopping** sit in there as peers of shipping and discounts.

**3. Trust signals are numeric and phone-first.** Neshatrokh's search placeholder is _«جستجو در بیش از ۲۷,۰۰۰ محصول»_ — the catalogue size _is_ the trust signal. A support phone number sits in the header on Neshatrokh and Hiland both. `قیمت قبل` (price history) is a nav item — a direct answer to inflation-era distrust of pricing.

**And the aesthetic split matters.** Khanoumi, Neshatrokh and Poosteman are loud: magenta and red, countdown timers, discount pills everywhere, bespoke banner artwork per category. Hiland is restrained: line-art category icons, no discount badges on cards, a 6-column grid, generous white. **Hiland is the only one that could sit next to a treatment room without embarrassing it** — and it is also the only one with no authority figure, which is precisely the space left open.

---

## 5 · Evidence and authority — the decisive dimension

ZO's PDP states the study design **before** the numbers: _"12-week independent, third-party clinical study consisting of 46 subjects… females between ages 44–74 with **Fitzpatrick skin types II–VI**."_ Then: 100% agreed skin looked lifted · 42% improvement in radiance · 16% in elasticity. Note the honesty of a modest instrumented 16% sitting beside a self-reported 100%.

Aveda does the same: _"80% had improvement in prismatic radiance"_, methodology disclosed — _33 women, twice daily_.

**Two things follow for us.** First, a practitioner can run this honestly at small scale: n, weeks, protocol, and the outcome — and stating n=20 reads better than hiding it. Second, **stating the Fitzpatrick range is a real differentiator in Iran.** Imported brands' studies skew II–IV; an Iranian practice works predominantly with III–IV and can say so, from its own patients.

**What ZO gets wrong, don't copy:** its brand-level Clinical Proof page fires _"98% of participants…"_ with no methodology at all. Unmethodologised percentages are worse than none when a named practitioner's licence is attached to them.

**Not one of the eleven sites has a named practitioner with before/after evidence, a booking flow and a training academy on the same domain.** ZO has the doctor but sends you to a locator. Khanoumi has the traffic and no expertise. That whole space is empty.

---

## 6 · Decisions this research changes

**Confirmed, now with evidence:**

- ✅ **Concern-first browsing.** The dominant Iranian vendor has _no_ concern axis, and its nearest equivalent speaks the product's language. Our labels — لک · جوش و آکنه · آبرسانی · ترمیم سد پوستی · ضدپیری — speak the customer's.
- ✅ **PHP separate from PLP.** Every site with real traffic has one URL per category. Hiland even puts «بر اساس نوع پوست» first among its tiles.
- ✅ **Restrained aesthetic.** Hiland proves premium restraint works in this market; it just lacks a reason to believe.

**New, adopt:**

| From                       | Take                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ZO**                     | The **protocol as site spine** — name the method, put it in the nav, make each phase a filter value, sell each phase as a bundle, write one education page per phase            |
| **ZO**                     | **`پس از درمان` (post-treatment) as a skin-state filter** — the one facet only a business with a treatment room can offer honestly                                              |
| **ZO**                     | **Program SKUs priced against itemised value** (`۸٬۵۰۰٬۰۰۰ — ارزش ۱۰٬۴۰۰٬۰۰۰`), named by outcome + phase                                                                        |
| **ZO**                     | The **restricted-product pattern**: professional items merchandised with full description, strength stated in the name, **no price and no cart** — converting to a consultation |
| **Aveda**                  | **One-line benefit on every card.** Highest-leverage single field.                                                                                                              |
| **Aveda / ZO**             | Methodology **before** the number; before/after labelled only `قبل` / `بعد`                                                                                                     |
| **Ulta**                   | **Live counts on every facet value**                                                                                                                                            |
| **Hiland**                 | **`کشور مبدا`** as a facet (ژاپن · کره · فرانسه) — local insight, and it is our positioning                                                                                     |
| **Hiland**                 | Sort as a **row of chips**, not a dropdown; search box inside long facets                                                                                                       |
| **Neshatrokh**             | A **service rail** under the header — our version carries مشاوره رایگان, رزرو نوبت, خرید اقساطی, ارسال, اصالت کالا                                                              |
| **Poosteman / Neshatrokh** | **Instalments as a headline**, not a checkout option                                                                                                                            |

**Reject:**

- Khanoumi's 14 facets and in-grid paid ads — marketplace economics; on 60 SKUs, facet maximalism returns one product per filter, which is worse than no filter.
- Permanent discount real estate (`✨Sales✨` as nav, `-30%` on every card, countdown timers). **On medical-grade product, visible permanent discounting tells patients the price was never real — and by extension that the recommendation isn't either.** This is the single most important thing to _not_ copy from the domestic leaders.
- Ulta's five stacked PDP cross-sell modules and its points-multiplier machinery.
- ZO's provider locator and partner attribution — **we are the provider.** Where ZO says "find an authorised physician", we say «رزرو مشاوره». Same funnel position, one hop shorter.

**One technical opportunity:** ZO's concern PLPs, its Clinical Proof page and its Regimen Finder all render client-side and return empty grids to a non-JS fetch — its most differentiated pages are its least crawlable. Khanoumi's category page also renders nothing without JS. **Server-rendering our concern pages and evidence pages is a cheap, decisive Persian-SEO advantage over every competitor in this study.**

---

## Still open

- **Elanza, Rojashop, Lookperfect** were refused by the Chrome extension. Grant those domains and this gets a second pass.
- Nobody in this set was examined at **mobile** width. Iranian beauty traffic is overwhelmingly mobile, and it should be the next thing looked at.
- Khanoumi's **PDP and checkout** were not opened — worth a look specifically at how they present اصالت کالا and payment options.
