# Shop product-discovery decision map

**Created:** 2026-08-24  
**Status:** Bootstrapped; research not yet started  
**Scope:** Shop-first depth for `fazaieli.ir`. Booking and Academy are considered only where they strengthen, constrain, or receive a handoff from Commerce.

This is the canonical map for deciding what the Shop should offer before expanding the implementation plan. Each unresolved ticket is sized for one focused session and produces a linked asset rather than expanding this file with raw research.

## Target outcome

Produce an evidence-backed Shop strategy that:

- distinguishes Iranian necessities, global ecommerce expectations, high-value differentiators, bonuses, and deliberate exclusions;
- covers the complete customer journey from entry and discovery through repeat purchase;
- covers staff operations required to deliver that journey reliably;
- evaluates acquisition, activation, conversion, average order value, margin, retention, referral, and reactivation as one commercial system;
- tests commercial, operational, regulatory, privacy, and technical feasibility;
- ends in approved feature specifications and phased implementation plans, not an unranked feature catalogue.

## Prioritisation vocabulary

- **Required:** Legal, financial, safety, accessibility, trust, or operational launch dependency.
- **Expected:** Common capability whose absence materially damages conversion or credibility.
- **Differentiating:** Supports the expert-guided positioning and is difficult for a mass retailer to copy.
- **Bonus:** Valuable after the core journey is reliable, but not a launch dependency.
- **Defer:** Insufficient evidence, excessive risk, or poor fit for the current business stage.

## #1: What Strategy Governs The Shop Discovery?

Blocked by: none  
Type: Grilling

### Question

What positioning, guidance model, scope, and AI ambition should govern feature selection?

### Answer

Use **expert-guided commerce** with **progressive guidance**. Ordinary skincare remains self-service; uncertainty, contraindications, professional products, and complex routines escalate to expert help. Research the Shop in depth, including PHP, PLP, PDP, search, guidance, cart, checkout, payments, fulfilment, post-purchase, retention, and staff operations.

Investigate two separate AI products:

- a customer-facing, text-based Persian **Shopping Guide** that explains approved information and escalates uncertainty;
- a permission-separated **Staff Copilot** that drafts and summarizes, while staff retain approval and action authority.

AI is not a diagnostic authority. Skin-photo assessment is outside the initial scope.

## #2: What Is Non-Negotiable For Iranian Skincare Ecommerce?

Blocked by: #1  
Type: Research

### Question

Which legal, payment, authenticity, pricing, delivery, returns, accessibility, connectivity, privacy, and customer-support capabilities are required or strongly expected in Iran in 2026?

### Answer

Unresolved. Produce `docs/research/shop-iran-requirements.md` with dated sources, observed evidence separated from inference, and explicit coverage gaps.

## #3: What Does The Competitive Market Prove?

Blocked by: #1  
Type: Research

### Question

Across leading Iranian beauty retailers, global premium skincare, clinical skincare, practitioner-led commerce, and adjacent guided-commerce products, which patterns improve discovery, trust, conversion, order completion, and retention, and which patterns should this brand reject?

### Answer

Unresolved. Extend the existing competitor work with mobile journeys and deeper PHP, PLP, PDP, search, cart, checkout, account, authenticity, loyalty, consultation, and post-purchase coverage. Produce `docs/research/shop-competitive-benchmark.md`. Record inaccessible sources and sample limits rather than implying complete coverage.

## #4: Which Customer Jobs And Journeys Must The Shop Resolve?

Blocked by: #2, #3  
Type: Grilling

### Question

What are the canonical journeys for a concern-led first-time buyer, a known-product buyer, a post-treatment client, a professional/student buyer, an uncertain customer needing guidance, a returning customer, and a customer with an order problem?

### Answer

Unresolved. Define entry points, intent, decision risks, confidence thresholds, handoffs, success outcomes, and primary metrics without merging Customer, Student, and Practitioner roles.

## #5: What Must PHP, PLP, Search, And Merchandising Do?

Blocked by: #2, #3, #4  
Type: Research

