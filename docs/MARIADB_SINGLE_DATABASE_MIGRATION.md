# طرح مهاجرت یکپارچه دیجی‌بایل به MariaDB

## تصمیم قطعی
- دیتابیس عملیاتی برنامه: `digibail_vamcitydigibilepay` روی MariaDB 10.6.17.
- phpMyAdmin ابزار مدیریت همین دیتابیس است؛ خود phpMyAdmin موتور دیتابیس نیست.
- ساختار و داده‌های موجود، شامل ۲۲۴ جدول، باید حفظ شود.
- هیچ جدول، رکورد، ایندکس یا رابطه‌ای بدون بررسی و تأیید حذف یا بازنویسی نمی‌شود.
- PostgreSQL تا پایان مهاجرت و قبولی آزمون‌های تطبیق، خاموش یا حذف نمی‌شود.

## وضعیت واقعی کد در شاخه main (بازبینی 2026-11-02)

### اتصال‌ها و اجرا
- `backend/api.js` مستقیماً `pg.Pool` می‌سازد و `DATABASE_URL` را می‌خواند.
- `backend/site-content.js` نیز یک `pg.Pool` مستقل دارد.
- `scripts/create-admin.js` و `scripts/provision-recovery-admin.js` مستقیماً به PostgreSQL متصل‌اند.
- `docker-compose.yml` سرویس `postgres:16-alpine` و volume به نام `digibail_pgdata` تعریف می‌کند.
- `next-server.js` فرایند `start.js` را روی پورت 1632 اجرا می‌کند. `start.js` پیش از بالا آوردن API، `migrate()` را اجرا می‌کند؛ شکست اتصال/مهاجرت باعث خروج فرایند و خطای پراکسی `ECONNREFUSED 127.0.0.1:1632` می‌شود.
- `/healthz` در سرور قدیمی `dbHealth()` را صدا می‌زند؛ در نتیجه سلامت API به دیتابیس متصل است.
- Workflow استقرار فعلی وجود متغیرهای `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL` را اجباری می‌کند و سرویس PostgreSQL را بالا می‌آورد.
- CI فعلی نیز فقط PostgreSQL را به‌عنوان سرویس تست راه‌اندازی می‌کند.

### اندازه سطح مهاجرت
بازبینی ایستا روی `backend/api.js`:
- ۱٬۴۳۰ خط کد
- ۱۰۵ فراخوانی `pool.query`
- ۲۷۲ پارامتر جایگزین‌شونده با الگوی PostgreSQL مانند `$1`
- ۵۴ cast از نوع `::type`
- ۸ استفاده از `ILIKE`
- ۶ الگوی `ON CONFLICT`
- ۱۹ دستور دارای `RETURNING`
- ۲۸ کاربرد JSONB
- علاوه بر این موارد، تراکنش‌ها، قفل‌ها، توابع تاریخ، regex و syntaxهای مختص PostgreSQL وجود دارد.

این آمار نشان می‌دهد جایگزینی رشته اتصال یا تبدیل ساده placeholderها، مهاجرت واقعی نیست و باعث خرابی قابلیت‌ها خواهد شد.

### اتصال MariaDB موجود
- کد `legacyMaria()` در `backend/api.js` از `mysql2/promise` و socket سیستم استفاده می‌کند.
- این اتصال در حال حاضر برای خواندن بخشی از حساب‌های قدیمی و چند مسیر مدیریتی استفاده می‌شود.
- کد `mariadb-user-sync.js` برای کپی حساب‌های PostgreSQL به `AspNetUsers` طراحی شده و جدول نگاشت `DigibailUserIdentity` را در صورت نیاز ایجاد می‌کند؛ این الگو باید در مهاجرت نهایی بازبینی شود، نه اینکه به‌عنوان معماری نهایی دو دیتابیسی باقی بماند.
- اسکریپت `scripts/migrate-legacy-digibail.js` خودش صریحاً واردکردن عملیاتی به PostgreSQL را بدون `ALLOW_POSTGRES_LEGACY_IMPORT=1` رد می‌کند. این اسکریپت مسیر مهاجرت نهایی به MariaDB نیست.

