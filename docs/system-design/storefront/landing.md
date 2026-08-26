# Landing composition and brand storytelling — phased implementation plan

**Parent:** [`../storefront.md`](../storefront.md)
**Extends:** [`shell-and-product-hub.md`](shell-and-product-hub.md) §4, `LAND-01`–`LAND-04`
**Binding decisions:** [`../../21-landing-composition-decisions.md`](../../21-landing-composition-decisions.md), `L-1`–`L-15`
**Route:** `/[locale]`
**Primary acceptance locale:** `fa`
**Execution:** ledger packet 6

---

## 1. Why this plan exists

`shell-and-product-hub.md` §4 establishes what the Landing _is_ — a route role, a
reading order, navigation continuity and responsive rules. It does not say what
the page is made of, because at the time it was written the brand storytelling
had not been decided and the three source-content batches did not exist.

Both now do. This plan covers the four things §4 leaves open:

1. the **storytelling spine** that carries the five beats and the Japanese/Forlle'd
   register through them;
2. the **ornament and motion vocabulary** those beats use;
3. how **unapproved source content** reaches a development environment without
   ever reaching a customer;
4. the **proof surfaces** — testimonials and before/after — including what ships
   as structure before its content exists.

Nothing here overrides `LAND-01`–`LAND-04`. Where this plan is more specific, it
is specific _inside_ them.

---

## 2. Prerequisites

- Packet 4's shell is in place and the Landing already renders inside it.
- `21-landing-composition-decisions.md` is accepted, with `L-5`'s petal-motion
  allowance still marked proposed.
- The dev catalogue seed exists and refuses to run under `NODE_ENV=production`.
- **Not prerequisites, deliberately:** approved testimonials, confirmed academy
  prices, brand image rights, real before/after imagery, and the two claim
  figures. `LAND-09` requires every beat that depends on them to be correct in
  their absence, so the page ships without them.

---

## 3. Landing requirements

### LAND-05 — The growth spine

The five beats are carried by **one continuous blossom branch** rendered as a
single logical ornament that advances state as the reader descends. It is the
page's through-line, not decoration applied per section.

| Beat            | Branch state                                       | The fact it sits beside                           |
| --------------- | -------------------------------------------------- | ------------------------------------------------- |
| 1 · portrait    | bare branch, entering from the inline-start margin | —                                                 |
| 2 · the claim   | first buds                                         | Japan, Forlle'd, exclusive representation, 日本製 |
| 3 · three doors | branch divides into three                          | the three rooms                                   |
| 4 · proof       | open blossom                                       | results, students, testimonials                   |
| 5 · invitation  | full bloom, then a single petal at rest            | the closing action                                |

**The rule that keeps this from becoming decoration.** Every stage is adjacent to
a claim that is independently true. A concept — authenticity, freshness, youth,
health, 改善 — may appear only where a verifiable fact carries it. A row of
concept cards with icons and adjectives is the failure mode this requirement
exists to prevent, and it is refused.

The spine is `aria-hidden` throughout. Removing it entirely must leave a page
that still reads correctly, and a test asserts that.

### LAND-06 — The ornament set

One set of small original SVG pieces, authored in-repo, composed by the spine:

| Piece                         | Role                        |
| ----------------------------- | --------------------------- |
| `branch-segment` (3 variants) | the spine's continuous line |
| `bud`                         | beat 2                      |
| `blossom-open`                | beats 4–5                   |
| `petal`                       | the resting mark at beat 5  |
| `slash`                       | section-rhythm mark         |

**Constraints.** Contour hairlines, no fill, no gradient, no shadow, no frame.
`--champagne` or `--gold` stroke with the blossom centre in `--gold-light`, and
placement restricted to lapis and teal bands — `tokens.css` line 6 records that
gold, firouzeh, champagne and sand fail contrast on `--ground`. Every piece is
`aria-hidden` and carries no text alternative.

**Provenance.** Drawn originally for this repository. Not traced from
`designs/references/forlled/`, which is Forlle'd's artwork, and not sourced from
a third-party sakura set — see `L-11` for why licence origin matters here more
than usual.

