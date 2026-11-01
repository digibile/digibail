<?php

declare(strict_types=1);

namespace App\Core\Health;

use App\Core\Database\ConnectionFactory;
use App\Core\Http\Request;
use App\Core\Http\Response;
use Throwable;

final class HealthController
{
    public function live(Request $request): Response
    {
        return Response::json([
            'status' => 'ok',
            'service' => 'digibail-php',
            'version' => $this->version(),
        ]);
    }

    public function ready(Request $request): Response
    {
        if (!ConnectionFactory::isConfigured()) {
            return Response::json([
                'status' => 'not_ready',
                'database' => 'not_configured',
            ], 503);
        }

        try {
            ConnectionFactory::create()->query('SELECT 1');
        } catch (Throwable $exception) {
            error_log('Readiness database check failed: ' . $exception->getMessage());

            return Response::json([
                'status' => 'not_ready',
                'database' => 'unavailable',
            ], 503);
        }

        return Response::json([
            'status' => 'ready',
            'database' => 'available',
            'version' => $this->version(),
        ]);
    }

    private function version(): string
    {
        $version = getenv('APP_VERSION');

        return $version === false || trim($version) === ''
            ? '0.1.0'
            : trim($version);
    }
}
