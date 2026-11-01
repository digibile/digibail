<?php

declare(strict_types=1);

use App\Core\Bootstrap;
use App\Core\Http\Request;
use App\Core\Http\Response;
use App\Core\Routing\Router;

require dirname(__DIR__) . '/vendor/autoload.php';

$router = Bootstrap::router();
$adminLoanCreatePath = $router->dispatch(new Request('GET', '/api/v1/admin/loan-products/seed'));
if ($adminLoanCreatePath->status !== 405 || ($adminLoanCreatePath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('Admin loan-product create must be registered as POST.');
}

$adminLoanUpdatePath = $router->dispatch(new Request('POST', '/api/v1/admin/loan-products/00000000-0000-4000-8000-000000000001'));
if ($adminLoanUpdatePath->status !== 405 || ($adminLoanUpdatePath->headers['Allow'] ?? '') !== 'PUT') {
    throw new RuntimeException('Admin loan-product update must be registered as PUT.');
}

$adminLoanTogglePath = $router->dispatch(new Request('GET', '/api/v1/admin/loan-products/00000000-0000-4000-8000-000000000001/toggle'));
if ($adminLoanTogglePath->status !== 405 || ($adminLoanTogglePath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('Admin loan-product toggle must be registered as POST.');
}

$tenantConfigPath = $router->dispatch(new Request('POST', '/api/v1/tenant/config'));
if ($tenantConfigPath->status !== 405 || ($tenantConfigPath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('The tenant configuration endpoint must be registered as GET.');
}

$loanProductsPath = $router->dispatch(new Request('POST', '/api/v1/loan-products'));
if ($loanProductsPath->status !== 405 || ($loanProductsPath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('The public loan products endpoint must be registered as GET.');
}

$loanProductDetailPath = $router->dispatch(new Request('POST', '/api/v1/loan-products/sample-plan'));
if ($loanProductDetailPath->status !== 405 || ($loanProductDetailPath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('The public loan product detail endpoint must be registered as GET.');
}

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

$uuidRouter = new Router();
$uuidRouter->put('/resources/{id:uuid}', static fn (Request $request): Response => Response::json(['id' => $request->params['id'] ?? null]));
$validUuid = $uuidRouter->dispatch(new Request('PUT', '/resources/00000000-0000-4000-8000-000000000001'));
if ($validUuid->status !== 200) {
    throw new RuntimeException('UUID-constrained routes must accept valid UUID identifiers.');
}
$invalidUuid = $uuidRouter->dispatch(new Request('PUT', '/resources/not-a-uuid'));
if ($invalidUuid->status !== 404) {
    throw new RuntimeException('UUID-constrained routes must reject non-UUID identifiers.');
}
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

$registerPath = $router->dispatch(new Request('GET', '/api/v1/security/register'));
if ($registerPath->status !== 405 || ($registerPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The OTP-verified registration endpoint must be registered as POST.');
}

$legacyRegisterPath = $router->dispatch(new Request('GET', '/api/v1/Auth/register'));
if ($legacyRegisterPath->status !== 405 || ($legacyRegisterPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The legacy registration route must remain registered as POST.');
}

$tenantConfigPath = $router->dispatch(new Request('POST', '/api/v1/tenant/config'));
if ($tenantConfigPath->status !== 405 || ($tenantConfigPath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('Public tenant configuration must remain registered as GET.');
}

$loanProductsPath = $router->dispatch(new Request('POST', '/api/v1/loan-products'));
if ($loanProductsPath->status !== 405 || ($loanProductsPath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('Public loan-product listing must remain registered as GET.');
}

$loanProductPath = $router->dispatch(new Request('POST', '/api/v1/loan-products/example-slug'));
if ($loanProductPath->status !== 405 || ($loanProductPath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('Public loan-product detail must remain registered as GET.');
}

$ocrRegisterPath = $router->dispatch(new Request('GET', '/api/v1/security/register/ocr'));
if ($ocrRegisterPath->status !== 405 || ($ocrRegisterPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The OCR registration endpoint must remain explicitly registered as POST.');
}

$otpRequestPath = $router->dispatch(new Request('GET', '/api/v1/security/otp/request'));
if ($otpRequestPath->status !== 405 || ($otpRequestPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The OTP request endpoint must be registered as POST.');
}

$otpStatusPath = $router->dispatch(new Request('POST', '/api/v1/security/otp/status'));
if ($otpStatusPath->status !== 405 || ($otpStatusPath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('The OTP status endpoint must be registered as GET.');
}

$otpVerifyPath = $router->dispatch(new Request('GET', '/api/v1/security/otp/verify'));
if ($otpVerifyPath->status !== 405 || ($otpVerifyPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The OTP verify endpoint must be registered as POST.');
}

$legacyOtpVerifyPath = $router->dispatch(new Request('GET', '/api/v1/Auth/verify-otp'));
if ($legacyOtpVerifyPath->status !== 405 || ($legacyOtpVerifyPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The legacy OTP verify route must remain registered as POST.');
}


$resetPath = $router->dispatch(new Request('GET', '/api/v1/security/password-reset/confirm'));
if ($resetPath->status !== 405 || ($resetPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The password reset confirmation endpoint must be registered as POST.');
}

$resetRequestPath = $router->dispatch(new Request('GET', '/api/v1/security/password-reset/request'));
if ($resetRequestPath->status !== 405 || ($resetRequestPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The password reset request endpoint must be registered as POST.');
}

$wrongMethod = $methodRouter->dispatch(new Request('GET', '/resource'));
if ($wrongMethod->status !== 405 || ($wrongMethod->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('Known paths with unsupported methods must return HTTP 405 and Allow.');
}

echo "PHP foundation smoke tests passed.\n";$adminLoanListPath = $router->dispatch(new Request('HEAD', '/api/v1/admin/loan-products'));
if ($adminLoanListPath->status !== 405 || ($adminLoanListPath->headers['Allow'] ?? '') !== 'GET, POST') {
    throw new RuntimeException('Admin loan-product list and create routes must be registered.');
}

$adminLoanUpdatePath = $router->dispatch(new Request('POST', '/api/v1/admin/loan-products/00000000-0000-4000-8000-000000000001'));
if ($adminLoanUpdatePath->status !== 405 || ($adminLoanUpdatePath->headers['Allow'] ?? '') !== 'PUT') {
    throw new RuntimeException('Admin loan-product update must be registered as PUT.');
}

$adminLoanTogglePath = $router->dispatch(new Request('GET', '/api/v1/admin/loan-products/00000000-0000-4000-8000-000000000001/toggle'));
if ($adminLoanTogglePath->status !== 405 || ($adminLoanTogglePath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('Admin loan-product toggle must be registered as POST.');
}

$tenantConfigPath = $router->dispatch(new Request('POST', '/api/v1/tenant/config'));
if ($tenantConfigPath->status !== 405 || ($tenantConfigPath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('The tenant configuration endpoint must be registered as GET.');
}

$loanProductsPath = $router->dispatch(new Request('POST', '/api/v1/loan-products'));
if ($loanProductsPath->status !== 405 || ($loanProductsPath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('The public loan products endpoint must be registered as GET.');
}

$loanProductDetailPath = $router->dispatch(new Request('POST', '/api/v1/loan-products/sample-plan'));
if ($loanProductDetailPath->status !== 405 || ($loanProductDetailPath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('The public loan product detail endpoint must be registered as GET.');
}

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

$registerPath = $router->dispatch(new Request('GET', '/api/v1/security/register'));
if ($registerPath->status !== 405 || ($registerPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The OTP-verified registration endpoint must be registered as POST.');
}

$legacyRegisterPath = $router->dispatch(new Request('GET', '/api/v1/Auth/register'));
if ($legacyRegisterPath->status !== 405 || ($legacyRegisterPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The legacy registration route must remain registered as POST.');
}

$tenantConfigPath = $router->dispatch(new Request('POST', '/api/v1/tenant/config'));
if ($tenantConfigPath->status !== 405 || ($tenantConfigPath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('Public tenant configuration must remain registered as GET.');
}

$loanProductsPath = $router->dispatch(new Request('POST', '/api/v1/loan-products'));
if ($loanProductsPath->status !== 405 || ($loanProductsPath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('Public loan-product listing must remain registered as GET.');
}

$loanProductPath = $router->dispatch(new Request('POST', '/api/v1/loan-products/example-slug'));
if ($loanProductPath->status !== 405 || ($loanProductPath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('Public loan-product detail must remain registered as GET.');
}

$ocrRegisterPath = $router->dispatch(new Request('GET', '/api/v1/security/register/ocr'));
if ($ocrRegisterPath->status !== 405 || ($ocrRegisterPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The OCR registration endpoint must remain explicitly registered as POST.');
}

$otpRequestPath = $router->dispatch(new Request('GET', '/api/v1/security/otp/request'));
if ($otpRequestPath->status !== 405 || ($otpRequestPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The OTP request endpoint must be registered as POST.');
}

$otpStatusPath = $router->dispatch(new Request('POST', '/api/v1/security/otp/status'));
if ($otpStatusPath->status !== 405 || ($otpStatusPath->headers['Allow'] ?? '') !== 'GET') {
    throw new RuntimeException('The OTP status endpoint must be registered as GET.');
}

$otpVerifyPath = $router->dispatch(new Request('GET', '/api/v1/security/otp/verify'));
if ($otpVerifyPath->status !== 405 || ($otpVerifyPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The OTP verify endpoint must be registered as POST.');
}

$legacyOtpVerifyPath = $router->dispatch(new Request('GET', '/api/v1/Auth/verify-otp'));
if ($legacyOtpVerifyPath->status !== 405 || ($legacyOtpVerifyPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The legacy OTP verify route must remain registered as POST.');
}


$resetPath = $router->dispatch(new Request('GET', '/api/v1/security/password-reset/confirm'));
if ($resetPath->status !== 405 || ($resetPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The password reset confirmation endpoint must be registered as POST.');
}

$resetRequestPath = $router->dispatch(new Request('GET', '/api/v1/security/password-reset/request'));
if ($resetRequestPath->status !== 405 || ($resetRequestPath->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('The password reset request endpoint must be registered as POST.');
}

$wrongMethod = $methodRouter->dispatch(new Request('GET', '/resource'));
if ($wrongMethod->status !== 405 || ($wrongMethod->headers['Allow'] ?? '') !== 'POST') {
    throw new RuntimeException('Known paths with unsupported methods must return HTTP 405 and Allow.');
}

echo "PHP foundation smoke tests passed.\n";