### ساختار داده مرجع
- MariaDB 10.6.17، ۲۲۴ جدول، حدود ۲٬۵۰۰ ستون، ۷۶۶ ردیف اطلاعات ایندکس و ۴۰۵ ردیف اطلاعات کلید خارجی در خروجی بررسی schema ثبت شده است.
- جدول‌های هویتی مرجع شامل `AspNetUsers`, `AspNetRoles`, `AspNetUserRoles` و جداول وابسته Identity هستند.
- حوزه‌های وام و مالی شامل `Loans`, `LoanProducts`, `UserLoanRequests`, `UserLoans`, `UserLoanPayments`, `UserLoanPaymentRequests`, `Purchases`, `Withdraws`, `OnlineMoneyTransfer` و سایر جدول‌های عملیاتی موجود است.
- جدول‌های دارای پیشوند مانند `bluvamdb__*` و `OnlineMoneyTransfer__*` منابع مجزای تاریخی‌اند و نباید بدون تحلیل ادغام یا حذف شوند.
- `__EFMigrationsHistory` و `__vamcity_migration_state` نیز بخشی از وضعیت فعلی دیتابیس‌اند و باید حفظ شوند.

## برنامه اجرایی و معیار خروج

### مرحله 0: خط مبنا و محافظت
1. تهیه و اعتبارسنجی backup کامل MariaDB و ثبت checksum و اندازه.
2. ثبت شمارش دقیق جدول‌ها، ستون‌ها، کلیدها، ایندکس‌ها و شمارش رکوردها به‌صورت فقط‌خواندنی.
3. تثبیت inventory واقعی PostgreSQL فعلی و تعیین اینکه کدام داده‌ها صرفاً cache/import هستند و کدام داده‌ها فقط در آن وجود دارند.
4. هیچ تغییر schema یا داده تا تکمیل این مرحله انجام نشود.

### مرحله 1: قرارداد اتصال MariaDB
1. ساخت یک ماژول اتصال واحد مبتنی بر `mysql2/promise` با pool مدیریت‌شده و تراکنش.
2. استانداردسازی خروجی query برای مصرف API و مدیریت صحیح `rows`, `rowCount` و شناسه درج‌شده.
3. استفاده از پارامترهای `?` و نام‌گذاری امن شناسه‌های SQL.
4. حذف اتصال‌های مستقل و پراکنده فقط پس از مهاجرت تمام مصرف‌کنندگان.

### مرحله 2: مدل و schema برنامه
1. مقایسه تک‌به‌تک جدول‌های اختصاصی برنامه فعلی با ۲۲۴ جدول MariaDB.
2. برای هر قابلیت مشخص شود: جدول موجود، ستون موجود، رابطه موجود، منبع حقیقت، یا نیاز واقعی به جدول افزوده.
3. جدول‌های جدید فقط با پیشوند/نام‌گذاری مالکیت برنامه و پس از تأیید عدم هم‌پوشانی ساخته شوند.
4. هرگز جداول عملیاتی قدیمی با schema جدید جایگزین نشوند.

### مرحله 3: مهاجرت API به تفکیک حوزه
ترتیب پیشنهادی:
1. سلامت، تنظیمات، ثبت رویداد و کپچا/OTP
2. هویت، نشست، نقش و دسترسی
3. کاتالوگ طرح‌های وام و جزئیات
4. درخواست وام، وضعیت، تاریخچه و پیوست
5. پرداخت، اقساط، تسویه و انتقال وجه
6. مشتری، نماینده، بازاریاب و کمیسیون
7. پیامک، محتوا، خبرنامه و گزارش
هر حوزه باید تست خواندن/نوشتن، مجوز، تراکنش و داده واقعی داشته باشد.

### مرحله 4: آزمون و جابه‌جایی
- CI باید MariaDB هم‌نسخه یا سازگار با production را راه‌اندازی کند.
- تست‌های یکپارچه برای ورود، ثبت‌نام، نقش‌ها، طرح‌ها، درخواست، پرداخت و پنل مدیریت اجرا شوند.
- شمارش‌ها و نمونه‌های تطبیقی از منابع اصلی با خروجی برنامه مقایسه شوند.
- تنها پس از قبولی کامل، استقرار MariaDB-only انجام شود.
- PostgreSQL و volume آن فقط پس از دوره پایش و تأیید صریح حفظ/حذف، از compose خارج شوند.

