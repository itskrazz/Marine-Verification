import { env } from "./env.js";
import { getGuildConfig, listEntities } from "../services/configService.js";

export async function resolveTeam(memberRoleIds) {
  const divisions = await listEntities(env.DISCORD_GUILD_ID, "division");
  const match = divisions.find(d => d.discord_role_id && memberRoleIds.has(d.discord_role_id));
  if (match) return { division: match.name, team: match.roblox_team_name || match.name };
  const config = await getGuildConfig(env.DISCORD_GUILD_ID);
  return { division: "PERSONNEL", team: config.defaultTeam };
}
