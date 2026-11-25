#!/usr/bin/env bash
#
# Boot PostgreSQL (if needed), the API, and the Vite dev server, seed the demo
# workspace, then run the Playwright browser flow against the real stack.
#
# Env overrides: PG_BIN, PGDATA, PGSOCK (local Postgres), API_PORT, WEB_PORT.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
API_PORT="${API_PORT:-4000}"
WEB_PORT="${WEB_PORT:-5173}"
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
PGDATA="${PGDATA:-/home/pguser/pgdata}"
PGSOCK="${PGSOCK:-/home/pguser/sockets}"
PGURL="postgresql://postgres:password@127.0.0.1:5432/memorybridge?schema=public"

pids=()
cleanup() {
  for p in "${pids[@]:-}"; do kill "$p" 2>/dev/null; done
}
trap cleanup EXIT

echo "== Ensuring PostgreSQL is up =="
if ! "$PG_BIN/pg_isready" -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
  if id pguser >/dev/null 2>&1 && [ -d "$PGDATA" ]; then
    su pguser -c "$PG_BIN/pg_ctl -D $PGDATA -l /home/pguser/pglog/server.log -o '-p 5432 -k $PGSOCK' start" >/dev/null 2>&1
    sleep 2
  fi
fi
"$PG_BIN/pg_isready" -h 127.0.0.1 -p 5432 || { echo "Postgres not reachable"; exit 2; }

echo "== Migrating + seeding demo data (idempotent) =="
export DATABASE_URL="$PGURL"
( cd "$BACKEND" && npx prisma migrate deploy >/dev/null 2>&1 )
# Only seed if the demo caregiver does not already exist.
HAS_DEMO=$(PGPASSWORD=password "$PG_BIN/psql" -t -h 127.0.0.1 -U postgres -d memorybridge \
  -c "SELECT 1 FROM \"User\" WHERE email='anita@example.com' LIMIT 1;" 2>/dev/null | tr -d '[:space:]')
if [ "$HAS_DEMO" != "1" ]; then
  ( cd "$BACKEND" && npx tsx prisma/seed.ts ) || { echo "Seed failed"; exit 2; }
else
  echo "   demo workspace already present, skipping seed"
fi

echo "== Starting API on :$API_PORT (mock LLM) =="
( cd "$BACKEND" && LLM_PROVIDER=mock PORT="$API_PORT" npx tsx src/server.ts ) >/tmp/claude-0/e2e-api.log 2>&1 &
pids+=($!)

echo "== Starting Vite dev server on :$WEB_PORT =="
( cd "$ROOT" && npm run dev -- --port "$WEB_PORT" --host 127.0.0.1 ) >/tmp/claude-0/e2e-web.log 2>&1 &
pids+=($!)

echo "== Waiting for services =="
for i in $(seq 1 30); do
  curl -sf "http://127.0.0.1:$API_PORT/api/v1/health" >/dev/null 2>&1 && break
  sleep 1
done
for i in $(seq 1 30); do
  curl -sf "http://127.0.0.1:$WEB_PORT/" >/dev/null 2>&1 && break
  sleep 1
done

echo "== Running Playwright flow =="
E2E_BASE_URL="http://127.0.0.1:$WEB_PORT" node "$ROOT/e2e/companion-flow.cjs"
RC=$?
echo "== E2E exit code: $RC =="
exit $RC