## ممنوعیت‌های مهاجرت
- تغییر `DATABASE_URL` به یک رشته MySQL بدون بازنویسی SQLها.
- اجرای migration فعلی PostgreSQL روی MariaDB.
- همگام‌سازی یا ادغام کورکورانه کاربران با تطبیق صرفاً شماره موبایل.
- انتقال رمزهای عبور یا hashها بدون بررسی الگوریتم و سازگاری.
- حذف داده‌ها یا جدول‌های تاریخی، از جمله HangFire و جدول‌های prefixed.
- استقرار production تا زمان سبز شدن تست‌های MariaDB.

## معیار تکمیل
مهاجرت زمانی کامل است که هیچ اتصال runtime یا job عملیاتی به PostgreSQL باقی نمانده باشد، تمام endpointهای فعال با MariaDB کار کنند، CI فقط با MariaDB تست اصلی را پاس کند، تمام ۲۲۴ جدول اولیه حفظ شده باشند و گزارش تطبیق داده/عملکرد ارائه شود.

## جدول‌های اختصاصی برنامه فعلی که باید تعیین تکلیف شوند

در کد PostgreSQL فعلی، این جدول‌ها در schema اولیه یا migrationهای runtime تعریف شده‌اند؛ وجود نام آن‌ها در کد به معنی وجود قطعی همه آن‌ها در دیتابیس ۱۹ جدولی فعلی نیست و باید با `information_schema` تطبیق داده شود.

- هویت و امنیت: `users`, `access_roles`, `user_role_assignments`, `user_role_overrides`, `captcha_challenges`, `otp_challenges`
- ثبت رویداد و پیامک: `audit_logs`, `sms_provider_settings`, `sms_templates`, `sms_logs`
- داده‌های واردشده و مشتری: `legacy_customers`, `legacy_source_data`, `customer_documents`, `customer_contracts`
- وام و درخواست: `loan_products`, `loan_requests`, `loan_request_comments`, `loan_request_status_history`, `customer_loan_applications`, `beta_inquiries`
- ابزار محتوای سایت: `homepage_content`, `newsletter_subscribers`, `blog_posts`
- ابزار هوش مصنوعی: `ai_story_assets`

برخی از این قابلیت‌ها ممکن است در حال حاضر از جدول‌های MariaDB موجود تغذیه شوند و برخی دیگر فقط در PostgreSQL باشند. برای هر مورد باید منبع حقیقت تعیین شود؛ ایجاد نسخه دوم از `AspNetUsers`، درخواست وام یا پرداخت ممنوع است.


## ممیزی snapshotهای SQL داخل مخزن (2026-11-02)

فایل‌های schema موجود با شمارش دستورهای `CREATE TABLE` بررسی شدند؛ این‌ها snapshotهای تبدیل‌شده‌اند و جای inventory زنده production را نمی‌گیرند:

| فایل | تعداد دستور CREATE TABLE | نام یکتای جدول |
|---|---:|---:|
| `database/mysql/schema-main.sql` | ۸۸ | ۸۸ |
| `database/mysql/schema-bluvamdb.sql` | ۵۶ | ۵۶ |
| `database/mysql/schema-transfer.sql` | ۱۲ | ۱۲ |
| `database/mysql/schema.sql` | ۱۵۶ | ۱۰۱ |

