CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY, username VARCHAR(80) UNIQUE, phone VARCHAR(16) UNIQUE,
  full_name VARCHAR(160) NOT NULL, national_code CHAR(10) UNIQUE, email VARCHAR(254),
  password_hash TEXT NOT NULL, role VARCHAR(32) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin','superadmin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at DESC);
CREATE TABLE IF NOT EXISTS sms_provider_settings (
  provider VARCHAR(40) PRIMARY KEY,
  api_key_encrypted TEXT NOT NULL,
  sender VARCHAR(32) NOT NULL,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS captcha_challenges (
  id UUID PRIMARY KEY, answer_hash TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS captcha_expiry_idx ON captcha_challenges(expires_at);
CREATE TABLE IF NOT EXISTS otp_challenges (
  id UUID PRIMARY KEY, phone VARCHAR(16) NOT NULL, purpose VARCHAR(16) NOT NULL CHECK (purpose IN ('login','register','password_reset')),
  code_hash TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, resend_at TIMESTAMPTZ NOT NULL,
  attempts SMALLINT NOT NULL DEFAULT 0, consumed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS otp_phone_created_idx ON otp_challenges(phone, created_at DESC);
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(80) NOT NULL, ip_address INET, details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_created_at_idx ON audit_logs(created_at DESC);


-- Legacy account compatibility and imported Digibail modules.
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_source TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_legacy_source_id_uq
  ON users(legacy_source, legacy_id)
  WHERE legacy_source IS NOT NULL AND legacy_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS legacy_customers (
  legacy_id UUID PRIMARY KEY,
  name TEXT,
  mobile TEXT,
  email TEXT,
  customer_code INTEGER,
  registered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_permanent BOOLEAN,
  purchased BOOLEAN,
  affiliate_code TEXT,
  parked_domain TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_templates (
  id BIGSERIAL PRIMARY KEY,
  legacy_id UUID UNIQUE,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  status INTEGER NOT NULL DEFAULT 0,
  category INTEGER NOT NULL DEFAULT 0,
  provider_panel INTEGER NOT NULL DEFAULT 0,
  is_pattern_base BOOLEAN NOT NULL DEFAULT FALSE,
  pattern_base_code TEXT,
  reject_reason TEXT,
  legacy_customer_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sms_templates_status_idx ON sms_templates(status, category);

CREATE TABLE IF NOT EXISTS sms_logs (
  id BIGSERIAL PRIMARY KEY,
  template_id BIGINT REFERENCES sms_templates(id) ON DELETE SET NULL,
  recipient_masked VARCHAR(32),
  status VARCHAR(24) NOT NULL,
  provider_message_id TEXT,
  error_code VARCHAR(80),
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sms_logs_created_at_idx ON sms_logs(created_at DESC);

ALTER TABLE otp_challenges DROP CONSTRAINT IF EXISTS otp_challenges_purpose_check;
ALTER TABLE otp_challenges ADD CONSTRAINT otp_challenges_purpose_check CHECK (purpose IN ('login','register','password_reset'));
