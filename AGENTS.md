# Working conventions

Read this before changing anything in this repository. It exists because the primary collaborator on this codebase is a language model, and written conventions are what make each session start correct instead of guessing.

---

## The project in one paragraph

`fazaieli.ir` is a Persian-first storefront, booking system and academy for a skincare institute in Mashhad. One maintainer. Hosted in Iran, paid in rials. Every decision in `docs/` was made with those constraints in front of it — when something here seems over-cautious, check the ADR before overriding it.

---

## Hard rules

These are not preferences. Breaking one costs money, data, or a customer.

1. **Money is an integer count of rials.** `bigint` columns. Toman is a display transform (÷10) at the view layer and appears nowhere in the database. No floats, no mixed units, ever.
2. **Times are `timestamptz` in UTC.** Jalali is a rendering concern, handled in one utility module. Nothing else in the codebase touches calendar conversion.
3. **Every server action opens with a Zod parse and an authorisation check.** No exceptions. Server Actions make it trivially easy to trust client input by accident.
4. **Sessions are httpOnly, SameSite, server-owned.** Never a JWT in `localStorage` — this site handles payments, and XSS would become account takeover with money attached.
5. **Order totals are computed server-side** from the cart at payment time. The client's number is a hint, never an input.
6. **Stock decrements inside the same transaction that records a confirmed payment** — never on add-to-cart. Cart items hold a reservation with a TTL.
7. **Payment confirmation is idempotent.** A refreshed callback must not verify twice, decrement twice, or create a second order.
8. **A customer-uploaded bank receipt is a claim, not proof.** Only a staff member who has matched the real bank statement moves an order to `paid`.
9. **Before/after images are default-deny.** No active consent row → the case does not render. Revocation is one admin action.
10. **No webfont, script, or stylesheet is fetched from a foreign host at runtime.** From Iranian infrastructure those requests hang and take the page with them. Everything ships from `/public`.

---

## Structure

```
src/
  app/[locale]/…          route files stay thin
  modules/<module>/       screens/ components/ models/ utils/ <module>.store.ts
  lib/                    db/ auth/ payments/ notifications/ i18n/
```

- **One feature unit is `src/modules/<module>/`**, and every module has the same shape. No exceptions — uniformity is what stops a solo codebase drifting into mud by month six.
- Modules do **not** import each other's types. Commerce, Booking and Academy meet in exactly two places: the shared payment abstraction, and the `/studio` read model, which owns no writes.
- i18n message files are **co-located**: `src/modules/<module>/i18n/<locale>.json`.
- **State has one owner.** Server Components/Drizzle own server truth; the URL owns applied shareable search/filter/sort/page state; module-scoped Zustand stores own shared client interaction state; React Hook Form owns form buffers. Never copy prices, stock, eligibility, reservations, totals, results, or errors into Zustand.
- TanStack Query is only for an explicitly approved browser-refetched server read. It does not replace the server-rendered PHP/PLP/PDP path or become a second source copied into Zustand. See `docs/architecture/data-and-state-ownership.md`.

## RTL

- Persian is the **primary** locale, not the afterthought. English and Arabic are translations.
- Every spacing and alignment property is logical: `margin-inline-start`, `padding-inline`, `text-align: start`, `inset-inline-end`. **Grep for `left`/`right` in CSS as a pre-commit check.**
- Every screen gets a Persian pass before it is called done. A checkout that breaks in RTL costs a customer.

## Style of work

- **No speculative fallback chains, no compatibility guards, no alternate field-name checks.** Use the canonical source. If a contract has a gap, document the gap — don't synthesise data from unrelated state.
- **No silent caps.** If something bounds coverage — a top-N, a retry limit, a sample — say so in the output rather than letting it read as complete.
- **Targeted changes stay targeted.** Asked for a small change, change only that. Suggest the rest; don't apply it unprompted.
- Forms: one `<Field>` set over react-hook-form + Zod, and **one schema per form shared by client and server**.

## Design

The palette was sampled from photographs of the institute and contrast-measured — it is not decorative preference. See `docs/04-information-architecture.md` and `designs/design-language/index.html`.

- Gold, firouzeh and champagne **fail contrast on white and pass on lapis**. They are dark-field colours. Gold is a hairline, never a fill behind text.
- Hairlines, not shadows. No card grid. Asymmetric splits. 96px minimum between sections.
- This is a feminine editorial skincare brand. **If a screen starts looking like an admin dashboard, it has gone wrong.**

## Deferred — do not build without asking

Component gallery route · Cache Components and Instant Navigations (Phase 2 polish) · background job queue · search engine beyond Postgres full-text · IRC / authenticity display · a separate mobile app.
