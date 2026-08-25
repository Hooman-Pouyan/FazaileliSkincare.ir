# Runbook — local development

**Purpose:** run and exercise the app end to end on one machine, with no Iranian
host, no SMS account, no payment gateway, and no object storage. Everything
below is development-only and is structurally refused in production.

## First run

```bash
cp .env.example .env                # then fill the two generated secrets
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"   # BETTER_AUTH_SECRET
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"   # AUTH_IDENTIFIER_PEPPER

pnpm install
pnpm db:up                          # postgres:16.9-alpine from compose.yaml
pnpm db:migrate
pnpm db:seed dev                    # reference data plus the fictional catalogue
pnpm dev
```

## Port conflicts

`FAZAIELI_DATABASE_PORT` in `.env.local` is the port the container publishes on
`127.0.0.1`. If something already owns it — a Homebrew or Postgres.app instance,
another project's container — `pnpm db:up` refuses with the offending port named
and stops before compose leaves a half-created container behind.

To move: change `FAZAIELI_DATABASE_PORT` **and** the port inside `DATABASE_URL`
to the same new value, then `pnpm db:down && pnpm db:up`.

## Which file holds what

`.env` is the local development configuration and the file to edit. `.env.local`
is the per-machine override layer, empty by default, for a collision or a
credential that is yours alone. Both are gitignored; `.env.example` is the
committed template.

Every consumer reads them in the same order — `.env.local`, then `.env`, and an
explicit environment variable beats both:

| Consumer | Reads |
|---|---|
| Next.js (`pnpm dev`, `pnpm build`) | natively |
| `drizzle.config.ts` (`db:migrate`, `db:studio`) | explicit dotenv load |
| `src/lib/db/seed.ts` (`db:seed`) | explicit dotenv load |
| `scripts/database.sh` (`db:up`, `db:reset`, `db:verify`) | `FAZAIELI_DATABASE_PORT` only |

Plain `import "dotenv/config"` reads `.env` alone, which is why the two TypeScript
entry points load the pair explicitly instead. `scripts/database.sh` passes an
explicit `DATABASE_URL` when it drives migrations and seeds, and dotenv never
overwrites a value already in the environment, so `db:verify`'s throwaway
database is unaffected by either file.

To find the holder instead: `lsof -nP -iTCP:5432 -sTCP:LISTEN`.

`pnpm db:url` prints the connection string the container is actually bound to;
`pnpm db:reset` destroys and rebuilds it; `pnpm db:verify` provisions a
throwaway database, migrates from zero, seeds twice, and runs the invariant and
schema suites.

## Seed profiles

| Command | Contents |
|---|---|
| `pnpm db:seed reference` | Locales and concerns. Real reference data, safe in any environment. |
| `pnpm db:seed dev` | The reference profile plus a fictional catalogue — three brands, three categories, ten products covering every offer and publication state, with placeholder imagery from `public/images/dev/`. |

Everything in the `dev` profile is invented. It describes no real product, and
`14-storyderm-draft-catalog-pipeline.md` still governs real catalogue data: no
inferred prices, SKUs, stock, claims or sellable boundaries. Two independent
guards keep the two apart — the seed refuses `NODE_ENV=production`, and it
refuses any database already holding a product it did not create. Its rows are
identifiable by their `dev-` slug and `DEV-` SKU prefixes, which is also how
`clearDevCatalogue` removes only its own.

The ten products are deliberately chosen so a route cannot pass by accident:
one purchasable, one with two variants, one with no media, one out of stock, one
`on_request` with no price row at all, one professional-only, one whose only
variant is inactive, one with no Persian translation, and two unpublished. The
last three must **not** appear in the Persian catalogue — if they do, the
publication or exact-locale predicate is broken.

## After a normalization change

`normalized_name` and `normalized_search_text` are computed at write time by
`normalizeCatalogSearchText`, so changing that function leaves every stored row
on the old rule and search quietly stops matching. Both seed profiles recompute
normalization on conflict, so re-running the seed is the fix:

```bash
pnpm db:migrate && pnpm db:seed dev
```

The query path must call the same function on its input before comparing. There
is no SQL-side equivalent — a query that skips it returns nothing for a
correctly spelled Persian term.

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

## Test suites

| Command | Needs PostgreSQL | Contents |
|---|---|---|
| `pnpm test:unit` | no | 14 files — money, jalali, phone, rate-limit keys, notifier, request boundary, runtime config, schema contract, search normalization, reference seed shape, i18n routing, rail, auth schemas, next config |
| `pnpm test:integration` | yes | the three `*.integration.test.ts` files — Better Auth runtime, the PostgreSQL rate-limit store, and the Better Auth schema mapping |
| `pnpm test` | yes | both |
| `pnpm test:e2e` | yes, plus a running server | Playwright |

The split exists so most changes can be verified without provisioning a
database, and so a schema or policy regression is caught by a suite that runs in
seconds rather than one that needs a container.

## What can be verified without your machine

Runnable in any checkout: `typecheck`, `lint`, `format`, and `test:unit`.

Requires your machine: `test:integration`, every `db:*` command, `pnpm dev`,
`pnpm build`, and Playwright.
