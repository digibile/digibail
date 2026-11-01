# ماتریس تطبیق API برای مهاجرت PHP

مبنای بررسی: `migration/php83-full-rebuild`، commit مبنا `be23d46ce92dc157480aba96736737c6a2d57173`.  
این سند فقط inventory مسیرهاست؛ تعداد مسیرها به معنی اثبات کارکرد یا تست endpoint نیست.

## خلاصه شمارش

- 46 مسیر شرطی/route literal در router فعلی Node `backend/api.js` شناسایی شد.
- 80 ترکیب route/action از کنترلرهای C# در Security، Core، Ops، Contracts و Enterprise شناسایی شد. بعضی مسیرها پارامتری‌اند و یک route template چند عملیات HTTP دارد.
- 31 خانواده مسیر در `frontend/panel.html` ارجاع شده است.
- 18 خانواده از مسیرهای پنل در router فعلی Node تطبیق مستقیم ندارند؛ بخش مهمی از آنها در کنترلرهای C# موجودند، اما این قطعات در router Node خودکار ثبت نشده‌اند.

## اختلاف‌های قطعی

### مسیرهای قدیمی احراز هویت در صفحه اصلی
`frontend/index.html` و `web/template-v3.html` از این مسیرها استفاده می‌کنند:
- `/api/v1/Auth/login`
- `/api/v1/Auth/register`
- `/api/v1/Auth/verify-otp`
- `/api/v1/Auth/me`

router فعلی Node به‌جای آن مسیرهای زیر را دارد:
- `/api/v1/security/login`
- `/api/v1/security/register`
- `/api/v1/security/otp/verify`
- `/api/v1/security/me`

این اختلاف باید با adapter سازگار یا اصلاح هماهنگ فرانت‌اند حل شود؛ تغییر ناگهانی مسیرهای عمومی بدون حفظ backward compatibility ممنوع است.

### خانواده مسیرهای پنل که در Node router تطبیق مستقیم ندارند
- `/api/v1/admin/app-settings`
- `/api/v1/admin/audit`
- `/api/v1/admin/audit/verify`
- `/api/v1/admin/backups`
- `/api/v1/admin/contract-templates`
- `/api/v1/admin/contract-variables`
- `/api/v1/admin/contract-variables/sync-defaults`
- `/api/v1/admin/counterparties`
- `/api/v1/admin/inquiries`
- `/api/v1/admin/ledger/accounts`
- `/api/v1/admin/ledger/entries`
- `/api/v1/admin/ledger/trial-balance`
- `/api/v1/admin/marketers`
- `/api/v1/admin/orders`
- `/api/v1/admin/payment-declarations`
- `/api/v1/admin/tenants`
- `/api/v1/admin/virtual-cards`
- `/api/v1/admin/virtual-cards/issue`

بخشی از این خانواده‌ها در کنترلرهای C# با نقش‌های Admin/SuperAdmin تعریف شده‌اند. برای PHP باید رفتار، ورودی/خروجی، policy، تراکنش و جداول هر endpoint port و تست شود، نه اینکه پاسخ خالی یا mock برگردانده شود.

## قابلیت‌های شناسایی‌شده در کنترلرهای C#

- Identity: captcha، login، OTP request/status/verify، register و OCR register
- Loan products: فهرست عمومی، نمایش با slug، ایجاد/ویرایش، seed، labels، toggle، تصویر و قراردادهای متصل
- Virtual cards: فهرست مشتری، reveal، freeze/unfreeze، transaction history، issue، limit، admin transactions و gateway card charge
- Documents: فهرست/آپلود مشتری، دریافت فایل، تغییر فیلدها، حذف، فهرست مدیر و review
- Payment declarations: ایجاد مشتری، فهرست مدیر و review
- Counterparties و Marketers: فهرست/ایجاد/ویرایش
- App settings: app config عمومی و admin settings
- Inquiries و Orders: ایجاد، نتیجه و تغییر وضعیت
- Backups: فهرست و ایجاد backup و دانلود نام‌دار؛ restore از API عمداً ارائه نشده
- Contracts: template CRUD، validate، version، approve، publish، archive، preview، sample upload/download، variables، product links، readiness، generate، events، values، HTML، sign و reject
- Audit/Ledger: audit list/verify، account list/create، entries، reverse، trial balance
- Health: health endpoint عمومی

## وضعیت‌های ناقص/غیرفعال که باید صادقانه حفظ شوند

- OCR ثبت‌نام در router فعلی Node با HTTP 501 برمی‌گردد.
- سرویس OCR در C# دارای NullOcrProvider است و OCR واقعی به provider و کلید محرمانه نیاز دارد.
- پیامک واقعی به تنظیمات معتبر Kavenegar نیاز دارد.
- Beta inquiry در کنترلر C# به مستندات/اتصال provider واقعی وابسته است.
- تأیید اعلام واریز فعلی صرفاً وضعیت PaymentDeclaration را تغییر می‌دهد؛ این عملیات به ثبت قسط یا سند حسابداری متصل نشده است.
- عملیات restore backup از API عمداً ارائه نشده است.

## قواعد port به PHP

1. برای هر endpoint، روش HTTP، مسیر، DTO، validation، response schema، status code، permission و side effect ثبت شود.
2. قراردادهای قدیمی فرانت‌اند با adapter/versioning حفظ شوند تا هیچ لینک یا صفحه قبلی ناگهان از کار نیفتد.
3. routeهای C# که در Node router وجود ندارند، تنها پس از بررسی مدل و رفتار کامل به PHP اضافه شوند.
4. هیچ endpoint غیرفعالی با mock یا داده ساختگی «موفق» نشان داده نشود.
5. تست قرارداد API برای هر مسیر در PHP 8.3، 8.4 و 8.5 اجرا شود.
