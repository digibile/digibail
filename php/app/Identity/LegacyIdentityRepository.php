<?php

declare(strict_types=1);

namespace App\Identity;

use PDO;

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
        if ($user === null) {
            error_log('[AUTH_DIAG] password_login lookup=not_unique_or_missing');
            return null;
        }
        if ((int) $user['IsActive'] !== 1) {
            error_log('[AUTH_DIAG] password_login account=inactive user_id=' . (string) $user['Id']);
            return null;
        }
        if (!$this->isLockoutExpired($user)) {
            error_log('[AUTH_DIAG] password_login account=locked user_id=' . (string) $user['Id']);
            return null;
        }

        $storedHash = is_string($user['PasswordHash'] ?? null) ? $user['PasswordHash'] : null;
        if (!\App\Security\PasswordVerifier::verify($password, $storedHash)) {
            error_log('[AUTH_DIAG] password_login password=verification_failed user_id=' . (string) $user['Id']);
            return null;
        }
        error_log('[AUTH_DIAG] password_login result=verified user_id=' . (string) $user['Id']);

        if (\App\Security\PasswordVerifier::needsBcryptUpgrade($storedHash)) {
            $this->upgradeHash((string) $user['Id'], (string) $storedHash, $password);
        }

        return $this->shapeUser($user, $this->rolesFor((string) $user['Id']));
    }

    /** @return array<string, mixed>|null */
    public function registerCustomer(
        string $fullName,
        string $phone,
        ?string $email,
        string $nationalCode,
        string $password,
        string $roleName
    ): ?array {
        $phone = self::normalizeDigits(trim($phone));
        if ($this->phoneExists($phone) || $this->nationalCodeExists($nationalCode)) {
            return null;
        }

        $normalizedRole = mb_strtoupper(trim($roleName), 'UTF-8');
        $roleQuery = $this->db->prepare(
            'SELECT Id FROM AspNetRoles
             WHERE NormalizedName = :normalized_role OR UPPER(Name) = :role_name
             ORDER BY Id ASC LIMIT 2'
        );
        $roleQuery->execute([
            'normalized_role' => $normalizedRole,
            'role_name' => $normalizedRole,
        ]);
        $roleRows = $roleQuery->fetchAll();
        if (count($roleRows) !== 1) {
            throw new \RuntimeException('Configured customer role is missing or ambiguous in AspNetRoles.');
        }

        $parts = preg_split('/\s+/u', trim($fullName), 2) ?: [];
        $firstName = $parts[0] ?? '';
        $lastName = $parts[1] ?? '';
        $now = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
        $date = $now->format('Y-m-d H:i:s.u');
        $rawDate = $now->format('Y-m-d\TH:i:s.u\Z');
        $sentinel = '0001-01-01T00:00:00.0000000';
        $securityStamp = bin2hex(random_bytes(24));
        $concurrencyStamp = bin2hex(random_bytes(16));
        $hash = \App\Security\PasswordVerifier::hashForNewPassword($password);

        $this->db->beginTransaction();
        try {
            if ($this->phoneExists($phone) || $this->nationalCodeExists($nationalCode)) {
                $this->db->rollBack();
                return null;
            }

            $insert = $this->db->prepare(
                'INSERT INTO AspNetUsers (
                    FirstName, LastName, Gender, IsActive, TotalSavedMoney, ViewCount,
                    UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed,
                    PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber,
                    PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnd, LockoutEnabled,
                    AccessFailedCount, RegDate, __raw_RegDate, __raw_LastLoginDate,
                    Mobile, NationalCode, Phone, MobileVerified, Otp, RegistrationCompleted
                ) VALUES (
                    :first_name, :last_name, 0, 1, 0, 0,
                    :username, :normalized_username, :email, :normalized_email, 0,
                    :password_hash, :security_stamp, :concurrency_stamp, :phone_number,
                    1, 0, NULL, 1, 0, :reg_date, :raw_reg_date, :raw_last_login_date,
                    :mobile, :national_code, :phone, 1, 0, 1
                )'
            );
            $insert->execute([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'username' => $phone,
                'normalized_username' => mb_strtoupper($phone, 'UTF-8'),
                'email' => $email,
                'normalized_email' => $email === null ? null : mb_strtoupper($email, 'UTF-8'),
                'password_hash' => $hash,
                'security_stamp' => $securityStamp,
                'concurrency_stamp' => $concurrencyStamp,
                'phone_number' => $phone,
                'reg_date' => $date,
                'raw_reg_date' => $rawDate,
                'raw_last_login_date' => $sentinel,
                'mobile' => $phone,
                'national_code' => $nationalCode,
                'phone' => substr($phone, 1),
            ]);

            $userId = (string) $this->db->lastInsertId();
            $coreUserId = self::uuid();
            $identityLink = $this->db->prepare(
                'INSERT INTO PhpIdentityLinks
                    (LegacyUserId, CoreUserId, MappingSource, VerifiedAt, CreatedOn)
                 VALUES (:legacy_user_id, :core_user_id, :source, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6))'
            );
            $identityLink->execute([
                'legacy_user_id' => $userId,
                'core_user_id' => $coreUserId,
                'source' => 'php_registration',
            ]);

            $assign = $this->db->prepare(
                'INSERT INTO AspNetUserRoles (UserId, RoleId)
                 VALUES (:user_id, :role_id)'
            );
            $assign->execute([
                'user_id' => $userId,
                'role_id' => (string) $roleRows[0]['Id'],
            ]);

            $this->db->commit();
            return $this->findActiveById($userId);
        } catch (\Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $exception;
        }
    }

    private function nationalCodeExists(string $nationalCode): bool
    {
        $statement = $this->db->prepare(
            'SELECT Id FROM AspNetUsers WHERE NationalCode = :national_code LIMIT 1'
        );
        $statement->execute(['national_code' => $nationalCode]);

        return $statement->fetchColumn() !== false;
    }

    private function phoneExists(string $phone): bool
    {
        $phone = self::normalizeDigits($phone);
        $forms = [
            '09' . substr($phone, 2),
            '98' . substr($phone, 1),
            '+98' . substr($phone, 1),
            substr($phone, 1),
        ];
        $statement = $this->db->prepare(
            'SELECT Id FROM AspNetUsers
             WHERE UserName = :username
                OR Mobile IN (:mobile_09, :mobile_98, :mobile_plus98, :mobile_local)
                OR Phone IN (:phone_09, :phone_local)
                OR PhoneNumber IN (:number_09, :number_98, :number_plus98, :number_local)
             LIMIT 1'
        );
        $statement->execute([
            'username' => $phone,
            'mobile_09' => $forms[0],
            'mobile_98' => $forms[1],
            'mobile_plus98' => $forms[2],
            'mobile_local' => $forms[3],
            'phone_09' => $forms[0],
            'phone_local' => $forms[3],
            'number_09' => $forms[0],
            'number_98' => $forms[1],
            'number_plus98' => $forms[2],
            'number_local' => $forms[3],
        ]);

        return $statement->fetch() !== false;
    }

    /** @return array<string, mixed>|null */
    public function findActiveByPhone(string $phone): ?array
    {
        $user = $this->findUser(self::normalizeDigits($phone));
        if ($user === null) {
            error_log('[AUTH_DIAG] phone_lookup result=not_unique_or_missing');
            return null;
        }
        if ((int) $user['IsActive'] !== 1) {
            error_log('[AUTH_DIAG] phone_lookup result=inactive user_id=' . (string) $user['Id']);
            return null;
        }
        if (!$this->isLockoutExpired($user)) {
            error_log('[AUTH_DIAG] phone_lookup result=locked user_id=' . (string) $user['Id']);
            return null;
        }

        error_log('[AUTH_DIAG] phone_lookup result=found user_id=' . (string) $user['Id']);
        return $this->shapeUser($user, $this->rolesFor((string) $user['Id']));
    }

    public function resetPasswordByPhone(string $phone, string $newPassword): bool
    {
        $user = $this->findUser(self::normalizeDigits($phone));
        if ($user === null || (int) $user['IsActive'] !== 1) {
            return false;
        }

        $newHash = \App\Security\PasswordVerifier::hashForNewPassword($newPassword);
        $newStamp = bin2hex(random_bytes(16));

        $this->db->beginTransaction();
        try {
            $statement = $this->db->prepare(
                'UPDATE AspNetUsers
                 SET PasswordHash = :password_hash,
                     SecurityStamp = :security_stamp,
                     AccessFailedCount = 0,
                     LockoutEnd = NULL
                 WHERE Id = :id AND IsActive = 1'
            );
            $statement->execute([
                'password_hash' => $newHash,
                'security_stamp' => $newStamp,
                'id' => (string) $user['Id'],
            ]);

            if ($statement->rowCount() !== 1) {
                $this->db->rollBack();
                return false;
            }

            $this->db->commit();
            return true;
        } catch (\Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $exception;
        }
    }

    /** @return array<string, mixed>|null */
    public function findActiveById(string $id): ?array
    {
        $statement = $this->db->prepare(
            'SELECT Id, FirstName, LastName, Mobile, Phone, PhoneNumber, UserName,
                    Email, NationalCode, IsActive, LockoutEnd, LockoutEnabled
             FROM AspNetUsers WHERE Id = :id LIMIT 1'
        );
        $statement->execute(['id' => $id]);
        $user = $statement->fetch();

        if (!is_array($user) || (int) $user['IsActive'] !== 1 || !$this->isLockoutExpired($user)) {
            return null;
        }

        return $this->shapeUser($user, $this->rolesFor((string) $user['Id']));
    }

    /** @return array<string, mixed> */
    private function shapeUser(array $user, array $roles): array
    {
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
            'core_user_id' => $this->coreUserIdForLegacyId((string) $user['Id']),
            'roles' => $roles,
            'source' => 'mariadb.AspNetUsers',
        ];
    }

    public function coreUserIdForLegacyId(string $legacyUserId): ?string
    {
        $statement = $this->db->prepare(
            'SELECT CoreUserId FROM PhpIdentityLinks
             WHERE LegacyUserId = :legacy_user_id AND VerifiedAt IS NOT NULL LIMIT 1'
        );
        $statement->execute(['legacy_user_id' => $legacyUserId]);
        $value = $statement->fetchColumn();
        return $value === false ? null : (string) $value;
    }

    /** @return array<string, mixed>|null */
    private function findUser(string $identifier): ?array
    {
        // Normalize localized digits before either exact-username or phone lookup.
        $identifier = self::normalizeDigits(trim($identifier));
        if ($identifier === '') {
            return null;
        }

        $select = <<<'SQL'
            SELECT Id, FirstName, LastName, Mobile, Phone, PhoneNumber,
                   UserName, Email, NationalCode, PasswordHash, IsActive,
                   LockoutEnd, LockoutEnabled
            FROM AspNetUsers
            SQL;

        // Exact identity always wins. Do not combine username and phone aliases:
        // legacy databases can legitimately contain repeated phone values across
        // imported customer rows, which must not make a unique username ambiguous.
        $exact = $this->db->prepare(
            $select . '
             WHERE NormalizedUserName = :normalized_username
                OR UserName = :username
             ORDER BY Id ASC
             LIMIT 2'
        );
        $exact->execute([
            'normalized_username' => mb_strtoupper($identifier, 'UTF-8'),
            'username' => $identifier,
        ]);
        $exactMatches = $exact->fetchAll();

        if (count($exactMatches) === 1) {
            return $exactMatches[0];
        }
        if (count($exactMatches) > 1) {
            error_log('[AUTH_DIAG] identity_query exact_username_match_count=' . count($exactMatches));
            return null;
        }

        // Only fall back to legacy phone aliases when no exact username exists.
        $phone = preg_match('/^09\\d{9}$/D', $identifier) === 1 ? $identifier : null;
        if ($phone === null) {
            error_log('[AUTH_DIAG] identity_query result=exact_username_not_found');
            return null;
        }

        $phone98 = '98' . substr($phone, 1);
        $phonePlus98 = '+' . $phone98;
        $phoneLocal = substr($phone, 1);
        $aliases = $this->db->prepare(
            $select . '
             WHERE Mobile = :mobile_09
                OR Phone = :phone_09
                OR PhoneNumber = :phone_number_09
                OR Mobile = :mobile_98
                OR PhoneNumber = :phone_number_98
                OR Mobile = :mobile_plus98
                OR PhoneNumber = :phone_number_plus98
                OR Mobile = :mobile_local
                OR PhoneNumber = :phone_number_local
             ORDER BY Id ASC
             LIMIT 2'
        );
        $aliases->execute([
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

        $matches = $aliases->fetchAll();
        if (count($matches) !== 1) {
            error_log('[AUTH_DIAG] identity_query phone_alias_match_count=' . count($matches));
            return null;
        }

        return $matches[0];
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

    private function isLockoutExpired(array $user): bool
    {
        if (!(bool) $user['LockoutEnabled'] || empty($user['LockoutEnd'])) {
            return true;
        }

        try {
            $lockoutEnd = new \DateTimeImmutable((string) $user['LockoutEnd']);
            return $lockoutEnd <= new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
        } catch (\Throwable) {
            return false;
        }
    }

    private function upgradeHash(string $userId, string $oldHash, string $password): void
    {
        $statement = $this->db->prepare(
            'UPDATE AspNetUsers SET PasswordHash = :new_hash
             WHERE Id = :id AND PasswordHash = :old_hash'
        );
        $statement->execute([
            'new_hash' => \App\Security\PasswordVerifier::hashForNewPassword($password),
            'id' => $userId,
            'old_hash' => $oldHash,
        ]);
    }

    private static function uuid(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        $hex = bin2hex($bytes);
        return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4)
            . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
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
