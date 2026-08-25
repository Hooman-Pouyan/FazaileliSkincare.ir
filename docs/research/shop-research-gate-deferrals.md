# Storefront research gates — recorded deferrals

**Date:** 2026-08-25
**Drafting owner:** implementation agent
**Maintainer approver:** Hooman Pouyan, in session, 2026-08-25
**Applies to:** `system-design/storefront.md` §6 gates for decision-map tickets #4, #5 and #6

---

## What this record does

Stage 0's exit condition is that no task in Stages 1–5 depends on an
**unresolved** decision. It offers two ways to satisfy that: resolve the
decision, or defer it explicitly. This file takes the second route for three
gates, so the storefront core can be built and looked at.

It does **not** widen scope, weaken an invariant, or authorize anything the page
plans forbid. Every deferral below names what is being decided later, what the
implementation must do in the meantime, and what forces a re-review.

## Why defer rather than research

Tickets #4, #5 and #6 ask what customers do, how they should discover products,
and what a product page must say to be trustworthy. Those are answerable from a
working storefront in an afternoon and expensive to answer from documents. There
is no live site, no analytics, no customer, and no verified catalogue to reason
about — so a document written now would record assumptions in the register
reserved for evidence, which is worse than an honest deferral.

The competitive benchmark (#3) and the Iranian-requirements research (#2) are
different: they are external facts, they exist, and they stay binding.

## The deferrals

### #4 — Customer journeys · `shop-customer-journeys.md`

| Field | Value |
|---|---|
| Blocks | PHP, PLP, PDP, cart |
| Deferred decision | Entry, intent, decision risk, confidence threshold, escalation, success outcome and metric per canonical journey |
| Interim rule | Build the one journey the IA already asserts — concern-first discovery → list → product → cart — and nothing branching off it. No journey-specific merchandising, no personalization, no recommendation surface. |
| Re-review trigger | Before any journey-specific surface is designed, and in all cases before Stage 5 |
| Unresolved gap carried | Whether concern-first or brand-first is the dominant Persian entry path. Both routes exist; neither is privileged in navigation until this closes. |

### #5 — Discovery surfaces · `shop-discovery-surfaces.md`

| Field | Value |
|---|---|
| Blocks | PHP, PLP, search, quick view, merchandising |
| Deferred decision | Browse axes, URL grammar, filters, sorting, counts, search behavior, SEO, analytics, empty/error behavior, mobile RTL requirements |
| Interim rule | The URL grammar in `storefront/plp.md` is treated as provisional-but-binding: it ships, it is honoured everywhere, and it is not forked. Facets are limited to those the schema can already answer — brand, concern, category, availability, price. No quick view. No merchandising slots beyond what the hub plan already names. |
| Re-review trigger | Before the storefront is publicly indexable, because changing URL grammar after indexing costs redirects |
| Unresolved gap carried | Whether zero-result searches suggest alternatives or simply state absence |
| Decided 2026-08-25 | The sort default is `featured` — curated `merchandising_rank` order, which `product_public_catalog_idx` already covers. Relevance was not chosen because it is meaningless outside a search scope, and newest was not chosen because a small catalogue would reorder itself on every import. The full grammar is `modules/commerce/models/catalogue-query.ts`. |

### #6 — PDP content and guidance · `shop-pdp-and-guidance.md`

| Field | Value |
|---|---|
| Blocks | PDP content, trust and safety |
| Deferred decision | Suitability, claims, usage, evidence, origin, variants, availability, restrictions, escalation, structured data, safety boundaries |
| Interim rule | **The strictest interim rule of the three, and it is not negotiable.** The PDP renders only fields present in the database and approved through the publication gate. It invents no claim, no benefit, no usage instruction and no suitability statement. Where copy is absent the section does not render — there is no placeholder prose. Restricted and professional-only products stay non-purchasable. No structured data claiming efficacy is emitted. |
| Re-review trigger | Before any real product is published, and before structured data is emitted |
| Unresolved gap carried | The whole claims-approval workflow. Until it exists, every product is a draft. |

## What is explicitly not deferred

- Ticket #2, Iranian requirements — accepted, binding.
- Ticket #3, competitive benchmark — its recorded mobile/Iranian evidence gap stays open and stays acknowledged.
- Ticket #7, checkout through returns — still gated. Nothing in this record authorizes checkout, payment, fulfilment or returns work.
- Every cross-cutting invariant in `storefront.md` §9 — money, publication, locale, inventory, UI and runtime — remains in force.

## Standing condition

These deferrals expire the moment the storefront is shown to a customer. They
buy a build to look at, not a launch. Publishing a real catalogue or opening the
site to search engines closes them and requires the decisions to be made.
