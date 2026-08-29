# Public surfaces - the Landing and the three hubs

**Status:** Review-ready; no runtime implementation is authorized by this document
**Updated:** 2026-08-27
**Scope:** The four pages a visitor meets before signing in - `/` (personal brand), `/shop`, `/book`, `/academy` - and the content entities they need
**Depends on:** [`landing.md`](landing.md) (`LAND-05`…`LAND-11`), [`shell-and-product-hub.md`](shell-and-product-hub.md), [`../content/content-spine.md`](../content/content-spine.md), [`../booking.md`](../booking.md), [`../academy.md`](../academy.md)
**Trigger:** the maintainer's brief of 2026-08-27, and [`../../31-content-depth-findings.md`](../../31-content-depth-findings.md), which measured that the pages read as deserted

---

## 1. Why this document exists

`30-next-block-plan.md` deliberately excluded the content-depth pass - _"no phase
above adds page sections, content kinds or taxonomy"_ - and said it was being
planned separately. **This is that plan.**

It covers four pages and one problem they share: the site has an excellent
transactional spine and almost nothing to say. Fifty products carry no Persian
copy. The Landing has five beats and no proof. The hubs render placeholder
plates. Every fix below is content architecture, not layout.

**The stopping boundary.** No runtime implementation is authorized. `§8` lists
what only the maintainer can supply, and most of this document is blocked on
material rather than on code.

---

## 2. The rule that organises everything: three audiences, three words

The institute serves three groups, and the maintainer's brief separates them
precisely:

| Word                                        | Who                               | Where their proof belongs |
| ------------------------------------------- | --------------------------------- | ------------------------- |
| **Client** · <span dir="rtl">مراجع</span>   | Someone who comes for a treatment | `/book`                   |
| **Customer** · <span dir="rtl">مشتری</span> | Someone who buys a product        | `/shop`                   |
| **Student** · <span dir="rtl">هنرجو</span>  | Someone who takes a course        | `/academy`                |

### PUB-D1 - A testimonial is attributed to an audience, and appears only on that audience's surface

A student praising a course is not evidence that a serum works. Mixing them
produces a wall of undifferentiated praise that reads as marketing, which is
exactly the failure a practitioner-led brand cannot afford.

The Landing is the one exception: it shows a **curated few across all three**,
because the Landing's subject is her, not any single room.

This is why `testimonial` needs an `audience` column, and why the existing
`content_block` of kind `testimonial` is not sufficient - it has no attribution,
no audience, no photo and no link to what it refers to.

---

## 3. The content entities that do not exist yet

`content_block` carries `heading`, `body`, `cta_label`, `cta_href` and nothing
else. It is a good spine for editorial copy and **cannot** carry any of the
following. These are real tables, not blocks.

### PUB-D2 - `credential` - her certificates as data, not a photo album

More than twenty certificates is not a gallery of images; it is a **credential
record** that happens to have a scan attached. Modelled as data it can be
grouped by issuer, sorted by year, filtered by discipline, and rendered as
structured data for search engines. Modelled as images it is twenty JPEGs nobody
can read.

| Column                         | Notes                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `slug`, `sort_order`           |                                                                                        |
| `issuer`                       | Forlle'd, Storyderm, Thalgo, a university, a ministry body                             |
| `issuer_brand_id`              | Nullable link to `brand` where the issuer is one we stock                              |
| `issued_on`, `expires_on`      | Some certifications lapse; showing a lapsed one as current is a claim that is not true |
| `credential_number`            | Where one exists and she is willing to publish it                                      |
| `discipline`                   | Grouping: laser, peels, injectables, product certification, teaching                   |
| `image_object_key`, `has_scan` | The artefact, not the record                                                           |
| `is_published`, `review_state` | Nothing publishes at `draft`                                                           |

Translations carry `title`, `issuer_name` and an optional one-line
`what_it_means` - which is the field that turns a certificate into an argument.
"Certified Forlle'd practitioner" means nothing to a customer; _"trained by the
manufacturer to perform their protocols"_ does.

### PUB-D3 - `testimonial` - attributed, audience-scoped, consented

