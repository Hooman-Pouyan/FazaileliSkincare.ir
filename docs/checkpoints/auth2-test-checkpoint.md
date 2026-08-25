# AUTH2 deferred test checkpoint

Status: **deferred by maintainer**  
Implementation branch: `codex/auth2-phone-otp`  
Start trigger: the maintainer explicitly says to start or continue the AUTH2 test checkpoint.

## Purpose

AUTH2 implementation may be reviewed and changed before time is spent on another comprehensive verification cycle. Do not run repeated Playwright captures, broad QA loops, exact-SHA review lanes, or deployment validation as part of ordinary implementation work. Resume the gates below only after the maintainer approves the implemented product direction.

This checkpoint separates two decisions:

1. Is the implemented phone-OTP experience the product we want?
2. Is that approved implementation correct, secure, production-ready, and regression-safe?

The first decision belongs to the implementation handoff. The second belongs here.

## Implemented scope awaiting product approval

- Better Auth phone-number OTP runtime with PostgreSQL-backed sessions and verification records.
- Server-owned `httpOnly`, `SameSite=Lax` session cookies; secure cookies in production.
- Iranian phone normalization, placeholder identifiers, provider-safe notification boundaries, and generic public errors.
- Per-phone and per-IP PostgreSQL rate limits, trusted-proxy parsing, password-path denial, absolute session lifetime, and token-redacted session reads.
- `/[locale]/login`, `/[locale]/verify`, loading, invalid-phone, wrong-code, missing-context, and success navigation states.
- Persian-first RTL editorial UI, English/Arabic copy, shared controls, local Vazirmatn asset, and thin App Router route files.

AUTH3 still owns centralized authorization. AUTH4 still owns staff passwords and TOTP. This checkpoint must not silently expand into either slice.

## Evidence already captured — do not repeat during implementation review

The current implementation pass already produced:

- PostgreSQL suite: 15 files and 68 tests passed.
- TypeScript, ESLint, targeted Prettier, logical RTL CSS, and `git diff --check` passed.
- Next.js production build completed and emitted localized login/verify routes plus `/api/auth/[...all]`.
- Eleven production browser captures were recorded under `output/playwright/auth2/final-*.png`.
- Independent visual integrity and design-system fidelity lanes returned unconditional PASS/APPROVE.

These artifacts explain the current implementation state; they are not a standing promise for later edits. Any product change invalidates only the affected evidence. Do not restart the complete matrix after every small revision.

## Deferred checkpoint gates

Run these once, in order, against the final implementation revision approved by the maintainer.

### AUTH2-CP1 — Freeze the candidate

- Record the full candidate commit SHA and implementation diff.
- Confirm no unrelated dirty files are staged or included.
- Record local PostgreSQL and Node/pnpm versions without credentials.
- Mark which prior artifacts remain valid and which changed surfaces require fresh evidence.

Exit: one immutable candidate SHA and a bounded verification matrix.

### AUTH2-CP2 — Static and database correctness

- Run the full PostgreSQL test suite against a disposable migrated database.
- Run typecheck, lint, targeted formatting, physical-direction CSS scan, foreign runtime-asset scan, and `git diff --check`.
- Run one production Next.js build using non-live placeholder configuration.
- Confirm database cleanup owns auth verification, session, person, and rate-limit rows created by the suite.

Exit: all commands pass once on the candidate SHA, with failures classified as candidate or environment failures.

### AUTH2-CP3 — Security and auth contract audit

Verify directly:

- Direct server session reads use the absolute-age policy and cannot bypass revocation.
- Trusted proxy chains are resolved right-to-left; spoofable multi-hop headers fail closed.
- Public verify forwards only `phoneNumber` and `code`; `updatePhoneNumber` and `disableSession` are not accepted from this customer flow.
- Password, reset-password, staff credential, and unauthorized mutation paths remain unavailable.
- Session cookies are `httpOnly`, `SameSite=Lax`, server-owned, and absent from browser storage.
- Session and public error bodies do not expose tokens, OTPs, phone numbers, provider secrets, or internal Better Auth errors.
- OTP verification, payment-adjacent session behavior, and rate-limit changes remain idempotent where applicable.

Exit: correctness, security, and runtime/debugging reviewers approve the exact candidate SHA with no blockers.

### AUTH2-CP4 — API adversarial matrix

Use the real production server and disposable database to exercise:

- valid send and verify;
- malformed JSON and wrong content type;
- invalid phone, missing phone, missing OTP, wrong OTP, expired OTP, and exhausted attempts;
- spoofed proxy chains and per-IP/per-phone rate limits;
- session read, absolute expiry, sign-out, repeated callbacks, and every disabled password path.

Capture status, response shape, cookie attributes, database side effects, and absence of sensitive values. Do not use live SMS credentials or customer data.

Exit: the complete adversarial matrix passes once without token/PII leakage.

### AUTH2-CP5 — Playwright end-to-end matrix

Run one comprehensive browser loop only after the UI direction is approved:

- `/fa/login` → send OTP → `/fa/verify` → valid OTP → settled `/fa`.
- Invalid phone, loading, wrong OTP, missing pending phone, reload, back, and retry behavior.
- Viewports: 375×812, 768×900, and 1280×900.
- Assert no horizontal overflow, initial scroll position, complete story/brand composition, 48px controls, no development overlay, and no `Rendering…` state in the settled success capture.
- Confirm the session cookie is `httpOnly` and unavailable to page JavaScript.

Capture only changed states when fixing a localized defect. The final approval round must capture the complete matrix once.

Exit: one fresh canonical capture set and one action log on the approved SHA.

### AUTH2-CP6 — RTL, accessibility, and visual review

- Persian-first keyboard and screen-reader pass: labels, descriptions, alerts, focus order, OTP paste, error recovery, and logical alignment.
- Responsive design-system review and visual-fidelity review of every required state.
- Confirm all runtime fonts/styles/scripts remain local to `/public`.
- Confirm there are no physical CSS directions, card-grid/dashboard drift, shadows, or low-contrast decorative colors on light fields.

Exit: both independent visual lanes pass with no blockers on the same capture set.

### AUTH2-CP7 — Exact-SHA code review

Run once after all candidate fixes:

- correctness and repository-convention review;
- security/session/runtime audit;
- caveman review for plain correctness and missing basics;
- ponytail review for over-engineering only;
- review-work lanes required for final handoff.

Every verdict must name the exact full SHA. A new commit invalidates only the applicable lanes; do not repeat unrelated lanes.

Exit: durable ledger contains every required lane, full SHA, verdict, and evidence path.

### AUTH2-CP8 — Deployment readiness, not deployment

- Confirm production environment variable inventory and trusted proxy configuration.
- Rotate any credentials that were previously exposed or copied into development context.
- Confirm SMS provider/template ownership, rate limits, monitoring, and rollback steps.
- Verify Liara/Vercel platform separation without performing a remote deployment unless separately authorized.

Exit: production preflight is approved; deployment remains a separate maintainer action.

## Resume protocol

When the maintainer says to start this checkpoint:

1. Re-read this file and record the candidate SHA.
2. Ask no broad product questions unless the implementation changed materially.
3. Run each gate once and retain its evidence.
4. Fix only gate-blocking defects.
5. Re-run only affected scenarios after a fix.
6. Stop immediately when all gates pass or a product decision is required.

Do not begin this checkpoint automatically after implementation work.
