#!/usr/bin/env bash
set -euo pipefail
: "${POSTGRES_DB:?Set POSTGRES_DB}"
: "${POSTGRES_USER:?Set POSTGRES_USER}"
: "${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}"
out="${1:-./backups}"
mkdir -p "$out"
chmod 700 "$out"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
file="$out/${POSTGRES_DB}_${stamp}.sql.gz"
export PGPASSWORD="$POSTGRES_PASSWORD"
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges | gzip -9 > "$file"
unset PGPASSWORD
chmod 600 "$file"
echo "Backup created: $file"
