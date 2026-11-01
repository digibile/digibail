# ممیزی فنی تبدیل DigiBail به PHP 8.5

تاریخ ممیزی: 2026-11-01  
مخزن: `digibile/digibail`  
شاخه: `migration/php83-full-rebuild`  
مبنای ممیزی: commit `be23d46ce92dc157480aba96736737c6a2d57173`  
وضعیت: فقط بررسی خواندنی؛ هیچ فایل عملیاتی یا دیتابیس تغییری نکرده است.

## 1. نسخه هدف و سیاست سازگاری

آخرین نسخه پایدار رسمی PHP در تاریخ ممیزی PHP 8.5.12 است (انتشار 2026-10-21). نسخه هدف محیط جدید PHP 8.5 است. کد باید با PHP 8.3، 8.4 و 8.5 سازگار بماند و CI برای هر سه شاخه اجرا شود. استفاده از قابلیت‌هایی که فقط در 8.5 موجودند ممنوع است، مگر آنکه لایه سازگاری صریح و تست‌شده داشته باشند. نسخه‌های dependency باید با Composer lock تثبیت شوند. PHP 8.6 آزمایشی/غیرهدف عملیاتی است.

## 2. ساختار فعلی مخزن

درخت شاخه ممیزی‌شده 206 مسیر دارد. هسته فعلی هنوز PHP نیست:
- Node.js API: `backend/api.js` (1,384 خط)
- Node.js HTTP server: `server.js` (104 خط)
- Next.js server bridge: `next-server.js`
- Next.js/React frontend: `app/`
- صفحات HTML مستقل: `frontend/`, `web/`, `backend/security/`
- کنترلرها و سرویس‌های C# در `backend/security`, `backend/core`, `backend/ops`, `backend/contracts`, `backend/enterprise`, `backend/tenancy`
- فایل‌های PHP موجود در مبنای فعلی فقط `database/migration/migrate.php` و `database/migration/config.example.php` هستند. فایل migrate.php ابزار واردکردن داده قدیمی است و هسته برنامه PHP محسوب نمی‌شود.

در سورس بررسی‌شده، پروژه .NET کامل و مستقل با solution/project و pipeline build مشخص در درخت اصلی دیده نشد؛ فایل‌های C# موجود به شکل قطعات ماژولی هستند. پیش از حذف هر runtime باید تعیین شود کدام قطعات واقعاً در محیط تولید استفاده شده‌اند.

## 3. پایگاه‌های داده قدیمی و DDL تبدیل‌شده

سند مرجع: `docs/vamcity-database-inventory.md`. اطلاعات از متادیتای backupهای SQL Server در محیط ایزوله استخراج شده‌اند و آمار live database نیستند.

| منبع | جدول | ستون | رکورد |
|---|---:|---:|---:|
| `vamcityc_vamcity_import_20261028` | 88 | 957 | 531,172 |
| `vamcityc_bluvamdb_import_20261028` | 56 | 573 | 286,597 |
| `vamcityc_transferDb_import_20261028` | 12 | 78 | 29 |
| مجموع | 156 | 1,608 | 817,798 |

در inventory اصلی 188 FK، BlueVam تعداد 99 FK و انتقال وجه 8 FK ثبت شده است. DDLهای MariaDB موجود:
- `database/mysql/schema-main.sql`
- `database/mysql/schema-bluvamdb.sql`
- `database/mysql/schema-transfer.sql`
- `database/mysql/schema.sql` (ترکیب سه مجموعه)

مهم: فایل `backend/db/001_init.sql` یک schema جداگانه PostgreSQL است و از ویژگی‌هایی مانند BIGSERIAL، BOOLEAN، TIMESTAMPTZ، JSONB/JSON و partial index استفاده می‌کند. این فایل را نمی‌توان مستقیماً به‌عنوان schema MariaDB اجرا کرد. طراحی جدید باید ابتدا mapping نوع داده و constraintها را مستند کند؛ هیچ یک از DDLها بدون تطبیق و migration آزمایشی روی داده کپی‌شده اجرا نشود.

## 4. ماژول‌های دامنه شناسایی‌شده در C#

### امنیت و هویت
`SecurityController.cs` شامل captcha، درخواست/وضعیت/تأیید OTP، ورود، ثبت‌نام و ثبت‌نام همراه OCR است. `SecurityServices.cs` شامل captcha، rate limiting، SMS/Kavenegar، token issuer و OTP است. احراز هویت، نشست‌ها، hash رمز، OTP، rate limit، قفل حساب و audit باید در PHP معادل شوند.

