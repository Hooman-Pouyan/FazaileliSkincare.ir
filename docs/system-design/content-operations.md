# Content operations - how anything on this site gets changed

**Status:** Review-ready; no runtime implementation is authorized by this document
**Updated:** 2026-08-27
**Scope:** The editing model for every changeable thing on the site - prices, stock, product copy, campaigns, testimonials, credentials, before-and-after cases, courses, services
**Depends on:** [`../00-decision-map.md`](../00-decision-map.md) `D18`, `D24`; [`../06-site-map.md`](../06-site-map.md) (the `/admin` route list); [`storefront/public-surfaces.md`](storefront/public-surfaces.md)
**Trigger:** the maintainer, 2026-08-27 - _"when the prices need to get updated, when the contents of a product need to get updated, when some banners need to be added"_

---

## 1. The question, asked properly

Not _"do we need a CMS?"_ The useful question is:

> **When something needs to change, who changes it, and what happens if the
> developer is not available?**

There are only three honest answers per item, and choosing the wrong one is
expensive in a different way each time:

| Answer                    | Cost of choosing it wrongly                                           |
| ------------------------- | --------------------------------------------------------------------- |
| **She changes it**        | A screen has to be built, secured and maintained by one developer     |
| **It waits for a deploy** | A typo on the Landing is visible until someone is free to fix it      |
| **It never changes**      | Wrong roughly half the time, and the discovery is always inconvenient |

The constraints are fixed: **one developer, one non-technical owner, hosted in
Iran.** Everything below follows from those three facts.

---

## 2. Why a third-party CMS is out - and the real reason is not sanctions

Sanctions and reachability matter: Contentful, Sanity and Strapi Cloud are
foreign-hosted, awkward to pay for from Iran, and unreliable to reach. `ADR-002`
already puts hosting inside Iran for exactly this class of reason.

**But that is the weaker argument.** The stronger one is entanglement.

The content here is not a blog beside a shop. A testimonial is _about a product_,
and only shows when that product is published. A certificate is _issued by a
brand we stock_. A before-and-after case is _attached to a service and a
practitioner_, and must disappear the instant a consent row is revoked. A
campaign is _scoped to a concern_ and expires on a date.

A generic CMS solves none of that, because it owns its own store and knows
nothing about `product.is_published`, `consent_record.revoked_at` or
`price.customer_group`. You would end up either duplicating the relationships in
two systems that drift, or letting a CMS write into a schema whose invariants -
integer rials, consent default-deny, publication rules - it cannot enforce.

**A self-hosted CMS is also a second application** with its own database, its own
auth, its own deploy and its own security surface, maintained by the same one
person. That is the cost, and it buys form screens that Next.js Server Actions
already make cheap.

**Decision: no CMS platform.** The editing surfaces are the four below.

---

## 3. The four editing surfaces

### CO-D1 - Surface 1: the message catalogue, for static UI copy

`src/messages/{fa,en,ar}.json` already holds **355 keys per locale**, with
three-way parity enforced by a test. This is a content system. It is versioned,
reviewable, type-checked through `next-intl`, and it cannot drift between
languages without a test failing.

**What belongs here:** section headings, button labels, empty-state sentences,
form hints, error messages, navigation labels. Anything that is part of the
_interface_ rather than part of the _business_.

**What does not:** anything with a date on it, anything about a specific product,
anything a customer wrote.

This is the correct home for the heading above a carousel. It is not a
compromise - it is better than a database row, because a heading that changes
should change with the design that surrounds it.

### CO-D2 - Surface 2: versioned seed data, for structured facts that rarely change

The house already has this pattern: `geo-data.ts` carries 31 provinces with a
recorded source, `reference-data.ts` carries the taxonomy, `storyderm-manifest.ts`
carries the catalogue. Structured, versioned, reviewed in a pull request, imported
into PostgreSQL so the application reads one place.

**This is the answer to "the Landing barely changes".** Her certificates, the
treatment rooms, her brand relationships and her milestone numbers are all
structured data with real fields - but they change a few times a year, and the
person who would change them is the person who would also review the pull
request.

**Seeded, not hardcoded in a component.** The distinction matters: the page still
renders from the database, so adding an admin screen later is additive rather
than a rewrite. Nothing about the read layer changes when the editing surface
does.

### CO-D3 - Surface 3: the back office, for what she must change without you

Already decided and already started. `06-site-map.md` lists `/admin/orders`,
`/admin/products`, `/admin/prices`, `/admin/inventory`, `/admin/content`,
`/admin/bookings`, `/admin/academy`, and `/admin/transfers` - which is built and
which that document correctly calls _"the screen your business runs on daily"_.

**The back office is not a content-management decision. It is an operations
requirement.** Confirming a bank transfer, marking an order shipped, taking
attendance, adding a holiday - none of those are content, all of them need
screens, and every one of them has to exist regardless of how content is edited.

