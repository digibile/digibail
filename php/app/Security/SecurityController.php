<?php

declare(strict_types=1);

namespace App\Security;

use App\Core\Database\ConnectionFactory;
use App\Core\Http\Request;
use App\Core\Http\Response;
use App\Identity\LegacyIdentityRepository;
use PDO;
use Throwable;

final class SecurityController
{
    private PDO $db;
    private SecurityStore $store;
    private LegacyIdentityRepository $identities;
    private ?JwtService $jwt = null;

    public function __construct()
    {
        $this->db = ConnectionFactory::create();
        $rateLimitPepper = (string) getenv('OTP_PEPPER');
        $captchaPepper = (string) getenv('CAPTCHA_PEPPER');
        $this->store = new SecurityStore($this->db, $rateLimitPepper, $captchaPepper);
        $this->identities = new LegacyIdentityRepository($this->db);
    }

    public function captcha(Request $request): Response
    {
        try {
            return Response::json($this->store->createCaptcha());
        } catch (Throwable $exception) {
            error_log('Captcha creation failed: ' . $exception->getMessage());
            return Response::json(['message' => 'سرویس کد امنیتی در دسترس نیست.'], 503);
        }
    }

    public function login(Request $request): Response
    {
        $ip = $this->clientIp($request);
        $username = trim((string) ($request->input['username'] ?? ''));
        $password = (string) ($request->input['password'] ?? '');
        $captchaId = (string) ($request->input['captchaId'] ?? '');
        $captchaAnswer = self::normalizeDigits((string) ($request->input['captchaAnswer'] ?? ''));

        if (!$this->store->hitRateLimit('login:ip:' . $ip, 40, 900)) {
            return Response::json(['message' => 'تلاش‌های ناموفق زیاد بود. کمی بعد دوباره امتحان کنید.'], 429);
        }

        if (!$this->store->consumeCaptcha($captchaId, $captchaAnswer)) {
            return Response::json(['message' => 'کد امنیتی نامعتبر یا منقضی شده است.'], 400);
        }

        if ($username === '' || $password === '') {
            return Response::json(['message' => 'نام کاربری و رمز را وارد کنید.'], 400);
        }

        if (!$this->store->hitRateLimit('login:user:' . mb_strtolower($username, 'UTF-8'), 8, 900)) {
            return Response::json(['message' => 'برای این حساب تلاش‌های زیادی شده. ۱۵ دقیقه بعد دوباره امتحان کنید.'], 429);
        }

        try {
            $user = $this->identities->authenticate($username, $password);
        } catch (Throwable $exception) {
            error_log('Legacy identity authentication failed: ' . $exception->getMessage());
            return Response::json(['message' => 'سرویس ورود موقتاً در دسترس نیست.'], 503);
        }

        if ($user === null) {
            return Response::json(['message' => 'نام کاربری یا رمز عبور نادرست است.'], 401);
        }

        $roles = $user['roles'];
        $role = $this->primaryRole($roles);
        $this->store->resetRateLimit('login:ip:' . $ip);
        $this->store->resetRateLimit('login:user:' . mb_strtolower($username, 'UTF-8'));
        $tokenRoles = $roles;
        // ASP.NET [Authorize(Roles="Admin")] treats SuperAdmin as an administrator too.
        if (in_array('SuperAdmin', $roles, true) && !in_array('Admin', $tokenRoles, true)) {
            $tokenRoles[] = 'Admin';
        }
        $claims = [
            'sub' => $user['id'],
            'role' => $role,
            'roles' => $tokenRoles,
            'phone' => (string) ($user['mobile'] ?? ''),
        ];

        try {
            $token = $this->jwt()->issue($claims, 28800);
        } catch (Throwable $exception) {
            error_log('JWT issue failed: ' . $exception->getMessage());
            return Response::json(['message' => 'تنظیمات امنیتی ورود کامل نیست.'], 503);
        }

        $expiresAt = gmdate(DATE_ATOM, time() + 28800);
        $secureCookie = strtolower((string) getenv('APP_ENV')) === 'production' ? '; Secure' : '';
        return new Response(
            200,
            json_encode([
                'accessToken' => $token,
                'token' => $token,
                'expiresAt' => $expiresAt,
                'user' => [
                    'id' => $user['id'],
                    'phone' => $user['mobile'],
                    'fullName' => $user['display_name'],
                    'role' => $role,
                    'roles' => $roles,
                ],
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
            [
                'Content-Type' => 'application/json; charset=utf-8',
                'Cache-Control' => 'no-store',
                'Set-Cookie' => 'db_session=' . $token . '; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800' . $secureCookie,
                'X-Content-Type-Options' => 'nosniff',
            ]
        );
    }

    public function me(Request $request): Response
    {
        $token = $this->bearerToken($request);
        if ($token === '') {
            $token = $this->cookieToken($request);
        }

        $claims = $this->jwt()->verify($token);
        if ($claims === null || !isset($claims['sub'])) {
            return Response::json(['message' => 'وارد حساب خود شوید.'], 401);
        }

        // Re-read the account and roles on every /me request so deactivation is effective immediately.
        $user = $this->identities->findActiveById((string) $claims['sub']);
        if ($user === null) {
            return Response::json(['message' => 'حساب کاربری فعال نیست.'], 401);
        }

        return Response::json([
            'data' => [
                'id' => $user['id'],
                'phone' => $user['mobile'],
                'fullName' => $user['display_name'],
                'username' => $user['username'],
                'role' => $user['roles'][0] ?? ($claims['role'] ?? 'Customer'),
                'roles' => $user['roles'],
                'passwordResetRequired' => false,
            ],
        ]);
    }

    /** @param list<string> $roles */
    private function primaryRole(array $roles): string
    {
        foreach (['SuperAdmin', 'Admin', 'Agent', 'Marketer', 'CustomerMarketer', 'Member', 'Customer'] as $candidate) {
            foreach ($roles as $role) {
                if (strcasecmp($role, $candidate) === 0) {
                    return $role;
                }
            }
        }

        return $roles[0] ?? 'Customer';
    }

    private function jwt(): JwtService
    {
        return $this->jwt ??= new JwtService((string) getenv('JWT_SECRET'), 'digibail');
    }

    private function clientIp(Request $request): string
    {
        // Only trust forwarded IP headers when the direct peer is loopback (nginx on same host).
        $remote = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
        if (in_array($remote, ['127.0.0.1', '::1'], true)) {
            $forwarded = trim(explode(',', (string) ($request->headers['x-real-ip'] ?? $request->headers['x-forwarded-for'] ?? ''))[0]);
            if (filter_var($forwarded, FILTER_VALIDATE_IP) !== false) {
                return $forwarded;
            }
        }

        return filter_var($remote, FILTER_VALIDATE_IP) !== false ? $remote : 'unknown';
    }

    private function bearerToken(Request $request): string
    {
        $header = (string) ($request->headers['authorization'] ?? '');
        return preg_match('/^Bearer\s+(.+)$/i', $header, $matches) === 1 ? trim($matches[1]) : '';
    }

    private function cookieToken(Request $request): string
    {
        $cookie = (string) ($request->headers['cookie'] ?? '');
        foreach (explode(';', $cookie) as $part) {
            $pair = explode('=', trim($part), 2);
            if (count($pair) === 2 && $pair[0] === 'db_session') {
                return trim($pair[1]);
            }
        }

        return '';
    }

    private static function normalizeDigits(string $value): string
    {
        return strtr($value, [
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
            '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
            '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
            '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
        ]);
    }
}
