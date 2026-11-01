# نقشه مهاجرت هویت و ورود DigiBail به PHP

تاریخ: 2026-11-01  
مخزن: `digibile/digibail`  
شاخه: `migration/php83-full-rebuild`  
وضعیت: تحلیل read-only؛ هیچ حساب، رمز، نقش یا جدول تغییری نکرده است.

## 1. منابع هویت موجود

### 1.1 حساب‌های SQL Server قدیمی

در دیتابیس اصلی، جدول‌های هویت ASP.NET شامل این موارد هستند:
- `AspNetUsers`: 54,628 رکورد
- `AspNetRoles`: 8 رکورد
- `AspNetUserRoles`: 54,625 رکورد
- `AspNetUserClaims`: 222 رکورد
- `AspNetRoleClaims`: 0 رکورد
- `AspNetUserLogins`: 0 رکورد
- `AspNetUserTokens`: 0 رکورد

در BlueVam:
- `AspNetUsers`: 49,867 رکورد
- `AspNetRoles`: 6 رکورد
- `AspNetUserRoles`: 49,864 رکورد
- `AspNetUserClaims`: 23 رکورد
- `AspNetRoleClaims`, `AspNetUserLogins`, `AspNetUserTokens`: صفر رکورد

در دیتابیس انتقال وجه:
- `AspNetUsers`: 1 رکورد
- `AspNetRoles`: 1 رکورد
- `AspNetUserRoles`: 1 رکورد
- جدول‌های claims/logins/tokens موجودند ولی رکوردی ندارند.

DDL MariaDB این جدول‌ها را با ساختار استاندارد Identity حفظ کرده است. شناسه کاربر و نقش BIGINT AUTO_INCREMENT است؛ جدول‌های link از کلید ترکیبی UserId/RoleId استفاده می‌کنند. ستون‌های مهم AspNetUsers عبارت‌اند از Id، FirstName، LastName، Mobile، Phone، UserName، NormalizedUserName، Email، PasswordHash، SecurityStamp، IsActive، NationalCode، LockoutEnd، LockoutEnabled، AccessFailedCount، AgentId، CustomerMarketerId و سایر فیلدهای کسب‌وکار. ستون‌ها و ترتیب کامل در schema-main و inventory اصلی ثبت شده‌اند.

### 1.2 حساب‌های جدید Node/PostgreSQL

`backend/db/001_init.sql` یک مدل جداگانه PostgreSQL ایجاد می‌کند:
- `users`: شناسه BIGSERIAL، username، phone، full_name، national_code، email، password_hash، role، is_active، created_at و updated_at.
- `captcha_challenges`: شناسه UUID، هش پاسخ، انقضا و زمان مصرف.
- `otp_challenges`: شناسه UUID، phone، purpose، code_hash، expires_at، resend_at، attempts، consumed_at و created_at.
- `audit_logs`: شناسه BIGSERIAL، user_id، event_type، ip_address، details JSONB و created_at.
- `legacy_source_data`: کلید مرکب source_table و legacy_id و payload JSONB برای نگهداری payloadهای قدیمی.
- `user_role_overrides` در منطق فعلی API برای نقش مؤثر کاربر استفاده شده است و باید با DDL کامل و migrationهای واقعی تطبیق داده شود.

این schema PostgreSQL است و نباید مستقیم روی MariaDB اجرا شود.

## 2. قراردادهای ورود فعلی

### ورود با نام کاربری/موبایل و رمز
Node route: `POST /api/v1/security/login`

رفتار مشاهده‌شده:
1. محدودیت تلاش بر اساس IP.
2. کپچای یک‌بارمصرف.
3. جست‌وجوی حساب با phone یا username.
4. بررسی فعال بودن حساب.
5. بررسی bcrypt برای حساب جدید.
6. در صورت عدم تطبیق، جست‌وجوی هش ASP.NET Identity در payload جدول legacy_source_data و بررسی آن.
7. پس از ورود موفق با هش قدیمی، ارتقای هش به bcrypt cost 12.
8. ثبت audit و صدور JWT.

### ورود OTP
- `GET /api/v1/security/captcha`
- `POST /api/v1/security/otp/request`
- `GET /api/v1/security/otp/status`
- `POST /api/v1/security/otp/verify`

