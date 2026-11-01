<?php

declare(strict_types=1);

namespace App\Security;

use PDO;
use RuntimeException;

final class SecurityStore
{
    public function __construct(
        private readonly PDO $db,
        private readonly string $rateLimitPepper,
        private readonly string $captchaPepper
    ) {
        if (strlen($this->rateLimitPepper) < 32 || strlen($this->captchaPepper) < 32) {
            throw new RuntimeException('OTP_PEPPER and CAPTCHA_PEPPER must each contain at least 32 bytes.');
        }
    }

    /** @return array{id:string,image:string,expiresIn:int} */
    public function createCaptcha(): array
    {
        $id = bin2hex(random_bytes(16));
        $answer = (string) random_int(10000, 99999);
        $hash = hash_hmac('sha256', 'captcha:' . $id . ':' . $answer, $this->captchaPepper);

        $statement = $this->db->prepare(
            'INSERT INTO php_security_challenges
                (id, challenge_type, subject, value_hash, attempts, expires_at)
             VALUES (:id, :type, NULL, :hash, 0, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 300 SECOND))'
        );
        $statement->execute(['id' => $id, 'type' => 'captcha', 'hash' => $hash]);

        $svg = $this->captchaSvg($answer);

        return [
            'id' => $id,
            'image' => 'data:image/svg+xml;base64,' . base64_encode($svg),
            'expiresIn' => 300,
        ];
    }

    public function consumeCaptcha(string $id, string $answer): bool
    {
        if (preg_match('/^[a-f0-9]{32}$/D', $id) !== 1 || preg_match('/^\d{5}$/D', $answer) !== 1) {
            return false;
        }

        $this->db->beginTransaction();
        try {
            $statement = $this->db->prepare(
                'SELECT value_hash
                 FROM php_security_challenges
                 WHERE id = :id AND challenge_type = :type
                   AND consumed_at IS NULL AND expires_at > UTC_TIMESTAMP()
                 FOR UPDATE'
            );
            $statement->execute(['id' => $id, 'type' => 'captcha']);
            $row = $statement->fetch();

            if (!is_array($row)) {
                $this->db->commit();
                return false;
            }

            $expected = hash_hmac('sha256', 'captcha:' . $id . ':' . $answer, $this->captchaPepper);
            if (!hash_equals((string) $row['value_hash'], $expected)) {
                $this->db->prepare(
                    'UPDATE php_security_challenges SET attempts = attempts + 1, consumed_at =
                        CASE WHEN attempts + 1 >= 5 THEN UTC_TIMESTAMP() ELSE consumed_at END
                     WHERE id = :id'
                )->execute(['id' => $id]);
                $this->db->commit();
                return false;
            }

            $this->db->prepare(
                'UPDATE php_security_challenges SET consumed_at = UTC_TIMESTAMP() WHERE id = :id'
            )->execute(['id' => $id]);
            $this->db->commit();
            return true;
        } catch (\Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $exception;
        }
    }

    public function createOtp(string $phone, string $purpose, string $code): void
    {
        $id = bin2hex(random_bytes(16));
        $hash = hash_hmac('sha256', 'otp:' . $phone . ':' . $purpose . ':' . $code, $this->rateLimitPepper);
        $statement = $this->db->prepare(
            'INSERT INTO php_security_challenges
                (id, challenge_type, subject, value_hash, attempts, expires_at, resend_at)
             VALUES (:id, :type, :subject, :hash, 0,
                     DATE_ADD(UTC_TIMESTAMP(), INTERVAL 120 SECOND),
                     DATE_ADD(UTC_TIMESTAMP(), INTERVAL 60 SECOND))'
        );
        $statement->execute([
            'id' => $id,
            'type' => 'otp:' . $purpose,
            'subject' => $phone,
            'hash' => $hash,
        ]);
    }

    public function cancelLatestOtp(string $phone, string $purpose): void
    {
        $statement = $this->db->prepare(
            'UPDATE php_security_challenges
             SET consumed_at = UTC_TIMESTAMP()
             WHERE id = (
                SELECT id FROM (
                    SELECT id FROM php_security_challenges
                    WHERE challenge_type = :type AND subject = :subject
                      AND consumed_at IS NULL
                    ORDER BY created_at DESC LIMIT 1
                ) latest
             )'
        );
        $statement->execute(['type' => 'otp:' . $purpose, 'subject' => $phone]);
    }

    /** @return array{expiresIn:int,resendIn:int} */
    public function otpStatus(string $phone, string $purpose): array
    {
        $statement = $this->db->prepare(
            'SELECT
                GREATEST(0, TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), expires_at)) AS expires_in,
                GREATEST(0, TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), resend_at)) AS resend_in
             FROM php_security_challenges
             WHERE challenge_type = :type AND subject = :subject
               AND consumed_at IS NULL
             ORDER BY created_at DESC LIMIT 1'
        );
        $statement->execute(['type' => 'otp:' . $purpose, 'subject' => $phone]);
        $row = $statement->fetch();

        return [
            'expiresIn' => is_array($row) ? max(0, (int) $row['expires_in']) : 0,
            'resendIn' => is_array($row) ? max(0, (int) $row['resend_in']) : 0,
        ];
    }

    public function verifyOtp(string $phone, string $purpose, string $code): bool
    {
        $this->db->beginTransaction();
        try {
            $statement = $this->db->prepare(
                'SELECT id, value_hash, attempts
                 FROM php_security_challenges
                 WHERE challenge_type = :type AND subject = :subject
                   AND consumed_at IS NULL AND expires_at > UTC_TIMESTAMP()
                 ORDER BY created_at DESC LIMIT 1 FOR UPDATE'
            );
            $statement->execute(['type' => 'otp:' . $purpose, 'subject' => $phone]);
            $row = $statement->fetch();

            if (!is_array($row) || (int) $row['attempts'] >= 5) {
                $this->db->commit();
                return false;
            }

            $expected = hash_hmac('sha256', 'otp:' . $phone . ':' . $purpose . ':' . $code, $this->rateLimitPepper);
            if (!hash_equals((string) $row['value_hash'], $expected)) {
                $this->db->prepare(
                    'UPDATE php_security_challenges
                     SET attempts = attempts + 1,
                         consumed_at = CASE WHEN attempts + 1 >= 5 THEN UTC_TIMESTAMP() ELSE consumed_at END
                     WHERE id = :id'
                )->execute(['id' => $row['id']]);
                $this->db->commit();
                return false;
            }

            $this->db->prepare(
                'UPDATE php_security_challenges SET consumed_at = UTC_TIMESTAMP() WHERE id = :id'
            )->execute(['id' => $row['id']]);
            $this->db->commit();
            return true;
        } catch (\Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $exception;
        }
    }

    public function resetRateLimit(string $bucket): void
    {
        $key = hash_hmac('sha256', $bucket, $this->rateLimitPepper);
        $statement = $this->db->prepare(
            'DELETE FROM php_security_rate_limits WHERE bucket_hash = :bucket'
        );
        $statement->execute(['bucket' => $key]);
    }

    public function createOneTimeTicket(string $ticket, string $phone, string $purpose): void
    {
        $statement = $this->db->prepare(
            'INSERT INTO php_security_challenges
                (id, challenge_type, subject, value_hash, attempts, expires_at)
             VALUES (:id, :type, :subject, :hash, 0,
                     DATE_ADD(UTC_TIMESTAMP(), INTERVAL 600 SECOND))'
        );
        $statement->execute([
            'id' => bin2hex(random_bytes(16)),
            'type' => 'ticket:' . $purpose,
            'subject' => $phone,
            'hash' => hash_hmac('sha256', 'ticket:' . $ticket, $this->rateLimitPepper),
        ]);
    }

    public function consumeOneTimeTicket(string $ticket, string $phone, string $purpose): bool
    {
        $this->db->beginTransaction();
        try {
            $statement = $this->db->prepare(
                'SELECT id, value_hash FROM php_security_challenges
                 WHERE challenge_type = :type AND subject = :subject
                   AND consumed_at IS NULL AND expires_at > UTC_TIMESTAMP()
                 ORDER BY created_at DESC LIMIT 1 FOR UPDATE'
            );
            $statement->execute(['type' => 'ticket:' . $purpose, 'subject' => $phone]);
            $row = $statement->fetch();
            $expected = hash_hmac('sha256', 'ticket:' . $ticket, $this->rateLimitPepper);

            if (!is_array($row) || !hash_equals((string) $row['value_hash'], $expected)) {
                $this->db->commit();
                return false;
            }

            $this->db->prepare(
                'UPDATE php_security_challenges SET consumed_at = UTC_TIMESTAMP() WHERE id = :id'
            )->execute(['id' => $row['id']]);
            $this->db->commit();
            return true;
        } catch (\\Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $exception;
        }
    }

    public function hitRateLimit(string $bucket, int $maximum, int $windowSeconds): bool
    {
        if ($maximum < 1 || $windowSeconds < 1) {
            throw new RuntimeException('Invalid rate limit policy.');
        }

        $key = hash_hmac('sha256', $bucket, $this->rateLimitPepper);
        $this->db->beginTransaction();
        try {
            $this->db->prepare(
                'INSERT IGNORE INTO php_security_rate_limits
                    (bucket_hash, window_started_at, attempts)
                 VALUES (:bucket, UTC_TIMESTAMP(), 0)'
            )->execute(['bucket' => $key]);

            $statement = $this->db->prepare(
                'SELECT window_started_at, attempts
                 FROM php_security_rate_limits
                 WHERE bucket_hash = :bucket
                 FOR UPDATE'
            );
            $statement->execute(['bucket' => $key]);
            $row = $statement->fetch();

            if (!is_array($row)) {
                throw new RuntimeException('Rate limit row could not be locked.');
            }

            $started = new \DateTimeImmutable((string) $row['window_started_at'], new \DateTimeZone('UTC'));
            $now = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
            $elapsed = $now->getTimestamp() - $started->getTimestamp();
            $attempts = $elapsed >= $windowSeconds ? 0 : (int) $row['attempts'];

            if ($elapsed >= $windowSeconds) {
                $this->db->prepare(
                    'UPDATE php_security_rate_limits
                     SET window_started_at = UTC_TIMESTAMP(), attempts = 1
                     WHERE bucket_hash = :bucket'
                )->execute(['bucket' => $key]);
                $allowed = true;
            } elseif ($attempts >= $maximum) {
                $allowed = false;
            } else {
                $this->db->prepare(
                    'UPDATE php_security_rate_limits
                     SET attempts = attempts + 1
                     WHERE bucket_hash = :bucket'
                )->execute(['bucket' => $key]);
                $allowed = true;
            }

            $this->db->commit();
            return $allowed;
        } catch (\Throwable $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $exception;
        }
    }

    private function captchaSvg(string $answer): string
    {
        $parts = [
            '<svg xmlns="http://www.w3.org/2000/svg" width="170" height="56" viewBox="0 0 170 56">',
            '<rect width="170" height="56" rx="10" fill="#241047"/>',
        ];

        for ($i = 0; $i < 6; $i++) {
            $x1 = random_int(0, 170);
            $y1 = random_int(0, 56);
            $x2 = random_int(0, 170);
            $y2 = random_int(0, 56);
            $parts[] = sprintf(
                '<path d="M%d %d L%d %d" stroke="#%06X" stroke-width="1.2"/>',
                $x1, $y1, $x2, $y2, random_int(0x666666, 0xBBBBBB)
            );
        }

        foreach (str_split($answer) as $index => $digit) {
            $x = 18 + ($index * 29);
            $y = 37 + random_int(-4, 4);
            $rotation = random_int(-18, 18);
            $parts[] = sprintf(
                '<text x="%d" y="%d" transform="rotate(%d %d %d)" font-family="monospace" font-size="29" font-weight="700" fill="#FFFFFF">%s</text>',
                $x, $y, $rotation, $x, $y, $digit
            );
        }

        $parts[] = '</svg>';

        return implode('', $parts);
    }
}
