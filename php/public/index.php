<?php

declare(strict_types=1);

use App\Core\Bootstrap;
use App\Core\Http\Response;

$requestedPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' && rtrim($requestedPath, '/') === '') {
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: public, max-age=60, stale-while-revalidate=300');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    readfile(__DIR__ . '/home.html');
    exit;
}


require dirname(__DIR__) . '/vendor/autoload.php';
\App\Core\Environment::load(dirname(__DIR__) . '/.env');



try {
    $router = Bootstrap::router();
    $response = $router->dispatch(Bootstrap::requestFromGlobals());
} catch (Throwable $exception) {
    error_log((string) $exception);

    $response = Response::json(
        ['error' => 'internal_server_error'],
        500
    );
}

$response->send();
