# موجودی رابط کاربری و دارایی‌های CSS برای مهاجرت PHP

مبنای بررسی: `migration/php83-full-rebuild` و commit مبنا `be23d46ce92dc157480aba96736737c6a2d57173`. این سند inventory ساختاری است و هیچ assetی را جابه‌جا یا تغییر نمی‌دهد.

## یافته اصلی CSS

صفحات مستقل HTML فعلی تقریباً همگی CSS را داخل `<style>` و JavaScript را داخل `<script>` نگه می‌دارند؛ هیچ‌یک از صفحات HTML بررسی‌شده stylesheet خارجی اختصاصی نداشتند. در نتیجه CSS هر صفحه باید هنگام port به PHP استخراج و به asset مستقل همان ماژول تبدیل شود. CSS مشترک فقط برای design tokens، فونت، reset و اجزای پایه مجاز است.

صفحات بررسی‌شده:
- `web/admin.html`
- `web/agents.html`
- `web/contracts.html`
- `web/customer-panel.html`
- `web/customers.html`
- `web/documents.html`
- `web/loan-definition.html`
- `web/loan-requests.html`
- `web/privacy.html`
- `web/sms-settings.html`
- `web/terms.html`
- `web/template-v3.html`
- `frontend/index.html`
- `frontend/login.html`
- `frontend/panel.html`
- `frontend/register.html`
- `backend/security/login-v2.html`
- `backend/security/register-v2.html`
- `backend/core/panel.html`

در صفحات React/Next:
- `app/page.tsx` از `app/homepage.css` استفاده می‌کند.
- `app/layout.tsx` از `app/globals.css` استفاده می‌کند.

## تقسیم‌بندی پیشنهادی assetها

- `resources/assets/core/tokens.css`: متغیرهای رنگ، فاصله، radius، shadow، typography و breakpoint.
- `resources/assets/core/reset.css`: reset، normalize و پایه RTL.
- `resources/assets/modules/storefront/storefront.css`
- `resources/assets/modules/identity/login.css`
- `resources/assets/modules/identity/register.css`
- `resources/assets/modules/admin-shell/admin-shell.css`
- `resources/assets/modules/customers/customers.css`
- `resources/assets/modules/agents/agents.css`
- `resources/assets/modules/loans/loan-definition.css`
- `resources/assets/modules/loans/loan-requests.css`
- `resources/assets/modules/documents/documents.css`
- `resources/assets/modules/contracts/contracts.css`
- `resources/assets/modules/notifications/sms-settings.css`
- `resources/assets/modules/legal/legal-pages.css`

هر stylesheet باید selectorهای namespaced داشته باشد تا CSS یک صفحه روی صفحه دیگر اثر نگذارد. هیچ فایل inline style/script از نسخه قدیمی قبل از استخراج و تست رفتار حذف نمی‌شود. صفحات مشترک قدیمی باید به یک view یا component واحد تبدیل شوند فقط پس از بررسی تفاوت رفتار و مسیرها.

## نکات مهم هنگام استخراج

1. تمام inline styleها، responsive breakpoints، RTL، print styles، modalها، toastها، tableها، form states و حالت‌های loading/empty/error باید حفظ شوند.
2. کلاس‌ها و IDهای مورد استفاده JavaScript نباید با refactor CSS تغییر نام داده شوند مگر همراه با تست DOM contract.
3. assetهای تصویر، فونت و آیکن باید فهرست و مسیرشان حفظ شود.
4. از selectorهای سراسری مانند `button`, `input`, `table` در فایل‌های ماژول استفاده نشود؛ تمام قواعد زیر namespace ماژول قرار گیرند.
5. صفحات ورود/ثبت‌نام، پنل مدیریت، مشتریان و نمایندگان باید مستقل باشند؛ اشتراک layout فقط در پوسته مشترک و design tokens.
6. CSS و JavaScript باید با نسخه PHP مستقل بمانند؛ PHP 8.3/8.4/8.5 نباید موجب تفاوت ظاهر یا رفتار شوند.

## وضعیت

- [x] شناسایی صفحات HTML مستقل و صفحات React اصلی
- [x] شناسایی inline CSS/JS در صفحات HTML نمونه‌برداری‌شده
- [x] شناسایی دو stylesheet اصلی Next.js
- [ ] استخراج کامل تمام style/scriptهای inline به فایل‌های ماژولی
- [ ] ساخت screenshot/visual regression baseline برای صفحات موجود
- [ ] تست RTL و responsive روی اندازه‌های موبایل/تبلت/دسکتاپ
- [ ] تست عدم نشت CSS بین ماژول‌ها