### هسته و وام
`CoreControllers.cs` و `CoreModule.cs` شامل طرح‌های وام، کارت مجازی، تراکنش کارت، مدارک مشتری، OCR و inquiry است. فیلدهای مالی طرح شامل روش سود، نرخ، ضریب دیرکرد/زودکرد، هزینه عملیاتی و شروط/مدارک است. رمزنگاری PAN/CVV و کنترل دسترسی به فایل‌ها جزو الزامات امنیتی است.

### عملیات
`OpsControllers.cs` و `OpsModule.cs` شامل اعلام واریز و بازبینی، حساب‌های طرف تسویه، بازاریاب، تنظیمات برنامه، استعلام‌ها و سفارش خرید هستند. در کد فعلی، تأیید PaymentDeclaration فقط وضعیت همان رکورد را تغییر می‌دهد؛ ثبت خودکار قسط/سند مالی در آن پیاده نشده و نباید در port وانمود شود که وجود دارد.

### قراردادها
`ContractControllers.cs`, `ContractEngine.cs`, `ContractServices.cs` و `ContractModule.cs` شامل قالب نسخه‌دار، متغیرهای قرارداد، اتصال قرارداد به محصول، تولید قرارداد، رویدادها، پیش‌نمایش، تأیید، انتشار، بایگانی، امضا و رد قرارداد است. HTML پاک‌سازی‌شده، نسخه منتشرشده immutable، hash متن و منبع معتبر متغیرها باید حفظ شوند.

### حسابداری و حسابرسی
`EntControllers.cs` و `EntModule.cs` شامل audit hash-chain، سرفصل‌ها، اسناد دوطرفه، خطوط بدهکار/بستانکار، تراز آزمایشی و سند معکوس هستند. توازن بدهکار/بستانکار و غیرقابل‌ویرایش‌بودن سند ثبت‌شده باید در transaction دیتابیس enforce شود.

### چندمستاجری
`TenancyServices.cs` شامل Tenant middleware، tenant context، دامنه و تنظیمات tenant است. جداسازی داده‌ها بر اساس TenantId باید در تمام repository/service/queryهای PHP اعمال شود، نه صرفاً در UI.

## 5. شکاف‌های مهم بین صفحات و API

ممیزی نشان داد صفحات فرانت‌اند و APIهای واقعی هم‌راستا نیستند:

- `frontend/index.html` و `web/template-v3.html` از مسیرهای قدیمی `/api/v1/Auth/login`, `/Auth/register`, `/Auth/verify-otp`, `/Auth/me` استفاده می‌کنند؛ API فعلی Node مسیرهای `/api/v1/security/login`, `/register`, `/otp/verify` و `/security/me` دارد.
- `frontend/panel.html` تعداد زیادی endpoint برای کارت مجازی، tenants، payment declarations، counterparties، marketers، backup، audit، ledger و contract templates صدا می‌زند. این endpointها در router فعلی Node به‌صورت کامل پیاده نشده‌اند و بعضی از آنها فقط در قطعات C# وجود دارند.
- `frontend/register.html` مسیر `/api/v1/security/register/ocr` را صدا می‌زند، ولی API فعلی صریحاً HTTP 501 برمی‌گرداند تا زمانی که OCR provider واقعی تنظیم شود.
- `backend/core/files/CoreServices.cs` دارای NullOcrProvider است؛ OCR واقعی هنوز یکپارچه نشده است.
- README نیز می‌گوید OCR فعال نیست و SMS واقعی به تنظیم Kavenegar نیاز دارد.

نتیجه: تبدیل ظاهری HTML یا ترجمه endpointها کافی نیست. برای هر صفحه باید ماتریس UI → route → service → table/transaction → permission → test ساخته شود و endpointهای ناقص به‌عنوان «ناقص/غیرفعال» ثبت شوند، نه اینکه پاسخ ساختگی تولید شود.

## 6. معماری هدف PHP

هدف پیاده‌سازی: Modular Monolith با PHP 8.5، سازگار با 8.3/8.4، Composer، PDO، MariaDB، PHP-FPM و رندر سمت سرور. ساختار پیشنهادی:

- `public/`: front controller و assets عمومی
- `app/Core/`: bootstrap، DI، router، request/response، validation، error handling، security
- `app/Modules/Identity/`
- `app/Modules/Tenancy/`
- `app/Modules/Loans/`
- `app/Modules/Customers/`
- `app/Modules/Agents/`
- `app/Modules/Documents/`
- `app/Modules/Contracts/`
- `app/Modules/Payments/`
- `app/Modules/Transfers/`
- `app/Modules/Accounting/`
- `app/Modules/Audit/`
- `app/Modules/Notifications/`
- `app/Modules/Marketplace/` (فقط قابلیت‌هایی که در سورس و نیازمندی مصوب وجودشان تأیید شود)
- `app/Modules/Updater/`
- `resources/views/`: viewهای مستقل RTL
- `resources/assets/<module>/`: CSS مستقل هر ماژول و JS حداقلی
- `database/migrations/`: migrationهای افزایشی و نسخه‌دار
- `tests/Unit`, `tests/Integration`, `tests/Compatibility`

