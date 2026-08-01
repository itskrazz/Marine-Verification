import { env } from "../config/env.js";
import { resolveDivision } from "../config/divisions.js";

export async function getMemberSyncData(client, discordUserId) {
  const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
  const member = await guild.members.fetch(discordUserId);
  const roleIds = new Set(member.roles.cache.keys());
  const division = resolveDivision(roleIds);

  return {
    discordUserId,
    division: division.key,
    team: division.robloxTeam,
    roleIds: [...roleIds]
  };
}

export async function grantVerifiedRole(client, discordUserId) {
  if (!env.DISCORD_VERIFIED_ROLE_ID) {
    return;
  }

  const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
  const member = await guild.members.fetch(discordUserId);

  if (!member.roles.cache.has(env.DISCORD_VERIFIED_ROLE_ID)) {
    await member.roles.add(
      env.DISCORD_VERIFIED_ROLE_ID,
      "Completed Roblox account verification"
    );
  }
}
