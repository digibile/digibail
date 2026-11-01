#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${1:-/home/digibail/domains/digebail.ir}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="$ROOT/.legacy-backups"
ARCHIVE="$BACKUP_DIR/legacy-source-$STAMP.tar.gz"

if [[ ! -d "$ROOT" ]]; then
  echo "ERROR: application root not found: $ROOT" >&2
  exit 10
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
TMP="$ARCHIVE.tmp"
trap 'rm -f "$TMP"' EXIT

cd "$ROOT"
ITEMS=()
for item in web backend server.js next-server.js start.js package.json package-lock.json pnpm-lock.yaml yarn.lock next.config.mjs Dockerfile docker-compose.yml .dockerignore server-run.sh migrate.js; do
  [[ -e "$item" ]] && ITEMS+=("$item")
done

if (( ${#ITEMS[@]} == 0 )); then
  echo "ERROR: no legacy application source files found; refusing empty archive." >&2
  exit 11
fi

tar -czf "$TMP" \
  --exclude='*/.env' --exclude='.env' \
  --exclude='*/.env.*' --exclude='.env.*' \
  --exclude='*/node_modules' --exclude='node_modules' \
  --exclude='*/vendor' --exclude='vendor' \
  --exclude='*/uploads' --exclude='uploads' \
  --exclude='*/storage' --exclude='storage' \
  --exclude='*/logs' --exclude='logs' \
  --exclude='*/backups' --exclude='backups' \
  --exclude='*.sql' --exclude='*.sql.gz' --exclude='*.dump' \
  "${ITEMS[@]}"

gzip -t "$TMP"
mv "$TMP" "$ARCHIVE"
chmod 600 "$ARCHIVE"
sha256sum "$ARCHIVE" > "$ARCHIVE.sha256"
chmod 600 "$ARCHIVE.sha256"

echo "LEGACY_ARCHIVE=$ARCHIVE"
echo "LEGACY_ARCHIVE_SHA256=$(cut -d ' ' -f 1 "$ARCHIVE.sha256")"
echo "LEGACY_ARCHIVE_BYTES=$(stat -c '%s' "$ARCHIVE")"
