# Dependency audit

**Date:** 2026-08-24 · Verified against the npm registry and official documentation, not from memory.

> **Why this document exists:** an earlier draft of ADR-001 said "Next.js 15" when 16.3 had already shipped. That was a memory error, and the fix is a process, not an apology: **every dependency is checked against the registry before it is written into a `package.json`, and this file records what was found and when.** Re-run the check before each new phase.

---

## Verification sources

- **npm registry** for published versions and package peer ranges.
- **Context7 official documentation** for framework and tool behavior, including Tailwind v4's CSS-first configuration and Sass incompatibility.
- **Installed peer checks** for the resolved dependency graph; published "latest" versions are not accepted when their declared peer ranges conflict.

---

## Verified versions — 2026-08-24

### Dependency ownership policy

- Every dependency must name one current concern, first consumer, owning phase/module, and why the platform or existing dependency is insufficient.
- Prefer one primary library per concern. Two libraries may coexist only when their responsibilities are explicitly non-overlapping, as with Zustand interaction state and TanStack Query browser-refetched server state.
- Record dependencies as **installed**, **required-not-installed**, **approved-gated**, **deferred**, **rejected**, or **removal-watch**. “Approved” alone does not authorize an unused installation.
- Before installation, verify the exact version, peer ranges, license, runtime/bundle effect, server/client compatibility, Iran-hosting/network behavior, and current official API.
- A dependency that adds a provider, cache, persistence, generated files, background network behavior, or global singleton must document that lifecycle and its tests.
- Remove a dependency when its only accepted consumer is removed; do not preserve it for speculative reuse.

Current state-management classifications:

| Dependency | Status | First owner/trigger |
|---|---|---|
| `zustand` | Required-not-installed | Foundation: request-safe Commerce/shell interaction store and PLP draft-filter coordination |
| `@tanstack/react-query` | Approved-gated | First accepted browser-refetched server read, most likely Cart drawer synchronization or approved autocomplete |

| Package | Latest stable | Note |
|---|---|---|
| `next` | **16.3.2** | Node 20.9+, Turbopack default |
| `react` / `react-dom` | **19.2.8** | |
| `typescript` | **6.0.3** | Compatibility pin: `typescript-eslint` 8.67 declares `<6.1.0` |
| `eslint` | **9.39.5** | Compatibility pin: Next 16.3's installed ESLint plugins reject 10.x |
| `pnpm` | **11.23.0** | Your package manager |
| `tailwindcss` | **4.3.3** | CSS-first config |
| `drizzle-orm` | **0.45.2** | Still 0.x — pin exactly |
| `drizzle-kit` | **0.31.10** | |
| `drizzle-zod` | **0.8.3** | |
| `postgres` | **3.4.9** | postgres.js driver |
| `next-intl` | **4.13.7** | |
| `better-auth` | **1.7.1** | Stable 1.x |
| `zod` | **4.4.3** | ⚠️ Zod **4** — see below |
| `react-hook-form` | **7.86.0** | |
| `@hookform/resolvers` | **5.9.1** | |
| `zustand` | **5.0.15** | Required architecture dependency; not yet installed in the current scaffold |
| `@tanstack/react-query` | **5.102.3** | Approved secondary dependency; install only with the first accepted browser-refetched server-state consumer |
| `radix-ui` | **1.6.7** | Unified Radix primitives package used by the scaffold |
| `tw-animate-css` | **1.4.0** | Tailwind v4 animation utilities imported by `globals.css` |
| `react-day-picker` | **10.0.1** | ⚠️ major 10 |
| `shadcn` (CLI) | **4.19.0** | |
| `sonner` 2.0.8 · `cmdk` 1.1.1 · `input-otp` 1.5.0 · `embla-carousel-react` 8.6.0 · `lucide-react` 1.33.0 · `libphonenumber-js` 1.13.11 · `class-variance-authority` 0.7.1 · `tailwind-merge` 3.6.0 | | |
| `vitest` 4.1.11 · `@playwright/test` 1.62.1 | | |

---

## Three corrections to earlier decisions

### 1. 🔴 `date-fns-jalali` is dropped — it has never had a stable release

```
dist-tags: { latest: "4.4.0-0" }
versions with no prerelease suffix: []
```

**Every published version is a prerelease.** For a booking system where a wrong date means a customer arriving on the wrong day, that is not an acceptable dependency, and I recommended it without checking.

**Replacement — and it is better anyway:**

| Job | Tool |
|---|---|
| **Formatting** a date in Persian | `Intl.DateTimeFormat('fa-IR-u-ca-persian', …)` — **built into Node and every browser.** Zero dependencies, correct Persian digits and month names, maintained by the platform. |
| **Calendar arithmetic** — Jalali ↔ Gregorian, month lengths, leap years | **`jalaali-js` 2.0.1** — stable, tiny, single-purpose, widely used. |

