# Dependency audit

**Date:** 2026-08-24 · Verified against the npm registry and official documentation, not from memory.

> **Why this document exists:** an earlier draft of ADR-001 said "Next.js 15" when 16.3 had already shipped. That was a memory error, and the fix is a process, not an apology: **every dependency is checked against the registry before it is written into a `package.json`, and this file records what was found and when.** Re-run the check before each new phase.

---

## ⚠️ Context7 is enabled but unreachable in this session

You have both `context7-mcp` and `find-docs` enabled, and I tried to use them. The API is blocked by this session's egress allowlist:

```
context7.com   → CONNECT tunnel failed, 403   (cloud container)
context7.com   → 403 from proxy after CONNECT (device bridge)
registry.npmjs.org → 200
```

Blocked from **both** sides, so it is the allowlist, not the tool. What I used instead:

- **npm registry** — authoritative for "what version is actually published", and reachable.
- **Official documentation sites** — `nextjs.org`, `better-auth.com`, `zod.dev` all fetch fine.

Between them this is as good as Context7 for version facts, and slightly worse for broad API search. **If you can add `context7.com` to the session's allowlist, do — it would make API-shape checks cheaper.** Until then this is the process.

---

## Verified versions — 2026-08-24

| Package | Latest stable | Note |
|---|---|---|
| `next` | **16.3.2** | Node 20.9+, Turbopack default |
| `react` / `react-dom` | **19.2.8** | |
| `typescript` | **7.0.2** | ⚠️ TS **7**, not 5 — see below |
| `eslint` | **10.9.0** | Flat config only |
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

### 3. TypeScript **7**, and what follows from it

TS 7 is the native port — roughly 10× faster type checking, and Next 16.3 supports using it for `next build`. Take it. Consequences: `eslint` 10 is flat-config only, and `next lint` no longer exists in Next 16 (run ESLint or Biome directly).

**Also watch:** `react-day-picker` is on **v10**. shadcn's `calendar` component historically targeted v9, so the generated component may need adjusting — check it the day we add the booking calendar rather than discovering it mid-build.

---

## Verified API shapes

**Better Auth 1.7 phone/OTP** — matches the plan, confirmed from the docs:

```ts
phoneNumber({
  sendOTP: ({ phoneNumber, code }, ctx) => { /* Kavenegar / SMS.ir */ },
  signUpOnVerification: {
    getTempEmail: (phone) => `${phone}@fazaieli.ir`,
    getTempName:  (phone) => phone,
  },
})
// client: authClient.phoneNumber.sendOtp({ phoneNumber })
//         authClient.phoneNumber.verify({ phoneNumber, code })
```

Defaults: 6-digit code, 300s expiry, 3 attempts, session created on verification. The docs advise **not awaiting `sendOTP`** — it prevents SMS-provider latency leaking into response timing.

That aligns with our own OTP invariants (single use, short TTL, rate-limited by phone *and* IP), and it does not replace them: Better Auth's 3-attempt limit protects one code; it does not stop someone burning your SMS budget by requesting a hundred codes.

---

## The rule going forward

Before any `package.json` is written or a new phase begins:

1. Query the registry for every package's actual latest version.
2. Fetch the official docs for anything whose API I have not verified **in this session**.
3. Record the date and the findings here.

Training data goes stale. The registry does not.
