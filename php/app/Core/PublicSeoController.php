<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Database\ConnectionFactory;
use App\Core\Http\Response;
use App\Core\Loans\LoanProductRepository;
use App\Tenancy\TenantResolver;
use Throwable;

final class PublicSeoController
{
    private const SITE = 'https://digebail.ir';

    public static function dispatch(string $path, string $method): ?Response
    {
        if (!in_array(strtoupper($method), ['GET', 'HEAD'], true)) return null;
        $path = '/' . trim($path, '/');
        if ($path === '/') return null;

        try {
            if ($path === '/robots.txt') return self::robots();
            if ($path === '/sitemap.xml') return self::sitemap();
            if ($path === '/plans') return self::plans();
            if ($path === '/faq.html') return self::faq();
            if ($path === '/contact.html') return self::contact();
            if (preg_match('#^/plans/([a-z0-9-]{2,40})$#D', $path, $match) === 1) {
                return self::planDetail($match[1]);
            }
        } catch (Throwable $exception) {
            error_log('Public SEO page failed: ' . $exception->getMessage());
            return self::html(self::errorPage(), 503, 'noindex, nofollow');
        }

        return null;
    }

    private static function products(): array
    {
        $db = ConnectionFactory::create();
        $tenant = (new TenantResolver($db))->resolve();
        return (new LoanProductRepository($db))->publicList($tenant['id']);
    }

    private static function product(string $slug): ?array
    {
        $db = ConnectionFactory::create();
        $tenant = (new TenantResolver($db))->resolve();
        return (new LoanProductRepository($db))->publicOne($tenant['id'], $slug);
    }

    private static function plans(): Response
    {
        $items = self::products();
        $cards = '';
        foreach ($items as $index => $plan) {
            $title = self::e((string) ($plan['title'] ?: $plan['name']));
            $slug = rawurlencode((string) $plan['id']);
            $description = self::e((string) ($plan['description'] ?: 'جزئیات و شرایط این طرح را بررسی کنید.'));
            $image = self::image((string) ($plan['imageUrl'] ?? ''));
            $cards .= '<article class="plan-card"><a class="plan-card-image" href="/plans/' . $slug . '">'
                . ($image !== '' ? '<img src="' . self::e($image) . '" alt="' . $title . '" loading="lazy">' : '<span>دیجی‌بایل</span>')
                . '</a><div class="plan-card-body"><span class="eyebrow">طرح ' . self::fa((string) ($index + 1)) . '</span>'
                . '<h2><a href="/plans/' . $slug . '">' . $title . '</a></h2><p>' . $description . '</p>'
                . '<div class="plan-values">' . (((float) ($plan['minAmount'] ?? 0) > 0) ? '<div><small>مبلغ از</small><b>' . self::money($plan['minAmount']) . '</b></div>' : '')
                . '<div><small>سقف طرح</small><b>' . self::money($plan['maxAmount'] ?? 0) . '</b></div></div>'
                . '<a class="action" href="/plans/' . $slug . '">مشاهده شرایط و جزئیات <span>←</span></a></div></article>';
        }

        $body = '<main class="public-wrap"><section class="seo-hero"><span>فهرست طرح‌های منتشرشده</span><h1>طرح‌های خرید اقساطی دیجی‌بایل</h1>'
            . '<p>شرایط طرح‌های فعال را مقایسه کنید، مبلغ و بازپرداخت را بررسی کنید و پیش از ثبت درخواست، جزئیات هر طرح را بخوانید.</p></section>'
            . '<section class="seo-content"><div class="section-heading"><div><span>انتخاب آگاهانه</span><h2>طرح‌های قابل مشاهده</h2></div><small>' . self::fa((string) count($items)) . ' طرح منتشرشده</small></div>'
            . ($cards !== '' ? '<div class="plans-grid">' . $cards . '</div>' : '<div class="empty-state"><h2>در حال حاضر طرح عمومی فعالی منتشر نشده است</h2><p>طرح‌های غیرفعال یا فاقد مجوز نمایش عمومی در این فهرست قرار نمی‌گیرند.</p></div>')
            . '<section class="seo-copy"><h2>چطور طرح مناسب را انتخاب کنیم؟</h2><p>پیش از ثبت درخواست، مبلغ قابل تأمین، مدت بازپرداخت، نرخ سود یا کارمزد، پیش‌پرداخت، هزینه‌های عملیاتی و مدارک موردنیاز را در صفحه اختصاصی هر طرح بررسی کنید. شرایط نهایی پس از بررسی درخواست و مطابق قرارداد ارائه‌دهنده مشخص می‌شود.</p><p>نمایش یک طرح در این فهرست به معنی تأیید اعتبار یا تضمین پرداخت تسهیلات نیست.</p></section></section></main>';

        $schema = ['@context' => 'https://schema.org', '@type' => 'ItemList', 'name' => 'طرح‌های خرید اقساطی دیجی‌بایل',
            'itemListElement' => array_map(static fn(array $p, int $i): array => [
                '@type' => 'ListItem', 'position' => $i + 1,
                'url' => self::SITE . '/plans/' . rawurlencode((string) $p['id']),
                'name' => (string) ($p['title'] ?: $p['name']),
            ], $items, array_keys($items))];
        return self::page('طرح‌های خرید اقساطی و تسهیلات | دیجی‌بایل',
            'مشاهده طرح‌های فعال خرید اقساطی، بررسی شرایط و مدارک و محاسبه شفاف مبلغ پیش‌پرداخت و اقساط در دیجی‌بایل.',
            '/plans', $body, $schema);
    }

