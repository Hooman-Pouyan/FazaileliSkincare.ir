# Local and CI database

DB1 uses the official PostgreSQL 16.9 Alpine image through Docker Compose. The
credentials in `compose.yaml` are local-only and must never be reused in a
hosted environment. Fresh volumes initialize with UTF-8 encoding and the
server runs in UTC.

## Prerequisites

- Node.js 22
- pnpm 11.23.0, as pinned by `packageManager` in `package.json`
- Docker with Compose v2 and a running daemon

Install dependencies once:

```bash
pnpm install --frozen-lockfile
```

## Start or reset the local database

Start PostgreSQL, wait up to 60 seconds for its health check, apply every
committed migration, and seed the reference catalogue:

```bash
pnpm db:up
```

The command prints the local `DATABASE_URL`. Export the same value for other
database commands or the application:

```bash
export DATABASE_URL="$(pnpm --silent db:url)"
```

Stop PostgreSQL while preserving its named volume:

```bash
pnpm db:down
```

Reset removes only the `fazaieli-db-local` Compose project's volume, then
provisions, migrates, and seeds a fresh database:

```bash
pnpm db:reset
```

Set `COMPOSE_PROJECT_NAME` to isolate another persistent checkout. Set
`FAZAIELI_DATABASE_PORT` when port 5432 is already occupied.

## Verify DB1 from zero

The repository and CI use the same command:

```bash
pnpm db:verify
```

It creates a uniquely named Compose project on an automatically allocated
loopback port, migrates from zero, runs the deterministic seed twice, checks
the live table/enum/migration/reference-data invariants, runs the focused
database tests, and removes the verification containers, network, and volume
on exit.