| Column                                      | Notes                                                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `audience`                                  | `client` / `customer` / `student` - `PUB-D1`                                                          |
| `display_name`, `display_role`              | "<span dir="rtl">مریم ک.</span>", "graduate, 1403 cohort". Never a full name without explicit consent |
| `person_id`                                 | Nullable; set when it came from a verified account                                                    |
| `subject_kind`, `subject_id`                | What it is about: a `service`, a `product`, a `course` - so it can appear on that thing's page        |
| `body`, `locale_code`                       | In her words, in her language                                                                         |
| `photo_object_key`                          | Optional and consented separately from the text                                                       |
| `consent_recorded_at`, `consent_revoked_at` | Default deny, per `§4`                                                                                |
| `is_featured`                               | The handful the Landing may use                                                                       |
| `is_published`, `review_state`              |                                                                                                       |

### PUB-D4 - `before_after_case` - the highest-consequence table on the site

`../../03-domain-model.md` §4b already sets the bar and this document does not
lower it: identifiable photographs of clients' faces attached to a
medical-adjacent treatment.

**Requirements, not suggestions.** Written consent captured and stored per case.
A `consent_revoked_at` that unpublishes immediately. **No case visible without an
active consent row** - default deny, so a missing record hides rather than shows.
Images from storage that is not publicly enumerable. No third-party analytics or
embeds on pages that show them. Removal is one admin action, never a code change.

| Column                                                              | Notes                                                       |
| ------------------------------------------------------------------- | ----------------------------------------------------------- |
| `service_id`, `practitioner_id`                                     | What was done, by whom                                      |
| `sessions_count`, `elapsed_weeks`                                   | Honesty about how long it took                              |
| `before_object_key`, `after_object_key`                             | Same lighting, same angle, or the comparison is a lie       |
| `skin_state_id`, `concern_id`                                       | So it can be filtered to _people like me_                   |
| `consent_recorded_at`, `consent_document_key`, `consent_revoked_at` |                                                             |
| `disclaimer_note`                                                   | Results vary, and saying so is both honest and legally wise |

### PUB-D5 - `space` - the rooms, including the Forlle'd room

The clinic is a physical place and its rooms are part of the offer. The
maintainer names a dedicated **Forlle'd treatment room** specifically, and
photographs are coming.

| Column               | Notes                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `slug`, `sort_order` |                                                                                                      |
| `room_id`            | Nullable link to Booking's `room`, so a photographed space and a schedulable room are the same thing |
| `brand_id`           | The Forlle'd room's association                                                                      |
| `is_featured`        |                                                                                                      |
| Translations         | `name`, `description`, `equipment_note`                                                              |

`space_media` holds ordered images with alt text. This is what lets `/book` show
where somebody will actually be lying down, which for a first-time client
resolves more anxiety than any amount of copy.

### PUB-D6 - `brand_relationship` - what "official representative" means, precisely

`brand` exists. What is missing is her **relationship** to each: official
representative of Forlle'd, stockist of Storyderm, certified in Thalgo. Those are
different claims with different weight, and flattening them into a logo strip
throws away the strongest one.

| Column          | Notes                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------- |
| `brand_id`      |                                                                                                   |
| `kind`          | `official_representative` / `authorised_stockist` / `certified_practitioner` / `training_partner` |
| `since_year`    |                                                                                                   |
| `evidence_note` | Internal - what backs the claim                                                                   |
| `is_published`  |                                                                                                   |

### PUB-D7 - `milestone` - the years, in numbers she will stand behind

"More than twenty certificates", "teaching since 13xx", "N students trained".
Numbers persuade, and invented numbers are a lie that compounds. Each milestone
is a row with a `value`, a `label`, an `as_of` date and a `source_note`, and
**none of them are computed from the database** unless the database genuinely
holds the truth. Student count becomes computed once Academy has real enrolments;
until then it is a maintained figure she has approved.

---

## 4. Consent is a first-class concern on three of these tables

`testimonial`, `before_after_case` and any photograph of an identifiable person
share one rule: **default deny**. The read filters on an active consent row
rather than on a `is_published` flag alone, so the failure mode of a missing
record is invisibility, not exposure.

One shared `consent_record` table, referenced by kind and id, with
`granted_at`, `document_object_key`, `scope` (text / photo / both) and
`revoked_at`. A revocation is a single write that removes the material from every
surface at once - which is what makes "she asked us to take it down" a
thirty-second job rather than a deployment.

---

## 5. The Landing - her, not the shop

The Landing's subject is Ms. Fazaieli. Everything else on the site sells
something; this page establishes why anyone should believe it. The current five
beats stay as the spine; these are the sections the brief adds.