### LAND-07 — Motion

One primitive, one duration, one easing. Elements reveal **once** on entry with a
fade and an 8–16px rise; the spine advances by `stroke-dashoffset` on the same
schedule.

- `prefers-reduced-motion` renders every resting state directly, spine included.
- With JavaScript disabled the page renders fully revealed. Content is never
  hidden behind an observer that may not run.
- Sticky band pinning is the only depth device. No parallax, no autoplay, no
  looping rail, no scroll hijack, no sticky section nav.
- The bounded six-petal reveal in `L-5` is **not built** until it is approved.

### LAND-08 — Proof: testimonials

- A reader-paced RTL rail: CSS scroll-snap, arrows and swipe, entry fade only.
- Reads **published** testimonials from PostgreSQL. It never reads a JSON file at
  runtime, in any environment.
- **Real testimonials never render.** They exist only as unpublished drafts
  (`L-13`). Development previews are populated by fictional records, so the rail
  can be judged full without a real quote leaving its draft state.
- At zero published items the **entire beat is absent** — no frame, no heading,
  no "coming soon". This is the state it ships in, so it is the state the tests
  assert first.

### LAND-09 — Proof: before and after

- Ships in packet 6 as **structure with placeholder imagery**: a labelled pair,
  or a draggable divider. No autoplay, no automatic wipe.
- Placeholder imagery is the existing flat-colour fixture treatment, which
  proves layout and explicitly does not prove art direction.
- Real imagery is gated on per-person consent and on the Iranian advertising
  rules covering implied medical results. Both are content and legal work; see
  `L-15`. The component may not accept a real image until that gate closes.

### LAND-10 — Absence is a designed state, not an edge case

Every beat that depends on unapproved content renders **absent** rather than
empty. Absent means the section, its heading, its ornament and its vertical
rhythm are all gone, and the beats above and below close the gap without a
visible seam.

This is a composition requirement, not error handling. An intentionally absent
optional beat and an operational failure remain distinguishable, per `LAND-04`.

### LAND-11 — SEO

Per `L-7` and `D-18-3`: self-canonical per locale, `hreflang` across fa/en/ar,
`Organization` + `LocalBusiness` (`HealthAndBeautyBusiness`) + `WebSite` with
`SearchAction`. `Person` for Mahdieh Fazaieli carries only verifiable
credentials.

Bounded to truth, and tested as such: no `AggregateRating`, no `Review`, no
`Offer`. `LocalBusiness` postal address, telephone and opening hours are omitted
until supplied — a test asserts their absence so they cannot be quietly invented.

---

## 4. Source content and the development seed

### CONTENT-01 — Reads come from PostgreSQL, always

No route, page model, Server Action or component imports a file from `content/`
at runtime, in any environment. The batches are seed input. This is the existing
contract in all three `content/*/README.md` files and it is restated here because
the Landing is the first surface tempted to break it.

### CONTENT-02 — Batches are seeded as drafts, completed fictionally, and marked

Each batch gets a table, a migration and an idempotent importer keyed on its own
stable identity: `sourceChecksum` for testimonials, `candidateKey` for academy,
`slugCandidate` for brands.

- Every real record enters **unpublished**.
- Fields the source cannot supply — cohort dates, capacity, venue, instructors,
  authorship — are completed with **clearly fictional** development values, so a
  flow can be walked end to end.
- Every completed field is marked in the row itself, not only in a comment, so a
  later reader cannot mistake an invention for a transcription.
- The importer refuses to publish anything whose source README leaves unknown,
  and the seeder's existing production refusal covers the whole path.

### CONTENT-03 — Real testimonials are drafts; previews use fiction

The 42 transcribed testimonials are imported with their real text and stay
unpublished. A separate fictional set is generated for development so the rail
renders full. No code path can promote a real record to published; the importer
has no such branch and a test asserts it.

### CONTENT-04 — Brand logos carry a recorded right

