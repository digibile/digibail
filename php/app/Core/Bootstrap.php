<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Health\HealthController;
use App\Core\Http\Request;
use App\Core\Http\Response;
use App\Core\Routing\Router;
use App\Security\SecurityController;

final class Bootstrap
{
    public static function router(): Router
    {
        $router = new Router();
        $health = new HealthController();
        $security = null;

        $securityController = static function () use (&$security): SecurityController {
            return $security ??= new SecurityController();
        };

        $router->get('/health/live', [$health, 'live']);
        $router->get('/health/ready', [$health, 'ready']);

        $router->get('/api/v1/security/captcha', static fn (Request $request): Response => $securityController()->captcha($request));
        $router->get('/api/v1/Auth/captcha', static fn (Request $request): Response => $securityController()->captcha($request));

        $router->post('/api/v1/security/login', static fn (Request $request): Response => $securityController()->login($request));
        $router->post('/api/v1/Auth/login', static fn (Request $request): Response => $securityController()->login($request));

        $router->post('/api/v1/security/otp/request', static fn (Request $request): Response => $securityController()->requestOtp($request));
        $router->get('/api/v1/security/otp/status', static fn (Request $request): Response => $securityController()->otpStatus($request));
        $router->post('/api/v1/security/otp/verify', static fn (Request $request): Response => $securityController()->verifyOtp($request));
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