Which means the marginal cost of putting content editing into a back office you
are building anyway is a handful of forms, not a new system. **That is the whole
argument for `CO-D3`.**

### CO-D4 - Surface 4: nothing at all, because it is computed

Product listings, concern pages, "new in", stock levels, prices, remaining seats,
availability. These are queries over operational tables. There is no content step
and there should never be one - a curated list of "latest products" is a list
that goes stale the day someone forgets to update it.

---

## 4. The classification

Every changeable thing on the site, with its surface. This table is the document.

| What changes                                       | How often                                             | Who                       | Surface                                                                                    |
| -------------------------------------------------- | ----------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------ |
| **Product prices**                                 | Weekly-ish; rial pricing moves with the exchange rate | Mahdieh                   | **Back office** - `D24`, see `§6`                                                          |
| **Stock levels**                                   | Daily                                                 | Staff                     | **Back office**, and by settlement automatically                                           |
| **Publish / unpublish a product**                  | Weekly                                                | Mahdieh                   | **Back office**                                                                            |
| **Product copy** (description, usage, ingredients) | Once in bulk, then rarely                             | Drafted, she approves     | **Back office** approval over a `draft → verified → approved` workflow that already exists |
| **New products**                                   | Monthly                                               | Developer                 | **Seed manifest**, the existing pipeline                                                   |
| **"Recommended by Ms. Fazaieli"**                  | Monthly                                               | Mahdieh                   | **Back office** - a product picker, not editorial copy                                     |
| **Campaign / promotional banner**                  | Occasionally, time-boxed                              | Mahdieh                   | **`content_block`** - the one genuine use, see `§5`                                        |
| **Hub section order and structure**                | When the design changes                               | Developer                 | **Code**                                                                                   |
| **Section headings and microcopy**                 | When the design changes                               | Developer                 | **Message catalogue**                                                                      |
| **Her story, milestones**                          | Yearly                                                | Developer, from her words | **Seed data**                                                                              |
| **Certificates**                                   | A few a year                                          | Developer initially       | **Seed data**, admin later if she wants it                                                 |
| **Treatment rooms and photographs**                | Rarely                                                | Developer                 | **Seed data**                                                                              |
| **Brand relationships**                            | Rarely                                                | Developer                 | **Seed data**                                                                              |
| **Testimonials**                                   | Ongoing                                               | Mahdieh                   | **Back office** - consent, attribution, audience                                           |
| **Before-and-after cases**                         | Ongoing                                               | Mahdieh                   | **Back office, non-negotiable** - `D18` requires revocation in one action                  |
| **Services and treatment prices**                  | Occasionally                                          | Mahdieh                   | **Back office**                                                                            |
| **Clinic holidays and hours**                      | Ongoing                                               | Staff                     | **Back office** - `BOOK-D6`                                                                |
| **Courses and cohort dates**                       | Each term                                             | Mahdieh                   | **Back office**                                                                            |
| **Legal pages**                                    | Rarely, but urgently when it happens                  | Developer                 | **Seed data**, so a correction is a small pull request rather than a schema change         |

---

## 5. What this corrects in `public-surfaces.md`

That document proposed seven new entities and implied all of them needed
management screens. **On reflection that is more machinery than the change
frequency justifies**, and the maintainer's push on this is right.

| Entity               | Yesterday's implication | Corrected                                                   |
| -------------------- | ----------------------- | ----------------------------------------------------------- |
| `credential`         | Admin-managed           | **Seed data.** ~20 rows, changes a few times a year         |
| `space` (rooms)      | Admin-managed           | **Seed data.** Changes when the clinic is rebuilt           |
| `brand_relationship` | Admin-managed           | **Seed data.** Three brands                                 |
| `milestone`          | Admin-managed           | **Seed data.** Reviewed numbers, reviewed in a pull request |
| `testimonial`        | Admin-managed           | **Unchanged** - ongoing, and consent needs a screen         |
| `before_after_case`  | Admin-managed           | **Unchanged, and non-negotiable** - `D18`                   |
| `consent_record`     | Admin-managed           | **Unchanged**                                               |

The tables stay. Only the editing surface changes, and because `CO-D2` keeps the
read layer reading from PostgreSQL, promoting any of them to a screen later is
additive.

### CO-D5 - `content_block` shrinks to campaigns and genuinely editorial prose

The maintainer's instinct that hub carousels do not need content blocks is
correct. A hub section separates into four parts, and only one of them is content:

| Part                                | Example                                                 | Surface                         |
| ----------------------------------- | ------------------------------------------------------- | ------------------------------- |
| Which sections exist, in what order | The hub has a concern rail, then a spotlight            | **Code**                        |
| What is _in_ the section            | These eight products                                    | **Query** or a **curated list** |
| The heading and intro above it      | <span dir="rtl">«پوستتان این روزها چه می‌خواهد؟»</span> | **Message catalogue**           |
| A time-boxed promotional message    | "Nowruz offer, until 15 Farvardin"                      | **`content_block`**             |

