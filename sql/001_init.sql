CREATE TABLE IF NOT EXISTS personnel_links (
    discord_user_id VARCHAR(32) PRIMARY KEY,
    roblox_user_id BIGINT UNIQUE NOT NULL,
    roblox_username VARCHAR(32) NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_codes (
    code VARCHAR(12) PRIMARY KEY,
    discord_user_id VARCHAR(32) NOT NULL,
    roblox_user_id BIGINT NOT NULL,
    roblox_username VARCHAR(32) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS verification_codes_roblox_user_idx
    ON verification_codes (roblox_user_id);

CREATE TABLE IF NOT EXISTS api_nonces (
    nonce VARCHAR(64) PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL
);
