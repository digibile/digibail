CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY, username VARCHAR(80) UNIQUE, phone VARCHAR(16) UNIQUE NOT NULL,
  full_name VARCHAR(160) NOT NULL, national_code CHAR(10) UNIQUE, email VARCHAR(254),
  password_hash TEXT NOT NULL, role VARCHAR(32) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin','superadmin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at DESC);
CREATE TABLE IF NOT EXISTS captcha_challenges (
  id UUID PRIMARY KEY, answer_hash TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS captcha_expiry_idx ON captcha_challenges(expires_at);
CREATE TABLE IF NOT EXISTS otp_challenges (
  id UUID PRIMARY KEY, phone VARCHAR(16) NOT NULL, purpose VARCHAR(16) NOT NULL CHECK (purpose IN ('login','register')),
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
