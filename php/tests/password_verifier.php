<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use App\Security\PasswordVerifier;

$password = 'Correct-Horse-42!';
$identityV3 = 'AQAAAAEAACcQAAAAEmRpZ2liYWlsLXRlc3Qtc2FsdM8B1mpUbR8haB2xb2r1gw5QVc4EgTrck8uaueWJYo7R';

if (!PasswordVerifier::verify($password, $identityV3)) {
    throw new RuntimeException('ASP.NET Identity v3 SHA-256 test vector must verify.');
}

if (PasswordVerifier::verify('incorrect-password', $identityV3)) {
    throw new RuntimeException('An incorrect ASP.NET Identity v3 password must fail.');
}

if (PasswordVerifier::verify($password, 'not-a-valid-hash')) {
    throw new RuntimeException('Malformed password hashes must fail closed.');
}

$bcrypt = PasswordVerifier::hashForNewPassword($password);
if (!PasswordVerifier::verify($password, $bcrypt)) {
    throw new RuntimeException('New bcrypt password hashes must verify.');
}

if (PasswordVerifier::needsBcryptUpgrade($identityV3) !== true) {
    throw new RuntimeException('Identity v3 hashes must be marked for upgrade after successful login.');
}

if (PasswordVerifier::needsBcryptUpgrade($bcrypt) !== false) {
    throw new RuntimeException('Fresh bcrypt cost-12 hashes must not need upgrade.');
}

echo "Password verifier tests passed.\n";
