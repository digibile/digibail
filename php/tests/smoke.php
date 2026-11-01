<?php

declare(strict_types=1);

use App\Core\Bootstrap;
use App\Core\Http\Request;
use App\Core\Http\Response;
use App\Core\Routing\Router;

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

$methodRouter = new Router();
$methodRouter->post('/resource', static fn (Request $request): Response => Response::json(['created' => true], 201));
$created = $methodRouter->dispatch(new Request('POST', '/resource'));

if ($created->status !== 201) {
    throw new RuntimeException('POST routes must dispatch correctly.');
}

$methodRouter->get('/resource/{id}', static fn (Request $request): Response => Response::json(['id' => $request->params['id'] ?? null]));
$parameterized = $methodRouter->dispatch(new Request('GET', '/resource/42'));
$parameterizedPayload = json_decode($parameterized->body, true, 512, JSON_THROW_ON_ERROR);
if (($parameterizedPayload['id'] ?? null) !== '42') {
    throw new RuntimeException('Parameterized routes must expose decoded route parameters.');
}

$knownSecurityPath = $router->dispatch(new Request('GET', '/api/v1/security/login'));
if ($knownSecurityPath->status !== 405 || ($knownSecurityPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The PHP login endpoint must be registered as POST.');
}

$legacySecurityPath = $router->dispatch(new Request('GET', '/api/v1/Auth/login'));
if ($legacySecurityPath->status !== 405 || ($legacySecurityPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The legacy login route must remain registered as POST.');
}

$captchaPath = $router->dispatch(new Request('POST', '/api/v1/security/captcha'));
if ($captchaPath->status !== 405 || ($captchaPath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('The CAPTCHA endpoint must be registered as GET.');
}

$mePath = $router->dispatch(new Request('POST', '/api/v1/security/me'));
if ($mePath->status !== 405 || ($mePath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('The current-user endpoint must be registered as GET.');
}

$legacyMePath = $router->dispatch(new Request('POST', '/api/v1/Auth/me'));
if ($legacyMePath->status !== 405 || ($legacyMePath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('The legacy current-user route must remain registered as GET.');
}

$wrongMethod = $methodRouter->dispatch(new Request('GET', '/resource'));
if ($wrongMethod->status !== 405 || ($wrongMethod->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('Known paths with unsupported methods must return HTTP 405 and Allow.');
}

echo "PHP foundation smoke tests passed.\n";
