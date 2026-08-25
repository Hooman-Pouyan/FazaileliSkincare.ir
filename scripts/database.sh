#!/usr/bin/env bash

set -Eeuo pipefail

readonly repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly compose_file="${repository_root}/compose.yaml"
readonly postgres_database="fazaieli"
readonly postgres_password="fazaieli_local"
readonly postgres_user="fazaieli"

project_name="${COMPOSE_PROJECT_NAME:-fazaieli-db-local}"

# The published port lives in .env.local so the container, DATABASE_URL and the
# app agree without repeating it on every command. An explicit environment
# variable still wins, which is what verify_fresh_database relies on.
# Same precedence Next.js and drizzle.config.ts use: .env.local wins over .env.
# An explicit environment variable still beats both, which is what
# verify_fresh_database relies on to request an ephemeral port.
read_configured_port() {
  local file value
  for file in "${repository_root}/.env.local" "${repository_root}/.env"; do
    [[ -f "${file}" ]] || continue
    # Parameter expansion, not sed: BSD sed on macOS rejects the GNU \? operator,
    # so a pattern that works on CI silently matched nothing here.
    value="$(grep -E '^FAZAIELI_DATABASE_PORT=' "${file}" | tail -1 || true)"
    [[ -n "${value}" ]] || continue
    value="${value#*=}"
    value="${value//\"/}"
    value="${value//\'/}"
    value="${value//[[:space:]]/}"
    if [[ "${value}" =~ ^[0-9]{1,5}$ ]]; then
      printf '%s\n' "${value}"
      return 0
    fi
  done
}

if [[ -z "${FAZAIELI_DATABASE_PORT:-}" ]]; then
  FAZAIELI_DATABASE_PORT="$(read_configured_port)"
fi
export FAZAIELI_DATABASE_PORT="${FAZAIELI_DATABASE_PORT:-5432}"

# Port 0 asks the kernel for a free port, so it can never collide.
assert_port_available() {
  local port="${FAZAIELI_DATABASE_PORT}"
  if [[ "${port}" == "0" ]]; then
    return 0
  fi
  if lsof -nP -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1; then
    printf '%s\n' \
      "Port ${port} is already in use, so the database container cannot bind it." \
      "" \
      "  What is holding it:  lsof -nP -iTCP:${port} -sTCP:LISTEN" \
      "" \
      "If that is another PostgreSQL you want to keep, choose a different port:" \
      "  1. set FAZAIELI_DATABASE_PORT in .env.local (e.g. 5433)" \
      "  2. update DATABASE_URL in .env.local to the same port" \
      "  3. rerun this command" >&2
    return 1
  fi
}

run_compose() {
  docker compose --project-name "${project_name}" --file "${compose_file}" "$@"
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    printf '%s\n' "Docker with Compose v2 is required for database commands." >&2
    return 1
  fi

  if ! docker info >/dev/null 2>&1; then
    printf '%s\n' "Docker is installed but its daemon is not running." >&2
    return 1
  fi
}

database_url() {
  local binding
  local port

  binding="$(run_compose port postgres 5432)"
  port="${binding##*:}"
  printf 'postgresql://%s:%s@127.0.0.1:%s/%s\n' \
    "${postgres_user}" \
    "${postgres_password}" \
    "${port}" \
    "${postgres_database}"
}

start_postgres() {
  assert_port_available
  run_compose up --detach --wait --wait-timeout 60 postgres
}

apply_migrations() {
  DATABASE_URL="$(database_url)" pnpm run db:migrate
}

seed_reference_data() {
  DATABASE_URL="$(database_url)" pnpm run db:seed reference
}

assert_database_invariants() {
  run_compose exec --no-TTY postgres \
    psql \
    --set ON_ERROR_STOP=1 \
    --username "${postgres_user}" \
    --dbname "${postgres_database}" \
    < "${repository_root}/scripts/database-invariants.sql"
}

run_schema_tests() {
  DATABASE_URL="$(database_url)" pnpm exec vitest run \
    src/lib/db/schema/schema.test.ts \
    src/lib/db/schema/better-auth.integration.test.ts \
    src/lib/db/normalize-catalog-search.test.ts \
    src/lib/db/seeds/reference-data.test.ts
}

provision_local_database() {
  start_postgres
  apply_migrations
  seed_reference_data
  printf 'Database ready: %s\n' "$(database_url)"
}

reset_local_database() {
  run_compose down --volumes --remove-orphans
  provision_local_database
}

cleanup_verification_database() {
  run_compose down --volumes --remove-orphans
}

verify_fresh_database() {
  project_name="fazaieli-db-verify-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}-$$"
  export FAZAIELI_DATABASE_PORT=0
  trap cleanup_verification_database EXIT

  start_postgres
  apply_migrations
  seed_reference_data
  seed_reference_data
  assert_database_invariants
  run_schema_tests
}

main() {
  require_docker

  case "${1:-}" in
    down)
      run_compose down --remove-orphans
      ;;
    reset)
      reset_local_database
      ;;
    up)
      provision_local_database
      ;;
    url)
      database_url
      ;;
    verify)
      verify_fresh_database
      ;;
    *)
      printf '%s\n' "Usage: $0 {up|down|reset|url|verify}" >&2
      return 2
      ;;
  esac
}

main "$@"
