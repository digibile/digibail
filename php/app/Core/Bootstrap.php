<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Health\HealthController;
use App\Core\Http\Request;
use App\Core\Http\Response;
use App\Core\Routing\Router;
use App\Core\Loans\LoanProductController;
use App\Security\SecurityController;

final class Bootstrap
{
    public static function router(): Router
    {
        $router = new Router();
        $health = new HealthController();
        $security = null;
        $tenant = null;

        $securityController = static function () use (&$security): SecurityController {
            return $security ??= new SecurityController();
        };
        $loanProducts = static function () use (&$tenant): LoanProductController {
            return $tenant ??= new LoanProductController();
        };

        $router->get('/health/live', [$health, 'live']);
        $router->get('/health/ready', [$health, 'ready']);

        $router->get('/api/v1/tenant/config', static fn (Request $request): Response => $loanProducts()->tenantConfig($request));
        $router->get('/api/v1/loan-products', static fn (Request $request): Response => $loanProducts()->publicList($request));
        $router->get('/api/v1/loan-products/{slug}', static fn (Request $request): Response => $loanProducts()->publicOne($request));

        $router->get('/api/v1/admin/loan-products', static fn (Request $request): Response => $loanProducts()->adminList($request));
        $router->post('/api/v1/admin/loan-products', static fn (Request $request): Response => $loanProducts()->create($request));
        $router->put('/api/v1/admin/loan-products/{id:uuid}', static fn (Request $request): Response => $loanProducts()->update($request));
        $router->post('/api/v1/admin/loan-products/{id:uuid}/toggle', static fn (Request $request): Response => $loanProducts()->toggle($request));
        $router->post('/api/v1/admin/loan-products/seed', static fn (Request $request): Response => $loanProducts()->seed($request));
        $router->get('/api/v1/admin/loan-products/labels', static fn (Request $request): Response => $loanProducts()->labels($request));
        $router->post('/api/v1/admin/loan-products/{id:uuid}/image', static fn (Request $request): Response => $loanProducts()->uploadImage($request));
        $router->delete('/api/v1/admin/loan-products/{id:uuid}/image', static fn (Request $request): Response => $loanProducts()->deleteImage($request));

        $router->get('/api/v1/security/captcha', static fn (Request $request): Response => $securityController()->captcha($request));
        $router->get('/api/v1/Auth/captcha', static fn (Request $request): Response => $securityController()->captcha($request));

        $router->post('/api/v1/security/login', static fn (Request $request): Response => $securityController()->login($request));
        $router->post('/api/v1/security/register', static fn (Request $request): Response => $securityController()->register($request));
        $router->post('/api/v1/security/register/ocr', static fn (Request $request): Response => Response::json(['message' => 'سرویس OCR تا زمان اتصال ارائه‌دهنده و تنظیم کلید محرمانه فعال نیست.'], 501));
        $router->post('/api/v1/Auth/register', static fn (Request $request): Response => $securityController()->register($request));
        $router->post('/api/v1/Auth/login', static fn (Request $request): Response => $securityController()->login($request));

        $router->post('/api/v1/security/otp/request', static fn (Request $request): Response => $securityController()->requestOtp($request));
        $router->get('/api/v1/security/otp/status', static fn (Request $request): Response => $securityController()->otpStatus($request));
        $router->post('/api/v1/security/otp/verify', static fn (Request $request): Response => $securityController()->verifyOtp($request));
        $router->post('/api/v1/security/password-reset/request', static fn (Request $request): Response => $securityController()->requestPasswordReset($request));
        $router->post('/api/v1/security/password-reset/confirm', static fn (Request $request): Response => $securityController()->confirmPasswordReset($request));
        $router->post('/api/v1/Auth/verify-otp', static fn (Request $request): Response => $securityController()->verifyOtp($request));

        $router->get('/api/v1/security/me', static fn (Request $request): Response => $securityController()->me($request));
        $router->get('/api/v1/Auth/me', static fn (Request $request): Response => $securityController()->me($request));

        return $router;
    }

    public static function requestFromGlobals(): Request
    {
        return Request::fromGlobals();
    }
}
