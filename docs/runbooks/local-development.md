# Runbook — local development

**Purpose:** run and exercise the app end to end on one machine, with no Iranian
host, no SMS account, no payment gateway, and no object storage. Everything
below is development-only and is structurally refused in production.

## First run

```bash
cp .env.example .env.local          # then fill the two generated secrets
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"   # BETTER_AUTH_SECRET
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"   # AUTH_IDENTIFIER_PEPPER

pnpm install
pnpm db:up                          # postgres:16.9-alpine from compose.yaml
pnpm db:migrate
pnpm db:seed reference
pnpm dev
```

`pnpm db:url` prints the connection string the container is actually bound to;
`pnpm db:reset` destroys and rebuilds it; `pnpm db:verify` provisions a
throwaway database, migrates from zero, seeds twice, and runs the invariant and
schema suites.

## Signing in without SMS

`SMS_PROVIDER="fake"` selects `FakeOtpNotifier`. It sends nothing and prints the
code to the dev server console:

```
  ┌─ dev OTP ─────────────────
  │  +989123456789  →  418302
  └───────────────────────────
```

The masked, OTP-free structured delivery log is emitted for every provider and
is what production sees. The reveal sink is wired only when
`NODE_ENV !== "production"`, and `resolveAuthRuntimeConfig` refuses
`SMS_PROVIDER="fake"` under `NODE_ENV=production` — two independent guards.

## Configuration failures

Auth configuration is resolved once at module load, so a bad value surfaces as a
500 on the first auth request. Outside production the thrown message names the
offending key:

```
AUTH_RUNTIME_CONFIG_INVALID: SMS_PROVIDER must be "fake" or "kavenegar"
AUTH_RUNTIME_CONFIG_INVALID: AUTH_TRUSTED_ORIGINS must include BETTER_AUTH_URL
```

In production the reason is withheld and only the stable code is thrown.

## Known issue — `next dev` runs on webpack

`dev` is pinned to `next dev --webpack`. Under Next 16.3.2 + Tailwind 4.3.3,
Turbopack merges Tailwind's global `*` preflight selector into
`src/modules/auth/auth-screen.module.css` and then rejects it as non-local; the
stylesheet itself contains no such selector. Webpack compiles it correctly.

Cost: slower dev rebuilds. Exit: either the upstream fix lands, or the auth
screen stops using a CSS Module — the rest of the codebase styles through
Tailwind and the token layer, so the module is the outlier, not the rule.

## What is deliberately faked locally

| Concern | Local | Production |
|---|---|---|
| SMS OTP | console reveal | Kavenegar / SMS.ir |
| Postgres | `compose.yaml` container | Iran-hosted managed instance |
| Object storage | not yet exercised | S3-compatible |
| Payment | bank transfer only, no gateway | bank transfer, then ZarinPal |
| Client IP | request socket, no proxy | trusted proxy header chain |

Every one of these sits behind a named interface chosen at the composition root.
Adding a real provider is a configuration change plus one adapter, never a change
to a route, action, or screen.

## What I can and cannot verify without your machine

Runnable anywhere: `typecheck`, `lint`, `format`, and every unit test that does
not open a database connection.

Requires your machine: anything touching PostgreSQL (`db:*`, the
`*.integration.test.ts` files), `pnpm dev`, `pnpm build`, and Playwright.
