<?php

declare(strict_types=1);

namespace App\Security;

final class PasswordVerifier
{
    private const IDENTITY_V3_MARKER = 0x01;
    private const MAX_ITERATIONS = 2_000_000;
    private const MAX_SALT_BYTES = 1024;
    private const MAX_SUBKEY_BYTES = 1024;

    public static function verify(string $password, ?string $storedHash): bool
    {
        if ($storedHash === null || $storedHash === '') {
            return false;
        }

        if (str_starts_with($storedHash, '$2')) {
            return password_verify($password, $storedHash);
        }

        $decoded = base64_decode($storedHash, true);
        if (!is_string($decoded) || strlen($decoded) < 14) {
            return false;
        }

        $header = unpack('Cmarker/Nprf/Niterations/NsaltLength', substr($decoded, 0, 13));
        if (!is_array($header) || $header['marker'] !== self::IDENTITY_V3_MARKER) {
            return false;
        }

        $prf = match ($header['prf']) {
            0 => 'sha1',
            1 => 'sha256',
            2 => 'sha512',
            default => null,
        };

        $iterations = $header['iterations'];
        $saltLength = $header['saltLength'];
        $subkeyLength = strlen($decoded) - 13 - $saltLength;

        if (
            $prf === null
            || $iterations < 1
            || $iterations > self::MAX_ITERATIONS
            || $saltLength < 1
            || $saltLength > self::MAX_SALT_BYTES
            || $subkeyLength < 16
            || $subkeyLength > self::MAX_SUBKEY_BYTES
        ) {
            return false;
        }

        $salt = substr($decoded, 13, $saltLength);
        $expected = substr($decoded, 13 + $saltLength);
        $actual = hash_pbkdf2($prf, $password, $salt, $iterations, $subkeyLength, true);

        return is_string($actual) && hash_equals($expected, $actual);
    }

    public static function needsBcryptUpgrade(?string $storedHash): bool
    {
        if ($storedHash === null || $storedHash === '') {
            return false;
        }

        if (str_starts_with($storedHash, '$2')) {
            return password_needs_rehash($storedHash, PASSWORD_BCRYPT, ['cost' => 12]);
        }

        // ASP.NET Identity v3 hashes are upgraded only after successful verification.
        return self::isIdentityV3($storedHash);
    }

    public static function hashForNewPassword(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    public static function isIdentityV3(string $storedHash): bool
    {
        $decoded = base64_decode($storedHash, true);

        return is_string($decoded)
            && strlen($decoded) >= 14
            && ord($decoded[0]) === self::IDENTITY_V3_MARKER;
    }
}
