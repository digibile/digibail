# پایگاه مرجع لینوکسی VamCity

## مشخصات قطعی

- مخزن: `digibile/digibail`
- نام پایگاه مرجع اصلی: `vamcitydigibilepay`
- موتور مقصد: MariaDB 10.6
- فایل ساخت پایگاه: `database/mysql/create-vamcitydigibilepay.sql`
- فایل ساختار کامل پایگاه اصلی: `database/mysql/schema-main.sql`
- ابزار انتقال داده: `database/migration/migrate.php`
- نمونه تنظیمات اتصال: `database/migration/config.example.php`

## ساختار تبدیل‌شده موجود

فایل `schema-main.sql` از متادیتای بکاپ SQL Server با نام `vamcityc_vamcity_import_20261028` تولید شده است. شمارش مستقیم فایل در مخزن:

- ۸۸ جدول
- ۱۸۸ تعریف کلید خارجی

فهرست مستند منبع نیز ۸۸ جدول، ۹۵۷ ستون و ۵۳۱٬۱۷۲ رکورد را برای پایگاه اصلی گزارش کرده است. تعداد رکوردهای بالا مربوط به منبع SQL Server است، نه اثبات انتقال داده به مقصد.

## روش نصب ساختار

روی سرور Linux دارای MariaDB:

```bash
mysql -u USER -p < database/mysql/create-vamcitydigibilepay.sql
mysql -u USER -p vamcitydigibilepay < database/mysql/schema-main.sql
```

در DirectAdmin اگر کاربر اجازه CREATE DATABASE ندارد، پایگاه `vamcitydigibilepay` را از بخش MySQL Management بسازید و فقط دستور دوم را اجرا کنید. نام کاربری و گذرواژه واقعی در Git ثبت نشود.

## تبدیل داده

ابزار `database/migration/migrate.php` انتقال جریانی از SQL Server ایزوله به MariaDB را انجام می‌دهد. ابتدا فقط بررسی:

```bash
php database/migration/migrate.php --dry-run
```

انتقال واقعی فقط پس از اطمینان از وجود پایگاه مقصد، دسترسی کاربر، فضای دیسک، نسخه پشتیبان مقصد و تطبیق ساختار انجام شود:

```bash
php database/migration/migrate.php --execute
```

این سند به معنی اجرای نصب یا انتقال روی سرور نیست. هیچ رکوردی را صرفاً بر اساس شمارش بکاپ، منتقل‌شده فرض نکنید.

## نگاشت‌های اصلی نوع داده

- SQL Server `uniqueidentifier` به `CHAR(36)` با collation باینری
- `nvarchar` به `VARCHAR` یا `LONGTEXT` با `utf8mb4`
- `decimal(p,s)` به `DECIMAL(p,s)`
- `datetime2` به `DATETIME(6)` همراه ستون `__raw_...` برای نگهداری مقدار دقیق اصلی
- `bit` به `TINYINT(1)`
- ستون‌های Identity به `AUTO_INCREMENT` در موارد تعریف‌شده در ساختار مقصد

این نگاشت‌ها در فایل SQL مقصد پیاده شده‌اند؛ بررسی رفتار برنامه و سازگاری کوئری‌ها همچنان لازم است.

## پایگاه‌های جانبی

منابع BlueVam و TransferDb در این مرحله به پایگاه مرجع وارد نمی‌شوند. آن‌ها منابع مستقل هستند و تا زمان بررسی وابستگی‌های برنامه، طرح‌واره و تعارض نام جدول‌ها باید جدا بمانند. اسکریپت انتقال مرجع فقط منبع اصلی `vamcityc_vamcity_import_20261028` را به مقصد یگانه `vamcitydigibilepay` منتقل می‌کند.