نتیجه مقایسه:
- `schema.sql` شامل تمام ۸۸ نام جدول `schema-main.sql` است، به‌علاوه جدول `Assurance` و ۱۲ جدول پیشونددار `OnlineMoneyTransfer__*`؛ تکرار تعریف‌ها در فایل تجمیعی باعث شده ۱۵۶ دستور، فقط ۱۰۱ نام یکتا داشته باشد.
- `schema-main.sql` و `schema-bluvamdb.sql` در ۵۵ نام جدول مشترک‌اند؛ بنابراین نباید تعداد فایل‌ها یا دستورهای CREATE را با تعداد جدول‌های مستقل جمع زد.
- اجتماع نام‌های یکتای سه snapshot اصلی، bluvamdb و transfer برابر ۱۰۱ است؛ در حالی که ممیزی زنده production تعداد ۲۲۴ جدول گزارش کرده است. پس این snapshotها پوشش کامل دیتابیس زنده نیستند و ۱۲۳ جدول زنده در این مجموعه snapshotها به‌صورت نام یکتا پوشش داده نشده‌اند.
- `database/02-schema-new-modules.sql` اسکریپت SQL Server است، نه schema قابل اجرای MariaDB؛ اجرای آن روی دیتابیس production ممنوع است.
- برای نگاشت نهایی باید از inventory زنده شامل تمام ۲۲۴ جدول و ستون‌ها استفاده کرد. هیچ نامی صرفاً به دلیل نبودن در snapshot نباید ساخته، حذف یا ادغام شود.

## وضعیت پشتیبان‌گیری

Workflow دستی `.github/workflows/backup-digibail-mariadb.yml` به شاخه مهاجرت افزوده شده است. این workflow:
- فقط با اجرای دستی از همین شاخه قابل اجراست.
- credential را از فایل تنظیمات موجود روی سرور می‌خواند و مقدار آن را چاپ نمی‌کند.
- فایل فشرده را بیرون از web root در `$HOME/private_backups/digibail-mariadb` ذخیره می‌کند.
- قبل از dump، وجود دیتابیس، موتور جدول‌ها و فضای آزاد را بررسی می‌کند؛ اگر جدول غیر InnoDB یا فضای ناکافی باشد، متوقف می‌شود.
- از `mysqldump --single-transaction --routines --triggers --events --hex-blob` استفاده می‌کند، gzip را تست و SHA-256 ثبت می‌کند و فقط سه backup آخر را نگه می‌دارد.
- هیچ backup یا داده مشتری را به GitHub Artifact یا log منتقل نمی‌کند.

**وضعیت اجرا:** workflow فقط به مخزن اضافه شده و هنوز روی سرور اجرا نشده است؛ backup تأییدشده یا restore آزمایشی ثبت نشده. تا زمان اجرای موفق backup و restore به دیتابیس ایزوله، هیچ cutover یا تغییر schema مجاز نیست.


## گام اجرایی بعدی: pool مشترک و تست واقعی MariaDB در CI (2026-11-02)

- ماژول `backend/db/mariadb.js` اضافه شد تا ساخت pool MariaDB در یک نقطه انجام شود؛ در نبود نام کاربری یا گذرواژه، با خطای 503 مشخص متوقف می‌شود و fallback به PostgreSQL ندارد.
- اتصال legacy MariaDB در `backend/api.js` از این factory مشترک استفاده می‌کند. این تغییر فقط اتصال legacy را متمرکز می‌کند و به معنی حذف PostgreSQL از API نیست.
- سرویس MariaDB 10.11 به CI اضافه شد و تست `tests/mariadb-pool.test.js` با یک جدول TEMPORARY، round-trip واقعی SELECT/INSERT را انجام می‌دهد. جدول موقت فقط در connection تست وجود دارد و دیتابیس اصلی یا schema پایدار را تغییر نمی‌دهد.
- سرویس PostgreSQL در CI فعلاً حفظ شده، چون API و health check هنوز به آن وابسته‌اند. CI اکنون دو موتور را برای تست بخش‌های متفاوت بالا می‌آورد؛ این وضعیت فقط مرحله گذار است و هدف نهایی همچنان MariaDB واحد است.
- نتیجه نهایی CI روی commit جدید باید قبل از ادامه refactor ثبت شود.

### محدودیت باقی‌مانده

`backend/api.js` همچنان import و استفاده مستقیم از `pg.Pool` دارد و `backend/site-content.js` نیز PostgreSQL-only است. بنابراین حذف سرویس PostgreSQL، تغییر `docker-compose.yml` یا deploy production در این مرحله ناامن است.