### Question

Which browse axes, search behavior, filters, sorting, comparison, availability, benefit copy, protocol/routine merchandising, authenticity signals, price presentation, promotions, recommendations, and empty/error states belong on the shop hub and listing surfaces?

### Answer

Unresolved. Produce `docs/research/shop-discovery-surfaces.md` with requirements for desktop and Persian-first mobile RTL behavior, SEO entry pages, analytics events, and a Required/Expected/Differentiating/Bonus/Defer classification.

## #6: What Must A Trustworthy PDP And Guided-Selling Journey Do?

Blocked by: #2, #3, #4  
Type: Research

### Question

How should the PDP communicate suitability, usage, ingredients, evidence, authenticity, origin, variants, stock, delivery, returns, price history, professional restrictions, routines, post-treatment relevance, and consultation escalation without drifting into diagnosis or unsupported clinical claims?

### Answer

Unresolved. Produce `docs/research/shop-pdp-and-guidance.md`, including content governance, evidence standards, structured-data needs, safety boundaries, and edge cases.

## #7: What Must Cart, Checkout, Payment, Fulfilment, And Returns Do?

Blocked by: #2, #3, #4  
Type: Research

### Question

What is the smallest high-confidence purchase flow for guest and returning customers across cart, Iranian address entry, pickup, nationwide shipping, bank transfer, gateway payment, instalments, stock reservation, failure recovery, order confirmation, tracking, cancellation, returns, refunds, and support?

### Answer

Unresolved. Produce `docs/research/shop-transaction-journey.md` with customer-visible states, staff-visible states, abuse/fraud cases, service-level expectations, and feasibility dependencies.

## #8: What Creates Repeat Purchase Without Discount-Marketplace Behavior?

Blocked by: #3, #4, #6, #7  
Type: Research

### Question

Which reorder, replenishment, saved routine, wishlist, back-in-stock, price-change, loyalty, referral, review, education, consultation follow-up, messaging, subscription, and win-back capabilities fit expensive professional skincare and Iranian customer expectations?

### Answer

Unresolved. Produce `docs/research/shop-retention-and-growth.md` with lifecycle triggers, consent rules, channel constraints, commercial hypotheses, and features explicitly rejected for brand or operational reasons.

## #9: What Staff Operations Are Necessary To Keep The Promise?

Blocked by: #2, #5, #6, #7  
Type: Research

### Question

Which catalogue, claim approval, pricing, inventory, reservation, transfer verification, order, fulfilment, returns, consultation, customer-service, consent, audit, analytics, and exception-management workflows must staff operate, and what should remain manual at the current scale?

### Answer

Unresolved. Produce `docs/research/shop-operations.md` with roles, queues, state transitions, exception cases, audit requirements, and workload estimates.

## #10: Is The Customer Shopping Guide Feasible And Safe?

Blocked by: #2, #4, #5, #6  
Type: Research

### Question

Can a Persian text-based Shopping Guide reliably interpret intent, ask bounded questions, retrieve only approved catalogue and practitioner content, explain and compare options with citations, construct routines, respect eligibility rules, and escalate uncertainty under Iran-specific availability, latency, cost, privacy, and hosting constraints?

### Answer

Unresolved. Produce `docs/research/shop-ai-shopping-guide-feasibility.md`. Compare deterministic guidance, retrieval-assisted generation, and fully human guidance. Explicitly test hallucination, unsafe advice, prompt abuse, stale catalogue data, monitoring, consent, and graceful unavailability.

## #11: Is The Staff Copilot Feasible And Worth Operating?

Blocked by: #6, #8, #9  
Type: Research

### Question

Which staff tasks benefit from drafting or summarisation without granting AI publishing, payment, inventory, clinical, or customer-record authority, and does the time saved exceed review and governance costs?

### Answer

Unresolved. Produce `docs/research/shop-ai-staff-copilot-feasibility.md` with use cases, permission boundaries, approval checkpoints, source provenance, evaluation criteria, and a do-not-automate list.

