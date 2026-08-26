# Brand brief — مؤسسه مهدیه فضائلی

**Purpose:** the single document a designer, a design tool, or an AI session should read before drawing anything for this project. It answers _who this is, what they sell, how it should feel,_ and — just as importantly — _what it must never look like._

---

## The business in one sentence

**Mahdieh Fazaieli** (مهدیه فضائلی) runs a specialist skin-care academy and treatment practice in **Mashhad**, is the **official representative of Forlle'd Japan**, and teaches as a **certified instructor of the Technical & Vocational Organization** (مدرس رسمی فنی و حرفه‌ای).

Three revenue lines, one reputation:

| Space       | Persian    | What it sells                                                                                           |
| ----------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| **Shop**    | فروشگاه    | Professional skincare — Forlle'd (Japan), Storyderm (Korea), Thalgo (France)                            |
| **Book**    | رزرو خدمات | Facials and skin treatments, in the treatment rooms, ~2 hours each                                      |
| **Academy** | آکادمی     | Workshops, seminars, in-person classes and online courses for people training to become skin therapists |

The reputation is the product. Everything else is downstream of it.

---

## Who she is, and why it matters to the design

She is not a shop owner who happens to teach. She is **a practitioner and a teacher who also sells the products she uses**. That ordering is the whole strategy:

- She treats clients herself, in her own rooms, alongside two other practitioners.
- She has trained hundreds of students; her Instagram highlight for them is «هنرجوها».
- Brands come to _her_ — Storyderm co-hosts workshops with her name as the instructor.
- Her Instagram bio reads: **«آکادمی تخصصی مراقبت از پوست در مشهد | مدرس رسمی فنی و حرفه‌ای | نماینده رسمی فورله‌د ژاپن»**

**Design consequence:** she must be visible. Not a logo — a person. Every competitor studied (eleven of them, see `08-competitive-research.md`) is either a faceless catalogue or an international brand with no local presence. A named practitioner with a treatment room, evidence, and an academy is a category of one — but only if the site puts her in it.

---

## Her voice, in her own words

From an Instagram story, and it is better than anything a copywriter would invent:

> **«وقتی سلامت پوست شما درمیونه، کیفیت یعنی هیچ مرحله‌ای سرسری انجام نشه؛ از انتخاب مواد تا اجرای دقیق خدمات.»**

That sentence is the brand. Careful, exacting, quality-obsessed, faintly stern. Not bubbly, not "bestie", not luxury-aloof either. **She sounds like a good doctor who likes you.**

Copy rules that follow:

- **Persian is the source language.** English and Arabic are translations, never the reverse — writing a translation first produces stilted Persian.
- Second person, respectful — «شما», not «تو».
- **Never promise. Show.** «نتیجه، نه وعده» over «معجزه برای پوست شما».
- Willing to say no: _"if your acne is active and severe, get a consultation before buying this"_ is on-brand. It builds more trust than any badge.
- No exclamation marks, no emoji in interface copy, no «فقط امروز!» urgency theatre.

---

## The room — where the palette came from

The colours were **sampled from photographs of the institute**, not chosen from a mood board. The place is genuinely well designed and the site should look like it:

- White corridors under bright daylight, lined with **bamboo stems in glass on white pebbles**
- A deep **teal ceiling** and **fluted green glass** in the treatment room
- **Gold cove lighting** grazing a deep **indigo** wall
- A **champagne-and-arch** treatment room with Forlle'd displayed in lit niches
- A gold-and-turquoise Persian **calligraphic medallion** as the mark — jewel-like, ornate, and genuinely good
- Staff in **navy waistcoats over white** — the uniform is a brand asset

The measured palette, the contrast maths, and the rules that follow from them are in `04-information-architecture.md`, `designs/tokens.json`, and `designs/design-language/index.html`.

