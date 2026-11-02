# نگاشت ساختاری زنده MariaDB به مدل فعلی برنامه

تاریخ استخراج: 2026-11-02  
منبع: خروجی فقط‌خواندنی workflow ممیزی ساختار production؛ فقط metadata مربوط به نام جدول، ستون، نوع داده و foreign key استفاده شده است. هیچ مقدار رکورد مشتری در این سند درج نشده است.

## کنترل صحت inventory

- MariaDB: نسخه 10.6.17
- جدول‌های پایه: ۲۲۴
- ستون‌ها: ۲٬۵۰۰
- اجزای ایندکس: ۷۶۶
- اجزای foreign key: ۴۰۵
- جدول‌ها InnoDB هستند؛ خروجی خام log یک سطر خالی انتهایی هم دارد که در شمارش واقعی لحاظ نشده است.
- این اعداد از snapshot زنده قبلی‌اند و پیش از backup باید دوباره روی production تأیید شوند.

## نگاشت قطعی در سطح ساختار

| قابلیت | جدول مرجع زنده | ستون‌ها و روابط تأییدشده | تصمیم برای برنامه جدید |
|---|---|---|---|
| کاربران | `AspNetUsers` | `Id BIGINT AUTO_INCREMENT`، `UserName`، `NormalizedUserName`، `PasswordHash`، `PhoneNumber`، `Mobile`، `Phone`، `CustomerId CHAR(36)`، `IsActive` و فیلدهای اختصاصی | منبع هویت؛ جدول `users` برنامه جدید نباید به‌عنوان مرجع دوم باقی بماند. انتخاب دقیق شماره تماس و سازگاری hash قبل از تغییر login باید بررسی شود. |
| نقش‌ها | `AspNetRoles`, `AspNetUserRoles` | شناسه نقش و کاربر هر دو BIGINT؛ FK واقعی به `AspNetRoles.Id` و `AspNetUsers.Id` | نقش متنی ستون `users.role` به رابطه استاندارد نقش تبدیل می‌شود؛ نقش‌ها و مجوزهای واقعی باید قبل از تغییر authorization استخراج شوند. |
| مشتری/مستأجر تجاری | `Customers` | `Id CHAR(36)`، `Name`، `Mobile`، `Email`، `Code`، وضعیت و تاریخ‌های ثبت/انقضا | از کاربر سامانه جداست؛ `AspNetUsers.CustomerId` مرز مشتری/مجموعه را نگه می‌دارد. ادغام این دو ممنوع. |
| دفترچه مخاطبان | `Contacts` | `Id CHAR(36)`، `FullName`، `BusinessName`، `Phone`، `Address`، `BankInfo`، `CustomerId` | با مشتری یا کاربر احراز هویت یکی نیست. |
| تعریف عملیاتی طرح/وام | `Loans` | `Id CHAR(36)`؛ `Title`، `Code`، درصدهای سود/تأخیر/تسویه زودهنگام، `CustomerId`، `MaxAmount`، `AllowedInstallments`، `CostsJson`، وضعیت فعال/غیرفعال | این جدول مالک عملیاتی درخواست‌ها و وام‌های صادرشده است؛ FK درخواست و وام فعال به آن اشاره می‌کند. |
| کاتالوگ طرح جدید | `LoanProducts` | `Id`, `TenantId`, `Name`, `Slug`, `MinAmount`, `MaxAmount`, `TiersJson`, `ConditionsJson`, `DocumentsJson`, `InterestMethod`, `InterestPercent`, `OperationalCostsJson` و فیلدهای نمایش | در production واقعاً وجود دارد و ۲۶ ستون دارد. کاندید مستقیم‌تر برای مدل `loan_products` برنامه جدید است؛ اما `TenantId` اجباری و unique بودن slug باید در طراحی repository رعایت شود. این جدول را با `Loans` یکی نکنید. |
| درخواست وام | `UserLoanRequests` | `Id CHAR(36)`, `UserId BIGINT`, `LoanId CHAR(36)`, `CustomerId CHAR(36)`, `RequestDate`, `Amount`, `InstallmentCount`, `StatusId`, `AgentStatusId`, `AgentId`, `SponsorId`, `Code` | FK زنده به `AspNetUsers`, `Loans` و `LoanRequestStatuses` تأیید شده است. جدول دوم `loan_requests` یا `customer_loan_applications` ساخته نشود. |
| تاریخچه وضعیت درخواست | `UserLoanRequestStatusHistories` | `UserLoanRequestId CHAR(36)`, `UserId BIGINT`, `DateTime`, وضعیت قبل/بعد و CustomerId | FK زنده به درخواست، کاربر و وضعیت‌ها دارد؛ جایگزین مستقیم‌تر برای `loan_request_status_history` است. |
| وام صادرشده/حساب وام | `UserLoans` | `Id CHAR(36)`, `UserId BIGINT`, `LoanId CHAR(36)`, `UserLoanRequestId CHAR(36)`, `Amount`, `Installment`, `Paid`, `Remain`, تاریخ‌ها، وضعیت و عامل | حساب وام مستقل از درخواست است؛ نباید با `UserLoanRequests` ادغام شود. |
| پرداخت قسط | `UserLoanPayments` | `Id`, `UserLoanId`, `InstallmentNumber`, `Amount`, `SaveDate`, `PaymentMethod`, `DelayPrice`, `Discount` و ستون‌های پیگیری | FK به `UserLoans.Id` تأیید شده؛ محاسبات پولی باید سمت backend و با تست تطبیقی بماند. |
| درخواست/تأیید پرداخت | `UserLoanPaymentRequests` | `UserLoanPaymentId`, `RequestDate`, `PaymentDate`, `Amount`, `Status`, `TrackNumber`, `AdminAcceptorId`, `AffectOnMainPayment` | FK به پرداخت و کاربر تأییدکننده دارد؛ با خود پرداخت یکی نیست. |
| پیوست مدارک درخواست | `UserLoanRequestAuthorizationItems`, `UserLoanRequestAuthorizationItemAttachments` | آیتم مجوز، شناسه درخواست، نوع/وضعیت، توضیح و پیوست | `customer_documents` برنامه جدید معادل یک‌به‌یک این ساختار نیست؛ نوع مدرک، محل فایل، مالک و گردش بررسی باید تطبیق داده شود. |
| محتوای سایت | `SiteContents` | `Id CHAR(36)`, `Key`, `Content LONGTEXT`, `IsJson`, `CustomerId` | برای homepage/content موجود است؛ جدول دوم `homepage_content` نسازید. |
| تنظیمات و درگاه‌ها | `AppSettings` | `CustomerId`، تنظیمات درگاه، پیامک، ایمیل، بانک، لینک‌ها و JSONهای تنظیمات | منبع تنظیمات موجود؛ اسرار نباید در گزارش، log یا frontend نمایش داده شوند. |
| الگوی پیامک | `SmsPatterns` | `Id`, `Title`, `Pattern`, `Status`, `CustomerId`, `Category`, `IppanelKeysJson` | کاندید نگاشت `sms_templates` است، با تطبیق معنای وضعیت و پنل. |
| لاگ پیامک | `AppSms` | `Id`, `Date`, `Text`, `Price`, `Status`, `To`, `CustomerId`, `EntityId`, `SmsPanel`, `SMSKey` | کاندید نگاشت `sms_logs` است؛ اطلاعات گیرنده در UI/log باید محدود و ماسک شود. |

