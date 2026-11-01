<?php

declare(strict_types=1);

use App\Security\JwtService;

require dirname(__DIR__) . '/vendor/autoload.php';

$service = new JwtService(str_repeat('k', 48));
$token = $service->issue([
    'sub' => '1842',
    'role' => 'Customer',
    'roles' => ['Customer', 'Admin'],
    'phone' => '09120000000',
]);

$claims = $service->verify($token);
if (($claims['sub'] ?? null) !== '1842' || ($claims['role'] ?? null) !== 'Customer' || ($claims['roles'][1] ?? null) !== 'Admin') {
    throw new RuntimeException('JWT claims must survive issue and verify.');
}

$parts = explode('.', $token);
$parts[1] = rtrim(strtr(base64_encode('{"iss":"digibail","sub":"attacker","exp":4102444800}'), '+/', '-_'), '=');
if ($service->verify(implode('.', $parts)) !== null) {
    throw new RuntimeException('JWT payload tampering must be rejected.');
}

$expired = $service->issue(['sub' => '1842'], 1);
sleep(2);
if ($service->verify($expired) !== null) {
    throw new RuntimeException('Expired JWTs must be rejected.');
}

try {
    new JwtService('short-secret');
    throw new RuntimeException('Short JWT secrets must be rejected.');
} catch (RuntimeException $exception) {
    if ($exception->getMessage() === 'Short JWT secrets must be rejected.') {
        throw $exception;
    }
}

echo "JWT service tests passed.\n";
