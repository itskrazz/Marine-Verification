export const schemaSql = `
CREATE TABLE IF NOT EXISTS personnel (
  discord_user_id VARCHAR(20) PRIMARY KEY,
  roblox_user_id BIGINT UNIQUE NOT NULL,
  roblox_username VARCHAR(64) NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_codes (
  code VARCHAR(12) PRIMARY KEY,
  discord_user_id VARCHAR(20) NOT NULL,
  roblox_user_id BIGINT NOT NULL,
  roblox_username VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS verification_blacklist (
  discord_user_id VARCHAR(20) PRIMARY KEY,
  reason TEXT NOT NULL,
  created_by VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action VARCHAR(64) NOT NULL,
  actor_discord_id VARCHAR(20),
  target_discord_id VARCHAR(20),
  target_roblox_id BIGINT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(64) PRIMARY KEY,
  setting_value JSONB NOT NULL,
  updated_by VARCHAR(20),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (setting_key, setting_value)
VALUES ('maintenance', '{"enabled": false, "message": "Verification is temporarily unavailable."}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_personnel_roblox_user_id
  ON personnel(roblox_user_id);

CREATE INDEX IF NOT EXISTS idx_verification_codes_discord_user_id
  ON verification_codes(discord_user_id);

CREATE INDEX IF NOT EXISTS idx_verification_codes_roblox_user_id
  ON verification_codes(roblox_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_target_discord
  ON audit_logs(target_discord_id);
`;
