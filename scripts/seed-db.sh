#!/usr/bin/env bash
# Loads db/init-db.tar.gz into an already-migrated database, and does nothing if rows are
# already there. Compose seeds itself through docker-entrypoint-initdb.d; Cloud SQL cannot,
# so the deploy pipeline calls this instead.
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dump="$repo_root/db/init-db.tar.gz"

rows="$(psql "$DATABASE_URL" --no-psqlrc --quiet --tuples-only --no-align \
  --command 'select count(*) from electricitydata')"

if [ "$rows" -gt 0 ]; then
  echo "electricitydata already holds $rows rows; leaving it alone."
  exit 0
fi

# The dump opens with a CREATE TABLE that prisma migrate has already applied, so only the
# single insert statement that follows it is replayed. tar warns about the macOS resource
# fork alongside the dump; it exits 0 and the warning is not a failure.
echo "Seeding electricitydata from $dump"
tar -xzOf "$dump" init-db.sql \
  | awk '/^insert into electricityData/,0' \
  | psql "$DATABASE_URL" --no-psqlrc --quiet --set ON_ERROR_STOP=1 --file -

rows="$(psql "$DATABASE_URL" --no-psqlrc --quiet --tuples-only --no-align \
  --command 'select count(*) from electricitydata')"
echo "Seeded $rows rows."
