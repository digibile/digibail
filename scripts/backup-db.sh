#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${MARIADB_DATABASE:?Set MARIADB_DATABASE}"
: "${MARIADB_USER:?Set MARIADB_USER}"
: "${MARIADB_PASSWORD:?Set MARIADB_PASSWORD}"
socket="${MARIADB_SOCKET_HOST:-/var/lib/mysql/mysql.sock}"

dump_cmd=""
if command -v mariadb-dump >/dev/null 2>&1; then
  dump_cmd="$(command -v mariadb-dump)"
elif command -v mysqldump >/dev/null 2>&1; then
  dump_cmd="$(command -v mysqldump)"
else
  echo "ERROR: mariadb-dump or mysqldump is required." >&2
  exit 2
fi

out="${1:-./backups}"
mkdir -p "$out"
chmod 700 "$out"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
file="$out/${MARIADB_DATABASE}_${stamp}.sql.gz"
defaults="$(mktemp)"
trap 'rm -f "$defaults"' EXIT
chmod 600 "$defaults"
{
  printf '[client]\n'
  printf 'user=%s\n' "$MARIADB_USER"
  printf 'password=%s\n' "$MARIADB_PASSWORD"
  printf 'socket=%s\n' "$socket"
  printf 'default-character-set=utf8mb4\n'
} > "$defaults"

"$dump_cmd" --defaults-extra-file="$defaults" --single-transaction --routines --triggers --events --hex-blob "$MARIADB_DATABASE" | gzip -9 > "$file"
gzip -t "$file"
chmod 600 "$file"
sha256sum "$file" > "$file.sha256"
chmod 600 "$file.sha256"
echo "MARIADB_BACKUP_OK=$file"
echo "MARIADB_BACKUP_SHA256=$(cut -d' ' -f1 "$file.sha256")"
