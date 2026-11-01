<?php

declare(strict_types=1);

use App\Security\PasswordVerifier;

require dirname(__DIR__) . '/vendor/autoload.php';


$password = 'Correct-Horse-42!';
$vectors = [
    'sha1' => 'AQAAAAAAACcQAAAAEmRpZ2liYWlsLXRlc3Qtc2FsdG/RW4RNMGyK8gOx2IBOifCZg/qutGtPj80/eG0II9dn',
    'sha256' => 'AQAAAAEAACcQAAAAEmRpZ2liYWlsLXRlc3Qtc2FsdM8B1mpUbR8haB2xb2r1gw5QVc4EgTrck8uaueWJYo7R',
    'sha512' => 'AQAAAAIAACcQAAAAEmRpZ2liYWlsLXRlc3Qtc2FsdOeJaodfpoMBtoufRMRjVSLBoObVQbtZk5Q6jaDRA2Nu',
];

foreach ($vectors as $prf => $hash) {
    if (!PasswordVerifier::verify($password, $hash)) {
        throw new RuntimeException('ASP.NET Identity v3 ' . $prf . ' test vector must verify.');
    }

    if (PasswordVerifier::verify('incorrect-password', $hash)) {
        throw new RuntimeException('An incorrect ASP.NET Identity v3 ' . $prf . ' password must fail.');
    }
}

if (PasswordVerifier::verify($password, 'not-a-valid-hash')) {
    throw new RuntimeException('Malformed password hashes must fail closed.');
}

$bcrypt = PasswordVerifier::hashForNewPassword($password);
if (!PasswordVerifier::verify($password, $bcrypt)) {
    throw new RuntimeException('New bcrypt password hashes must verify.');
}

if (PasswordVerifier::needsBcryptUpgrade($vectors['sha256']) !== true) {
    throw new RuntimeException('Identity v3 hashes must be marked for upgrade after successful login.');
}

if (PasswordVerifier::needsBcryptUpgrade($bcrypt) !== false) {
    throw new RuntimeException('Fresh bcrypt cost-12 hashes must not need upgrade.');
}

echo "Password verifier tests passed.\n";
