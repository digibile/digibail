<?php

declare(strict_types=1);

namespace App\Security;

use RuntimeException;

final class JwtService
{
    public function __construct(
        private readonly string $secret,
        private readonly string $issuer = 'digibail'
    ) {
        if (strlen($this->secret) < 32) {
            throw new RuntimeException('JWT_SECRET must contain at least 32 bytes.');
        }
        if ($this->issuer === '') {
            throw new RuntimeException('JWT issuer must not be empty.');
        }
    }

    /** @param array<string, mixed> $claims */
    public function issue(array $claims, int $ttlSeconds = 28800): string
    {
        if ($ttlSeconds < 1 || $ttlSeconds > 86400) {
            throw new RuntimeException('JWT lifetime is outside the permitted range.');
        }

        $now = time();
        $payload = $claims + [
            'iss' => $this->issuer,
            'iat' => $now,
            'exp' => $now + $ttlSeconds,
        ];

        // Security-critical registered claims cannot be overridden by callers.
        $payload['iss'] = $this->issuer;
        $payload['iat'] = $now;
        $payload['exp'] = $now + $ttlSeconds;

        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $segments = [
            self::base64UrlEncode(json_encode($header, JSON_THROW_ON_ERROR)),
            self::base64UrlEncode(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)),
        ];
        $signingInput = implode('.', $segments);
        $signature = hash_hmac('sha256', $signingInput, $this->secret, true);

        return $signingInput . '.' . self::base64UrlEncode($signature);
    }

    /** @return array<string, mixed>|null */
    public function verify(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;
        $headerJson = self::base64UrlDecode($encodedHeader);
        $payloadJson = self::base64UrlDecode($encodedPayload);
        $signature = self::base64UrlDecode($encodedSignature);

        if ($headerJson === null || $payloadJson === null || $signature === null) {
            return null;
        }

        try {
            $header = json_decode($headerJson, true, 16, JSON_THROW_ON_ERROR);
            $payload = json_decode($payloadJson, true, 64, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }

        if (!is_array($header) || ($header['alg'] ?? null) !== 'HS256') {
            return null;
        }
        if (!is_array($payload) || ($payload['iss'] ?? null) !== $this->issuer) {
            return null;
        }

        $expected = hash_hmac('sha256', $encodedHeader . '.' . $encodedPayload, $this->secret, true);
        if (!hash_equals($expected, $signature)) {
            return null;
        }

        $now = time();
        if (!isset($payload['exp']) || !is_numeric($payload['exp']) || (int) $payload['exp'] <= $now) {
            return null;
        }
        if (isset($payload['nbf']) && (!is_numeric($payload['nbf']) || (int) $payload['nbf'] > $now)) {
            return null;
        }

        return $payload;
    }

    private static function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $value): ?string
    {
        if ($value === '' || preg_match('/^[A-Za-z0-9_-]+$/D', $value) !== 1) {
            return null;
        }

        $decoded = base64_decode(strtr($value, '-_', '+/') . str_repeat('=', (4 - strlen($value) % 4) % 4), true);

        return is_string($decoded) ? $decoded : null;
    }
}