کد OTP در PostgreSQL فقط به‌شکل HMAC/hash ذخیره می‌شود، پس از پنج تلاش ناموفق قفل می‌شود و انقضای 120 ثانیه و resend delay شصت ثانیه در مسیر Node دیده می‌شود. پیامک از provider تنظیم‌شده ارسال می‌شود. شماره موبایل باید نرمال شود و هدف login/register از هم جدا بماند.

### ثبت‌نام
`POST /api/v1/security/register`
- تیکت امضاشده JWT با purpose=register و issuer=digibail لازم است.
- کپچا الزامی است.
- نام، کد ملی، شماره و طول رمز اعتبارسنجی می‌شوند.
- حساب در users ساخته می‌شود.
- mirror به MariaDB تلاش می‌شود؛ خطای mirror فعلاً باعث fail شدن پاسخ ثبت‌نام نمی‌شود و فقط log می‌شود. این رفتار باید در طراحی انتقال به یک outbox/retry قابل مشاهده تبدیل شود تا حسابی بی‌صدا از دو مخزن جا نماند.

### بازیابی رمز
دو endpoint در Node وجود دارد:
- `POST /api/v1/security/password-reset/request`
- `POST /api/v1/security/password-reset/confirm`

در confirm، password hash جدید bcrypt می‌شود، OTP مصرف می‌شود و audit در یک transaction ثبت می‌شود. این مسیر باید در PHP حفظ شود.

### OCR ثبت‌نام
`POST /api/v1/security/register/ocr` در Node عمداً HTTP 501 برمی‌گرداند تا provider واقعی پیکربندی شود. در C# نیز NullOcrProvider وجود دارد. در PHP نباید پاسخ ساختگی یا OCR ظاهراً موفق ساخته شود.

## 3. قالب‌های هش رمز و سازگاری

شواهد کد فعلی:
- حساب‌های جدید Node با bcrypt cost 12 ذخیره می‌شوند.
- هش‌های قدیمی ASP.NET Identity v3 از payload قدیمی خوانده می‌شوند.
- C# PasswordHelper قالب Identity v3 را با header نسخه، شناسه PRF، تعداد iteration، طول salt، salt و subkey بررسی می‌کند. PRFهای SHA1/SHA256/SHA512 در کد پشتیبانی شده‌اند.
- در مسیر C#، هش‌های bcrypt نیز پشتیبانی می‌شوند، به شرط وجود BCrypt.Net.

الزام port:
1. هیچ هش موجودی هنگام import بازنویسی نشود.
2. PHP ابتدا bcrypt را با `password_verify` بررسی کند.
3. برای ASP.NET Identity v3، parser دقیق باینری و PBKDF2 با PRF و iterationهای ذخیره‌شده پیاده‌سازی و با test vectorهای ثابت آزمایش شود.
4. پس از ورود موفق به هش قدیمی، ارتقا به bcrypt cost 12 فقط در transaction انجام شود؛ اگر هش جدید نوشته نشد، ورود با هش قدیمی همچنان باید قابل تکرار باشد.
5. هیچ رمز خام یا هش کامل در log، audit یا پیام خطا ثبت نشود.
6. حسابی با قالب هش ناشناخته نباید با رمز تصادفی یا reset اجباری بی‌اجازه جایگزین شود.

## 4. اختلاف‌های معماری که باید حل شوند

