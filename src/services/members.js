const { pool } = require("../db");

async function getMember(guildId, userId) {
  const r = await pool.query(
    `SELECT * FROM marine_members WHERE guild_id=$1 AND discord_user_id=$2`,
    [guildId, userId]
  );
  return r.rows[0] || null;
}
async function linkRoblox(guildId, userId, username) {
  const r = await pool.query(
    `INSERT INTO marine_members(guild_id,discord_user_id,roblox_username)
     VALUES($1,$2,$3)
     ON CONFLICT(guild_id,discord_user_id)
     DO UPDATE SET roblox_username=EXCLUDED.roblox_username, updated_at=NOW()
     RETURNING *`,
    [guildId,userId,username]
  );
  return r.rows[0];
}
async function setRank(guildId,userId,rank,preset,by,reason,action) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const before = await client.query(
      `SELECT * FROM marine_members WHERE guild_id=$1 AND discord_user_id=$2 FOR UPDATE`,
      [guildId,userId]
    );
    const previous = before.rows[0] || null;
    const result = await client.query(
      `INSERT INTO marine_members(
        guild_id,discord_user_id,rank_key,rank_name,rank_abbreviation,paygrade,rank_order,nickname_preset
       ) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT(guild_id,discord_user_id) DO UPDATE SET
        rank_key=EXCLUDED.rank_key,rank_name=EXCLUDED.rank_name,
        rank_abbreviation=EXCLUDED.rank_abbreviation,paygrade=EXCLUDED.paygrade,
        rank_order=EXCLUDED.rank_order,nickname_preset=EXCLUDED.nickname_preset,updated_at=NOW()
       RETURNING *`,
      [guildId,userId,rank.key,rank.name,rank.abbreviation,rank.paygrade,rank.order,preset]
    );
    await client.query(
      `INSERT INTO rank_history(guild_id,discord_user_id,old_rank_key,new_rank_key,action,reason,changed_by)
       VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [guildId,userId,previous?.rank_key || null,rank.key,action,reason,by]
    );
    await client.query("COMMIT");
    return { previous, current: result.rows[0] };
  } catch(e) {
    await client.query("ROLLBACK"); throw e;
  } finally { client.release(); }
}
async function setPreset(guildId,userId,preset) {
  const r = await pool.query(
    `UPDATE marine_members SET nickname_preset=$3,updated_at=NOW()
     WHERE guild_id=$1 AND discord_user_id=$2 RETURNING *`,
    [guildId,userId,preset]
  );
  return r.rows[0] || null;
}
module.exports = { getMember, linkRoblox, setRank, setPreset };
