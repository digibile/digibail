<?php

declare(strict_types=1);

/**
 * Verify the existing DigiBail MariaDB connection without running migrations.
 * Prefer the protected DirectAdmin config when readable; otherwise reuse the
 * already-provisioned private .env. No existing credentials or secrets are rotated.
 */

$domainRoot = dirname(__DIR__, 2);
$appRoot = dirname(__DIR__);
$configPath = $domainRoot . '/database/migration/config.php';
$envPath = $appRoot . '/.env';
$databaseName = 'digibail_vamcitydigibilepay';

$existing = [];
if (is_file($envPath) && is_readable($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $existing[trim($key)] = trim(trim($value), "'\" ");
    }
}

$mysql = null;
if (is_file($configPath) && is_readable($configPath)) {
    $config = require $configPath;
    $candidate = is_array($config) ? ($config['mysql'] ?? null) : null;
    if (is_array($candidate)) {
        $mysql = $candidate;
        echo "DATABASE_CONFIG_SOURCE=directadmin\n";
    }
}

if ($mysql === null) {
    $encodedPassword = (string) ($existing['DB_PASSWORD_B64'] ?? '');
    $decodedPassword = $encodedPassword !== '' ? base64_decode($encodedPassword, true) : false;
    $password = is_string($decodedPassword)
        ? $decodedPassword
        : (string) ($existing['DB_PASSWORD'] ?? '');

    if (
        !is_file($envPath)
        || !is_readable($envPath)
        || empty($existing['DB_USER'])
        || $password === ''
    ) {
        throw new RuntimeException(
            'Database config is not readable by the deployment account and existing private .env credentials are incomplete.'
        );
    }

    $mysql = [
        'host' => $existing['DB_HOST'] ?? 'localhost',
        'port' => $existing['DB_PORT'] ?? 3306,
        'user' => $existing['DB_USER'],
        'password' => $password,
        'socket' => $existing['DB_SOCKET'] ?? '',
    ];
    echo "DATABASE_CONFIG_SOURCE=existing_private_env\n";
}

if (empty($mysql['user']) || !array_key_exists('password', $mysql)) {
    throw new RuntimeException('Existing database credentials are incomplete.');
}

$host = (string) ($mysql['host'] ?? 'localhost');
$port = (int) ($mysql['port'] ?? 3306);
$user = (string) $mysql['user'];
$password = (string) $mysql['password'];
$socket = (string) ($mysql['socket'] ?? '');

if (!empty($existing['DB_NAME']) && $existing['DB_NAME'] !== $databaseName) {
    throw new RuntimeException('Existing private environment points to an unexpected database; refusing to change it.');
}

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
$missing = [];
foreach ($requiredTables as $table) {
    $check->execute([$table]);
    if ((int) $check->fetchColumn() !== 1) {
        $missing[] = $table;
    }
}
if ($missing !== []) {
    throw new RuntimeException('Required existing PHP tables are missing: ' . implode(', ', $missing));
}

$tableCount = (int) $pdo->query(
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'"
)->fetchColumn();

echo "PHP_ENV_CREATED_OR_REUSED=1\n";
echo "PHP_ENV_PERMISSIONS=0600\n";
echo "PHP_REQUIRED_TABLES=" . count($requiredTables) . "/" . count($requiredTables) . "\n";
echo "TARGET_BASE_TABLE_COUNT={$tableCount}\n";
echo "PHP_DATABASE_BOOTSTRAP_READY=1\n";
