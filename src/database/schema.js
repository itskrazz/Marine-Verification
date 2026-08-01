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

ALTER TABLE personnel ADD COLUMN IF NOT EXISTS usmc_rank VARCHAR(64);
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS rank_abbreviation VARCHAR(16);
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS division VARCHAR(128);
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS unit_name VARCHAR(128);
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS billet VARCHAR(128);

CREATE TABLE IF NOT EXISTS balances (discord_user_id VARCHAR(20) PRIMARY KEY,balance BIGINT NOT NULL DEFAULT 0,daily_streak INT NOT NULL DEFAULT 0,last_daily_at TIMESTAMPTZ,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS reputation (id BIGSERIAL PRIMARY KEY,giver_id VARCHAR(20) NOT NULL,receiver_id VARCHAR(20) NOT NULL,reason TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS commendations (id BIGSERIAL PRIMARY KEY,giver_id VARCHAR(20) NOT NULL,receiver_id VARCHAR(20) NOT NULL,reason TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS shop_items (item_key VARCHAR(64) PRIMARY KEY,name VARCHAR(128) NOT NULL,description TEXT NOT NULL,price BIGINT NOT NULL,consumable BOOLEAN NOT NULL DEFAULT FALSE,enabled BOOLEAN NOT NULL DEFAULT TRUE);
CREATE TABLE IF NOT EXISTS inventory (discord_user_id VARCHAR(20) NOT NULL,item_key VARCHAR(64) NOT NULL,quantity INT NOT NULL DEFAULT 0,PRIMARY KEY(discord_user_id,item_key));
CREATE TABLE IF NOT EXISTS trainings (id BIGSERIAL PRIMARY KEY,host_id VARCHAR(20) NOT NULL,title VARCHAR(128) NOT NULL,status VARCHAR(24) NOT NULL DEFAULT 'created',started_at TIMESTAMPTZ,ended_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS training_attendance (training_id BIGINT NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,discord_user_id VARCHAR(20) NOT NULL,result VARCHAR(24) NOT NULL DEFAULT 'attended',PRIMARY KEY(training_id,discord_user_id));
CREATE TABLE IF NOT EXISTS qualifications (discord_user_id VARCHAR(20) NOT NULL,qualification VARCHAR(128) NOT NULL,awarded_by VARCHAR(20) NOT NULL,awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(discord_user_id,qualification));
CREATE TABLE IF NOT EXISTS moderation_cases (case_number BIGSERIAL PRIMARY KEY,action VARCHAR(32) NOT NULL,target_discord_id VARCHAR(20) NOT NULL,moderator_discord_id VARCHAR(20) NOT NULL,reason TEXT,duration_seconds BIGINT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS member_notes (id BIGSERIAL PRIMARY KEY,target_discord_id VARCHAR(20) NOT NULL,author_discord_id VARCHAR(20) NOT NULL,note TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS service_awards (id BIGSERIAL PRIMARY KEY,discord_user_id VARCHAR(20) NOT NULL,award VARCHAR(128) NOT NULL,reason TEXT,awarded_by VARCHAR(20) NOT NULL,awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS loa_requests (id BIGSERIAL PRIMARY KEY,discord_user_id VARCHAR(20) NOT NULL,reason TEXT NOT NULL,ends_at TIMESTAMPTZ,status VARCHAR(24) NOT NULL DEFAULT 'pending',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
INSERT INTO shop_items(item_key,name,description,price,consumable) VALUES
('profile_background','Custom Profile Background','Unlocks a custom profile background.',500,FALSE),
('profile_badge','Profile Badge','Adds a cosmetic profile badge.',350,FALSE),
('daily_boost','Additional Daily Reward','Adds a bonus to one future daily claim.',250,TRUE),
('trivia_boost','Trivia Boost','Adds a temporary trivia reward boost.',200,TRUE),
('challenge_coin','Cosmetic Challenge Coin','Adds a cosmetic challenge coin.',300,FALSE),
('community_title','Community Title','Unlocks an approved community title.',450,FALSE)
ON CONFLICT(item_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS guild_config (
  guild_id VARCHAR(20) PRIMARY KEY,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by VARCHAR(20),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS organization_entities (
  id BIGSERIAL PRIMARY KEY,
  guild_id VARCHAR(20) NOT NULL,
  entity_type VARCHAR(24) NOT NULL,
  entity_key VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  parent_key VARCHAR(64),
  discord_role_id VARCHAR(20),
  roblox_team_name VARCHAR(128),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(guild_id, entity_type, entity_key)
);
CREATE TABLE IF NOT EXISTS event_sessions (
  id BIGSERIAL PRIMARY KEY,
  guild_id VARCHAR(20) NOT NULL,
  event_type VARCHAR(32) NOT NULL,
  host_id VARCHAR(20) NOT NULL,
  title VARCHAR(128) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS event_checkins (
  event_id BIGINT NOT NULL REFERENCES event_sessions(id) ON DELETE CASCADE,
  discord_user_id VARCHAR(20) NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  PRIMARY KEY(event_id, discord_user_id)
);
CREATE TABLE IF NOT EXISTS missions (
  mission_key VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT NOT NULL,
  reward BIGINT NOT NULL DEFAULT 100,
  enabled BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS mission_completions (
  discord_user_id VARCHAR(20) NOT NULL,
  mission_key VARCHAR(64) NOT NULL REFERENCES missions(mission_key),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(discord_user_id, mission_key)
);
CREATE TABLE IF NOT EXISTS badges (
  discord_user_id VARCHAR(20) NOT NULL,
  badge VARCHAR(128) NOT NULL,
  awarded_by VARCHAR(20),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(discord_user_id, badge)
);
CREATE TABLE IF NOT EXISTS njp_cases (
  id BIGSERIAL PRIMARY KEY,
  target_discord_id VARCHAR(20) NOT NULL,
  opened_by VARCHAR(20) NOT NULL,
  details TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS investigations (
  id BIGSERIAL PRIMARY KEY,
  target_discord_id VARCHAR(20) NOT NULL,
  opened_by VARCHAR(20) NOT NULL,
  details TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);
INSERT INTO missions(mission_key,name,description,reward) VALUES
('verify','Verify Account','Complete Discord to Roblox verification.',100),
('training','Attend Training','Attend a recorded training.',150),
('commendation','Earn Commendation','Receive a commendation.',200)
ON CONFLICT(mission_key) DO NOTHING;
`;
