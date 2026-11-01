# ماتریس تطبیق API برای مهاجرت PHP

تاریخ بازبینی: 2026-11-01  
مخزن: `digibile/digibail`  
شاخه: `migration/php83-full-rebuild`  
مبنای استخراج مسیرها: `backend/api.js` و `php/app/Core/Bootstrap.php`

> این سند فهرست مسیرهای صریح API در Node.js را ثبت می‌کند و وضعیت ثبت مسیر در PHP را نشان می‌دهد. ثبت‌شدن مسیر به‌تنهایی به معنی تکمیل منطق کسب‌وکار، برابری داده‌ها یا آماده‌بودن برای تولید نیست.

## 1. خلاصه وضعیت

- مسیرهای صریح استخراج‌شده از API فعلی Node.js: **50**
- مسیرهای کسب‌وکاری ثبت‌شده در PHP در این مرحله: **15** مسیر امنیت/هویت شامل مسیرهای سازگاری قدیمی و مسیر OCR با پاسخ 501.
- مسیرهای دامنه‌ای که هنوز در PHP پیاده‌سازی نشده‌اند: **40** مسیر از فهرست 50تایی Node.
- مسیرهای سلامت PHP: `GET /health/live` و `GET /health/ready`؛ این دو مسیر در شمار 50 مسیر API کسب‌وکار Node نیستند.

توجه: بعضی مسیرهای Node چندبار با منطق شرطی یا alias استفاده می‌شوند؛ این ماتریس بر اساس زوج یکتای HTTP method + path تهیه شده است.

## 2. امنیت و هویت

| روش | مسیر Node.js | وضعیت PHP |
|---|---|---|
| GET | `/api/v1/security/me` | پیاده‌سازی اولیه؛ رفتار و منبع هویت نیازمند تطبیق نهایی |
| POST | `/api/v1/security/password-reset/request` | پیاده‌سازی شده؛ OTP و CAPTCHA |
| POST | `/api/v1/security/password-reset/confirm` | پیاده‌سازی شده؛ ticket یک‌بارمصرف و تغییر رمز تراکنشی |
| GET | `/api/v1/security/captcha` | پیاده‌سازی شده |
| POST | `/api/v1/security/login` | پیاده‌سازی اولیه روی MariaDB اصلی |
| POST | `/api/v1/security/otp/request` | پیاده‌سازی شده؛ Kavenegar و challenge هش‌شده |
| GET | `/api/v1/security/otp/status` | پیاده‌سازی شده |
| POST | `/api/v1/security/otp/verify` | پیاده‌سازی شده؛ ticket یک‌بارمصرف |
| POST | `/api/v1/security/register` | پیاده‌سازی اولیه روی جداول هویت MariaDB اصلی |
| POST | `/api/v1/security/register/ocr` | عمداً HTTP 501؛ مطابق رفتار فعلی تا زمان اتصال OCR واقعی |

مسیرهای سازگاری قدیمی PHP که علاوه بر مسیرهای بالا نگه داشته شده‌اند:
- `GET /api/v1/Auth/captcha`
- `POST /api/v1/Auth/login`
- `POST /api/v1/Auth/register`
- `POST /api/v1/Auth/verify-otp`
- `GET /api/v1/Auth/me`

## 3. تنظیمات مستأجر و محصولات وام

