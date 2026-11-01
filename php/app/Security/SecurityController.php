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

    public function requestOtp(Request $request): Response
    {
        $phone = self::normalizeDigits(trim((string) ($request->input['phone'] ?? '')));
        $requestedPurpose = (string) ($request->input['purpose'] ?? 'login');
        $purpose = in_array($requestedPurpose, ['login', 'register', 'password_reset'], true) ? $requestedPurpose : 'login';

        if (preg_match('/^09\\d{9}$/D', $phone) !== 1) {
            return Response::json(['message' => 'شماره موبایل معتبر نیست.'], 400);
        }

        if (!$this->store->hitRateLimit('otp:ip:' . $this->clientIp($request), 10, 3600)
            || !$this->store->hitRateLimit('otp:phone:' . $phone, 3, 3600)) {
            return Response::json(['message' => 'تعداد درخواست کد زیاد است. کمی بعد دوباره تلاش کنید.'], 429);
        }

        $captchaId = (string) ($request->input['captchaId'] ?? '');
        $captchaAnswer = self::normalizeDigits((string) ($request->input['captchaAnswer'] ?? ''));
        if (!$this->store->consumeCaptcha($captchaId, $captchaAnswer)) {
            return Response::json(['message' => 'کد امنیتی نامعتبر یا منقضی شده است.'], 400);
        }

        $account = $this->identities->findActiveByPhone($phone);
        if ($purpose === 'login' && $account === null) {
            return Response::json(['message' => 'حساب فعالی با این شماره پیدا نشد.'], 404);
        }
        if ($purpose === 'register' && $account !== null) {
            return Response::json(['message' => 'این شماره قبلاً ثبت شده است.'], 409);
        }
        if ($purpose === 'password_reset' && $account === null) {
            return Response::json([
                'ok' => true,
                'message' => 'اگر شماره به حساب فعال متصل باشد، کد بازیابی ارسال می‌شود.',
                'expiresIn' => 120,
                'resendIn' => 60,
            ]);
        }

        $status = $this->store->otpStatus($phone, $purpose);
        if ($status['resendIn'] > 0) {
            return Response::json([
                'message' => 'برای ارسال مجدد کمی صبر کنید.',
                'expiresIn' => $status['expiresIn'],
                'resendIn' => $status['resendIn'],
            ], 429);
        }

        $code = (string) random_int(100000, 999999);
        $this->store->createOtp($phone, $purpose, $code);
        $sender = new KavenegarSmsSender();
        if (!$sender->sendOtp($phone, $code)) {
            $this->store->cancelLatestOtp($phone, $purpose);
            return Response::json(['message' => 'ارسال پیامک تأیید نشد؛ تنظیمات یا سرویس پیامک را بررسی کنید.'], 502);
        }

        return Response::json([
            'ok' => true,
            'message' => 'کد تأیید ارسال شد.',
            'expiresIn' => 120,
            'resendIn' => 60,
        ]);
    }

    public function otpStatus(Request $request): Response
    {
        $phone = self::normalizeDigits(trim((string) ($request->query['phone'] ?? '')));
        if (preg_match('/^09\\d{9}$/D', $phone) !== 1) {
            return Response::json(['message' => 'شماره موبایل معتبر نیست.'], 400);
        }

        $requestedPurpose = (string) ($request->query['purpose'] ?? 'login');
        $purpose = in_array($requestedPurpose, ['login', 'register', 'password_reset'], true) ? $requestedPurpose : 'login';
        return Response::json($this->store->otpStatus($phone, $purpose));
    }

    public function verifyOtp(Request $request): Response
    {
        $phone = self::normalizeDigits(trim((string) ($request->input['phone'] ?? '')));
        $code = self::normalizeDigits(trim((string) ($request->input['code'] ?? '')));
        $requestedPurpose = (string) ($request->input['purpose'] ?? 'login');
        $purpose = in_array($requestedPurpose, ['login', 'register', 'password_reset'], true) ? $requestedPurpose : 'login';

        if (preg_match('/^09\\d{9}$/D', $phone) !== 1 || preg_match('/^\\d{6}$/D', $code) !== 1) {
            return Response::json(['message' => 'شماره یا کد تأیید معتبر نیست.'], 400);
        }

        if (!$this->store->verifyOtp($phone, $purpose, $code)) {
            return Response::json(['ok' => false, 'message' => 'کد تأیید نادرست، منقضی یا مصرف‌شده است.'], 400);
        }

        if (in_array($purpose, ['register', 'password_reset'], true)) {
            $ticket = $this->jwt()->issue([
                'purpose' => $purpose,
                'phone' => $phone,
            ], 600);

            return Response::json(['ticket' => $ticket]);
        }

        $user = $this->identities->findActiveByPhone($phone);
        if ($user === null) {
            return Response::json(['ok' => false, 'message' => 'حساب فعالی با این شماره پیدا نشد.'], 404);
        }

        return $this->authenticatedResponse($user);
    }

    public function register(Request $request): Response
    {
        if (!$this->store->hitRateLimit('register:ip:' . $this->clientIp($request), 10, 3600)) {
            return Response::json(['message' => 'تعداد ثبت‌نام از این شبکه زیاد است.'], 429);
        }

        $captchaId = (string) ($request->input['captchaId'] ?? '');
        $captchaAnswer = self::normalizeDigits((string) ($request->input['captchaAnswer'] ?? ''));
        if (!$this->store->consumeCaptcha($captchaId, $captchaAnswer)) {
            return Response::json(['message' => 'کد امنیتی نامعتبر یا منقضی شده است.'], 400);
        }

        $ticket = (string) ($request->input['ticket'] ?? '');
        $ticketClaims = $this->jwt()->verify($ticket);
        if ($ticketClaims === null || ($ticketClaims['purpose'] ?? null) !== 'register' || !isset($ticketClaims['phone'])) {
            return Response::json(['message' => 'تأیید موبایل منقضی شده است. دوباره کد بگیرید.'], 400);
        }

        $fullName = trim((string) ($request->input['fullName'] ?? ''));
        $nameParts = preg_split('/\\s+/u', $fullName, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $nationalCode = self::normalizeDigits((string) ($request->input['nationalCode'] ?? ''));
        $password = (string) ($request->input['password'] ?? '');
        $email = trim((string) ($request->input['email'] ?? ''));

        if (count($nameParts) < 2) {
            return Response::json(['message' => 'نام و نام خانوادگی را کامل بنویسید.'], 400);
        }
        if (!self::validNationalCode($nationalCode)) {
            return Response::json(['message' => 'کد ملی از نظر ساختار معتبر نیست.'], 400);
        }
        if (strlen($password) < 10 || strlen($password) > 128) {
            return Response::json(['message' => 'رمز عبور باید بین ۸ تا ۱۲۸ نویسه باشد.'], 400);
        }
        if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            return Response::json(['message' => 'نشانی ایمیل معتبر نیست.'], 400);
        }

        try {
            $user = $this->identities->registerCustomer(
                $fullName,
                (string) $ticketClaims['phone'],
                $email === '' ? null : $email,
                $nationalCode,
                $password,
                trim((string) (getenv('AUTH_CUSTOMER_ROLE') ?: 'Customer'))
            );
        } catch (Throwable $exception) {
            error_log('Legacy customer registration failed: ' . $exception->getMessage());
            return Response::json(['message' => 'ثبت‌نام در حال حاضر انجام نشد. تنظیمات نقش و پایگاه داده را بررسی کنید.'], 503);
        }

        if ($user === null) {
            return Response::json(['message' => 'این شماره قبلاً ثبت شده یا ثبت‌نام تکراری است.'], 409);
        }

        return $this->authenticatedResponse($user);
    }

    private static function validNationalCode(string $value): bool
    {
        if (preg_match('/^\\d{10}$/D', $value) !== 1 || preg_match('/^(\\d)\\1{9}$/D', $value) === 1) {
            return false;
        }

        $check = (int) $value[9];
        $sum = 0;
        for ($index = 0; $index < 9; $index++) {
            $sum += ((int) $value[$index]) * (10 - $index);
        }

        $remainder = $sum % 11;
        return $remainder < 2 ? $check === $remainder : $check === 11 - $remainder;
    }

    public function requestPasswordReset(Request $request): Response
    {
        $input = array_merge($request->input, ['purpose' => 'password_reset']);
        $resetRequest = new Request(
            $request->method,
            $request->path,
            $request->headers,
            $request->query,
            $input,
            $request->files
        );

        return $this->requestOtp($resetRequest);
    }

    public function confirmPasswordReset(Request $request): Response
    {
        $ticket = (string) ($request->input['ticket'] ?? '');
        $password = (string) ($request->input['password'] ?? '');
        if (strlen($password) < 10 || strlen($password) > 128) {
            return Response::json(['message' => 'رمز جدید باید بین ۱۰ تا ۱۲۸ نویسه باشد.'], 400);
        }

        $claims = $this->jwt()->verify($ticket);
        if ($claims === null || ($claims['purpose'] ?? null) !== 'password_reset' || !isset($claims['phone'])) {
            return Response::json(['message' => 'مجوز بازیابی منقضی یا نامعتبر است.'], 400);
        }

        try {
            if (!$this->identities->resetPasswordByPhone((string) $claims['phone'], $password)) {
                return Response::json(['message' => 'تغییر رمز انجام نشد. حساب فعال پیدا نشد یا اطلاعات تغییر کرده است.'], 409);
            }
        } catch (Throwable $exception) {
            error_log('Password reset failed: ' . $exception->getMessage());
            return Response::json(['message' => 'تغییر رمز موقتاً امکان‌پذیر نیست.'], 503);
        }

        return Response::json(['ok' => true, 'message' => 'رمز عبور با موفقیت تغییر کرد.']);
    }

    private function authenticatedResponse(array $user): Response
    {
        $roles = $user['roles'];
        $role = $this->primaryRole($roles);
        $tokenRoles = $roles;
        if (in_array('SuperAdmin', $roles, true) && !in_array('Admin', $tokenRoles, true)) {
            $tokenRoles[] = 'Admin';
        }

        $token = $this->jwt()->issue([
            'sub' => $user['id'],
            'role' => $role,
            'roles' => $tokenRoles,
            'phone' => (string) ($user['mobile'] ?? ''),
        ], 28800);

        $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? '; Secure' : '';
        return new Response(
            200,
            json_encode([
                'accessToken' => $token,
                'token' => $token,
                'expiresAt' => gmdate(DATE_ATOM, time() + 28800),
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
                'Set-Cookie' => 'db_session=' . $token . '; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800' . $secure,
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
