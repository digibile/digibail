-- DigiBail application tables in the existing single MariaDB database.
-- Existing ASP.NET, VamCity and BluVam tables are not altered.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 username VARCHAR(160) NULL,
 phone VARCHAR(64) NULL,
 full_name VARCHAR(160) NOT NULL,
 national_code VARCHAR(32) NULL,
 email VARCHAR(320) NULL,
 password_hash LONGTEXT NOT NULL,
 role VARCHAR(32) NOT NULL DEFAULT 'customer',
 is_active TINYINT(1) NOT NULL DEFAULT 1,
 password_reset_required TINYINT(1) NOT NULL DEFAULT 0,
 legacy_source VARCHAR(80) NULL,
 legacy_id VARCHAR(160) NULL,
 legacy_username VARCHAR(160) NULL,
 legacy_customer_id VARCHAR(128) NULL,
 legacy_agent_id BIGINT NULL,
 legacy_customer_marketer_id BIGINT NULL,
 legacy_agent_metadata_id VARCHAR(128) NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_digibail_users_legacy(legacy_source,legacy_id),
 KEY ix_digibail_users_username(username),
 KEY ix_digibail_users_phone(phone),
 KEY ix_digibail_users_national_code(national_code),
 KEY ix_digibail_users_created(created_at),
 KEY ix_digibail_users_role_active(role,is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS access_roles (
 code VARCHAR(40) NOT NULL PRIMARY KEY,
 display_name VARCHAR(120) NOT NULL,
 legacy_source VARCHAR(120) NULL,
 legacy_id VARCHAR(160) NULL,
 UNIQUE KEY uq_digibail_access_roles_legacy(legacy_source,legacy_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_role_assignments (
 user_id BIGINT NOT NULL,
 role_code VARCHAR(40) NOT NULL,
 legacy_source VARCHAR(120) NOT NULL,
 legacy_user_id VARCHAR(160) NOT NULL,
 legacy_role_id VARCHAR(160) NOT NULL,
 PRIMARY KEY(user_id,role_code),
 UNIQUE KEY uq_digibail_user_role_legacy(legacy_source,legacy_user_id,legacy_role_id),
 CONSTRAINT fk_digibail_user_roles_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT fk_digibail_user_roles_role FOREIGN KEY(role_code) REFERENCES access_roles(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_role_overrides (
 user_id BIGINT NOT NULL PRIMARY KEY,
 role_code VARCHAR(40) NOT NULL,
 updated_by BIGINT NULL,
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 CONSTRAINT fk_digibail_role_override_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS DigibailAppUserIdentity (
 AppUserId BIGINT NOT NULL PRIMARY KEY,
 LegacySource VARCHAR(80) NOT NULL,
 MariaDbUserId BIGINT NOT NULL,
 RoleCode VARCHAR(40) NOT NULL,
 CreatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UpdatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_DigibailAppUserIdentity_SourceUser(LegacySource,MariaDbUserId),
 KEY ix_DigibailAppUserIdentity_MariaUser(MariaDbUserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sms_provider_settings (
 provider VARCHAR(40) NOT NULL PRIMARY KEY,
 api_key_encrypted TEXT NOT NULL,
 sender VARCHAR(32) NOT NULL,
 updated_by BIGINT NULL,
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS captcha_challenges (
 id CHAR(36) NOT NULL PRIMARY KEY,
 answer_hash CHAR(64) NOT NULL,
 expires_at DATETIME(6) NOT NULL,
 consumed_at DATETIME(6) NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 KEY ix_digibail_captcha_expiry(expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS otp_challenges (
 id CHAR(36) NOT NULL PRIMARY KEY,
 phone VARCHAR(16) NOT NULL,
 purpose VARCHAR(24) NOT NULL,
 code_hash CHAR(64) NOT NULL,
 expires_at DATETIME(6) NOT NULL,
 resend_at DATETIME(6) NOT NULL,
 attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
 consumed_at DATETIME(6) NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 KEY ix_digibail_otp_phone_created(phone,created_at),
 KEY ix_digibail_otp_expiry(expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT NULL,
 event_type VARCHAR(80) NOT NULL,
 ip_address VARCHAR(64) NULL,
 details JSON NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 KEY ix_digibail_audit_created(created_at),
 KEY ix_digibail_audit_user_created(user_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS legacy_customers (
 legacy_id VARCHAR(64) NOT NULL PRIMARY KEY,
 name TEXT NULL,
 mobile VARCHAR(64) NULL,
 email VARCHAR(254) NULL,
 customer_code BIGINT NULL,
 registered_at DATETIME(6) NULL,
 expires_at DATETIME(6) NULL,
 is_permanent TINYINT(1) NULL,
 purchased TINYINT(1) NULL,
 affiliate_code TEXT NULL,
 parked_domain TEXT NULL,
 legacy_username VARCHAR(160) NULL,
 account_type VARCHAR(160) NOT NULL DEFAULT 'مشتری / کاربر منتقل‌شده',
 legacy_source_table VARCHAR(160) NULL,
 imported_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 KEY ix_digibail_legacy_customer_registered(registered_at),
 KEY ix_digibail_legacy_customer_mobile(mobile),
 KEY ix_digibail_legacy_customer_username(legacy_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sms_templates (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 legacy_id VARCHAR(64) NULL,
 title VARCHAR(200) NOT NULL,
 body TEXT NOT NULL,
 is_system TINYINT(1) NOT NULL DEFAULT 0,
 status INT NOT NULL DEFAULT 0,
 category INT NOT NULL DEFAULT 0,
 provider_panel INT NOT NULL DEFAULT 0,
 is_pattern_base TINYINT(1) NOT NULL DEFAULT 0,
 pattern_base_code TEXT NULL,
 reject_reason TEXT NULL,
 legacy_customer_id VARCHAR(64) NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_digibail_sms_template_legacy(legacy_id),
 KEY ix_digibail_sms_template_status(status,category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sms_logs (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 template_id BIGINT NULL,
 recipient_masked VARCHAR(32) NULL,
 status VARCHAR(24) NOT NULL,
 provider_message_id VARCHAR(160) NULL,
 error_code VARCHAR(80) NULL,
 created_by BIGINT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 KEY ix_digibail_sms_logs_created(created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS legacy_source_data (
 source_table VARCHAR(160) NOT NULL,
 legacy_id VARCHAR(160) NOT NULL,
 payload JSON NOT NULL,
 imported_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 PRIMARY KEY(source_table,legacy_id),
 KEY ix_digibail_legacy_source_table(source_table,imported_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loan_products (
 id CHAR(36) NOT NULL PRIMARY KEY,
 slug VARCHAR(40) NOT NULL,
 name VARCHAR(120) NOT NULL,
 title VARCHAR(160) NOT NULL DEFAULT '',
 description VARCHAR(500) NOT NULL DEFAULT '',
 badge VARCHAR(40) NOT NULL DEFAULT '',
 min_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
 max_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
 interval_days INT NOT NULL DEFAULT 0,
 tiers JSON NOT NULL,
 conditions JSON NOT NULL,
 documents JSON NOT NULL,
 is_active TINYINT(1) NOT NULL DEFAULT 0,
 sort_order INT NOT NULL DEFAULT 0,
 interest_method VARCHAR(12) NOT NULL DEFAULT 'Monthly',
 interest_percent DECIMAL(18,6) NOT NULL DEFAULT 0,
 late_daily_coef DECIMAL(18,8) NOT NULL DEFAULT 0,
 early_daily_coef DECIMAL(18,8) NOT NULL DEFAULT 0,
 show_in_list TINYINT(1) NOT NULL DEFAULT 0,
 send_reminders TINYINT(1) NOT NULL DEFAULT 0,
 image_url LONGTEXT NULL,
 labels JSON NOT NULL,
 full_description_html LONGTEXT NOT NULL,
 operational_costs JSON NOT NULL,
 legacy_source_table VARCHAR(160) NULL,
 legacy_id VARCHAR(160) NULL,
 legacy_payload JSON NOT NULL,
 needs_review TINYINT(1) NOT NULL DEFAULT 0,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_digibail_loan_product_slug(slug),
 UNIQUE KEY uq_digibail_loan_product_legacy(legacy_source_table,legacy_id),
 KEY ix_digibail_loan_product_public(is_active,show_in_list,sort_order),
 KEY ix_digibail_loan_product_created(created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loan_requests (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 request_key VARCHAR(160) NOT NULL,
 source_table VARCHAR(160) NOT NULL,
 legacy_id VARCHAR(160) NOT NULL,
 applicant_name TEXT NOT NULL,
 mobile VARCHAR(64) NOT NULL,
 national_code VARCHAR(32) NOT NULL,
 status VARCHAR(160) NOT NULL,
 amount DECIMAL(20,2) NULL,
 created_at DATETIME(6) NULL,
 payload JSON NOT NULL,
 imported_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_digibail_loan_request_key(request_key),
 UNIQUE KEY uq_digibail_loan_request_legacy(source_table,legacy_id),
 KEY ix_digibail_loan_request_created(created_at),
 KEY ix_digibail_loan_request_status_created(status,created_at),
 KEY ix_digibail_loan_request_mobile(mobile),
 KEY ix_digibail_loan_request_national(national_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loan_request_comments (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 loan_request_id BIGINT NOT NULL,
 author_user_id BIGINT NULL,
 author_name VARCHAR(160) NOT NULL DEFAULT '',
 comment TEXT NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 KEY ix_digibail_loan_comments_request(loan_request_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loan_request_status_history (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 loan_request_id BIGINT NOT NULL,
 old_status VARCHAR(160) NOT NULL DEFAULT '',
 new_status VARCHAR(160) NOT NULL,
 note TEXT NOT NULL,
 changed_by BIGINT NULL,
 changed_by_name VARCHAR(160) NOT NULL DEFAULT '',
 changed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 legacy_source_table VARCHAR(160) NULL,
 legacy_id VARCHAR(160) NULL,
 UNIQUE KEY uq_digibail_loan_status_legacy(legacy_source_table,legacy_id),
 KEY ix_digibail_loan_status_request(loan_request_id,changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS beta_inquiries (
 id CHAR(36) NOT NULL PRIMARY KEY,
 reference VARCHAR(32) NOT NULL,
 user_id BIGINT NOT NULL,
 national_code CHAR(10) NOT NULL,
 consent_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 status VARCHAR(40) NOT NULL DEFAULT 'pending_provider',
 status_note TEXT NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_digibail_beta_reference(reference),
 KEY ix_digibail_beta_user_created(user_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_documents (
 id CHAR(36) NOT NULL PRIMARY KEY,
 user_id BIGINT NOT NULL,
 kind VARCHAR(80) NOT NULL,
 file_name VARCHAR(255) NOT NULL,
 mime_type VARCHAR(80) NOT NULL,
 file_data LONGBLOB NOT NULL,
 fields JSON NOT NULL,
 ocr_text LONGTEXT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'Pending',
 review_note TEXT NULL,
 created_on DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 KEY ix_digibail_documents_user_created(user_id,created_on),
 KEY ix_digibail_documents_status_created(status,created_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_contracts (
 id CHAR(36) NOT NULL PRIMARY KEY,
 user_id BIGINT NOT NULL,
 title VARCHAR(240) NOT NULL,
 number VARCHAR(120) NOT NULL,
 body_html LONGTEXT NOT NULL,
 status VARCHAR(32) NOT NULL DEFAULT 'Presented',
 expires_at DATETIME(6) NULL,
 signed_at DATETIME(6) NULL,
 rejected_at DATETIME(6) NULL,
 rejection_note TEXT NULL,
 created_on DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 KEY ix_digibail_contracts_user_created(user_id,created_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_loan_applications (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 reference VARCHAR(32) NOT NULL,
 user_id BIGINT NOT NULL,
 loan_product_id CHAR(36) NOT NULL,
 loan_name VARCHAR(160) NOT NULL,
 amount DECIMAL(18,2) NOT NULL,
 installment_months INT NOT NULL,
 down_payment DECIMAL(18,2) NOT NULL DEFAULT 0,
 monthly_payment DECIMAL(18,2) NOT NULL DEFAULT 0,
 status VARCHAR(32) NOT NULL DEFAULT 'Submitted',
 details JSON NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY uq_digibail_customer_loan_reference(reference),
 KEY ix_digibail_customer_loan_user(user_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_story_assets (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 created_by BIGINT NOT NULL,
 title TEXT NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'draft',
 payload JSON NOT NULL,
 image_data LONGTEXT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 KEY ix_ai_story_assets_owner_created(created_by,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS digibail_legacy_manifest (
 source_schema VARCHAR(64) NOT NULL,
 source_table VARCHAR(64) NOT NULL,
 source_rows BIGINT NOT NULL DEFAULT 0,
 imported_rows BIGINT NOT NULL DEFAULT 0,
 imported_at DATETIME(6) NULL,
 PRIMARY KEY(source_schema,source_table)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS digibail_legacy_columns (
 source_schema VARCHAR(64) NOT NULL,
 source_table VARCHAR(64) NOT NULL,
 column_name VARCHAR(128) NOT NULL,
 data_type VARCHAR(64) NOT NULL,
 is_nullable VARCHAR(8) NOT NULL,
 ordinal_position INT NOT NULL,
 primary_key_order INT NULL,
 referenced_schema VARCHAR(64) NULL,
 referenced_table VARCHAR(64) NULL,
 referenced_column VARCHAR(128) NULL,
 PRIMARY KEY(source_schema,source_table,column_name),
 KEY ix_digibail_legacy_columns_order(source_schema,source_table,ordinal_position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS digibail_legacy_relational_rows (
 source_schema VARCHAR(64) NOT NULL,
 source_table VARCHAR(64) NOT NULL,
 legacy_id VARCHAR(255) NOT NULL,
 payload JSON NOT NULL,
 PRIMARY KEY(source_schema,source_table,legacy_id),
 KEY ix_digibail_legacy_rows_source(source_schema,source_table)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
