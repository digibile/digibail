# ابزار انتقال یک‌باره

این پوشه ابزار موقت خواندن داده‌های منبع قدیمی را نگه می‌دارد. وابستگی `pg` فقط در `scripts/migration-tools/package.json` نصب می‌شود و **در `package.json` برنامه یا تصویر Docker وب وجود ندارد**.

پس از انتقال موفق و تأیید، برنامهٔ اجرایی فقط به MariaDB متصل می‌ماند. نشانی دیتابیس منبع فقط در فایل موقت جداگانه استفاده می‌شود و وارد `.env` دائمی MariaDB نمی‌شود.

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
test -s .env
SOURCE_URL="$(sed -n 's/^DATABASE_URL=//p' .env | head -n1)"
test -n "$SOURCE_URL"
printf 'DIGIBAIL_SOURCE_DATABASE_URL=%s\n' "$SOURCE_URL" > "$BACKUP_DIR/source.env"
unset SOURCE_URL
chmod 600 "$BACKUP_DIR/source.env"
docker build -f Dockerfile.migration --target migration-tools -t digibail-migration-tools:cutover .
docker stop digebailir-app-1
docker run --rm --network "$PG_NETWORK" --env-file .env --env-file "$BACKUP_DIR/source.env" -e DIGIBAIL_MIGRATION_BACKUP_VERIFIED=YES -v /var/lib/mysql/mysql.sock:/tmp/mysql.sock digibail-migration-tools:cutover node scripts/migration-tools/migrate-postgres-app-data-to-mariadb.mjs --apply
docker run --rm --network "$PG_NETWORK" --env-file .env --env-file "$BACKUP_DIR/source.env" -e DIGIBAIL_LEGACY_USERS_BACKUP_VERIFIED=YES -v /var/lib/mysql/mysql.sock:/tmp/mysql.sock digibail-migration-tools:cutover node scripts/import-legacy-mariadb-users.mjs --apply
docker build -f Dockerfile.migration -t digibail-cutover-verifier:cutover .
docker run --rm --env-file .env -v /var/lib/mysql/mysql.sock:/tmp/mysql.sock digibail-cutover-verifier:cutover
shred -u "$BACKUP_DIR/source.env" 2>/dev/null || rm -f "$BACKUP_DIR/source.env"
docker image rm digibail-migration-tools:cutover
```

فرمان‌های اول باید نسخهٔ سالم هر دو دیتابیس را بسازند. فرمان مهاجرت باید با کد خروج صفر پایان یابد، فرمان واردسازی نقش‌ها باید `DIGIBAIL_SINGLE_DATABASE_READY=PASS` چاپ کند و فرمان راستی‌آزمایی نیز همین نشانگر را چاپ کند.

اگر هر مرحله شکست خورد، کانتینر قبلی را دوباره با `docker start digebailir-app-1` بالا بیاورید و تا رفع اختلاف هیچ جدول، کانتینر یا Volume منبعی را حذف نکنید.

## پس از تأیید

گردش استقرار، نشانگر کامل بودن ۵۹ جدول و نگاشت سه مجموعهٔ حساب کاربری را بررسی می‌کند. بعد از آن متغیرهای موقت منبع را از `.env` پاک می‌کند، نسخهٔ MariaDB-only را بالا می‌آورد و سلامت و ورود مدیر را می‌سنجد. فقط کانتینر PostgreSQL مخصوص DigiBail حذف می‌شود و Volume قدیمی برای بازگشت اضطراری حفظ می‌شود.

هیچ کانتینر یا Volume متعلق به پروژه‌های دیگر سرور، از جمله Sookar/NAF، نباید در این عملیات هدف قرار گیرد.
