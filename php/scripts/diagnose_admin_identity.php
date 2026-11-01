<?php
declare(strict_types=1);
use App\Core\Database\ConnectionFactory;
use App\Core\Environment;
$appRoot = dirname(__DIR__);
require $appRoot . '/vendor/autoload.php';
Environment::load($appRoot . '/.env');
$id = (string) ($argv[1] ?? '');
if ($id === '' || !ctype_digit($id)) { fwrite(STDERR, "DIAG_INVALID_USER_ID=1\n"); exit(2); }
$db = ConnectionFactory::create();
$columns = $db->prepare('SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table');
$columns->execute(['table' => 'AspNetUsers']);
$available = array_fill_keys(array_column($columns->fetchAll(), 'COLUMN_NAME'), true);
$wanted = ['Id', 'UserName', 'NormalizedUserName', 'PasswordHash', 'IsActive', 'Mobile', 'Phone', 'PhoneNumber'];
$select = array_values(array_filter($wanted, static fn(string $name): bool => isset($available[$name])));
if (!in_array('Id', $select, true)) { throw new RuntimeException('AspNetUsers.Id is unavailable.'); }
$sql = 'SELECT ' . implode(', ', $select) . ' FROM AspNetUsers WHERE Id = :id LIMIT 1';
$statement = $db->prepare($sql);
$statement->execute(['id' => $id]);
$user = $statement->fetch();
if (!is_array($user)) { echo "AUTH_DIAG_ACCOUNT_FOUND=0\n"; exit(0); }
echo "AUTH_DIAG_ACCOUNT_FOUND=1\n";
echo 'AUTH_DIAG_ACCOUNT_ACTIVE=' . ((int) ($user['IsActive'] ?? 0) === 1 ? '1' : '0') . "\n";
echo 'AUTH_DIAG_USERNAME_MATCH=' . ((string) ($user['UserName'] ?? '') === '09127070757' ? '1' : '0') . "\n";
$hash = (string) ($user['PasswordHash'] ?? '');
$hashType = str_starts_with($hash, '$2') ? 'bcrypt' : (\App\Security\PasswordVerifier::isIdentityV3($hash) ? 'identity_v3' : ($hash === '' ? 'empty' : 'other'));
echo "AUTH_DIAG_PASSWORD_HASH_TYPE={$hashType}\n";
foreach (['Mobile', 'Phone', 'PhoneNumber'] as $field) {
 echo 'AUTH_DIAG_' . strtoupper($field) . '_SET=' . (!empty($user[$field]) ? '1' : '0') . "\n";
}
$match = $db->prepare('SELECT COUNT(*) FROM AspNetUsers WHERE NormalizedUserName = :normalized OR UserName = :username');
$match->execute(['normalized' => '09127070757', 'username' => '09127070757']);
echo 'AUTH_DIAG_USERNAME_MATCH_COUNT=' . (int) $match->fetchColumn() . "\n";
$roleTable = $db->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'AspNetUserRoles'")->fetchColumn();
if ((int) $roleTable === 1) {
 $roles = $db->prepare('SELECT r.Name FROM AspNetUserRoles ur INNER JOIN AspNetRoles r ON r.Id = ur.RoleId WHERE ur.UserId = :id ORDER BY r.Name');
 $roles->execute(['id' => $id]);
 $names = array_map(static fn(array $row): string => (string) $row['Name'], $roles->fetchAll());
 echo 'AUTH_DIAG_LINKED_ROLES=' . ($names === [] ? 'none' : implode(',', $names)) . "\n";
} else { echo "AUTH_DIAG_LINKED_ROLES_TABLE=missing\n"; }
if (isset($available['Roles'])) {
 $legacy = $db->prepare('SELECT Roles FROM AspNetUsers WHERE Id = :id LIMIT 1');
 $legacy->execute(['id' => $id]);
 $value = trim((string) $legacy->fetchColumn());
 echo 'AUTH_DIAG_LEGACY_ROLES=' . ($value === '' ? 'empty' : preg_replace('/[^A-Za-z0-9_, -]/', '', $value)) . "\n";
} else { echo "AUTH_DIAG_LEGACY_ROLES_COLUMN=missing\n"; }
echo "AUTH_DIAG_READ_ONLY=1\n";