| روش | مسیر Node.js | وضعیت PHP |
|---|---|---|
| GET | `/api/v1/tenant/config` | در انتظار پیاده‌سازی |
| GET | `/api/v1/loan-products` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/loan-products/legacy-candidates` | در انتظار پیاده‌سازی |
| POST | `/api/v1/admin/loan-products/import-legacy` | در انتظار پیاده‌سازی |
| POST | `/api/v1/admin/loan-products` | در انتظار پیاده‌سازی |

## 4. مدیریت و هوش مصنوعی

| روش | مسیر Node.js | وضعیت PHP |
|---|---|---|
| POST | `/api/v1/admin/ai/story` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/ai/stories` | در انتظار پیاده‌سازی |
| POST | `/api/v1/admin/ai/stories` | در انتظار پیاده‌سازی |
| POST | `/api/v1/admin/ai/story/generate` | در انتظار پیاده‌سازی |
| POST | `/api/v1/admin/ai/story/audio` | در انتظار پیاده‌سازی |
| POST | `/api/v1/admin/ai/story/image` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/loan-requests` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/summary` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/users` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/roles` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/users-page` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/legacy-customers` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/legacy-customers-page` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/legacy-agents-page` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/legacy-source-tables` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/legacy-source-data` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/legacy-relational-tables` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/legacy-relational-data` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/beta-inquiries` | در انتظار پیاده‌سازی |

## 5. پیامک، اسناد و قراردادها

| روش | مسیر Node.js | وضعیت PHP |
|---|---|---|
| GET | `/api/v1/admin/sms/settings` | در انتظار پیاده‌سازی |
| POST | `/api/v1/admin/sms/settings` | در انتظار پیاده‌سازی |
| POST | `/api/v1/admin/sms/test` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/sms/templates` | در انتظار پیاده‌سازی |
| POST | `/api/v1/admin/sms/templates/update` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/sms/logs` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/documents` | در انتظار پیاده‌سازی |
| POST | `/api/v1/admin/documents/review` | در انتظار پیاده‌سازی |
| GET | `/api/v1/admin/contracts` | در انتظار پیاده‌سازی |
| POST | `/api/v1/admin/contracts/create` | در انتظار پیاده‌سازی |

## 6. مشتری و درخواست‌ها

| روش | مسیر Node.js | وضعیت PHP |
|---|---|---|
| POST | `/api/v1/beta/inquiry` | در انتظار پیاده‌سازی |
| GET | `/api/v1/me/loan-applications` | در انتظار پیاده‌سازی |
| POST | `/api/v1/me/loan-applications` | در انتظار پیاده‌سازی |
| GET | `/api/v1/me/documents` | در انتظار پیاده‌سازی |
| POST | `/api/v1/me/documents` | در انتظار پیاده‌سازی |
| GET | `/api/v1/me/contracts` | در انتظار پیاده‌سازی |

## 7. مانع مهم برابری داده‌ها

API فعلی Node.js فقط روی MariaDB کار نمی‌کند:
- حساب‌های جاری و برخی داده‌های قدیمی از PostgreSQL خوانده می‌شوند.
- حساب‌های قدیمی در سه مجموعه MariaDB اصلی، BlueVam و انتقال وجه وجود دارند.
- ثبت‌نام Node ابتدا در PostgreSQL ثبت می‌شود و سپس برای mirror به MariaDB تلاش می‌کند.
- پیاده‌سازی فعلی PHP هویت را مستقیماً از MariaDB اصلی می‌خواند و ثبت‌نام را نیز در همان جداول اصلی می‌نویسد.

بنابراین، با وجود پیاده‌سازی مسیرهای ورود و ثبت‌نام، **برابری رفتار با Node و یکپارچگی همه منابع هویت هنوز تأیید نشده است**. پیش از جابه‌جایی ترافیک باید سیاست منبع حقیقت هویت، نگاشت شناسه‌ها، نقش‌های هم‌نام، حساب‌های PostgreSQL-only و outbox/retry همگام‌سازی تعیین و با داده کپی‌شده آزمایش شود.

## 8. ترتیب پیشنهادی ادامه مهاجرت

1. تکمیل ماتریس هویت و منبع حقیقت PostgreSQL/MariaDB و آزمون ورود برای هر سه منبع قدیمی.
2. مدیریت مستأجر، تنظیمات و فهرست طرح‌های وام.
3. درخواست وام، وضعیت‌ها، مدارک و پیوست‌ها.
4. کاربران، نقش‌ها، دسترسی‌های مدیریتی و گزارش‌های عملیاتی.
5. پیامک، قراردادها، OCR و اسناد.
6. درخواست‌های پرداخت، تراکنش‌ها، تسویه و انتقال وجه.
7. حسابداری، کیف پول، audit و سایر ماژول‌های دامنه.
8. تبدیل صفحات HTML/React/Next به PHP و CSS مستقل هر بخش، پس از تثبیت APIهای متناظر.
9. تطبیق داده، آزمون پذیرش، برنامه rollback و سپس استقرار کنترل‌شده.

هیچ جدول عملیاتی یا runtime فعلی صرفاً به دلیل ایجاد این شاخه حذف یا جایگزین نمی‌شود.