## روابط کلیدی تأییدشده از foreign keyهای production

- `AspNetUserRoles.UserId -> AspNetUsers.Id`
- `AspNetUserRoles.RoleId -> AspNetRoles.Id`
- `UserLoanRequests.UserId -> AspNetUsers.Id`
- `UserLoanRequests.LoanId -> Loans.Id`
- `UserLoanRequests.StatusId/AgentStatusId -> LoanRequestStatuses.Id`
- `UserLoanRequestStatusHistories.UserLoanRequestId -> UserLoanRequests.Id`
- `UserLoanRequestStatusHistories.UserId -> AspNetUsers.Id`
- `UserLoans.UserLoanRequestId -> UserLoanRequests.Id`
- `UserLoans.LoanId -> Loans.Id`
- `UserLoanPayments.UserLoanId -> UserLoans.Id`
- `UserLoanPaymentRequests.UserLoanPaymentId -> UserLoanPayments.Id`
- `UserLoanPaymentRequests.AdminAcceptorId -> AspNetUsers.Id`

## اختلاف‌های مهم با PostgreSQL فعلی

### کاربران و نقش‌ها
- PostgreSQL `users.id` از نوع BIGSERIAL است و جدول `users.role` نقش را به شکل متن نگه می‌دارد.
- MariaDB `AspNetUsers.Id` و `AspNetRoles.Id` هر دو BIGINT هستند، ولی نقش از رابطه `AspNetUserRoles` می‌آید.
- MariaDB فیلدهای `Phone`, `Mobile`, `PhoneNumber` را جداگانه دارد؛ بدون بررسی منطق login نباید یکی را به‌جای دیگری انتخاب کرد.
- الگوریتم و قالب `PasswordHash` باید با verify واقعی آزمایش شود؛ انتقال یا بازنویسی hash بدون تست ممنوع است.

