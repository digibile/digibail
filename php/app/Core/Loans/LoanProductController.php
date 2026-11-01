<?php

declare(strict_types=1);

namespace App\Core\Loans;

use App\Core\Database\ConnectionFactory;
use App\Core\Http\Request;
use App\Core\Http\Response;
use App\Security\AuthContext;
use App\Tenancy\TenantResolver;
use PDO;
use Throwable;

final class LoanProductController
{
    private PDO $db;
    private LoanProductRepository $products;
    private TenantResolver $tenants;
    private AuthContext $auth;

    public function __construct()
    {
        $this->db = ConnectionFactory::create();
        $this->products = new LoanProductRepository($this->db);
        $this->tenants = new TenantResolver($this->db);
        $this->auth = new AuthContext();
    }

    public function tenantConfig(Request $request): Response
    {
        $tenant = $this->tenants->resolve();
        return Response::json([
            'data' => [
                'name' => $tenant['name'],
                'slug' => $tenant['slug'],
                'brand' => $tenant['brand'],
            ],
        ]);
    }

    public function publicList(Request $request): Response
    {
        $tenant = $this->tenants->resolve();
        return new Response(
            200,
            json_encode($this->products->publicList($tenant['id']), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
            [
                'Content-Type' => 'application/json; charset=utf-8',
                'Cache-Control' => 'public, max-age=10, stale-while-revalidate=30',
                'X-Content-Type-Options' => 'nosniff',
            ]
        );
    }

    public function publicOne(Request $request): Response
    {
        $tenant = $this->tenants->resolve();
        $slug = (string) ($request->params['slug'] ?? '');
        $product = $this->products->publicOne($tenant['id'], $slug);

        return $product === null
            ? Response::json(['message' => 'طرح وام پیدا نشد.'], 404)
            : new Response(
                200,
                json_encode($product, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
                [
                    'Content-Type' => 'application/json; charset=utf-8',
                    'Cache-Control' => 'public, max-age=10, stale-while-revalidate=30',
                    'X-Content-Type-Options' => 'nosniff',
                ]
            );
    }

    public function adminList(Request $request): Response
    {
        $denied = $this->adminGuard($request);
        if ($denied !== null) return $denied;
        $tenant = $this->tenants->resolve();
        return Response::json($this->products->adminList($tenant['id']));
    }

    public function create(Request $request): Response
    {
        $denied = $this->adminGuard($request);
        if ($denied !== null) return $denied;
        $input = $this->cleanInput($request->input);
        if ($input instanceof Response) return $input;

        $tenant = $this->tenants->resolve();
        try {
            $id = $this->products->create($tenant['id'], $input);
            return Response::json(['id' => $id], 201);
        } catch (\PDOException $exception) {
            if ($exception->getCode() === '23000') {
                return Response::json(['message' => 'این شناسه قبلاً ثبت شده است.'], 409);
            }
            throw $exception;
        }
    }

    public function update(Request $request): Response
    {
        $denied = $this->adminGuard($request);
        if ($denied !== null) return $denied;
        $input = $this->cleanInput($request->input);
        if ($input instanceof Response) return $input;

        $tenant = $this->tenants->resolve();
        $id = (string) ($request->params['id'] ?? '');
        if (!$this->isUuid($id)) return Response::json(['message' => 'شناسه طرح معتبر نیست.'], 400);

        try {
            if (!$this->products->update($tenant['id'], $id, $input)) {
                return Response::json(['message' => 'طرح پیدا نشد.'], 404);
            }
            return Response::json(['ok' => true]);
        } catch (\PDOException $exception) {
            if ($exception->getCode() === '23000') {
                return Response::json(['message' => 'این شناسه قبلاً ثبت شده است.'], 409);
            }
            throw $exception;
        }
    }

    public function toggle(Request $request): Response
    {
        $denied = $this->adminGuard($request);
        if ($denied !== null) return $denied;
        $tenant = $this->tenants->resolve();
        $id = (string) ($request->params['id'] ?? '');
        if (!$this->isUuid($id)) return Response::json(['message' => 'شناسه طرح معتبر نیست.'], 400);
        $active = $this->products->toggle($tenant['id'], $id);
        return $active === null
            ? Response::json(['message' => 'طرح پیدا نشد.'], 404)
            : Response::json(['isActive' => $active]);
    }

    public function labels(Request $request): Response
    {
        $denied = $this->adminGuard($request);
        if ($denied !== null) return $denied;
        $tenant = $this->tenants->resolve();
        return Response::json($this->products->labels($tenant['id']));
    }

    public function seed(Request $request): Response
    {
        $denied = $this->adminGuard($request);
        if ($denied !== null) return $denied;
        $tenant = $this->tenants->resolve();
        if ($this->products->adminList($tenant['id']) !== []) {
            return Response::json(['message' => 'محصولی از قبل وجود دارد.'], 409);
        }

        $conditions = [
            'minAge' => 22, 'maxAge' => 60, 'minIncome' => 6,
            'kyc' => 1, 'minScore' => 50, 'maxActive' => 3,
        ];
        $documents = [
            ['name' => 'کارت ملی', 'required' => true],
            ['name' => 'شناسنامه', 'required' => true],
            ['name' => 'فیش حقوقی', 'required' => false],
        ];
        $defaults = [
            [
                'name' => 'طرح بتا بانک رفاه', 'slug' => 'beta',
                'description' => 'تسهیلات بانک رفاه؛ مبلغ و اقساط از سامانه بانک استعلام می‌شود',
                'badge' => 'جدید', 'minAmount' => 0, 'maxAmount' => 0,
                'intervalDays' => 30, 'tiers' => [],
                'conditions' => ['kind' => 'beta'],
                'documents' => [['name' => 'کارت ملی', 'required' => true]],
                'isActive' => false, 'sortOrder' => 0,
            ],
            [
                'name' => 'اقساط ۳ ماهه', 'slug' => 'p3',
                'description' => 'برای خریدهای کوچک و روزمره', 'badge' => 'بدون پیش‌پرداخت',
                'minAmount' => 1000000, 'maxAmount' => 20000000, 'intervalDays' => 30,
                'tiers' => [['months' => 3, 'feePercent' => 2, 'downPaymentPercent' => 0]],
                'conditions' => $conditions, 'documents' => $documents,
                'isActive' => true, 'sortOrder' => 1,
            ],
            [
                'name' => 'اقساط ۶ ماهه', 'slug' => 'p6',
                'description' => 'متعادل‌ترین انتخاب', 'badge' => 'پرطرفدار',
                'minAmount' => 1000000, 'maxAmount' => 30000000, 'intervalDays' => 30,
                'tiers' => [
                    ['months' => 4, 'feePercent' => 2.3, 'downPaymentPercent' => 5],
                    ['months' => 6, 'feePercent' => 2.5, 'downPaymentPercent' => 10],
                ],
                'conditions' => $conditions, 'documents' => $documents,
                'isActive' => true, 'sortOrder' => 2,
            ],
            [
                'name' => 'اقساط ۹ ماهه', 'slug' => 'p9',
                'description' => 'برای خریدهای بزرگ‌تر', 'badge' => '',
                'minAmount' => 3000000, 'maxAmount' => 40000000, 'intervalDays' => 30,
                'tiers' => [['months' => 9, 'feePercent' => 2.5, 'downPaymentPercent' => 15]],
                'conditions' => $conditions, 'documents' => $documents,
                'isActive' => true, 'sortOrder' => 3,
            ],
        ];

        foreach ($defaults as $default) {
            $input = $this->cleanInput($default);
            if ($input instanceof Response) return $input;
            $this->products->create($tenant['id'], $input);
        }

        return Response::json(['ok' => true, 'created' => count($defaults)]);
    }

    public function uploadImage(Request $request): Response
    {
        $denied = $this->adminGuard($request);
        if ($denied !== null) return $denied;
        $tenant = $this->tenants->resolve();
        $id = (string) ($request->params['id'] ?? '');
        if (!$this->isUuid($id)) return Response::json(['message' => 'شناسه طرح معتبر نیست.'], 400);

        $file = $request->files['file'] ?? null;
        if (!is_array($file) || (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK
            || (int) ($file['size'] ?? 0) < 1 || (int) $file['size'] > 1500000
            || !isset($file['tmp_name']) || !is_uploaded_file((string) $file['tmp_name'])) {
            return Response::json(['message' => 'عکس الزامی است و حداکثر ۱٫۵ مگابایت حجم دارد.'], 400);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file((string) $file['tmp_name']);
        $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        $imageInfo = @getimagesize((string) $file['tmp_name']);
        if (!isset($extensions[$mime]) || !is_array($imageInfo) || ($imageInfo['mime'] ?? '') !== $mime) {
            return Response::json(['message' => 'فقط فایل تصویری معتبر JPG، PNG یا WEBP پذیرفته می‌شود.'], 400);
        }

        $directory = dirname(__DIR__, 3) . '/public/uploads/plans';
        if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
            return Response::json(['message' => 'مسیر ذخیره تصویر آماده نیست.'], 500);
        }

        $filename = bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
        $destination = $directory . '/' . $filename;
        if (!move_uploaded_file((string) $file['tmp_name'], $destination)) {
            return Response::json(['message' => 'ذخیره تصویر انجام نشد.'], 500);
        }

        $old = $this->products->imageUrl($tenant['id'], $id);
        $url = '/uploads/plans/' . $filename;
        if (!$this->products->setImageUrl($tenant['id'], $id, $url)) {
            @unlink($destination);
            return Response::json(['message' => 'طرح پیدا نشد.'], 404);
        }
        $this->removeImage($old, $directory);

        return Response::json(['url' => $url]);
    }

    public function deleteImage(Request $request): Response
    {
        $denied = $this->adminGuard($request);
        if ($denied !== null) return $denied;
        $tenant = $this->tenants->resolve();
        $id = (string) ($request->params['id'] ?? '');
        if (!$this->isUuid($id)) return Response::json(['message' => 'شناسه طرح معتبر نیست.'], 400);

        $old = $this->products->imageUrl($tenant['id'], $id);
        if ($old === null) return Response::json(['message' => 'طرح پیدا نشد.'], 404);
        $this->products->setImageUrl($tenant['id'], $id, '');
        $this->removeImage($old, dirname(__DIR__, 3) . '/public/uploads/plans');
        return new Response(204, '', ['Cache-Control' => 'no-store']);
    }

    private function adminGuard(Request $request): ?Response
    {
        $user = $this->auth->user($request);
        if ($user === null) return Response::json(['message' => 'ورود مدیر لازم است.'], 401);
        if (!$this->auth->hasAnyRole($user, ['Admin', 'SuperAdmin'])) {
            return Response::json(['message' => 'دسترسی مدیر لازم است.'], 403);
        }
        return null;
    }

    /** @param array<string,mixed> $raw
     *  @return array<string,mixed>|Response
     */
    private function cleanInput(array $raw): array|Response
    {
        $name = trim((string) ($raw['name'] ?? ''));
        $slug = trim((string) ($raw['slug'] ?? ''));
        if ($name === '' || $slug === '') return Response::json(['message' => 'نام و شناسه طرح الزامی است.'], 400);
        if (preg_match('/^[a-z0-9-]{2,40}$/D', $slug) !== 1) {
            return Response::json(['message' => 'شناسه فقط حروف انگلیسی کوچک، عدد و خط تیره باشد.'], 400);
        }

        $method = (string) ($raw['interestMethod'] ?? 'Monthly');
        if (!in_array($method, ['Monthly', 'Annual', 'Flat'], true)) {
            return Response::json(['message' => 'نحوه محاسبه سود نامعتبر است.'], 400);
        }

        $min = is_numeric($raw['minAmount'] ?? null) ? (float) $raw['minAmount'] : 0.0;
        $max = is_numeric($raw['maxAmount'] ?? null) ? (float) $raw['maxAmount'] : 0.0;
        $interval = filter_var($raw['intervalDays'] ?? 30, FILTER_VALIDATE_INT);
        $interest = is_numeric($raw['interestPercent'] ?? 0) ? (float) ($raw['interestPercent'] ?? 0) : -1;
        $late = is_numeric($raw['lateDailyCoef'] ?? 0) ? (float) ($raw['lateDailyCoef'] ?? 0) : -1;
        $early = is_numeric($raw['earlyDailyCoef'] ?? 0) ? (float) ($raw['earlyDailyCoef'] ?? 0) : -1;

        if ($interest < 0 || $interest > 100 || $late < 0 || $late > 1 || $early < 0 || $early > 1) {
            return Response::json(['message' => 'نرخ و ضرایب مالی خارج از محدوده مجاز است.'], 400);
        }

        $tiers = $raw['tiers'] ?? [];
        $conditions = $raw['conditions'] ?? [];
        $documents = $raw['documents'] ?? [];
        $labels = $raw['labels'] ?? [];
        $costs = $raw['operationalCosts'] ?? [];

        if (!is_array($tiers) || !array_is_list($tiers) || !is_array($documents) || !array_is_list($documents)
            || !is_array($labels) || !array_is_list($labels) || !is_array($costs) || !array_is_list($costs)
            || !is_array($conditions)) {
            return Response::json(['message' => 'ساختار شرایط، پله‌ها، مدارک یا هزینه‌ها معتبر نیست.'], 400);
        }

        if (count($labels) > 10) return Response::json(['message' => 'حداکثر ۱۰ برچسب مجاز است.'], 400);
        foreach ($labels as $label) {
            if (!is_string($label) || $label === '' || mb_strlen($label, 'UTF-8') > 30) {
                return Response::json(['message' => 'برچسب نامعتبر است.'], 400);
            }
        }

        if (count($costs) > 10) return Response::json(['message' => 'حداکثر ۱۰ هزینه عملیاتی مجاز است.'], 400);
        foreach ($costs as $cost) {
            $title = is_array($cost) ? (string) ($cost['title'] ?? '') : '';
            $percent = is_array($cost) && is_numeric($cost['percent'] ?? null) ? (float) $cost['percent'] : -1;
            if ($title === '' || mb_strlen($title, 'UTF-8') > 100 || $percent < 0 || $percent > 100) {
                return Response::json(['message' => 'عنوان و درصد هزینه عملیاتی نامعتبر است.'], 400);
            }
        }

        $beta = ($conditions['kind'] ?? null) === 'beta';
        if (!$beta) {
            if ($min <= 0 || $max < $min || $interval === false || $interval < 1 || $interval > 365) {
                return Response::json(['message' => 'بازه مبلغ یا فاصله اقساط نامعتبر است.'], 400);
            }
            if ($tiers === []) return Response::json(['message' => 'حداقل یک پله اقساط لازم است.'], 400);
            foreach ($tiers as $tier) {
                if (!is_array($tier) || !is_numeric($tier['months'] ?? null) || (int) $tier['months'] < 1
                    || !is_numeric($tier['feePercent'] ?? null) || (float) $tier['feePercent'] < 0) {
                    return Response::json(['message' => 'ساختار پله‌های اقساط نامعتبر است.'], 400);
                }
            }
        }

        $title = trim((string) ($raw['title'] ?? $name));
        if (mb_strlen($title, 'UTF-8') > 160) return Response::json(['message' => 'عنوان طرح بیش از ۱۶۰ نویسه است.'], 400);

        return [
            'name' => mb_substr($name, 0, 120, 'UTF-8'),
            'slug' => $slug,
            'description' => mb_substr((string) ($raw['description'] ?? ''), 0, 500, 'UTF-8'),
            'badge' => mb_substr((string) ($raw['badge'] ?? ''), 0, 40, 'UTF-8'),
            'minAmount' => $min,
            'maxAmount' => $max,
            'intervalDays' => $interval === false ? 30 : $interval,
            'tiers' => $tiers,
            'conditions' => (object) $conditions,
            'documents' => $documents,
            'isActive' => ($raw['isActive'] ?? true) !== false,
            'sortOrder' => is_numeric($raw['sortOrder'] ?? 0) ? (int) $raw['sortOrder'] : 0,
            'interestMethod' => $method,
            'interestPercent' => $interest,
            'lateDailyCoef' => $late,
            'earlyDailyCoef' => $early,
            'showInList' => ($raw['showInList'] ?? true) !== false,
            'sendReminders' => ($raw['sendReminders'] ?? true) !== false,
            'title' => $title,
            'imageUrl' => '',
            'labels' => $labels,
            'fullDescriptionHtml' => self::cleanHtml((string) ($raw['fullDescriptionHtml'] ?? '')),
            'operationalCosts' => $costs,
        ];
    }

    private static function cleanHtml(string $html): string
    {
        $html = mb_substr($html, 0, 50000, 'UTF-8');
        $html = strip_tags($html, '<p><br><strong><b><em><i><ul><ol><li><a><h2><h3><blockquote>');
        $html = preg_replace('/\s+on[a-z]+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/iu', '', $html) ?? '';
        $html = preg_replace('/(href)\s*=\s*([\'"])\s*javascript:[\s\S]*?\2/iu', 'href="#"', $html) ?? '';
        return $html;
    }

    private function removeImage(?string $url, string $directory): void
    {
        if ($url === null || !str_starts_with($url, '/uploads/plans/')) return;
        $name = basename($url);
        if ($name !== '' && $name !== '.' && $name !== '..') {
            $path = $directory . '/' . $name;
            if (is_file($path)) @unlink($path);
        }
    }

    private function isUuid(string $value): bool
    {
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $value) === 1;
    }
}
