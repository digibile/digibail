<?php

declare(strict_types=1);

namespace App\Identity;

use App\Security\PasswordVerifier;
use PDO;
use Throwable;

final class LegacyIdentityRepository
{
    public function __construct(private readonly PDO $db)
    {
    }

    /** @return array<string, mixed>|null */
    public function authenticate(string $identifier, string $password): ?array
    {
        $identifier = trim($identifier);
        if ($identifier === '' || $password === '') {
            return null;
        }

        $user = $this->findUser($identifier);
        if ($user === null || (int) $user['IsActive'] !== 1 || !$this->isLockoutExpired($user)) {
            return null;
        }

        $storedHash = is_string($user['PasswordHash'] ?? null) ? $user['PasswordHash'] : null;
        if (!PasswordVerifier::verify($password, $storedHash)) {
            return null;
        }

        if (PasswordVerifier::needsBcryptUpgrade($storedHash)) {
            $this->upgradeHash((string) $user['Id'], (string) $storedHash, $password);
        }

        return [
            'id' => (string) $user['Id'],
            'username' => $user['UserName'],
            'first_name' => $user['FirstName'],
            'last_name' => $user['LastName'],
            'display_name' => trim((string) ($user['FirstName'] ?? '') . ' ' . (string) ($user['LastName'] ?? '')),
            'mobile' => $user['Mobile'] ?: ($user['PhoneNumber'] ?: $user['Phone']),
            'email' => $user['Email'],
            'national_code' => $user['NationalCode'],
            'is_active' => (bool) $user['IsActive'],
            'roles' => $this->rolesFor((string) $user['Id']),
            'source' => 'mariadb.AspNetUsers',
        ];
    }

    /** @return array<string, mixed>|null */
    private function findUser(string $identifier): ?array
    {
        $digits = self::normalizeDigits($identifier);
        $phone = preg_match('/^09\d{9}$/', $digits) === 1 ? $digits : null;
        $phone98 = $phone === null ? null : '98' . substr($phone, 1);
        $phonePlus98 = $phone === null ? null : '+98' . substr($phone, 1);
        $phoneLocal = $phone === null ? null : substr($phone, 1);

        $sql = <<<'SQL'
            SELECT Id, FirstName, LastName, Mobile, Phone, PhoneNumber,
                   UserName, Email, NationalCode, PasswordHash, IsActive,
                   LockoutEnd, LockoutEnabled
            FROM AspNetUsers
            WHERE NormalizedUserName = :normalized_username
               OR UserName = :username
               OR (:phone_guard IS NOT NULL AND (
                    Mobile = :mobile_09 OR Phone = :phone_09 OR PhoneNumber = :phone_number_09
                    OR Mobile = :mobile_98 OR PhoneNumber = :phone_number_98
                    OR Mobile = :mobile_plus98 OR PhoneNumber = :phone_number_plus98
                    OR Mobile = :mobile_local OR PhoneNumber = :phone_number_local
               ))
            ORDER BY Id ASC
            LIMIT 2
            SQL;

        $statement = $this->db->prepare($sql);
        $statement->execute([
            'normalized_username' => mb_strtoupper($identifier, 'UTF-8'),
            'username' => $identifier,
            'phone_guard' => $phone,
            'mobile_09' => $phone,
            'phone_09' => $phone,
            'phone_number_09' => $phone,
            'mobile_98' => $phone98,
            'phone_number_98' => $phone98,
            'mobile_plus98' => $phonePlus98,
            'phone_number_plus98' => $phonePlus98,
            'mobile_local' => $phoneLocal,
            'phone_number_local' => $phoneLocal,
        ]);

        $matches = $statement->fetchAll();

        // Ambiguous legacy identities must never authenticate as an arbitrary row.
        return count($matches) === 1 ? $matches[0] : null;
    }

    /** @return list<string> */
    private function rolesFor(string $userId): array
    {
        $statement = $this->db->prepare(
            'SELECT r.Name
             FROM AspNetUserRoles ur
             INNER JOIN AspNetRoles r ON r.Id = ur.RoleId
             WHERE ur.UserId = :user_id
             ORDER BY r.Name'
        );
        $statement->execute(['user_id' => $userId]);

        return array_values(array_filter(
            array_map(static fn (array $row): string => (string) $row['Name'], $statement->fetchAll()),
            static fn (string $role): bool => $role !== ''
        ));
    }

    /** @param array<string, mixed> $user */
    private function isLockoutExpired(array $user): bool
    {
        if (!(bool) $user['LockoutEnabled'] || empty($user['LockoutEnd'])) {
            return true;
        }

        try {
            $lockoutEnd = new \DateTimeImmutable((string) $user['LockoutEnd']);
            return $lockoutEnd <= new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
        } catch (Throwable) {
            return false;
        }
    }

    private function upgradeHash(string $userId, string $oldHash, string $password): void
    {
        $newHash = PasswordVerifier::hashForNewPassword($password);
        $statement = $this->db->prepare(
            'UPDATE AspNetUsers
             SET PasswordHash = :new_hash
             WHERE Id = :id AND PasswordHash = :old_hash'
        );
        $statement->execute([
            'new_hash' => $newHash,
            'id' => $userId,
            'old_hash' => $oldHash,
        ]);
    }

    private static function normalizeDigits(string $value): string
    {
        return strtr($value, [
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
            '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
            '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
            '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
        ]);
    }
}
