-- DigiBail PHP 8.3 Release Center
-- Additive-only schema. Run only after reviewing against the live MariaDB schema.
-- Does not alter or delete existing application tables.

CREATE TABLE IF NOT EXISTS db_release_settings (
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NULL,
  is_secret TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS db_release_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  version VARCHAR(40) NOT NULL,
  channel VARCHAR(30) NOT NULL DEFAULT 'stable',
  release_type ENUM('normal','security','critical') NOT NULL DEFAULT 'normal',
  title VARCHAR(190) NOT NULL,
  notes MEDIUMTEXT NULL,
  package_url TEXT NOT NULL,
  package_sha256 CHAR(64) NOT NULL,
  min_php VARCHAR(20) NOT NULL DEFAULT '8.3',
  max_php VARCHAR(20) NULL,
  min_schema_version VARCHAR(40) NULL,
  published_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_db_release_version_channel (version, channel),
  KEY ix_db_release_published (channel, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS db_release_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  version VARCHAR(40) NOT NULL,
  channel VARCHAR(30) NOT NULL,
  status ENUM('queued','checking','backing_up','installing','migrating','health_check','succeeded','failed','rolled_back') NOT NULL,
  started_by BIGINT UNSIGNED NULL,
  started_at DATETIME NOT NULL,
  finished_at DATETIME NULL,
  previous_version VARCHAR(40) NULL,
  backup_path TEXT NULL,
  error_code VARCHAR(80) NULL,
  error_message TEXT NULL,
  details_json LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_db_release_runs_status (status, started_at),
  KEY ix_db_release_runs_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS db_release_migrations (
  migration_id VARCHAR(190) NOT NULL,
  checksum CHAR(64) NOT NULL,
  applied_by_run BIGINT UNSIGNED NOT NULL,
  applied_at DATETIME NOT NULL,
  execution_ms INT UNSIGNED NULL,
  PRIMARY KEY (migration_id),
  KEY ix_db_release_migrations_run (applied_by_run)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS db_release_backups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  run_id BIGINT UNSIGNED NOT NULL,
  backup_kind ENUM('files','database','full') NOT NULL,
  storage_path TEXT NOT NULL,
  sha256 CHAR(64) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_db_release_backups_run (run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
