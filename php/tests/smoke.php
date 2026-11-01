<?php

declare(strict_types=1);

use App\Core\Bootstrap;
use App\Core\Http\Request;

require dirname(__DIR__) . '/vendor/autoload.php';

$router = Bootstrap::router();
$live = $router->dispatch(new Request('GET', '/health/live'));

if ($live->status !== 200) {
    throw new RuntimeException('Health live route must return HTTP 200.');
}

$payload = json_decode($live->body, true, 512, JSON_THROW_ON_ERROR);

if (($payload['status'] ?? null) !== 'ok') {
    throw new RuntimeException('Health live route returned an invalid payload.');
}

$missing = $router->dispatch(new Request('GET', '/route-that-does-not-exist'));

if ($missing->status !== 404) {
    throw new RuntimeException('Unknown routes must return HTTP 404.');
}

$methodRouter = new \\App\\Core\\Routing\\Router();
$methodRouter->post('/resource', static fn (Request $request): \\App\\Core\\Http\\Response => \\App\\Core\\Http\\Response::json(['created' => true], 201));
$created = $methodRouter->dispatch(new Request('POST', '/resource'));

if ($created->status !== 201) {
    throw new RuntimeException('POST routes must dispatch correctly.');
}

$wrongMethod = $methodRouter->dispatch(new Request('GET', '/resource'));
if ($wrongMethod->status !== 405 || ($wrongMethod->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('Known paths with unsupported methods must return HTTP 405 and Allow.');
}

echo "PHP foundation smoke tests passed.\n";