### طرح‌ها
- PostgreSQL `loan_products` شامل ستون‌های اختصاصی import مانند `legacy_source_table`, `legacy_id`, `legacy_payload`, `needs_review` است و ساختار JSONB دارد.
- MariaDB `LoanProducts` ستون‌های مشابه کاتالوگ را با نام PascalCase/JSON متنی دارد، اما `TenantId` اجباری و `CreatedOn` موجود است.
- MariaDB `Loans` موجودیت دیگری است و درخواست‌های عملیاتی واقعاً به آن FK دارند. نگاشت مدل کاتالوگ به `Loans` اشتباه است.
- راهکار پیشنهادی: کاتالوگ `loan_products` به `LoanProducts` تطبیق داده شود؛ درخواست/صدور وام از `UserLoanRequests` و `UserLoans` استفاده کند. هر اتصال میان کاتالوگ و `Loans` باید صریح و با قاعده کسب‌وکار تأیید شود، نه با حدس.

### سایر مدل‌های اختصاصی
- `legacy_customers` نباید جایگزین `Customers` شود؛ باید داده‌های موجود و معنای CustomerId مقایسه شوند.
- `sms_templates` و `sms_logs` به‌ترتیب با `SmsPatterns` و `AppSms` کاندید هستند؛ schema و معنای وضعیت باید تطبیق شود.
- `homepage_content` با `SiteContents` کاندید است.
- `otp_challenges`, `captcha_challenges`, `audit_logs`, `customer_contracts`, `newsletter_subscribers`, `blog_posts` معادل دقیق تأییدشده ندارند؛ فقط پس از بررسی قابلیت فعال و عدم وجود جایگزین می‌توان برای آن‌ها طراحی مستقل کرد.
- `customer_documents` با ساختارهای پیوست مدارک درخواست و الزامات تضمین، رابطه یک‌به‌یک ندارد.

## مواردی که هنوز انجام نشده‌اند

- هیچ شمارش دقیق رکورد از business tableها برای این سند اجرا نشده است؛ `TABLE_ROWS` در InnoDB تخمینی است.
- هیچ داده‌ای بین PostgreSQL و MariaDB کپی نشده است.
- هیچ جدول یا ستونی تغییر نکرده است.
- backup کامل و restore آزمایشی هنوز اجرا/تأیید نشده است.
- سازگاری password hash، JWT subject، شناسه‌های tenant/customer، محاسبات اقساط و تراکنش‌های مالی هنوز باید با تست کد و داده آزمایشی بررسی شود.
- این سند mapping ساختاری است، نه مجوز cutover.