- مدل قدیمی ASP.NET نقش‌ها را در `AspNetRoles` و `AspNetUserRoles` نگه می‌دارد؛ مدل جدید Node یک فیلد role در users دارد و نقش مؤثر را با user_role_overrides نیز می‌خواند. این دو مدل را نمی‌توان با یک ستون رشته‌ای ساده یکی فرض کرد.
- C# AuthAdapter به‌صورت reflection دنبال property ساده Role/RoleName/UserRole می‌گردد؛ اگر مدل EF فقط Identity join tables داشته باشد، registration از این adapter ممکن است fail شود. قبل از port باید مدل EF واقعی و mapping آن بررسی شود.
- شناسه‌های قدیمی BIGINT و شناسه‌های جدید در برخی جداول UUID هستند. هیچ ID نباید با cast ساده یا تولید ID جدید جایگزین شود. mapping باید source database + source table + legacy ID را کلید یکتا نگه دارد.
- داده اصلی و BlueVam همپوشانی قابل توجه در AspNetUsers دارند؛ تعداد کاربران را نباید با جمع ساده به تعداد اشخاص یکتا تبدیل کرد. تطبیق باید بر اساس شناسه منبع، username، normalized username، phone و قواعد تعارض مصوب انجام شود.
- mirror فعلی Node به MariaDB به‌صورت best-effort است. PHP target باید منبع حقیقت را مشخص کند و همگام‌سازی را با outbox/retry، idempotency key و گزارش خطا پیاده کند.
- در C#، CaptchaService و RateLimiter از IMemoryCache استفاده می‌کنند؛ این برای چند worker یا چند سرور، وضعیت مشترک و یکپارچه نمی‌دهد. PHP production باید challenge و rate limit را در MariaDB یا cache مشترک پایدار نگه دارد و مصرف challenge اتمیک باشد.
- OTP C# دارای Ip، SendStatus و SendInfo است؛ schema جدید PostgreSQL در بخش فعلی این فیلدها را ندارد. تصمیم نهایی باید بر اساس migrationهای کامل و نسخه عملیاتی باشد، نه افزودن/حذف خودسرانه ستون.

## 5. مدل مقصد PHP پیشنهادی، بدون تغییر منبع قدیمی

- حفظ جدول‌های `AspNetUsers`, `AspNetRoles`, `AspNetUserRoles`, claims و tokens به‌عنوان داده legacy تا پایان parity و دوره بازگشت.
- ساخت لایه Identity PHP که نقش مؤثر را از رابطه‌های واقعی و overrideهای تأییدشده محاسبه کند؛ نه از نقش hardcoded در UI.
- افزودن جدول‌های مقصد برای OTP، captcha، password reset، audit و sync outbox فقط پس از تعیین source of truth و schema نهایی MariaDB.
- ایجاد نگاشت هویت مستقل با unique key روی (source_system, source_table, source_id).
- اجرای login bridge برای حفظ ورود حساب‌های قدیمی و upgrade هش فقط بعد از احراز موفق.
- JWT باید از نظر issuer، audience، algorithm، key length، expiry و claim names با کلاینت‌های فعلی سازگار بماند.
- نشست‌ها، cookie/token transport، logout/revocation، CORS، CSRF و rate limit باید به‌عنوان رفتارهای صریح تست شوند.

## 6. تست‌های پذیرش الزامی

- ورود با username و phone.
- ورود با bcrypt فعلی.
- ورود با ASP.NET Identity v3 برای هر PRF موجود و upgrade امن.
- رد رمز نادرست، حساب غیرفعال و حساب قفل‌شده.
- OTP login و register، انقضا، resend delay، پنج تلاش ناموفق، مصرف یک‌باره و درخواست همزمان.
- کپچا یک‌بارمصرف، انقضا و محدودیت IP.
- ثبت‌نام با شماره تکراری، کد ملی تکراری و ticket منقضی.
- بازیابی رمز با OTP و rollback در خطای transaction.
- نقش Admin/SuperAdmin/Agent/Customer و claims چندگانه از جدول‌های واقعی.
- تست تعارض کاربر بین main و BlueVam و transfer بدون ادغام اشتباه.
- تست سازگاری API قدیمی `/api/v1/Auth/*` و مسیر canonical `/api/v1/security/*`.
- اجرای تمام تست‌ها روی PHP 8.3، 8.4 و 8.5.

## 7. موارد باز پیش از پیاده‌سازی Identity

- [ ] خواندن تمام migrationهای PostgreSQL مربوط به users، user_role_overrides، OTP، audit و sync.
- [ ] تعیین schema نهایی MariaDB برای کاربران جدید و legacy؛ بدون ایجاد دو منبع حقیقت.
- [ ] مستندسازی role names/IDs واقعی در main، BlueVam و transfer.
- [ ] بررسی نسخه عملیاتی JWT و transport آن در صفحات موجود.
- [ ] تهیه test vectors از hashهای Identity بدون افشای خود hashها یا اطلاعات کاربران.
- [ ] تعیین سیاست merge تعارض کاربران بین سه منبع و کلید یکتای identity map.

تا بسته‌شدن این موارد، endpointهای ورود/ثبت‌نام PHP به‌صورت mock یا نیمه‌کاره منتشر نمی‌شوند.
