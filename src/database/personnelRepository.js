import { pool } from "./pool.js";

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

export async function findByDiscordUserId(discordUserId) {
  const result = await pool.query(
    `SELECT * FROM personnel WHERE discord_user_id = $1`,
    [discordUserId]
  );
  return result.rows[0] ?? null;
}

export async function findByRobloxUserId(robloxUserId) {
  const result = await pool.query(
    `SELECT * FROM personnel WHERE roblox_user_id = $1`,
    [robloxUserId]
  );
  return result.rows[0] ?? null;
}
