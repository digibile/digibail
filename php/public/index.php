<?php

declare(strict_types=1);

/*
 * Load the private application environment file from the project root.
 * Existing process environment variables always take precedence.
 */
$environmentFile = dirname(__DIR__) . '/.env';

if (is_file($environmentFile) && is_readable($environmentFile)) {
    $environmentLines = file($environmentFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($environmentLines !== false) {
        foreach ($environmentLines as $environmentLine) {
            $line = trim($environmentLine);

            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            if (!preg_match('/^([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*(.*)$/', $line, $matches)) {
                continue;
            }

            $name = $matches[1];

            if (getenv($name) !== false) {
                continue;
            }

            $value = trim($matches[2]);

            if (
                strlen($value) >= 2
                && (($value[0] === '"' && str_ends_with($value, '"'))
                    || ($value[0] === "'" && str_ends_with($value, "'")))
            ) {
                $value = substr($value, 1, -1);
            }

            putenv($name . '=' . $value);
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

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