هر ماژول باید route، controller، service، repository، validation، policy، view، asset و test خودش را داشته باشد. CSS هر ماژول در namespace مستقل باشد. فقط tokenها، typography و reset در هسته مشترک باشند. منو و مجوزها از منبع واحد backend بیایند.

## 7. دروازه‌های اجباری پیش از انتقال و استقرار

1. تکمیل تطبیق تمام جدول‌ها/ستون‌ها/کلیدها/ایندکس‌ها و تفاوت سه دیتابیس با DDL MariaDB.
2. تکمیل فهرست routeها و عملیات UI و C# و تعیین وضعیت واقعی هرکدام.
3. mapping داده و شناسه‌ها، به‌ویژه GUID/uniqueidentifier، bigint identity، تاریخ‌های timezoneدار، decimal precision، Unicode، nullable/default و binary/file storage.
4. ساخت نسخه آزمایشی DB از backup؛ اجرای import و کنترل row count، orphan FK، duplicate، checksum نمونه و حفظ مقادیر مالی.
5. تست‌های unit/integration/security و compatibility در PHP 8.3/8.4/8.5.
6. backup و rollback عملیاتی قبل از تغییر دامنه یا PHP-FPM.
7. قطع Node/.NET فقط پس از اثبات parity قابلیت‌ها و تأیید سلامت production.

## 8. محدودیت اجرای فعلی

اتصال فعلی این کار به GitHub است؛ دسترسی مستقیم SSH، DirectAdmin و دیتابیس زنده در این نشست موجود نیست. بنابراین این ممیزی و تغییرات شاخه GitHub قابل انجام است، اما ارتقای PHP سرور، اجرای migration روی DB واقعی و استقرار دامنه از این اتصال قابل ادعا یا انجام نیست.

## 9. وضعیت

- [x] شاخه مستقل از main موجود است.
- [x] بررسی read-only ساختار مخزن و مسیرهای اصلی
- [x] بررسی سه DDL قدیمی MariaDB و schema جداگانه PostgreSQL
- [x] شناسایی شکاف endpoint بین صفحات و router فعلی
- [x] تعیین نسخه هدف PHP 8.5 و ماتریس سازگاری 8.3/8.4/8.5
- [ ] تکمیل mapping تمام routeها و عملیات UI به سرویس و جداول
- [ ] تکمیل مقایسه جزئی تمام ستون‌ها و constraintها در سه DB و DDL
- [ ] طراحی migration plan قابل بازگشت
- [ ] شروع پیاده‌سازی ماژول PHP پس از بستن موارد بالا
- [ ] اجرای CI و تست سازگاری
- [ ] استقرار آزمایشی و production

## 10. تطبیق شمار ستون‌های DDL با inventory

تطبیق برنامه‌ای DDLهای سه دیتابیس با ردیف‌های ستون در سند inventory انجام شد:
- دیتابیس اصلی: 957 ستون منبع + 77 ستون کمکی `__raw_*` در DDL = 1,034 ستون DDL؛ تطبیق عددی دقیق است.
- انتقال وجه: 78 ستون منبع + 5 ستون کمکی `__raw_*` = 83 ستون DDL؛ تطبیق عددی دقیق است.
- BlueVam: DDL شامل 626 ستون است که 54 مورد `__raw_*` هستند؛ در نتیجه 572 ستون متناظر با ستون‌های منبع وجود دارد. اما خلاصه ابتدای بخش BlueVam در inventory عدد 573 ستون اعلام کرده است. ردیف‌های جزئی ستون که در استخراج قابل شمارش بودند و DDL به 572 می‌رسند. این اختلاف یک‌ستونی باید در فایل استخراج/خلاصه metadata با منبع backup بازبینی و تعیین تکلیف شود؛ تا آن زمان BlueVam از دروازه تأیید schema عبور نکرده است.
- در هر سه DDL، تعداد جدول‌ها با inventory (88، 56 و 12) منطبق است و ستون‌های `__raw_*` برای حفظ نمایش دقیق تاریخ/زمان‌های SQL Server اضافه شده‌اند؛ این ستون‌ها نباید به‌عنوان ستون اصلی کسب‌وکار تفسیر شوند.

این کنترل نشان می‌دهد صرفاً مقایسه تعداد جدول‌ها کافی نیست؛ به‌ویژه اختلاف یک‌ستونی BlueVam باید پیش از ساخت migration نهایی بسته شود.
