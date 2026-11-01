<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Health\HealthController;
use App\Core\Http\Request;
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

        // Current API contract.
        $router->get('/api/v1/security/captcha', static fn (Request $request) => $securityController()->captcha($request));
        $router->post('/api/v1/security/login', static fn (Request $request) => $securityController()->login($request));
        $router->get('/api/v1/security/me', static fn (Request $request) => $securityController()->me($request));

        // Backward-compatible paths still used by the original public login page.
        $router->post('/api/v1/Auth/login', static fn (Request $request) => $securityController()->login($request));
        $router->get('/api/v1/Auth/me', static fn (Request $request) => $securityController()->me($request));

        return $router;
    }

    public static function requestFromGlobals(): Request
    {
        return Request::fromGlobals();
    }
}
