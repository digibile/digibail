<?php

declare(strict_types=1);

use App\Core\Database\ConnectionFactory;

require dirname(__DIR__) . '/vendor/autoload.php';

$path = $argv[1] ?? '';
if ($path === '' || !is_file($path) || !is_readable($path)) {
    fwrite(STDERR, "Usage: php scripts/import_identity_links.php /secure/path/verified-identity-map.csv\n");
    exit(2);
}

$db = ConnectionFactory::create();
$handle = fopen($path, 'rb');
if ($handle === false) {
    fwrite(STDERR, "Cannot read identity mapping CSV.\n");
    exit(2);
}

$header = fgetcsv($handle);
$expected = ['legacy_user_id', 'core_user_id', 'mobile', 'national_code'];
if ($header !== $expected) {
    fclose($handle);
    fwrite(STDERR, "CSV header must be: " . implode(',', $expected) . "\n");
    exit(2);
}

$find = $db->prepare(
    'SELECT Id, Mobile, Phone, PhoneNumber, NationalCode
     FROM AspNetUsers WHERE Id = :id LIMIT 2'
);
$insert = $db->prepare(
    'INSERT INTO PhpIdentityLinks
        (LegacyUserId, CoreUserId, MappingSource, VerifiedAt, CreatedOn)
     VALUES (:legacy_id, :core_id, :source, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6))'
);

$rows = 0;
$failed = 0;
$db->beginTransaction();

try {
    while (($record = fgetcsv($handle)) !== false) {
        if (count($record) !== 4) {
            throw new RuntimeException('A CSV row does not contain exactly four columns.');
        }

        [$legacyId, $coreId, $mobile, $nationalCode] = array_map('trim', $record);
        if ($legacyId === '' || !self::validUuid($coreId)) {
            throw new RuntimeException('Invalid legacy ID or core GUID in mapping CSV.');
        }

        $find->execute(['id' => $legacyId]);
        $matches = $find->fetchAll();
        if (count($matches) !== 1) {
            throw new RuntimeException('Legacy identity does not resolve uniquely: ' . $legacyId);
        }

        $user = $matches[0];
        $candidatePhones = array_filter([
            normalizeDigits((string) $user['Mobile']),
            normalizeDigits((string) $user['Phone']),
            normalizeDigits((string) $user['PhoneNumber']),
        ]);
        $expectedPhone = normalizeDigits($mobile);
        $phoneMatches = false;
        foreach ($candidatePhones as $candidate) {
            if ($candidate !== '' && phoneForms($candidate) === phoneForms($expectedPhone)) {
                $phoneMatches = true;
                break;
            }
        }

        if (!$phoneMatches || normalizeDigits((string) $user['NationalCode']) !== normalizeDigits($nationalCode)) {
            throw new RuntimeException('Mobile or national-code reconciliation failed for legacy ID: ' . $legacyId);
        }

        $insert->execute([
            'legacy_id' => $legacyId,
            'core_id' => strtolower($coreId),
            'source' => 'verified_import',
        ]);
        $rows++;
    }

    $db->commit();
} catch (Throwable $exception) {
    if ($db->inTransaction()) $db->rollBack();
    $failed = 1;
    fwrite(STDERR, $exception->getMessage() . "\n");
} finally {
    fclose($handle);
}

if ($failed !== 0) exit(1);
fwrite(STDOUT, "Imported {$rows} verified identity links. No fuzzy or automatic matching was performed.\n");

function normalizeDigits(string $value): string
{
    return strtr(trim($value), [
        '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
        '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
        '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
        '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
    ]);
}

function phoneForms(string $phone): string
{
    $digits = normalizeDigits($phone);
    if (str_starts_with($digits, '+98')) $digits = '0' . substr($digits, 3);
    elseif (str_starts_with($digits, '98')) $digits = '0' . substr($digits, 2);
    elseif (preg_match('/^9\\d{9}$/D', $digits) === 1) $digits = '0' . $digits;
    return $digits;
}

function validUuid(string $value): bool
{
    return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $value) === 1;
}