Logo assets live under `content/brands/logos/` with a per-brand note recording
where the right to publish comes from. `imageRightsStatus` stays `unknown` until
that note exists, and an unknown status means the mark does not render.

---

## 5. Phased task list

### LANDING0 — Content tables, importers and the fictional completion

Add the `testimonial`, academy-offering and brand-candidate tables with their
migrations. Write importers per `CONTENT-02`–`CONTENT-04`. Generate the fictional
testimonial set. Integration tests prove idempotency, prove production refusal,
and prove no path publishes a real testimonial.

### LANDING1 — The ornament set

Author the six SVG pieces per `LAND-06` as token-bound components. Contrast and
placement rules enforced by test where mechanically checkable.

### LANDING2 — The motion primitive and the spine

One reveal-once primitive per `LAND-07`, plus the spine's state machine per
`LAND-05`. Reduced-motion and no-JS paths verified. Sticky band pinning built as
the parallax substitute.

### LANDING3 — Beats 1–3

Portrait, the claim from verifiable credentials only, three photographic doors
carrying room accents. No card grid, no shadows.

### LANDING4 — Beats 4–5

The testimonial rail per `LAND-08`, the before/after structure per `LAND-09`, and
the single closing invitation. Absence verified per `LAND-10` before presence is.

### LANDING5 — SEO

Metadata, canonical, `hreflang` and JSON-LD per `LAND-11`, with the omission
tests.

### LANDING6 — Verification and review log

Typecheck, eslint, unit and integration suites with no skipped files, then a
dev-server pass at 390/768/1440 in Persian RTL, with JavaScript disabled, and
with `prefers-reduced-motion` forced. Write the packet 6 review-log section.

---

## 6. Test scenarios

1. Every content-blocked beat is absent, and the page reads correctly without it.
2. The testimonial rail renders zero items and the beat disappears entirely.
3. No real testimonial can reach a published state through any importer path.
4. Re-running every importer changes nothing.
5. Seeding refuses under `NODE_ENV=production`.
6. With JavaScript disabled, every beat's content is present and readable.
7. Under `prefers-reduced-motion`, every element renders at its resting state and
   the spine renders fully drawn.
8. Removing the spine leaves a page that still reads correctly.
9. JSON-LD emits no `AggregateRating`, `Review` or `Offer`, and no
   `LocalBusiness` address, telephone or opening hours.
10. Persian RTL at 390/768/1440 with no horizontal overflow and no physical
    inset properties.

---

## 7. Exit gate

`/fa` renders the five beats in order, inside the shared shell, at 390/768/1440
with Persian RTL passing and with JavaScript disabled. Every beat whose content
is unapproved is absent rather than empty-framed. Motion is reveal-once on the
existing duration and easing, with reduced-motion verified. The three content
batches are seeded as drafts with their fictional completion marked, and no real
testimonial is publishable. Landing JSON-LD emits and is bounded to truth. The
packet 6 review-log section is written.

---

## 8. Open and deferred

| Item                                  | State                                         | Comes back when                                           |
| ------------------------------------- | --------------------------------------------- | --------------------------------------------------------- |
| Six-petal reveal motion (`L-5`)       | proposed                                      | the maintainer answers                                    |
| 3D / WebGL brand story (`L-12`)       | deferred off the storefront path              | a dedicated brand-story route exists and can lazy-load it |
| Real testimonials publishing (`L-4`)  | blocked on consent                            | consent is collected per person                           |
| Academy prices and dates (`L-4`)      | blocked on owner confirmation                 | prices and certificate issuers are confirmed              |
| Brand logos (`CONTENT-04`)            | blocked on rights                             | a per-brand rights note exists                            |
| Real before/after (`LAND-09`, `L-15`) | blocked on consent and advertising rules      | both close                                                |
| The two claim figures (`L-2`)         | blocked on the owner                          | supplied                                                  |
| `LocalBusiness` contact facts (`L-7`) | blocked on the owner, same as review item 4.2 | supplied                                                  |