| #   | Section                  | What it contains                                                   | Notes                                                                            |
| --- | ------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 1   | **Portrait and opening** | Her photograph, name, what she does, where                         | Exists. Needs the real portrait and a first line that is a claim, not a greeting |
| 2   | **The short story**      | Years practising, years teaching, how she came to Forlle'd         | 120-180 words. The one place first person is right                               |
| 3   | **Milestones**           | 3-4 numbers from `milestone`                                       | Restraint: four numbers persuade, twelve read as a brochure                      |
| 4   | **Credentials**          | The certificate wall from `credential`                             | See below - this is the section the brief cares most about                       |
| 5   | **Brands**               | From `brand_relationship`, each with its actual relationship named | "Official representative of Forlle'd, Japan" is a stronger sentence than a logo  |
| 6   | **Teaching**             | Workshops and seminars, with photographs                           | Links into `/academy`                                                            |
| 7   | **Proof, curated**       | 3-4 featured testimonials spanning all three audiences             | The Landing exception in `PUB-D1`                                                |
| 8   | **Where they are now**   | Graduates and what they do today                                   | The most persuasive Academy content, and it belongs on the Landing too           |
| 9   | **The three doors**      | Shop, Book, Academy                                                | Exists as the fork                                                               |

### PUB-D8 - The certificate wall is a filterable grid, not a lightbox carousel

Twenty-plus certificates presented as a slideshow is twenty clicks to see
something the visitor wanted to skim. Presented as a grid grouped by discipline,
with issuer and year visible without opening anything, it is scannable in four
seconds - and _that_ is what conveys "she is qualified", not any individual
scan.

The scan opens on demand for anyone who wants to verify. Alt text carries the
issuer and title, so the wall works for a screen reader and for search.

---

## 6. The three hubs

Each hub answers a different question and carries its own audience's proof.

### 6.1 `/shop` - "what should I use?"

Today it renders concern plates with no images and a spotlight. The brief adds
merchandising and customer proof.

| Section                         | Source                                    | Notes                                                                                                                                                                 |
| ------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Recommended by Ms. Fazaieli** | Curated product list                      | Her name on a selection is the single strongest merchandising unit this shop has. Not an algorithm                                                                    |
| **By concern**                  | `concern`                                 | Exists; needs real imagery (`R-5`)                                                                                                                                    |
| **By skin type**                | `skin_state`                              | **A second axis that exists in the schema and is unused.** "Oily", "dry", "sensitive" is how many customers self-identify, and `product_skin_state` already models it |
| **Routines and pairings**       | `product_pair`, later `protocol`          | "This cleanser with that serum". The protocol engine turns this from a pairing into a purchasable routine                                                             |
| **Campaign**                    | `content_block` kind `campaign`           | Already supported by the spine. Time-boxed via `effective_from`/`until`                                                                                               |
| **New in**                      | `product.created_at`                      | Cheap, and returning customers look for it first                                                                                                                      |
| **Customer testimonials**       | `testimonial` where audience = `customer` | `PUB-D1`                                                                                                                                                              |
| **Authenticity**                | `brand_relationship` + IRC                | Why buying here differs from buying on Instagram                                                                                                                      |

### 6.2 `/book` - "what happens, and where?"

The most anxiety-laden of the three. A first-time client is deciding whether to
let a stranger work on their face.

| Section                  | Source                                  | Notes                                                                                                                                    |
| ------------------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **What we treat**        | `service` grouped by concern            | Not a price list first. The concern is what they arrived with                                                                            |
| **The rooms**            | `space` + `space_media`                 | Including the **Forlle'd treatment room**, which is a differentiator and should be named as one. Photographs pending from the maintainer |
| **Before and after**     | `before_after_case`                     | Filterable by concern and skin state, so a visitor sees people like themselves. Consent-gated per `PUB-D4`                               |
| **The practitioners**    | `practitioner`                          | Who they are, what they are certified in - links to `credential`                                                                         |
| **What a visit is like** | Editorial                               | Duration, preparation, aftercare, what to expect. Removes the unknown                                                                    |
| **Client testimonials**  | `testimonial` where audience = `client` |                                                                                                                                          |
| **Book**                 | Booking availability                    | The action, once `BOOK4` exists                                                                                                          |

### 6.3 `/academy` - "will this change what I can do?"

The buying decision here is career-shaped, not product-shaped. Evidence of
_outcomes_ outperforms description of _content_.

