# ابزار انتقال یک‌باره

این پوشه ابزار موقت خواندن داده‌های باقیماندهٔ منبع قدیمی را نگه می‌دارد. وابستگی `pg` فقط در `scripts/migration-tools/package.json` نصب می‌شود و **در `package.json` برنامه یا تصویر Docker وب وجود ندارد**.

## ترتیب امن انتقال

این عملیات را در پنجرهٔ نگهداری انجام دهید تا هنگام تهیهٔ نسخه و انتقال، برنامهٔ قبلی رکورد تازه‌ای ننویسد. Volume و کانتینر منبع را تا پایان آزمون نگه دارید.

```sh
cd /home/digibail/domains/digebail.ir
PG_CONTAINER=digebailir-db-1
PG_NETWORK=$(docker inspect -f '{{range $name, $cfg := .NetworkSettings.Networks}}{{println $name}}{{end}}' "$PG_CONTAINER" | head -n1)
test -n "$PG_NETWORK"
BACKUP_DIR="/root/digibail-cutover-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR/postgres" "$BACKUP_DIR/mariadb"
chmod 700 "$BACKUP_DIR" "$BACKUP_DIR/postgres" "$BACKUP_DIR/mariadb"
docker exec "$PG_CONTAINER" sh -lc 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' | gzip -9 > "$BACKUP_DIR/postgres/source.sql.gz"
gzip -t "$BACKUP_DIR/postgres/source.sql.gz"
chmod 600 "$BACKUP_DIR/postgres/source.sql.gz"
sha256sum "$BACKUP_DIR/postgres/source.sql.gz" > "$BACKUP_DIR/postgres/source.sql.gz.sha256"
bash scripts/backup-db.sh "$BACKUP_DIR/mariadb"
docker build -f Dockerfile.migration -t digibail-migration-tools:cutover .
docker stop digebailir-app-1
docker run --rm --network "$PG_NETWORK" --env-file .env -e DIGIBAIL_MIGRATION_BACKUP_VERIFIED=YES -v /var/lib/mysql/mysql.sock:/tmp/mysql.sock digibail-migration-tools:cutover node scripts/migration-tools/migrate-postgres-app-data-to-mariadb.mjs --apply
docker run --rm --network "$PG_NETWORK" --env-file .env -e DIGIBAIL_LEGACY_USERS_BACKUP_VERIFIED=YES -v /var/lib/mysql/mysql.sock:/tmp/mysql.sock digibail-migration-tools:cutover node scripts/import-legacy-mariadb-users.mjs --apply
docker run --rm --env-file .env -v /var/lib/mysql/mysql.sock:/tmp/mysql.sock digibail-migration-tools:cutover node scripts/migration-tools/verify-single-mariadb-ready.mjs
```

هر دستور باید با کد خروج صفر پایان یابد و فرمان آخر باید `DIGIBAIL_SINGLE_DATABASE_READY=PASS` چاپ کند. اگر هر مرحله شکست خورد، کانتینر قبلی را دوباره با `docker start digebailir-app-1` بالا بیاورید و تا بررسی اختلاف رکوردها هیچ Volume یا جدولی را پاک نکنید.

## پس از تأیید

پس از موفقیت بررسی نهایی، گردش استقرار برنامه فایل `.env` را از متغیرهای `DATABASE_URL` و `POSTGRES_*` پاک می‌کند، نسخهٔ MariaDB-only را بالا می‌آورد، سلامت و ورود مدیر را بررسی می‌کند و سپس فقط کانتینر PostgreSQL مخصوص DigiBail را به‌عنوان سرویس متوقف‌شده حذف می‌کند. Volume قدیمی PostgreSQL برای امکان بازگشت اضطراری حذف نمی‌شود.

هیچ کانتینر یا Volume متعلق به پروژه‌های دیگر سرور، از جمله Sookar/NAF، نباید در این عملیات هدف قرار گیرد.
