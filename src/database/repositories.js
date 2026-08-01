import { pool } from "./pool.js";

export async function findPersonnelByDiscordId(discordUserId) {
  const result = await pool.query(
    `SELECT * FROM personnel WHERE discord_user_id = $1`,
    [discordUserId]
  );
  return result.rows[0] ?? null;
}

export async function findPersonnelByRobloxId(robloxUserId) {
  const result = await pool.query(
    `SELECT * FROM personnel WHERE roblox_user_id = $1`,
    [robloxUserId]
  );
  return result.rows[0] ?? null;
}

export async function upsertPersonnel({
  discordUserId,
  robloxUserId,
  robloxUsername
}) {
  const result = await pool.query(
    `
      INSERT INTO personnel (
        discord_user_id,
        roblox_user_id,
        roblox_username
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (discord_user_id)
      DO UPDATE SET
        roblox_user_id = EXCLUDED.roblox_user_id,
        roblox_username = EXCLUDED.roblox_username,
        updated_at = NOW()
      RETURNING *
    `,
    [discordUserId, robloxUserId, robloxUsername]
  );
  return result.rows[0];
}

export async function deletePersonnelByDiscordId(discordUserId) {
  const result = await pool.query(
    `DELETE FROM personnel WHERE discord_user_id = $1 RETURNING *`,
    [discordUserId]
  );
  return result.rows[0] ?? null;
}

export async function getPersonnelCount() {
  const result = await pool.query(`SELECT COUNT(*)::int AS count FROM personnel`);
  return result.rows[0].count;
}

export async function getRecentPersonnel(limit = 10) {
  const result = await pool.query(
    `
      SELECT *
      FROM personnel
      ORDER BY verified_at DESC
      LIMIT $1
    `,
    [limit]
  );
  return result.rows;
}

export async function getBlacklistEntry(discordUserId) {
  const result = await pool.query(
    `SELECT * FROM verification_blacklist WHERE discord_user_id = $1`,
    [discordUserId]
  );
  return result.rows[0] ?? null;
}

export async function setBlacklistEntry({
  discordUserId,
  reason,
  createdBy
}) {
  const result = await pool.query(
    `
      INSERT INTO verification_blacklist (
        discord_user_id,
        reason,
        created_by
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (discord_user_id)
      DO UPDATE SET
        reason = EXCLUDED.reason,
        created_by = EXCLUDED.created_by,
        created_at = NOW()
      RETURNING *
    `,
    [discordUserId, reason, createdBy]
  );
  return result.rows[0];
}

export async function removeBlacklistEntry(discordUserId) {
  const result = await pool.query(
    `
      DELETE FROM verification_blacklist
      WHERE discord_user_id = $1
      RETURNING *
    `,
    [discordUserId]
  );
  return result.rows[0] ?? null;
}

export async function getBlacklistCount() {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM verification_blacklist`
  );
  return result.rows[0].count;
}

export async function writeAuditLog({
  action,
  actorDiscordId = null,
  targetDiscordId = null,
  targetRobloxId = null,
  details = {}
}) {
  await pool.query(
    `
      INSERT INTO audit_logs (
        action,
        actor_discord_id,
        target_discord_id,
        target_roblox_id,
        details
      )
      VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [
      action,
      actorDiscordId,
      targetDiscordId,
      targetRobloxId,
      JSON.stringify(details)
    ]
  );
}

export async function getRecentAuditLogs(limit = 10) {
  const result = await pool.query(
    `
      SELECT *
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [limit]
  );
  return result.rows;
}

export async function getSetting(key) {
  const result = await pool.query(
    `SELECT setting_value FROM app_settings WHERE setting_key = $1`,
    [key]
  );
  return result.rows[0]?.setting_value ?? null;
}

export async function setSetting(key, value, updatedBy) {
  const result = await pool.query(
    `
      INSERT INTO app_settings (
        setting_key,
        setting_value,
        updated_by
      )
      VALUES ($1, $2::jsonb, $3)
      ON CONFLICT (setting_key)
      DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING setting_value
    `,
    [key, JSON.stringify(value), updatedBy]
  );
  return result.rows[0].setting_value;
}
