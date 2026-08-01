import { pool } from "./pool.js";

const sql = `
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

CREATE INDEX IF NOT EXISTS idx_verification_codes_discord
  ON verification_codes(discord_user_id);

CREATE INDEX IF NOT EXISTS idx_verification_codes_roblox
  ON verification_codes(roblox_user_id);

CREATE TABLE IF NOT EXISTS api_nonces (
  nonce VARCHAR(128) PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

try {
  await pool.query(sql);
  console.log("Database migration completed.");
} catch (error) {
  console.error("Database migration failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
