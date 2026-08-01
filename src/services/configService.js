import { pool } from "../database/pool.js";

const DEFAULT_CONFIG = {
  roles: { verified: null, admin: null, moderator: null, trainer: null },
  channels: { logs: null, moderation: null, training: null, suggestions: null, reports: null },
  nicknameTemplate: "[{rank}] {roblox}",
  defaultTeam: "Marine Corps Personnel"
};

export async function getGuildConfig(guildId) {
  const result = await pool.query(
    `INSERT INTO guild_config(guild_id,config) VALUES($1,$2::jsonb)
     ON CONFLICT(guild_id) DO UPDATE SET guild_id=EXCLUDED.guild_id
     RETURNING config`, [guildId, JSON.stringify(DEFAULT_CONFIG)]
  );
  return { ...DEFAULT_CONFIG, ...result.rows[0].config,
    roles: { ...DEFAULT_CONFIG.roles, ...(result.rows[0].config.roles ?? {}) },
    channels: { ...DEFAULT_CONFIG.channels, ...(result.rows[0].config.channels ?? {}) }
  };
}

export async function setConfigValue(guildId, path, value, actorId) {
  const config = await getGuildConfig(guildId);
  const parts = path.split(".");
  let cursor = config;
  for (let i=0;i<parts.length-1;i++) cursor = cursor[parts[i]] ??= {};
  cursor[parts.at(-1)] = value;
  await pool.query(`UPDATE guild_config SET config=$2::jsonb,updated_by=$3,updated_at=NOW() WHERE guild_id=$1`, [guildId, JSON.stringify(config), actorId]);
  return config;
}

export async function listEntities(guildId, type=null) {
  const result = type
    ? await pool.query(`SELECT * FROM organization_entities WHERE guild_id=$1 AND entity_type=$2 ORDER BY name`, [guildId,type])
    : await pool.query(`SELECT * FROM organization_entities WHERE guild_id=$1 ORDER BY entity_type,name`, [guildId]);
  return result.rows;
}

export async function upsertEntity({guildId,type,key,name,parentKey=null,roleId=null,teamName=null,metadata={},actorId}) {
  const result = await pool.query(`INSERT INTO organization_entities(guild_id,entity_type,entity_key,name,parent_key,discord_role_id,roblox_team_name,metadata)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
    ON CONFLICT(guild_id,entity_type,entity_key) DO UPDATE SET name=EXCLUDED.name,parent_key=EXCLUDED.parent_key,discord_role_id=EXCLUDED.discord_role_id,roblox_team_name=EXCLUDED.roblox_team_name,metadata=EXCLUDED.metadata,updated_at=NOW()
    RETURNING *`, [guildId,type,key,name,parentKey,roleId,teamName,JSON.stringify(metadata)]);
  return result.rows[0];
}
export async function deleteEntity(guildId,type,key){return (await pool.query(`DELETE FROM organization_entities WHERE guild_id=$1 AND entity_type=$2 AND entity_key=$3 RETURNING *`,[guildId,type,key])).rows[0]??null;}