Only the last has a date attached and must change without a deploy. That is the
whole remaining job of `content_block`, and `effective_from` / `effective_until`
already exist on it for exactly this.

A **curated list** is worth naming separately: "recommended by Ms. Fazaieli" is
data _about products_, not editorial copy. It is a `curated_list` with ordered
`curated_list_item` rows and a product picker in admin - not a block of text
containing product slugs.

---

## 6. Prices deserve their own paragraph

`D24` already decided this and the schema already carries it:
`price_adjustment_batch` has `status`, `created_by`, `committed_by` and
`committed_at`, alongside a `price_history` table.

That shape is a **staged, previewed, audited, two-step** price change - not a
form that edits one number. Under Iranian inflation prices move by percentage
across a brand or a category, and the failure mode of doing that one product at a
time is a catalogue where half the items moved and half did not.

**`/admin/prices` is the second most valuable screen in the back office**, after
transfers. Select a scope, apply a percentage, **preview every resulting price**,
commit as one batch, keep the history. `price_history` then feeds the price chart
that Iranian shoppers actively look for.

---

## 7. Back office build order

Sequenced by what stops the business without it.

| #   | Screen             | Why here                                                                                |
| --- | ------------------ | --------------------------------------------------------------------------------------- |
| 1   | `/admin/transfers` | **Built.** Money does not move without it                                               |
| 2   | `/admin/orders`    | You cannot run a shop you cannot see. Fulfilment states live here                       |
| 3   | `/admin/prices`    | `D24`; inflation makes this recurring                                                   |
| 4   | `/admin/inventory` | Stock, and the reconciliation check against `inventory_movement`                        |
| 5   | `/admin/products`  | Publish, unpublish, approve copy, curate the recommended list                           |
| 6   | `/admin/content`   | Testimonials, before-and-after, **consent revocation in one action** (`D18`), campaigns |
| 7   | `/admin/bookings`  | With Booking                                                                            |
| 8   | `/admin/academy`   | With Academy                                                                            |

**Every screen re-checks the staff role inside its actions**, never inferring it
from the page having rendered - the rule `payment.authz.ts` already establishes,
and roles read from the database on each request rather than from the session.

---

## 8. What to accept, deliberately

- **Some things will wait for a deploy, and that is fine.** Her story, the room
  photographs and the certificate list change a few times a year. Building
  screens for them costs more than the waiting does.
- **The message catalogue is not a limitation.** 355 keys with enforced trilingual
  parity is a stronger guarantee than any CMS would give, because a missing
  Persian string fails a test rather than rendering an English word to a Persian
  customer.
- **The back office will look like an admin dashboard, and that is allowed.**
  `D2` says _fazaieli.ir is a storefront, not an admin dashboard_ - that is about
  the **storefront**. `/admin` is a tool for one or two people who use it daily,
  and it should be dense, fast and boring.
- **Nothing gets a screen until someone has needed it twice.** The most expensive
  back office is the one built for changes nobody makes.

---

## 9. Phased delivery

### CO0 - The seed surfaces

- [ ] `credential`, `space`, `brand_relationship`, `milestone` and legal pages as
      versioned seed data with recorded sources, imported to PostgreSQL.

**Exit gate:** the Landing renders her real credentials from the database, and
updating one is a reviewed pull request.

### CO1 - Orders and prices

- [ ] `/admin/orders` with fulfilment states; `/admin/prices` implementing `D24`
      end to end - scope, percentage, preview, commit, history.

**Exit gate:** a 12% increase across one brand is previewed, committed as one
batch, and every affected price has a history row.

### CO2 - Inventory and products

- [ ] `/admin/inventory` with the movement reconciliation check;
      `/admin/products` with publish, copy approval and the curated list.

**Exit gate:** `inventory_movement` sums to `on_hand` for every variant, checked
by the screen rather than by a query someone remembers to run.

### CO3 - Content

- [ ] `/admin/content`: testimonials with audience and consent, before-and-after
      with **one-action revocation**, campaign blocks with effective dates.

**Exit gate:** revoking consent removes a case from every surface in one action,
proved by test, per `D18`.

---

## 10. What the maintainer must decide

1. **Is waiting for a deploy acceptable** for her story, certificates, rooms and
   brand relationships? `CO-D2` assumes yes.
2. **Who else touches the back office** besides her - which decides how much the
   role model has to distinguish `staff` from `admin`.
3. **Does she want to write product copy, or approve drafted copy?** The
   `draft → verified → approved` workflow supports both; the screens differ.
4. **How are prices actually decided today** - a percentage on cost, a fixed
   markup, per-brand rules? `D24`'s tooling should match how she already thinks.
