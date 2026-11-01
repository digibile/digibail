<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Health\HealthController;
use App\Core\Http\Request;
use App\Core\Routing\Router;

final class Bootstrap
{
    public static function router(): Router
    {
        $router = new Router();
        $health = new HealthController();

        $router->get('/health/live', [$health, 'live']);
        $router->get('/health/ready', [$health, 'ready']);

        return $router;
    }

    public static function requestFromGlobals(): Request
    {
        return Request::fromGlobals();
    }
}