    private static function planDetail(string $slug): Response
    {
        $plan = self::product($slug);
        if ($plan === null) {
            return self::page('طرح پیدا نشد | دیجی‌بایل', 'این طرح در فهرست عمومی دیجی‌بایل منتشر نشده است.',
                '/plans/' . rawurlencode($slug),
                '<main class="public-wrap"><section class="empty-state"><h1>این طرح در دسترس نیست</h1><p>ممکن است طرح غیرفعال شده یا اجازه نمایش عمومی نداشته باشد.</p><a class="action" href="/plans">بازگشت به فهرست طرح‌ها</a></section></main>',
                null, 404, 'noindex, nofollow');
        }

        $titleRaw = (string) ($plan['title'] ?: $plan['name']);
        $title = self::e($titleRaw);
        $descriptionRaw = (string) ($plan['description'] ?? '');
        $description = self::e($descriptionRaw !== '' ? $descriptionRaw : 'شرایط و جزئیات طرح را پیش از ثبت درخواست بررسی کنید.');
        $image = self::image((string) ($plan['imageUrl'] ?? ''));
        $conditions = self::values($plan['conditions'] ?? []);
        $documents = self::values($plan['documents'] ?? []);
        $costs = self::values($plan['operationalCosts'] ?? []);
        $tiers = is_array($plan['tiers'] ?? null) ? $plan['tiers'] : [];
        $interval = max(1, (int) ($plan['intervalMonths'] ?? 1));
        $detail = '<main class="public-wrap"><section class="detail-hero"><div><a class="back-link" href="/plans">← همه طرح‌ها</a><span class="eyebrow">طرح منتشرشده در دیجی‌بایل</span>'
            . '<h1>' . $title . '</h1><p>' . $description . '</p><div class="plan-values detail-values"><div><small>حداقل مبلغ</small><b>' . self::money($plan['minAmount'] ?? 0) . '</b></div>'
            . '<div><small>سقف طرح</small><b>' . self::money($plan['maxAmount'] ?? 0) . '</b></div><div><small>نرخ پایه ثبت‌شده</small><b>' . self::fa((string) ($plan['interestPercent'] ?? 0)) . '٪</b></div></div>'
            . '</div>' . ($image !== '' ? '<div class="detail-image"><img src="' . self::e($image) . '" alt="' . $title . '"></div>' : '') . '</section>'
            . '<section class="detail-layout"><article class="info-panel"><h2>شرایط و مدارک طرح</h2><h3>شرایط</h3>' . self::listOrEmpty($conditions, 'شرایط تکمیلی برای نمایش عمومی ثبت نشده است.')
            . '<h3>مدارک موردنیاز</h3>' . self::listOrEmpty($documents, 'فهرست مدارک جداگانه‌ای ثبت نشده است.')
            . '<h3>هزینه‌های عملیاتی</h3>' . self::listOrEmpty($costs, 'هزینه عملیاتی جداگانه‌ای در اطلاعات عمومی ثبت نشده است؛ این موضوع به معنی رایگان بودن خدمات نیست.')
            . '<p class="disclaimer">اطلاعات این صفحه از طرح منتشرشده در سامانه دریافت می‌شود. شرایط نهایی تابع بررسی ارائه‌دهنده و قرارداد رسمی است.</p></article>'
            . '<aside class="calculator" id="calculator"><span class="eyebrow">اطلاعات بازپرداخت ثبت‌شده</span><h2>برآورد اقساط</h2>'
            . '<label>مبلغ موردنیاز (تومان)<input id="amount" type="number" min="' . (int) $plan['minAmount'] . '" max="' . (int) $plan['maxAmount'] . '" value="' . (int) $plan['minAmount'] . '" step="100000"></label>'
            . '<label>مدت بازپرداخت<select id="term">' . self::tierOptions($tiers, $interval, (float) ($plan['interestPercent'] ?? 0)) . '</select></label>'
            . '<div class="calc-result"><small>قسط ماهانه برآوردی</small><strong id="monthly">پس از تطبیق روش محاسبه</strong><span id="term-label"></span></div>'
            . '<div class="calc-row"><span>پیش‌پرداخت</span><b id="down">-</b></div><div class="calc-row"><span>سود یا کارمزد</span><b id="fee">-</b></div><div class="calc-row total"><span>مجموع بازپرداخت</span><b id="total">-</b></div>'
            . '<p class="disclaimer">برای جلوگیری از نمایش قسط نادرست، محاسبه‌گر خودکار تا زمان تطبیق نوع سود با فرمول اصلی این طرح فعال نیست.</p><a class="action" href="/login.html">ورود و ثبت درخواست ←</a></aside></section></main>';

        $calcData = [
            'min' => (float) $plan['minAmount'], 'max' => (float) $plan['maxAmount'],
            'interestMethod' => (string) ($plan['interestMethod'] ?? 'Monthly'),
            'interestPercent' => (float) ($plan['interestPercent'] ?? 0),
            'intervalMonths' => $interval, 'tiers' => $tiers,
        ];
        $schema = ['@context' => 'https://schema.org', '@type' => 'FinancialProduct', 'name' => $titleRaw,
            'description' => $descriptionRaw, 'url' => self::SITE . '/plans/' . rawurlencode($slug),
            'provider' => ['@type' => 'Organization', 'name' => 'دیجی‌بایل']];
        return self::page($titleRaw . ' | شرایط و محاسبه اقساط | دیجی‌بایل',
            mb_substr($descriptionRaw !== '' ? $descriptionRaw : 'شرایط، مدارک و برآورد بازپرداخت این طرح را در دیجی‌بایل بررسی کنید.', 0, 300, 'UTF-8'),
            '/plans/' . rawurlencode($slug), $detail, $schema, 200, 'index, follow',
            '<script type="application/json" id="plan-data">' . json_encode($calcData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR) . '</script>'
            . '<script defer src="/assets/plan-calculator.js?v=1"></script>');
    }