Both stay behind the one `JalaliDate` utility module that the domain model already requires, so nothing else in the codebase touches calendar conversion.

### 2. ⚠️ Zod **4**, not 3 — the API I would have written by default is deprecated

| Zod 3 (what I'd have written) | Zod 4 (correct) |
|---|---|
| `z.string().email()` | **`z.email()`** — string formats are now top-level; the old form is deprecated |
| `{ message: "…" }`, `invalid_type_error`, `required_error` | **`{ error: "…" }`** — one unified parameter |
| `errorMap` | **`error`** — renamed, accepts a plain string |
| `z.record(valueSchema)` | **`z.record(keySchema, valueSchema)`** — two arguments now required |
| `.default()` parses the default | **`.default()` short-circuits**; `.prefault()` is the old behaviour |

Also: defaults inside optional fields now apply by default. Since **every server action opens with a Zod parse** (AGENTS.md rule 3), getting this wrong would have been wrong in about a hundred places.

### 3. TypeScript and ESLint compatibility pins

The registry's newest releases are not a compatible set for this scaffold. `typescript-eslint` 8.67 declares TypeScript `>=4.8.4 <6.1.0`, so TypeScript is pinned to 6.0.3. Next 16.3's installed ESLint plugins reject ESLint 10, so ESLint is pinned to 9.39.5. `pnpm peers check`, the typechecker, and the linter must all pass before either pin is raised. Next 16 no longer has `next lint`; run ESLint directly.

**Also watch:** `react-day-picker` is on **v10**. shadcn's `calendar` component historically targeted v9, so the generated component may need adjusting — check it the day we add the booking calendar rather than discovering it mid-build.

---

## Verified API shapes

### State-management dependency decision

Zustand and TanStack Query are complementary, not alternatives and not replacements for Next.js Server Components.

| Concern | Decision |
|---|---|
| Shared client interaction state | **Zustand required.** Module-scoped stores own draft filters, drawer/command state, selected variants, gallery selection, and other coordinated UI interactions. |
| Applied search/filter/sort/page state | **URL-owned.** It must remain shareable, canonical, and restorable through browser history. Zustand may hold an explicit draft before Apply. |
| Initial PHP/PLP/PDP/catalogue state | **Server-owned.** Page-shaped reads and Server Components remain the primary path. |
| Form buffers | **React Hook Form-owned.** Do not duplicate form values into Zustand without an approved cross-step draft requirement. |
| Browser-refetched server state | **TanStack Query approved with a first-consumer gate.** Expected candidates are cart drawer synchronization, approved autocomplete, live booking availability, and account/order status refresh. |

Zustand 5's Next.js guidance requires request-safe scoped stores and keeps React Server Components outside the store. Persistence is default-off because browser storage can create hydration, privacy, and stale-contract problems. TanStack Query requires an explicit QueryClient/hydration/cache boundary; adding that boundary is justified only when browser refetching or cache synchronization is an accepted requirement.

The complete ownership, hydration, URL reconciliation, selector, Query key, retry, invalidation, and adoption rules live in [`architecture/data-and-state-ownership.md`](architecture/data-and-state-ownership.md).

**Better Auth 1.7 phone/OTP** — matches the plan, confirmed from the docs:

```ts
phoneNumber({
  sendOTP: ({ phoneNumber, code }, ctx) => { /* Kavenegar / SMS.ir */ },
  signUpOnVerification: {
    getTempEmail: (phone) => placeholderEmailFromPhone(phone),
    getTempName:  () => "کاربر",
  },
})
// client: authClient.phoneNumber.sendOtp({ phoneNumber })
//         authClient.phoneNumber.verify({ phoneNumber, code })
```

Defaults: 6-digit code, 300s expiry, 3 attempts, session created on verification. This project overrides expiry to 120 seconds, creates a non-PII HMAC-derived address under `.invalid`, and schedules the send through Next.js `after()` with a bounded provider call. The docs advise **not awaiting `sendOTP`** in the response path — it prevents SMS-provider latency leaking into response timing.

That aligns with our own OTP invariants (single use, short TTL, rate-limited by phone *and* IP), and it does not replace them: Better Auth's 3-attempt limit protects one code; it does not stop someone burning your SMS budget by requesting a hundred codes.

Customer password sign-up remains disabled. The same pinned package supplies separately provisioned staff email/password plus mandatory TOTP; the complete adapter, session, rate-limit, proxy, and account-lifecycle contract is [`system-design/authentication-and-account-security.md`](system-design/authentication-and-account-security.md).

---

## The rule going forward

Before any `package.json` is written or a new phase begins:

1. Query the registry for every package's actual latest version.
2. Fetch the official docs for anything whose API I have not verified **in this session**.
3. Record the date and the findings here.

An approved dependency is not automatically installed. Install it in the phase that owns its first concrete consumer, add its verification evidence, and remove or defer it if that consumer is rejected.

Training data goes stale. The registry does not.