| Section                     | Source                                                 | Notes                                                                                                              |
| --------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Upcoming cohorts**        | `cohort`                                               | Dated, with city, capacity and remaining seats. Scarcity that is true                                              |
| **Courses**                 | `course`                                               | Level, prerequisites, outcomes, whether certifying                                                                 |
| **Where graduates are now** | `testimonial` audience `student` with `display_role`   | The strongest section on the page. "Now running her own clinic in Neyshabur" sells a course better than a syllabus |
| **Student work**            | `before_after_case` attributed to a student, consented | Results her students achieved - proof the teaching transfers                                                       |
| **Inside the classroom**    | Sample video, photographs                              | `ACAD-D5` governs hosting. A short free preview lowers the barrier more than any description                       |
| **Certification**           | `certificate` + the public verify URL                  | What the certificate is worth and how anyone checks it                                                             |
| **Student testimonials**    | `testimonial` where audience = `student`               |                                                                                                                    |
| **Seminars and workshops**  | `cohort` of a short kind, or editorial                 | Often brand-sponsored; `ACAD-D3` already models the sponsor                                                        |

---

## 7. Phased delivery

Content-first, because every section above is blocked on material rather than on
code, and building empty sections is what produced `31-content-depth-findings.md`.

### PUB0 - The entity layer

- [ ] `credential`, `testimonial`, `before_after_case`, `space`, `space_media`,
      `brand_relationship`, `milestone`, `consent_record`, with translations.
- [ ] Consent enforced as default-deny in the **read**, proved by a test that a
      case without an active consent row is invisible.
- [ ] Staff screens to enter all of it - this is data she must be able to
      maintain without a developer.

**Exit gate:** every FK indexed and proved by query; a revoked consent removes
material from every surface in one write, proved by test.

### PUB1 - The Landing's proof sections

- [ ] Credentials wall (`PUB-D8`), milestones, brand relationships, the short
      story, curated testimonials.

**Exit gate:** the Landing renders her real credentials, and every number on it
traces to a `milestone` row she approved.

### PUB2 - The shop hub

- [ ] Recommended-by, skin-type axis, pairings, campaign slot, new-in, customer
      testimonials.

**Exit gate:** the hub renders no placeholder plate, and the skin-type axis
returns real products from `product_skin_state`.

### PUB3 - The booking hub

- [ ] Services by concern, the rooms including Forlle'd, before/after under
      consent, practitioners, what-to-expect, client testimonials.

**Exit gate:** no before/after case renders without an active consent row, proved
by removing one.

### PUB4 - The academy hub

- [ ] Cohorts, courses, graduate outcomes, student work, classroom preview,
      certification explainer, student testimonials.

**Exit gate:** a real cohort from a real poster renders with its sponsor and
co-instructors.

### PUB5 - Search, SEO and structured data

- [ ] `Person` structured data for her, `Course` for courses, `Service` for
      treatments, `Product` already partly done.
- [ ] The credentials wall exposed as structured credentials.

**Exit gate:** each surface validates, and no page carrying a client photograph
loads a third-party script.

---

## 8. What only the maintainer can supply

Most of this document is blocked on material, not on engineering.

1. **The portrait**, and permission to use it prominently.
2. **The certificates** - scans, issuers, years, and which may be published.
   Also which have lapsed, because showing a lapsed certification as current is a
   claim that is not true.
3. **The Forlle'd room photographs**, and the other treatment rooms.
4. **Before and after cases with written consent.** Without consent documents
   this section cannot ship, and that is not negotiable.
5. **Testimonials with attribution and consent**, sorted into client, customer
   and student.
6. **Graduate outcomes** - who is doing what now, and their permission to say so.
7. **The milestone numbers**, each one she is willing to stand behind.
8. **Her brand relationships**, stated precisely: representative, stockist or
   certified.
9. **Her story in her own words**, 120-180 Persian words. This is the one thing
   on the site nobody else can write.

---

## 9. Capability catalogue

**In v1** - the entities, the credentials wall, the three hubs' proof sections,
consent enforcement, skin-type browsing, curated recommendation.

**Deliberately later** - filtering before/after by skin state; video
testimonials; a press or media-mention section; a public practitioner profile
page; Instagram-sourced content ingestion; a journal or magazine for organic
search; multi-city seminar listings.

**Rejected for now** - a review score aggregate on the Landing, which reduces a
practitioner to a number; auto-playing video; any before/after presented without
elapsed time and session count, which is the shape of a misleading claim.
