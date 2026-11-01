<?php

declare(strict_types=1);

use App\Cards\CardCrypto;

require dirname(__DIR__) . '/vendor/autoload.php';

putenv('CARDS_ENCRYPTION_KEY=' . base64_encode(random_bytes(32)));
putenv('CARDS_HASH_PEPPER=php-card-test-pepper-0123456789');
putenv('CARDS_BIN=910100');

$crypto = new CardCrypto();
$pan = $crypto->newPan();

if (!CardCrypto::validPan($pan) || !str_starts_with($pan, '910100')) {
    throw new RuntimeException('Generated PAN must use the configured BIN and pass Luhn validation.');
}

$cvv = '572';
$encrypted = $crypto->protect($cvv);
if ($encrypted === $cvv || $crypto->unprotect($encrypted) !== $cvv) {
    throw new RuntimeException('AES-256-GCM card encryption must round-trip without storing plaintext.');
}

if ($crypto->hash($pan) !== $crypto->hash($pan) || strlen($crypto->hash($pan)) !== 64) {
    throw new RuntimeException('Card PAN HMAC must be deterministic and SHA-256 sized.');
}

try {
    $crypto->unprotect(substr($encrypted, 0, -4) . 'AAAA');
    throw new RuntimeException('Tampered card ciphertext must fail authentication.');
} catch (RuntimeException $exception) {
    if ($exception->getMessage() === 'Tampered card ciphertext must fail authentication.') throw $exception;
}

echo "Virtual card crypto tests passed.\n";
