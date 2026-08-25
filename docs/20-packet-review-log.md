# Packet review log

**Purpose:** every packet closes with the judgements that deserve a second look —
calls made on thin evidence, deliberate omissions, product questions raised by
building, and refinements not worth blocking on. Nothing here is a defect; open
defects go in the ledger.

Read this when a packet is revisited for polish, or when deciding whether a
carried gap has become a real problem.

**Status key:** `open` needs a decision · `carried` is deliberate and dormant ·
`resolved` has been settled, with the outcome recorded.

---

## Packet 1 — execution ledger and status corrections

| # | What | Kind | Status |
|---|---|---|---|
| 1.1 | Five numbering schemes still coexist. The ledger indexes them but does not replace them; if the project ever feels heavy to navigate, collapsing DB/AUTH/Stage IDs into one is the change to make. | structure | carried |

## Packet 2 — fictional development catalogue

| # | What | Kind | Status |
|---|---|---|---|
| 2.1 | Ten products across five concerns is enough to exercise every offer state but not enough to judge a grid, a facet rail, or pagination. When the PLP lands, decide whether to grow the fixture or wait for real catalogue data. | product | open |
| 2.2 | Placeholder imagery is flat colour with a number. It proves layout, not art direction; the hub and PDP cannot be judged aesthetically against it. | UI | carried |
| 2.3 | Stock is written directly rather than through an `inventory_movement`. Correct for fixture data, but it means the movement ledger is untested until DB5. | technical | carried |

## Packet 3 — catalogue reads

| # | What | Kind | Status |
|---|---|---|---|
| 3.1 | **Sort default is `featured`** (curated `merchandising_rank`). Chosen because relevance is meaningless outside search and newest reorders a small catalogue on every import — but nobody has seen it against real products. | product | open |
| 3.2 | **Price bounds cross the URL in toman, storage is rials.** One conversion at the query boundary. Worth confirming this reads naturally to a Persian shopper before URLs are indexed. | product | open |
| 3.3 | Facet counts are not implemented. `PLP-03` needs each group counted with its own selections removed — a query per group — which lands with the rail that renders them in packet 6. | technical | carried |
| 3.4 | The trigram index will sit unused until roughly a thousand products. Expected, evidenced in `evidence/c3-trgm-search.md`, and the re-check gate is named there. | technical | carried |
| 3.5 | **Media resolution uses `cardObjectKey`/`detailObjectKey` verbatim.** Fine for local paths; when object storage exists this becomes a CDN base plus key, and the decision of where that base lives is unmade. | technical | open |
| 3.6 | Professional-only products are visible and non-purchasable (D-18-2). Whether Iranian rules or a brand agreement restrict advertising professional *pricing* publicly is still the owner's to confirm. | product / legal | open |

## Packet 4 — the storefront shell

### Worth your attention

| # | What | Kind | Status |
|---|---|---|---|
| 4.1 | **The bottom bar carries four items and excludes Booking and Academy.** Reasoned from the IA — a bottom bar is repeat-navigation furniture — not measured. If either turns out to be a repeat destination, this is wrong and cheap to change. | product | open |
| 4.2 | **The footer omits the address and telephone.** The storefront canvas marks both `[براکت]`, and `SHELL-05` forbids inventing contact detail. They appear the moment you supply them. | content | **needs you** |
| 4.3 | **Terms, privacy and returns are linked but unwritten**, so three footer links 404 today. `SHELL-05` requires them visible and eNamad will not certify the domain without them. This is the longest-lead item in the packet and it is not an engineering task. | content / legal | **needs you** |
| 4.4 | **The eNamad slot is an empty bordered square.** It holds layout space so nothing shifts when the real seal arrives. Decide whether an empty slot is acceptable pre-certification or whether it should render nothing at all. | UI | open |
| 4.5 | **The command palette lists rooms, not concerns.** Decision N-4 says it should list the five canonical concerns; they live in the database and reading them in the shell would put a query on every page including the landing. Arrives with a cached reference read. | technical | carried |
| 4.6 | **`/account` is the identity destination and `/studio` stays planned.** Revisit when Studio is built in Phase 5: does it absorb the account page or sit beside it in the rail? | product | carried |
| 4.7 | **Locale switching keeps the path and shows `locale-unavailable` when content is missing.** Untested against real English or Arabic content, because none exists. | product | carried |
| 4.8 | **Bodoni Moda ships as variable TrueType, not woff2.** The declaration matches the files, so display type renders — but woff2 roughly halves both files, and over Iranian mobile that is worth having. Needs `fonttools` with brotli, which neither of this session's environments could install. | performance | open |
| 4.9 | **`pnpm dlx shadcn@latest add command` overwrote the customised `dialog.tsx`** — replacing token bindings with literal `bg-black/50`, adding `shadow-lg` against the hairlines-not-shadows rule, swapping the two project radii for Tailwind's ramp, and reintroducing physical `left`/`right`. It also renamed a prop out from under `search-command.tsx`, which typecheck caught. All re-bound; the workflow rule is now in AGENTS.md. | process | resolved |
| 4.10 | **No skeleton on `loading.tsx`.** A skeleton that guesses at a layout it does not know promises a shape the real page may not have. Revisit per route once the real layouts exist. | UI | carried |
| 4.11 | **The shell has had no browser pass.** Three defects in this packet passed 209 unit tests and died on the first real request; RTL, focus order, 44px targets and overflow at 390/768/1440 are unverified. | verification | **needs you** |