    private static function faq(): Response
    {
        $questions = [
            ['چطور طرح‌های قابل استفاده را ببینم؟', 'در صفحه طرح‌ها فقط طرح‌هایی نمایش داده می‌شوند که در سامانه فعال شده‌اند و اجازه نمایش عمومی دارند.'],
            ['آیا همه طرح‌های ثبت‌شده عمومی هستند؟', 'خیر. فقط طرح‌های فعال و منتشرشده در فهرست عمومی نمایش داده می‌شوند.'],
            ['مبلغ محاسبه‌گر قطعی است؟', 'خیر. محاسبه‌گر برای برآورد اولیه است. مبلغ قطعی و شرایط نهایی بر اساس قرارداد و تأیید ارائه‌دهنده مشخص می‌شود.'],
            ['برای ثبت یا پیگیری درخواست چه کار کنم؟', 'برای مشاهده اطلاعات پرونده و ثبت درخواست، وارد حساب کاربری خود شوید. اطلاعات شخصی در صفحات عمومی نمایش داده نمی‌شود.'],
            ['چرا طرحی در فهرست نمی‌بینم؟', 'ممکن است در حال حاضر طرحی با وضعیت فعال و مجوز انتشار عمومی وجود نداشته باشد. سامانه اطلاعات آزمایشی یا ساختگی نمایش نمی‌دهد.'],
            ['آیا مشاهده طرح به معنی تأیید تسهیلات است؟', 'خیر. مشاهده یا ثبت درخواست به‌تنهایی به معنی تأیید اعتبار یا تعهد به پرداخت نیست.'],
        ];
        $items = '';
        foreach ($questions as [$q, $a]) $items .= '<article class="info-card"><h2>' . self::e($q) . '</h2><p>' . self::e($a) . '</p></article>';
        $schema = ['@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => array_map(
            static fn(array $qa): array => ['@type' => 'Question', 'name' => $qa[0], 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $qa[1]]], $questions)];
        $body = '<main class="public-wrap"><section class="seo-hero"><span>راهنمای استفاده</span><h1>سؤالات متداول دیجی‌بایل</h1><p>پاسخ پرسش‌های رایج درباره مشاهده طرح‌ها، محاسبه اقساط و پیگیری درخواست‌ها.</p></section><section class="info-grid">' . $items . '</section></main>';
        return self::page('سؤالات متداول | دیجی‌بایل', 'پاسخ پرسش‌های متداول درباره طرح‌های منتشرشده، محاسبه اقساط و پیگیری درخواست در دیجی‌بایل.', '/faq.html', $body, $schema);
    }

    private static function contact(): Response
    {
        $body = '<main class="public-wrap"><section class="seo-hero"><span>مرکز راهنمایی کاربران</span><h1>ارتباط با دیجی‌بایل</h1><p>برای حفظ امنیت اطلاعات، پیگیری پرونده‌های شخصی فقط پس از ورود به حساب کاربری انجام می‌شود.</p></section>'
            . '<section class="info-grid"><article class="info-card"><h2>پیگیری درخواست ثبت‌شده</h2><p>وارد حساب خود شوید و وضعیت درخواست را بررسی کنید. اطلاعات پرونده و مدارک شما در صفحات عمومی نمایش داده نمی‌شوند.</p><a class="action" href="/login.html">ورود به حساب کاربری ←</a></article>'
            . '<article class="info-card"><h2>پیش از ثبت درخواست</h2><p>شرایط، مدارک و جزئیات هر طرح را در صفحه اختصاصی آن مطالعه کنید. برآورد محاسبه‌گر قطعی نیست.</p><a class="action" href="/plans">مشاهده طرح‌های منتشرشده ←</a></article></section>'
            . '<p class="notice">شماره تماس، نشانی دفتر یا ایمیل تأییدشده‌ای در اطلاعات عمومی قابل انتشار ثبت نشده است؛ برای جلوگیری از انتشار اطلاعات نادرست، اطلاعات تماس ساختگی درج نشده است.</p></main>';
        return self::page('ارتباط با دیجی‌بایل | راهنمای پیگیری', 'راهنمای ورود امن و پیگیری درخواست‌های ثبت‌شده در حساب کاربری دیجی‌بایل.', '/contact.html', $body);
    }

    private static function robots(): Response
    {
        $body = "User-agent: *\nAllow: /\nAllow: /plans\nAllow: /plans/\nAllow: /faq.html\nAllow: /contact.html\nDisallow: /api/\nDisallow: /admin\nDisallow: /admin.php\nDisallow: /expert.php\nDisallow: /login.html\nDisallow: /register.html\nDisallow: /profile.html\nDisallow: /my/\nDisallow: /documents.html\nDisallow: /contracts.html\nSitemap: " . self::SITE . "/sitemap.xml\n";
        return new Response(200, $body, ['Content-Type' => 'text/plain; charset=utf-8', 'Cache-Control' => 'public, max-age=3600']);
    }

    private static function sitemap(): Response
    {
        $urls = [self::SITE . '/', self::SITE . '/plans', self::SITE . '/faq.html', self::SITE . '/contact.html'];
        foreach (self::products() as $plan) $urls[] = self::SITE . '/plans/' . rawurlencode((string) $plan['id']);
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        foreach (array_unique($urls) as $url) $xml .= '<url><loc>' . htmlspecialchars($url, ENT_XML1 | ENT_QUOTES, 'UTF-8') . '</loc></url>';
        $xml .= '</urlset>';
        return new Response(200, $xml, ['Content-Type' => 'application/xml; charset=utf-8', 'Cache-Control' => 'public, max-age=600']);
    }

    private static function page(string $title, string $description, string $canonicalPath, string $body, ?array $schema = null, int $status = 200, string $robots = 'index, follow', string $extraHead = ''): Response
    {
        $schemaTag = $schema === null ? '' : '<script type="application/ld+json">' . json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR) . '</script>';
        $html = '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            . '<meta name="description" content="' . self::e($description) . '"><meta name="robots" content="' . self::e($robots) . '">'
            . '<link rel="canonical" href="' . self::SITE . self::e($canonicalPath) . '"><meta property="og:type" content="website">'
            . '<meta property="og:locale" content="fa_IR"><meta property="og:title" content="' . self::e($title) . '"><meta property="og:description" content="' . self::e($description) . '">'
            . '<meta property="og:url" content="' . self::SITE . self::e($canonicalPath) . '"><title>' . self::e($title) . '</title>'
            . '<link rel="stylesheet" href="/assets/public-seo.css?v=1">' . $schemaTag . $extraHead . '</head><body>'
            . '<header class="public-header"><a class="brand" href="/">دیجی‌بایل<span>پی</span></a><nav><a href="/">خانه</a><a href="/plans">طرح‌ها</a><a href="/faq.html">سؤالات متداول</a><a href="/contact.html">ارتباط با ما</a></nav><a class="login" href="/login.html">ورود / ثبت‌نام</a></header>'
            . $body . '<footer class="public-footer"><a href="/">دیجی‌بایل</a><nav><a href="/plans">طرح‌ها</a><a href="/faq.html">سؤالات متداول</a><a href="/contact.html">ارتباط با ما</a><a href="/privacy.html">حریم خصوصی</a></nav><span>شرایط نهایی تابع بررسی درخواست و قرارداد رسمی است.</span></footer></body></html>';
        return self::html($html, $status, $robots);
    }

    private static function html(string $body, int $status = 200, string $robots = 'index, follow'): Response
    {
        return new Response($status, $body, ['Content-Type' => 'text/html; charset=utf-8', 'Cache-Control' => 'public, max-age=60, stale-while-revalidate=300', 'X-Content-Type-Options' => 'nosniff', 'X-Robots-Tag' => $robots]);
    }

    private static function errorPage(): string
    {
        return '<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><title>سرویس موقتاً در دسترس نیست</title><h1>دریافت اطلاعات طرح‌ها موقتاً ممکن نیست</h1><p>لطفاً کمی بعد دوباره مراجعه کنید.</p><a href="/">بازگشت به خانه</a></html>';
    }

    private static function e(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private static function fa(string $value): string
    {
        return strtr($value, ['0'=>'۰','1'=>'۱','2'=>'۲','3'=>'۳','4'=>'۴','5'=>'۵','6'=>'۶','7'=>'۷','8'=>'۸','9'=>'۹']);
    }

    private static function money(mixed $value): string
    {
        return self::fa(number_format((float) $value, 0, '.', ',')) . ' تومان';
    }

    private static function image(string $url): string
    {
        if ($url === '') return '';
        if (str_starts_with($url, '/uploads/')) return $url;
        return preg_match('#^https://#i', $url) === 1 ? $url : '';
    }

    private static function values(mixed $value): array
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE) $value = $decoded;
        }
        if (is_array($value)) {
            $result = [];
            foreach ($value as $key => $item) {
                if (is_scalar($item)) $result[] = is_string($key) && !is_int($key) ? $key . ': ' . (string) $item : (string) $item;
                elseif (is_array($item)) {
                    $label = $item['title'] ?? $item['name'] ?? $item['label'] ?? null;
                    if (is_string($label) && $label !== '') $result[] = $label;
                }
            }
            return $result;
        }
        return [];
    }

    private static function listOrEmpty(array $values, string $empty): string
    {
        if ($values === []) return '<p class="muted">' . self::e($empty) . '</p>';
        $html = '<ul>';
        foreach ($values as $value) $html .= '<li>' . self::e((string) $value) . '</li>';
        return $html . '</ul>';
    }

    private static function tierOptions(array $tiers, int $fallbackMonths, float $fallbackRate): string
    {
        if ($tiers === []) $tiers = [['months' => $fallbackMonths, 'feePercent' => $fallbackRate, 'downPaymentPercent' => 0]];
        $html = '';
        foreach ($tiers as $i => $tier) {
            if (!is_array($tier)) continue;
            $months = max(1, (int) ($tier['months'] ?? $tier['m'] ?? $tier['installments'] ?? $fallbackMonths));
            $rate = max(0, (float) ($tier['feePercent'] ?? $tier['fee'] ?? $tier['monthlyRatePercent'] ?? $fallbackRate));
            $down = max(0, min(100, (float) ($tier['downPaymentPercent'] ?? $tier['down'] ?? 0)));
            $html .= '<option value="' . $i . '" data-months="' . $months . '" data-rate="' . $rate . '" data-down="' . $down . '">' . self::fa((string) $months) . ' ماه · نرخ ' . self::fa((string) $rate) . '٪</option>';
        }
        return $html;
    }
}
