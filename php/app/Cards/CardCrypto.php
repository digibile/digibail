<?php

declare(strict_types=1);

namespace App\Cards;

use RuntimeException;

final class CardCrypto
{
    private string $encryptionKey;
    private string $hashPepper;
    private string $bin;

    public function __construct()
    {
        $encoded = trim((string) getenv('CARDS_ENCRYPTION_KEY'));
        $key = base64_decode($encoded, true);
        if (!is_string($key) || strlen($key) !== 32) {
            throw new RuntimeException('CARDS_ENCRYPTION_KEY must be base64 for exactly 32 random bytes.');
        }

        $pepper = (string) getenv('CARDS_HASH_PEPPER');
        if (strlen($pepper) < 24 || str_starts_with($pepper, 'change-me')) {
            throw new RuntimeException('CARDS_HASH_PEPPER must contain at least 24 non-placeholder characters.');
        }

        $bin = trim((string) (getenv('CARDS_BIN') ?: '910100'));
        if (preg_match('/^\d{6}$/D', $bin) !== 1) {
            throw new RuntimeException('CARDS_BIN must contain exactly six digits.');
        }

        $this->encryptionKey = $key;
        $this->hashPepper = $pepper;
        $this->bin = $bin;
    }

    public function protect(string $plain): string
    {
        $nonce = random_bytes(12);
        $tag = '';
        $ciphertext = openssl_encrypt(
            $plain,
            'aes-256-gcm',
            $this->encryptionKey,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag,
            'digibail.virtual-cards.v1',
            16
        );

        if (!is_string($ciphertext) || strlen($tag) !== 16) {
            throw new RuntimeException('Card data encryption failed.');
        }

        return 'v1:' . base64_encode($nonce . $tag . $ciphertext);
    }

    public function unprotect(string $encoded): string
    {
        if (!str_starts_with($encoded, 'v1:')) {
            throw new RuntimeException('Unsupported virtual-card ciphertext version.');
        }

        $payload = base64_decode(substr($encoded, 3), true);
        if (!is_string($payload) || strlen($payload) < 29) {
            throw new RuntimeException('Malformed virtual-card ciphertext.');
        }

        $nonce = substr($payload, 0, 12);
        $tag = substr($payload, 12, 16);
        $ciphertext = substr($payload, 28);
        $plain = openssl_decrypt(
            $ciphertext,
            'aes-256-gcm',
            $this->encryptionKey,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag,
            'digibail.virtual-cards.v1'
        );

        if (!is_string($plain)) {
            throw new RuntimeException('Virtual-card ciphertext authentication failed.');
        }

        return $plain;
    }

    public function hash(string $pan): string
    {
        return strtoupper(hash_hmac('sha256', $pan, $this->hashPepper));
    }

    public function newPan(): string
    {
        $digits = array_fill(0, 16, 0);
        for ($i = 0; $i < 6; $i++) {
            $digits[$i] = (int) $this->bin[$i];
        }
        for ($i = 6; $i < 15; $i++) {
            $digits[$i] = random_int(0, 9);
        }

        $sum = 0;
        for ($i = 0; $i < 15; $i++) {
            $value = $digits[14 - $i];
            if ($i % 2 === 0) {
                $value *= 2;
                if ($value > 9) $value -= 9;
            }
            $sum += $value;
        }
        $digits[15] = (10 - ($sum % 10)) % 10;

        return implode('', $digits);
    }

    public function binPrefix(): string
    {
        return substr($this->bin, 0, 4);
    }

    public static function validPan(string $pan): bool
    {
        if (preg_match('/^\d{16}$/D', $pan) !== 1) return false;
        $sum = 0;
        for ($i = 0; $i < 16; $i++) {
            $value = (int) $pan[15 - $i];
            if ($i % 2 === 1) {
                $value *= 2;
                if ($value > 9) $value -= 9;
            }
            $sum += $value;
        }
        return $sum % 10 === 0;
    }
}
