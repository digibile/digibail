<?php

declare(strict_types=1);

use App\Core\Bootstrap;
use App\Core\Http\Response;

require dirname(__DIR__) . '/vendor/autoload.php';

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
