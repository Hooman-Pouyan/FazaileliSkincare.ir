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
- **One mechanism per concern, and no working around a drift.** Styling is Tailwind on the token layer with shadcn primitives; state ownership is in `architecture/data-and-state-ownership.md`; navigation is one manifest. When something fights the stack, the answer is to remove what does not belong — not to add a second mechanism, pin a tool to an older mode, or reach for a hand-rolled equivalent of something the framework already provides.

  The worked example is on the record: the auth screens carried the only CSS Module in `src/`, Turbopack rejected it, and `dev` was pinned to `--webpack` to keep going. One drift bought a second, and every developer paid for it in rebuild speed until the module was removed. If a genuine framework constraint forces an exception, it goes in the config that owns the policy with the reason written next to it, never in an inline disable.

- **Reach for the design system before writing UI.** Need a block or a control? Look first in `src/components/ui` and the existing feature components; then at shadcn and the libraries its ecosystem supports — Radix, Base UI, and the rest — and add one properly. Hand-rolling a dialog, a combobox or a menu that a maintained primitive already provides is how accessibility and focus behaviour quietly diverge between screens.

  **`shadcn add` overwrites a component that is already there.** It regenerates the stock file, so every customisation on it is lost: on 2026-08-25 it replaced the token-bound `dialog.tsx` with literal `bg-black/50`, a `shadow-lg`, Tailwind's default radii and physical `left`/`right` properties, and renamed a prop out from under `search-command.tsx`. After adding or updating any component, diff it and re-bind it to the token layer before committing.

- **A class name that does nothing is a defect no gate can see.** TypeScript and ESLint both read a class list as a string, so a utility Tailwind does not recognise compiles to nothing, silently, and the page renders slightly wrong. Tailwind has **no** `inset-inline-*`, `inset-block-*` or `border-inline-*` utilities: the spellings are `start-`/`end-`, `inset-x-`/`inset-y-`, `border-s`/`border-e`, and for the block axis `top-`/`bottom-`. Nineteen dead classes shipped in packet 4 this way and left the rail and the mobile bar `fixed` with no offsets. `src/lib/design/tailwind-candidates.test.ts` now compiles every class name in `src/` against the project's real theme and fails on any that produces nothing; `eslint.config.mjs` catches the CSS-property family directly. Neither is optional scaffolding — delete either and the defect class comes straight back.

- **The design system has a component library, not only tokens — open it.** `design-system/Fazaieli Design System-handoff.zip` holds 228 files: every component with a `.prompt.md` beside it stating its purpose and its rules, plus `SKILL.md`, brand assets and icons. Read the component's prompt file before building anything that resembles it. Working from `designs/tokens.css` and the playbook alone is how a price filter got hand-rolled out of number inputs while the system's own `Slider` — _"the only slider in the system"_ — sat token-bound and imported by nothing, and how lapis became the Shop's selected colour when teal is the Shop's accent. Nothing in typecheck, eslint or the tests can catch this: it is correct code implementing the wrong thing. The inventory and the room-accent table are in `docs/25-design-system-adherence.md`.

- **An architectural improvement is proposed before it is adopted.** Say what it changes and why, get it agreed, and record it in `docs/` — then build on it. The value of these decisions is that they are shared and durable; a better idea introduced silently is still drift, and the next person cannot tell it from a mistake.

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
