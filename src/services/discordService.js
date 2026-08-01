import { EmbedBuilder } from "discord.js";
import { env } from "../config/env.js";
import { resolveTeam } from "../config/divisions.js";
import { getGuildConfig, listEntities } from "./configService.js";

export async function getDiscordGuild(client) {
  return client.guilds.fetch(env.DISCORD_GUILD_ID);
}

export async function getDiscordMember(client, discordUserId) {
  const guild = await getDiscordGuild(client);
  return guild.members.fetch(discordUserId);
}

export async function getMemberTeamData(client, discordUserId) {
  const member = await getDiscordMember(client, discordUserId);
  const roleIds = new Set(member.roles.cache.keys());
  const resolved = await resolveTeam(roleIds);

  return {
    discordUserId,
    division: resolved.division,
    team: resolved.team,
    roleIds: [...roleIds]
  };
}

export async function grantVerifiedRole(client, discordUserId) {
  if (!(await getGuildConfig(env.DISCORD_GUILD_ID)).roles.verified) {
    return;
  }

  const member = await getDiscordMember(client, discordUserId);

  if (!member.roles.cache.has((await getGuildConfig(env.DISCORD_GUILD_ID)).roles.verified)) {
    await member.roles.add(
      (await getGuildConfig(env.DISCORD_GUILD_ID)).roles.verified,
      "Completed Roblox account verification"
    );
  }
}

export async function removeVerifiedRole(client, discordUserId) {
  if (!(await getGuildConfig(env.DISCORD_GUILD_ID)).roles.verified) {
    return;
  }

  const member = await getDiscordMember(client, discordUserId);

  if (member.roles.cache.has((await getGuildConfig(env.DISCORD_GUILD_ID)).roles.verified)) {
    await member.roles.remove(
      (await getGuildConfig(env.DISCORD_GUILD_ID)).roles.verified,
      "Roblox account link removed"
    );
  }
}

export async function setMemberDivision(client, discordUserId, divisionKey) {
  const member = await getDiscordMember(client, discordUserId);
  const divisions = await listEntities(env.DISCORD_GUILD_ID, "division");
  const selected = divisions.find(d => d.entity_key === divisionKey);
  if (!selected?.discord_role_id) throw new Error("Division is not configured with a Discord role.");
  const removable = divisions.map(d=>d.discord_role_id).filter(id=>id && member.roles.cache.has(id));
  if (removable.length) await member.roles.remove(removable, "USMC division reassignment");
  await member.roles.add(selected.discord_role_id, "USMC division assignment");
  return { division:selected.name, team:selected.roblox_team_name || selected.name };
}

export async function clearMemberDivisions(client, discordUserId) {
  const member = await getDiscordMember(client, discordUserId);

  const divisions = await listEntities(env.DISCORD_GUILD_ID, "division");
  const removableRoleIds = divisions
    .map((division) => division.discord_role_id)
    .filter((roleId) => roleId && member.roles.cache.has(roleId));

  if (removableRoleIds.length > 0) {
    await member.roles.remove(
      removableRoleIds,
      "USMC admin cleared division roles"
    );
  }

  return removableRoleIds.length;
}

export function isAuthorizedAdmin(interaction) {
  if (interaction.memberPermissions?.has("Administrator")) {
    return true;
  }

  if (interaction.memberPermissions?.has("ManageGuild")) {
    return true;
  }

  if (
    env.DISCORD_ADMIN_ROLE_ID &&
    interaction.member?.roles?.cache?.has(env.DISCORD_ADMIN_ROLE_ID)
  ) {
    return true;
  }

  return false;
}

export async function sendLog(client, {
  title,
  description,
  fields = []
}) {
  if (!env.DISCORD_LOG_CHANNEL_ID) {
    return;
  }

  try {
    const channel = await client.channels.fetch(
      env.DISCORD_LOG_CHANNEL_ID
    );

    if (!channel?.isTextBased()) {
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .addFields(fields)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("Failed to send Discord log:", error);
  }
}