## #12: How Should The End-To-End Mobile Shop Behave?

Blocked by: #5, #6, #7  
Type: Prototype

### Question

Does one coherent Persian-first mobile journey from Instagram entry through PHP, PLP/search, PDP/guidance, cart, checkout, payment, and confirmation make the strategy understandable and usable without becoming a marketplace or dashboard?

### Answer

Unresolved. Prototype only the highest-risk interactions identified by research; link the prototype and QA evidence here rather than embedding them.

## #13: How Should Shopping Guide And Human Escalation Behave?

Blocked by: #6, #10, #12  
Type: Prototype

### Question

Where should guidance appear, what questions may it ask, how are sources and uncertainty shown, when does it recommend products or routines, and when must it stop and hand off to a practitioner or support?

### Answer

Unresolved. Prototype representative safe, uncertain, professional-only, unavailable-product, and adverse-reaction scenarios. Link the artifact and observations here.

## #14: Which Commercial Strategies, Campaigns, And Game Mechanics Fit The Brand?

Blocked by: #2, #3, #4, #6, #7, #8, #9  
Type: Research

### Question

Which acquisition, launch, seasonal, educational, authenticity, consultation, bundle, gift-with-purchase, sampling, referral, loyalty, challenge, progress, community, live-shopping, partnership, professional, student, and reactivation tactics can grow the Shop without training customers to wait for discounts or turning clinical trust into entertainment?

### Answer

Unresolved. Produce `docs/research/shop-commercial-growth-strategy.md`. Evaluate campaign calendars relevant to Iran, brand and practitioner partnerships, cross-workspace handoffs, segmentation, eligibility, channel consent, inventory and fulfilment load, unit economics, margin risk, fraud/abuse, analytics, experiment design, and stop criteria. Gamification must advance a real customer job such as routine adherence, education, progress, contribution, or referral; random prize wheels, fake scarcity, deceptive streak pressure, and permanent-discount theatre are rejected by default unless evidence overturns that position.

## #15: Which Features Deserve Which Phase?

Blocked by: #5, #6, #7, #8, #9, #10, #11, #14  
Type: Grilling

### Question

Given evidence, dependencies, business leverage, operational load, safety, cost, and reversibility, which capabilities are Required, Expected, Differentiating, Bonus, or Defer, and what is the smallest coherent launch?

### Answer

Unresolved. Produce `docs/product/shop-opportunity-prioritisation.md` with evidence links, assumptions, rejection reasons, dependencies, and measurable success criteria. No silent scoring formula or unsupported precision.

## #16: Does The Prioritised Strategy Survive Independent Pressure-Testing?

Blocked by: #15  
Type: Grilling

### Question

What fatal risks, missed upside, outsider confusion, execution bottlenecks, and cross-workspace consequences remain in the proposed Shop roadmap?

### Answer

Unresolved. Run the LLM Council against the evidence-backed prioritisation. Link its full transcript and visual report, then record the accepted corrections here.

## #17: What Product Specification Is Approved?

Blocked by: #12, #13, #16  
Type: Grilling

### Question

What final product architecture, surface behavior, domain language, data ownership, safety boundaries, operational model, analytics model, and phase scope should be approved before implementation planning?

### Answer

Unresolved. Present the design in reviewable sections. After user approval, write the Shop product specification and self-review it for placeholders, contradictions, scope drift, and ambiguity.

## #18: What Is The Executable Phased Implementation Plan?

Blocked by: #17  
Type: Grilling

### Question

How should the approved specification be sequenced into small, verifiable phases that extend the existing implementation plan without mixing optional differentiators into launch-critical commerce?

### Answer

Unresolved. Write the phased implementation plan only after the written specification is reviewed and approved. Include dependencies, migrations, content work, operations, testing, Persian RTL QA, rollout, measurement, rollback, and explicit deferred scope.

## Frontier

Tickets **#2 and #3** are the first unresolved frontier and may be researched independently. Their evidence is required before customer journeys or feature prioritisation are treated as decisions.