### Refinements not worth blocking on

- The rail's brand medallion is a bordered circle with a lapis dot, carried from the existing scaffold. The real mark, when there is one, replaces it in one place.
- Room accent colours come from `--accent-*` tokens, so changing the active-state colour is a token edit, not a component edit.
- `BottomNavigation` and `Rail` share the manifest but not markup. If a third surface appears, extract the shared item shape then — not before.

---

## Landing direction pass — 2026-08-25, ahead of packet 6

Raised by reconciling the maintainer's description of the first page against the
IA, the design playbook, and the three content batches. Decisions are in
[`21-landing-composition-decisions.md`](21-landing-composition-decisions.md);
what needs the maintainer is here.

| # | What | Kind | Status |
|---|---|---|---|
| L.1 | **Academy prices are unconfirmed.** `content/academy/` records ۱۸م / ۳۹م / ۶م تومان as `needs_owner_confirmation`, and certificate issuers are unverified. This blocks the Landing's academy beat and the entire `/academy` room, and it is the single highest-leverage answer available. | content | **needs you** |
| L.2 | **No testimonial may be published.** All 42 records carry `publicationConsent = unknown`. Consent has to be collected from named women about their own skin; it is not a flag anyone can set on their behalf. Beat 4's rail will render zero items until it exists. | content / consent | **needs you** |
| L.3 | **Brand relationships and image rights are unresolved.** 13 marks, `imageRightsStatus = unknown` on all of them, official-representative status confirmed for Forlle'd only. No brand logo may be published; the Shop hub's brand row runs on seeded fiction until this lands. | content / legal | **needs you** |
| L.4 | **Beat 2 needs two numbers** — years in practice and students trained. They are claims about the business and cannot be invented. Until supplied, the claim beat renders the two verifiable credentials only. | content | **needs you** |
| L.5 | **The blossom petal reveal is proposed, not adopted.** Form and colour treatment are decided (L-5); the bounded six-petal reveal-once needs a yes before it is built. Refusing it costs the page nothing structurally. | UI / motion | **needs you** |
| L.6 | **Parallax, autoplay carousels and looping testimonial rails were asked for and refused**, against `10-design-playbook.md` Step 5 and the testimonials README. Substitutes are sticky band pinning and a reader-paced RTL scroll-snap rail. Worth a look on screen before assuming the substitute delivers the feeling that was wanted. | UI / motion | open |
| L.7 | **`LocalBusiness` JSON-LD needs the same three facts as the footer** — address, telephone, opening hours. Review item 4.2 now blocks structured data as well as the footer. | SEO / content | **needs you** |
| L.8 | **The content review surface is deliberately not an admin.** AUTH4 is out of the block, so the plan is a generated review sheet per batch that writes answers back into the JSON with importers refusing anything still unknown. If that proves awkward in practice, the alternative is bringing a minimal admin forward — which inverts the block's sequence and should be a considered choice, not a drift. | process | open |
| L.9 | **The 日本製 authenticity mark is a product idea, parked.** Counterfeit anxiety is the category's biggest objection and `اصالت` is already a PDP accordion section. Where an authenticity mark appears and what it asserts belongs with packet 8, not with landing ornament. | product | carried |
| L.10 | **`/about`, `/results` and `/academy` do not exist**, so three of the Landing's five beats have no deeper destination. The beats terminate at the rooms that do exist and the deeper links are absent rather than dead. | structure | carried |
