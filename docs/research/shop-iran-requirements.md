# Iran-specific Shop launch requirements

**Research date:** 2026-08-25  
**Decision-map ticket:** [`#2`](../15-shop-product-discovery-map.md#2-what-is-non-negotiable-for-iranian-skincare-ecommerce)  
**Status:** Evidence-backed launch baseline; legal, regulatory, provider, and business confirmation still required

## Read this boundary first

This is product research, not a legal opinion and not a claim that every Iranian rule in force in 2026 has been located. The primary legal source reviewed was WIPO Lex's English translation of Iran's **Electronic Commerce Act 2003**. That Act repeatedly delegates details to later regulations, including withdrawal exceptions, marketing practice, children's advertising, health-data processing, and electronic payments. Those later instruments were not comprehensively available from this research environment.

The document therefore separates four kinds of statement:

- **Direct evidence:** what an inspected law, provider document, or rendered public surface actually says or exposes.
- **Launch requirement:** the conservative product behavior that follows from that evidence and the repository's settled invariants.
- **Product inference:** a useful design or operating choice that is not itself proven to be law.
- **Confirmation gate:** a legal, accountant, provider, carrier, or business decision that must be resolved before the affected feature goes live.

## Executive decision

The Shop can continue through catalogue and public-read implementation, but checkout must not be declared launch-ready until the owner closes the confirmation gates in this document. The launch baseline is:

1. disclose the merchant, contact channels, product characteristics, full charge, offer validity, payment, delivery, cancellation, return, and after-sales terms before commitment;
2. preserve the accepted terms and order acknowledgement in a durable, customer-retrievable record;
3. provide a withdrawal and refund path that is no less protective than the reviewed Act, while counsel confirms product-specific exceptions;
4. treat skincare profile and health information as explicit-consent, purpose-limited, correctable, and deletable data;
5. make marketing opt-in separate and optional;
6. confirm authenticity evidence per sellable product before publication rather than using a generic authenticity badge;
7. keep all money in integer rials, re-read server totals at payment time, and confirm the exact provider contract in staging;
8. publish delivery coverage and commitments only after the institute and carrier can operationally meet them;
9. ship an accessible Persian-first flow that works without foreign runtime assets and degrades safely during provider or international-connectivity failure;
10. expose a real complaint/support route with response ownership, not only social messaging.

## Evidence-to-requirement matrix

### 1. Merchant identity, contact, and complaint route

**Direct evidence**

- Electronic Commerce Act Article 33 requires the supplier's identity, trade name, address, and a contact method before the contract.
- Article 34 requires the business/work address for complaints plus after-sales and guarantee information.
- Articles 53-54 require the advertising business to be identifiable and prohibit concealing identity or place of business.
- On 2026-08-25, Khanoumi's rendered public homepage exposed phone support, FAQ, purchase/payment help, shipping, returns, privacy, and support links; Roja Shop exposed phone numbers, support hours, order guidance, privacy, terms, FAQ, and a live-chat shell. These are competitor observations, not proof of law.

**Launch requirement**

- Persistent footer and order surfaces must show the legal/trading name, physical complaint address, support phone, and at least one non-ephemeral written support channel.
- Order confirmation and status must carry the same merchant identity and a case/reference number.
- Support ownership must include payment failure, bank-transfer claim, delivery exception, cancellation, return, refund, privacy request, and suspected counterfeit/product-integrity cases.

**Confirmation gate**

- Owner/counsel must approve the exact legal entity/name, complaint address, business registration disclosures, support hours, and response targets.
- The eNAMAD endpoint was not retrievable from this environment because its TLS endpoint rejected the client. eNAMAD registration/display rules remain unverified and must be confirmed directly with the competent Iranian authority before launch.

### 2. Product information and skincare safety

**Direct evidence**

- Article 33(a) requires technical specifications and functional characteristics before contract.
- Articles 50-52 prohibit misleading quantity/quality marketing, prohibit advertising that endangers health, and require precise, accurate, clear product descriptions.
- Article 66 prohibits online trademark use that misleads about the originality of goods or services.

**Launch requirement**

- Each PDP must publish the canonical product identity, brand, variant/size, country of origin where verified, full ingredients, intended use, usage directions, warnings/contraindications supplied by an approved source, seller identity, sellable availability, and approved evidence/claims.
- Practitioner commentary, customer testimony, manufacturer claims, and regulatory/authenticity facts must remain separately attributed.
- A product with missing provenance, unresolved identity, unapproved health claim, or restricted eligibility remains unpublished or unavailable; the UI must not synthesize missing facts.

**Confirmation gate**

- Mahdieh or a named clinical/content owner must approve claims, suitability, warnings, and escalation rules.
- Counsel/regulatory adviser must confirm whether any stocked item is legally a cosmetic, hygienic product, supplement, medical product, or another regulated class and what class-specific sale restrictions apply.

### 3. Final price, currency, fees, and offer validity

**Direct evidence**

- Article 33(d-e) requires all customer charges, including price, tax, freight, and calling charges, plus the period for which the offer remains valid.
- Article 33(f) requires payment, delivery, cancellation, return, and after-sales terms before contract.
- ZarinPal's inspected Invoice API describes `amount` as a required integer payable in **rials** and supports an explicit fee type of merchant or payer.

**Launch requirement**

- Database and provider amounts remain integer rials. Toman is a labelled display transform only.
- The checkout review must show item subtotal, discount, shipping, tax if applicable, provider/customer fee if applicable, and final payable total before the irreversible action.
- The server re-prices the cart and shipping at placement/payment; browser totals are never authoritative.
- Promotions need an actual validity window and eligibility rule. Expiry or price change must return the customer to an explainable review state.

**Confirmation gate**

- Accountant/counsel must decide tax/invoice obligations and whether prices are tax-inclusive.
- The business and provider contract must decide who bears gateway fees. The UI must not infer this from a sandbox example.

### 4. Contract acknowledgement and durable records

**Direct evidence**

- Article 35 requires the stated information and its acknowledgement in a clear, comprehensible durable medium.
- Articles 8, 11-16, and 22-25 address retention, integrity, later access, and acknowledgement of data messages.
- Article 81 requires appropriate copies so another copy remains safe if one is lost.

**Launch requirement**

- Persist a versioned order snapshot containing product/variant description, quantity, per-line and total money, contact, address, shipping method, accepted policy versions, timestamps, and payment references.
- Provide an on-site order-status/receipt view plus a downloadable or message-delivered acknowledgement that does not depend on a transient toast.
- Keep audit and idempotency records sufficient to prove what was accepted without retaining unnecessary payment or health data.

**Confirmation gate**

- Counsel/accountant must set invoice, order, payment, refund, consent, and complaint record-retention periods.

### 5. Withdrawal, cancellation, returns, and refunds

**Direct evidence**

- Article 37 gives at least seven working days to withdraw from a distance transaction without penalty or reason; the consumer bears only return cost.
- Article 38 starts the goods period at delivery, delays the start until Articles 33-34 information is given, requires immediate free reimbursement after withdrawal, and delegates product/service exceptions to later regulation.
- Article 39 requires immediate refund when the supplier cannot perform, subject to the stated willingness-to-wait exception.
- Articles 40-41 govern announced equivalent substitution and wrong goods, placing wrong-item return cost on the supplier.
- Articles 42 and 47 define some scope exclusions; Articles 45-46 prevent less-protective or unfair terms from displacing the section.

**Launch requirement**

- Publish the withdrawal window, how to request it, the start event, return-cost owner, accepted condition, inspection process, refund path/timing, wrong/damaged/missing-item route, and non-availability route before purchase.
- Never silently substitute a product or variant. An equivalent substitution requires prior disclosure and customer choice.
- Model cancellation, return, and refund as auditable states with customer-visible outcomes; a support note alone is not the system of record.

**Confirmation gate**

- Iranian counsel must supply the current Article 79 regulation and approve hygiene/seal/opened-cosmetic, personalized product, service, gift card, digital course, and professional-product exceptions. No exception is implemented from marketplace convention alone.
- The owner must approve whether return shipping is prepaid, reimbursed, or customer-arranged for each valid reason and the operational inspection/refund targets.

### 6. Payment gateway and bank-transfer claims

**Direct evidence**

- Article 49 leaves consumer rights in electronic payment systems to relevant rules and regulations; the 2003 Act alone is not a complete payment rulebook.
- ZarinPal's inspected terminal document requires MCC ID, settlement bank-account ID, domain, support phone, and terminal name for a terminal request.
- Its Invoice API requires terminal ID, integer rial amount, description, payer data, and notification type; it accepts a callback URL and returns invoice/session identifiers and status.
- Its transaction queries expose distinct statuses such as `PAID`, `VERIFIED`, `REFUNDED`, `ACTIVE`, and `TRASH`, and return masked PAN/RRN fields.
- Its Refund API requires session, rial amount, method, and reason. The rendered documentation was internally inconsistent: prose stated a 20,000-rial minimum while an example used 11,000. That threshold is not adopted here.

**Launch requirement**

- ZarinPal remains disabled until merchant/terminal approval, credentials, allowed domain/callback, staging request-return-verification, settlement reconciliation, error mapping, and refund behavior are proven.
- A browser callback is not proof of payment. Server verification/reconciliation owns the transition, and repeated callbacks/retries must be idempotent.
- Store provider identifiers, status timeline, verified amount, masked card data only when operationally required, and an audit trail; never store full card data.
- Bank-transfer receipt upload remains a claim. Only an authorized staff member who matches the real bank statement may mark it paid.

**Confirmation gate**

- Obtain the signed provider contract/current API version and confirm verification endpoint, authentication, callback allow-list, retries, duplicate verification semantics, settlement schedule, fee owner, refund minimum/timing, supported failure codes, and incident support.
- Confirm eNAMAD/PSP/acquiring-bank prerequisites with the actual provider. This research does not treat an API page as merchant approval.

### 7. Authenticity, IRC, and TTAC

**Direct evidence**

- Article 66 directly protects against misleading online trademark use concerning originality.
- The official TTAC endpoints (`ttac.ir` and `www.ttac.ir`) reset or failed TLS from this research environment on 2026-08-25. No current TTAC/IRC rule was therefore directly verified.
- Khanoumi and Roja Shop displayed Iranian trust/industry marks on their public footers; that demonstrates a market trust pattern, not that the marks prove each product authentic.

**Launch requirement**

- Authenticity is product/batch provenance, not a decorative site-wide badge. For each sellable SKU retain supplier, invoice/source, verified brand/product identity, relevant registration/IRC/TTAC identifiers when applicable, batch/expiry fields when applicable, and who verified them.
- Show only customer-verifiable authenticity facts. If a code or official lookup cannot be checked, label the limitation; never imply regulator verification.
- Provide a suspected-counterfeit/support route and quarantine affected inventory while reviewed.

**Confirmation gate**

- Regulatory adviser and owner must define which catalogue classes require IRC, UID/TTAC, label, batch, expiry, or other evidence; provide official source material; and approve public wording.
- IRC/authenticity display remains a deferred product feature until that contract is settled; repository provenance and admin verification can be prepared without inventing public claims.

### 8. Delivery commitments and Iranian address data

**Direct evidence**

- Article 33(f) requires delivery terms before contract; Article 39 governs inability to perform.
- The official Post/GNAF endpoints failed TLS negotiation from this environment on 2026-08-25, so current carrier formats, service coverage, and SLA terms were not directly verified.
- The repository's current product model specifies an Iranian address shape with canonical province/city, 10-digit postal code, address line, recipient, and phone; that is an internal product decision, not external regulatory evidence.

**Launch requirement**

- Offer only institute pickup, Mashhad courier, or nationwide post combinations that operations can actually fulfil.
- Address UI is Persian-first and captures recipient name, E.164 phone, canonical province/city, postal code, address line/details, and optional delivery instructions; phone/postal values render with explicit LTR isolation.
- Quote shipping server-side. Before commitment show method, coverage, charge, dispatch estimate, delivery estimate or clearly labelled range, tracking availability, and exception/support route.
- Store an immutable order address/method/charge snapshot. Never rewrite old orders when reference data or rates change.

**Confirmation gate**

- Carrier/postal contract must confirm the canonical province/city dataset, exact postal-code validation, prohibited goods, packaging, pickup/cutoff schedule, coverage, loss/damage process, tracking, returned parcel handling, and delivery SLA.
- Owner must approve realistic dispatch/delivery commitments and holiday/closure behavior before copy is published.

### 9. Privacy, health data, and account closure

**Direct evidence**

- Article 58 prohibits storage, processing, or distribution of sensitive private data including physical and psychological condition without explicit consent.
- Article 59 requires specified purposes, collection limited to that purpose, accuracy, access, correction, and the ability to request complete removal.
- Article 60 delegates medical/health-record processing to later regulation.

**Launch requirement**

- Ordinary guest checkout must not require a skin profile or health answers.
- Any skin concern, allergy, contraindication, treatment, before/after image, or practitioner note needs explicit purpose-specific consent and separate authorization from marketing.
- Collect only fields required for the named workflow; expose access/correction/deletion requests; revoke publication separately from retaining a lawful private clinical/transaction record.
- Account closure must remove or de-identify sign-in/contact state while preserving only legally required transaction records under a documented retention rule.

**Confirmation gate**

- Counsel must identify current Article 60 regulations and approve lawful basis, retention, deletion exceptions, processor/provider contracts, breach response, and cross-border/foreign-service constraints.

### 10. Marketing consent and commercial pressure

**Direct evidence**

- Article 43 says consumer silence is not consent.
- Article 55 requires arrangements that let consumers choose whether to receive advertising by mail or email.
- Articles 50-54 prohibit misleading marketing and concealed identity.
- Khanoumi's current homepage exposed accept and reject controls for cookie rules but also used a dense promotion/discount-led experience; Roja Shop surfaced dated discount and credit campaigns. These are observable conversion patterns, not preferred Fazaieli behavior.

**Launch requirement**

- Marketing opt-in is unchecked, channel-specific, purpose-labelled, and independent of account, checkout, policy acceptance, or care consent.
- Record consent text/version, channel, timestamp, source, and withdrawal. Every automated marketing channel needs an unsubscribe/stop path.
- No fake countdown, false stock pressure, preselected consent, disguised advertisement, or discount claim without an auditable basis.

**Confirmation gate**

- Confirm current SMS/operator, email, messaging-platform, cookie/analytics, and children's-marketing rules before enabling each channel.

### 11. Accessibility and Persian-first operation

**Direct evidence**

- Article 35 requires clear and comprehensible information and expressly references appropriate measures for disabled people and children.
- On 2026-08-25, Khanoumi rendered a distinct 390 × 844 mobile navigation with labelled home/category/cart/account controls and collapsible support sections. Roja Shop rendered a mobile menu/search and campaign shortcuts. This confirms mobile Persian commerce is a first-class market surface, not that either site is accessibility-conformant.

**Launch requirement**

- Persian RTL is the primary QA path. Complete purchase and support flows must work at narrow mobile widths, with keyboard, visible focus, native semantics, labelled errors, adequate contrast, reduced motion, zoom/reflow, and screen-reader announcements.
- Money, phone, postal code, tracking number, and provider references receive deliberate bidi isolation.
- Legal/return/privacy information must remain readable without script-dependent overlays and available before purchase.

**Confirmation gate**

- Select and document the target accessibility standard with counsel/product ownership. WCAG 2.2 AA is the recommended engineering baseline, but this research did not prove it is the exact Iranian statutory threshold.

### 12. Connectivity and runtime-hosting resilience

**Direct evidence**

- Cloudflare reported on 2026-01-13 that traffic from Iran had effectively dropped to zero after 2026-01-08 during a complete international shutdown. This is operational evidence of extreme reachability risk, not a guarantee about any future event.
- The project already has a hard runtime constraint: no foreign-hosted webfont, script, or stylesheet. The current research also directly encountered TLS failures for multiple Iranian public-service and commerce endpoints from a foreign network.

**Launch requirement**

- Ship fonts, CSS, JavaScript, core images, and critical UI from Iranian-reachable first-party infrastructure; no foreign runtime dependency may block rendering or purchase recovery.
- Server timeouts and provider failures need bounded, user-visible outcomes. Never leave an order ambiguous because a callback, analytics, messaging, or authenticity service is unavailable.
- Payment initiation/verification, bank-transfer review, order status, inventory, and audit data remain server-owned. Analytics and marketing failures do not block checkout.
- Maintain operational runbooks for gateway unavailable, callback delayed, SMS/email unavailable, carrier unavailable, partial connectivity, and full shutdown/recovery.

**Confirmation gate**

- Verify the production host, DNS, CDN, object storage, email/SMS, monitoring, maps/address data, payment, and support tools from Iranian fixed and mobile networks before launch. A US-based check is not evidence of Iranian reachability.

## Required pre-launch decisions

| Owner                        | Decision/evidence required                                                                                                                             | Blocks                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| Iranian counsel              | Current implementing regulations; withdrawal exceptions; privacy/health data; required merchant/eNAMAD disclosures; marketing; accessibility threshold | checkout and public legal copy                |
| Accountant                   | tax/invoice treatment, records, fee presentation, refund accounting                                                                                    | final-price and receipt implementation        |
| Regulatory adviser + Mahdieh | product classes, legal sale restrictions, claim approvals, IRC/TTAC/batch/expiry evidence                                                              | catalogue publication and authenticity claims |
| ZarinPal/acquirer            | approved terminal/contract, API version, callback/verification, idempotency, fees, settlement, refunds, failures                                       | gateway activation                            |
| Carrier/Post/courier         | address/reference data, coverage, rates, SLA, tracking, loss/damage/returns                                                                            | delivery promises                             |
| Owner/operations             | support channels/hours/SLA, dispatch windows, return inspection, bank-transfer matching, incident ownership                                            | production launch                             |
| Engineering/QA               | Iranian-network, mobile RTL, accessibility, provider-failure, replay/idempotency, and recovery evidence                                                | production launch                             |

## What can proceed before those decisions

- public Shop hub, PLP, and PDP reads using approved catalogue content;
- internal provenance/authenticity fields without public regulator claims;
- policy/version and immutable order-snapshot primitives;
- server-owned rial money, cart pricing, inventory, reservation, and idempotency foundations;
- accessible Persian address UI behind non-production fixtures;
- bank-transfer and gateway state machines in test/staging, without live credentials or production claims;
- support/return/refund information architecture using placeholder labels that cannot be mistaken for approved policy copy.

## Explicit gaps and inaccessible evidence

- No exhaustive 2026 Iranian legal corpus or Article 79 implementing regulations were verified.
- eNAMAD, TTAC, Post, and GNAF official endpoints were inaccessible from this environment because of TLS/reset failures; their current rules were not inferred from search snippets or competitor badges.
- No Iranian lawyer, accountant, regulator, payment-provider representative, carrier, or institute operations owner was interviewed.
- No live merchant account, provider sandbox callback, refund, bank settlement, SMS/email deliverability, or Iranian-network deployment was tested.
- No product-by-product IRC/TTAC, supplier invoice, batch, expiry, or authenticity dataset was provided.
- No claim is made that the competitor support, cookie, discount, trust-mark, or mobile patterns are legally sufficient or accessible.

## Source ledger

All URLs were accessed or attempted on 2026-08-25 unless otherwise stated.

### Directly inspected

- [WIPO Lex — Electronic Commerce Act 2003, Iran](https://www.wipo.int/wipolex/en/text/244933) — stable WIPO record and 13-page English PDF; Articles 8, 11-16, 22-25, 33-46, 49-60, 66, 69-81 were reviewed. The English text is a translation; counsel must use the authoritative current Persian law.
- [ZarinPal — terminal request](https://www.zarinpal.com/docs/apiDocs/query/terminal) — merchant terminal inputs; page responded successfully and reported a 2026-08-23 last-modified header.
- [ZarinPal — invoice](https://www.zarinpal.com/docs/apiDocs/query/invoice) — rial amount, fee owner, payer/callback inputs, invoice/session status.
- [ZarinPal — transaction/session queries](https://www.zarinpal.com/docs/apiDocs/query/session) — transaction identifiers and status vocabulary.
- [ZarinPal — refund](https://www.zarinpal.com/docs/apiDocs/query/refund) — refund inputs/method/status and the documented minimum/example inconsistency.
- [Cloudflare — What we know about Iran's Internet shutdown](https://blog.cloudflare.com/iran-protests-internet-shutdown/) — published 2026-01-13; Iran traffic/shutdown evidence.
- [Khanoumi](https://www.khanoumi.com/) — rendered desktop and 390 × 844 mobile public homepage; support, policies, trust marks, search/navigation, promotions, and cookie choices observed. No account or checkout used.
- [Roja Shop](https://rojashop.com/) — rendered desktop and 390 × 844 mobile public homepage; consultation, gift card, support/legal links, chat shell, search/navigation, and discount/credit campaigns observed. No account or checkout used.

### Attempted but not treated as substantive evidence

- [eNAMAD](https://enamad.ir/) — TLS negotiation failed.
- [TTAC](https://ttac.ir/) — TLS/reset failure.
- [Iran Post](https://www.post.ir/) and [GNAF](https://gnaf.post.ir/) — TLS negotiation failed.
- [Internet Society Pulse — Iran shutdowns](https://pulse.internetsociety.org/en/shutdowns/?country_code=IR&page=1) — automated access received a challenge; not used for a factual requirement.
