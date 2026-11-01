<?php

declare(strict_types=1);

/**
 * Production bootstrap for the isolated PHP runtime.
 * Reuses the already-provisioned DirectAdmin MariaDB credentials and database.
 * Only additive CREATE TABLE IF NOT EXISTS migrations are applied.
 */

$domainRoot = dirname(__DIR__, 2);
$appRoot = dirname(__DIR__);
$configPath = $domainRoot . '/database/migration/config.php';
$envPath = $appRoot . '/.env';
$migrationDirectory = $appRoot . '/database/migrations';
$databaseName = 'digibail_vamcitydigibilepay';

if (!is_file($configPath) || !is_readable($configPath)) {
    throw new RuntimeException('Existing DirectAdmin database configuration is unavailable.');
}

$config = require $configPath;
$mysql = $config['mysql'] ?? null;
if (!is_array($mysql) || empty($mysql['user']) || !array_key_exists('password', $mysql)) {
    throw new RuntimeException('Existing DirectAdmin database credentials are incomplete.');
}

$host = (string) ($mysql['host'] ?? 'localhost');
$port = (int) ($mysql['port'] ?? 3306);
$user = (string) $mysql['user'];
$password = (string) $mysql['password'];
$socket = (string) ($mysql['socket'] ?? '');

if ($socket !== '' && file_exists($socket)) {
    $dsn = sprintf('mysql:unix_socket=%s;dbname=%s;charset=utf8mb4', $socket, $databaseName);
} else {
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, $port, $databaseName);
}

$pdo = new PDO($dsn, $user, $password, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::ATTR_TIMEOUT => 10,
]);

$existing = [];
if (is_file($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $existing[trim($key)] = trim(trim($value), "'\" ");
    }
}

$values = $existing;
$values['APP_ENV'] = 'production';
$values['APP_DEBUG'] = 'false';
$values['DB_HOST'] = $host;
$values['DB_PORT'] = (string) $port;
$values['DB_NAME'] = $databaseName;
$values['DB_USER'] = $user;
$values['DB_PASSWORD_B64'] = base64_encode($password);
$values['DB_SOCKET'] = $socket;
$values['DB_CHARSET'] = 'utf8mb4';
$values['DB_CONNECTION_TIMEOUT'] = '10';

foreach (['JWT_SECRET', 'OTP_PEPPER', 'CAPTCHA_PEPPER', 'CARDS_HASH_PEPPER'] as $secret) {
    if (empty($values[$secret]) || str_starts_with((string) $values[$secret], 'change-me')) {
        $values[$secret] = bin2hex(random_bytes(48));
    }
}
if (empty($values['CARDS_ENCRYPTION_KEY'])) {
    $values['CARDS_ENCRYPTION_KEY'] = base64_encode(random_bytes(32));
}
$values['CARDS_BIN'] = $values['CARDS_BIN'] ?? '910100';
$values['CARDS_VALID_MONTHS'] = $values['CARDS_VALID_MONTHS'] ?? '36';
$values['AUTH_CUSTOMER_ROLE'] = $values['AUTH_CUSTOMER_ROLE'] ?? 'Customer';
$values['BRAND_NAME'] = $values['BRAND_NAME'] ?? 'دیجی‌بایل';

$lines = [];
foreach ($values as $key => $value) {
    if (preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/D', (string) $key) !== 1) {
        continue;
    }
    $lines[] = $key . '=' . (string) $value;
}
if (file_put_contents($envPath, implode("\n", $lines) . "\n", LOCK_EX) === false) {
    throw new RuntimeException('Could not write private PHP environment file.');
}
chmod($envPath, 0600);

foreach ($values as $key => $value) {
    putenv($key . '=' . $value);
    $_ENV[$key] = $value;
}

$pdo->query('SELECT 1')->fetchColumn();
echo "EXISTING_MARIADB_CONNECTION=OK\n";
echo "TARGET_DATABASE={$databaseName}\n";

$migrations = [
    '20261101_php_security_support.sql',
    '20261101_php_tenancy_loan_products.sql',
    '20261101_php_identity_links.sql',
    '20261101_php_virtual_cards.sql',
];

foreach ($migrations as $migration) {
    $path = $migrationDirectory . '/' . $migration;
    if (!is_file($path) || !is_readable($path)) {
        throw new RuntimeException('Required additive PHP migration is missing: ' . $migration);
    }
    $sql = file_get_contents($path);
    if (!is_string($sql)) {
        throw new RuntimeException('Could not read migration: ' . $migration);
    }
    $sql = preg_replace('/^\s*--.*$/m', '', $sql);
    foreach (array_filter(array_map('trim', explode(';', (string) $sql))) as $statement) {
        $pdo->exec($statement);
    }
    echo "MIGRATION_APPLIED={$migration}\n";
}

$tableCount = (int) $pdo->query(
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'"
)->fetchColumn();

$requiredTables = [
    'php_security_challenges',
    'php_security_rate_limits',
    'Tenants',
    'TenantDomains',
    'LoanProducts',
    'PhpIdentityLinks',
    'VirtualCards',
    'VirtualCardTxns',
];

$check = $pdo->prepare(
    'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?'
);
foreach ($requiredTables as $table) {
    $check->execute([$table]);
    if ((int) $check->fetchColumn() !== 1) {
        throw new RuntimeException('Required PHP table is missing after migration: ' . $table);
    }
}

echo "PHP_ENV_CREATED=1\n";
echo "PHP_ENV_PERMISSIONS=0600\n";
echo "PHP_REQUIRED_TABLES=" . count($requiredTables) . "/" . count($requiredTables) . "\n";
echo "TARGET_BASE_TABLE_COUNT={$tableCount}\n";
echo "PHP_DATABASE_BOOTSTRAP_READY=1\n";