**One honest observation to hold onto:** the _physical space_ is considerably more elegant than the _current graphic design_. Her Instagram templates — heavy gold frames, blue-to-gold gradients, outlined display type — are standard Iranian beauty marketing and they undersell the room they were shot in. **The website takes its cue from the architecture, not from the post templates.** That single decision is what will stop this looking like every other skincare site in Iran.

---

## The audience

Iranian women, predominantly in Mashhad and Khorasan, plus a national mail-order audience and a professional audience for the academy.

- **Mobile-first, overwhelmingly.** Instagram is the funnel (7.4k followers) and WhatsApp is the current queue. Design for the phone and adapt up.
- **Price-aware but not price-led.** These are expensive imported products. Buyers want to know they are real, that they suit their skin, and that someone competent chose them.
- **Counterfeit anxiety is the category's biggest objection.** Imported Japanese and Korean skincare is widely faked in Iran. Authenticity signals are worth more than discounts.
- **Two distinct personas** that must never be merged:
  - **The client** — has a problem («لک», «جوش»), wants it solved, may not know product names.
  - **The student** — a practitioner or aspiring one, evaluating a course and a teacher.

---

## How the three spaces should feel

They share one shell and one account, but they are three rooms with different jobs:

|                         | Shop                                | Book                              | Academy                                 |
| ----------------------- | ----------------------------------- | --------------------------------- | --------------------------------------- |
| Accent                  | teal                                | firouzeh                          | gold                                    |
| Mood                    | considered retail, editorial        | calm, clinical, reassuring        | credible, professional, aspirational    |
| Primary object          | the product, photographed well      | the calendar, in Shamsi           | the syllabus and the dated cohort       |
| The question it answers | "what does my skin need?"           | "when can I come in?"             | "what will I be able to do afterwards?" |
| Failure mode to avoid   | looking like a discount marketplace | looking like a hotel booking form | looking like a course-selling funnel    |

**Academy contains four things and they are not the same:** dated **workshops** (کارگاه — often brand-sponsored, sometimes co-taught, city-specific), **seminars** (سمینار), in-person **classes** (کلاس حضوری), and **online courses** (دوره آنلاین). Dated things carry real urgency — capacity, venue, a date on the poster. Online courses do not. The design must distinguish them at a glance.

---

## Design direction

**The one-line direction:** _the calm of the corridor, not the noise of the marketplace._

Do:

- Let photography carry the pages; the institute is photogenic and the products are beautifully packaged
- Hairlines, whitespace and tone shifts for separation
- Long stretches of ink-on-cool-white punctuated by deep lapis sections — the same rhythm as the building, and the same rhythm the contrast maths demands
- Asymmetric splits (60/40, 70/30) echoing the arched niches
- Persian typography with room to breathe: 1.8 line-height, Persian numerals, generous measure
- Show her face, her students' work, and real before/after — with consent

Don't:

- **No card grid.** A product tile is a borderless image with type beneath it.
- **No shadows.** Shadows are what make a site look like a template.
- **No permanent discount furniture** — no countdown timers, no `-۳۰٪` on every tile, no «فروش ویژه» as a nav item. On medical-grade product, visible permanent discounting tells patients the price was never real, and by extension that the recommendation isn't either.
- **No generic pink-and-lavender "beauty" palette.** The measured institute palette is stronger and it is actually hers.
- **No dashboard.** If a customer-facing screen starts looking like an admin panel, it has gone wrong. (`/admin` is exempt — it _is_ a dashboard.)
- No stock photography of Western models. No emoji as icons.

---

## What success looks like

A woman in Mashhad with melasma should be able to arrive from an Instagram link, understand within ten seconds that a real specialist is behind this, find «لک» without reading a menu, see what she should use and why, and either buy it or book a consultation — in Persian, on a phone, with no doubt that the product is genuine.

A prospective student should be able to land on the same site and, in a completely different room, see who teaches, what she has taught, what the certificate is worth, and when the next Mashhad workshop runs.

Neither should ever feel like they wandered into the other's shop.
