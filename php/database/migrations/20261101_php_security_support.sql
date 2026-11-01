-- PHP security support tables. Additive only; legacy identity/business tables remain unchanged.
CREATE TABLE IF NOT EXISTS php_security_challenges (
    id CHAR(32) NOT NULL,
    challenge_type VARCHAR(32) NOT NULL,
    subject VARCHAR(190) NULL,
    value_hash CHAR(64) NOT NULL,
    attempts INT UNSIGNED NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    resend_at DATETIME NULL,
    consumed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_php_challenge_lookup (challenge_type, subject, consumed_at, expires_at),
    KEY idx_php_challenge_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS php_security_rate_limits (
    bucket_hash CHAR(64) NOT NULL,
    window_started_at DATETIME NOT NULL,
    attempts INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (bucket_hash),
    KEY idx_php_rate_limit_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
