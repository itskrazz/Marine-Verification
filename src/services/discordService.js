import { EmbedBuilder } from "discord.js";
import { env } from "../config/env.js";
import { DIVISIONS, resolveTeam } from "../config/divisions.js";

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
  const resolved = resolveTeam(roleIds);

  return {
    discordUserId,
    division: resolved.division,
    team: resolved.team,
    roleIds: [...roleIds]
  };
}

export async function grantVerifiedRole(client, discordUserId) {
  if (!env.DISCORD_VERIFIED_ROLE_ID) {
    return;
  }

  const member = await getDiscordMember(client, discordUserId);

  if (!member.roles.cache.has(env.DISCORD_VERIFIED_ROLE_ID)) {
    await member.roles.add(
      env.DISCORD_VERIFIED_ROLE_ID,
      "Completed Roblox account verification"
    );
  }
}

export async function removeVerifiedRole(client, discordUserId) {
  if (!env.DISCORD_VERIFIED_ROLE_ID) {
    return;
  }

  const member = await getDiscordMember(client, discordUserId);

  if (member.roles.cache.has(env.DISCORD_VERIFIED_ROLE_ID)) {
    await member.roles.remove(
      env.DISCORD_VERIFIED_ROLE_ID,
      "Roblox account link removed"
    );
  }
}

export async function setMemberDivision(client, discordUserId, divisionKey) {
  const member = await getDiscordMember(client, discordUserId);
  const selected = DIVISIONS.find((division) => division.key === divisionKey);

  if (!selected) {
    throw new Error(`Unknown division: ${divisionKey}`);
  }

  const removableRoleIds = DIVISIONS
    .map((division) => division.roleId)
    .filter((roleId) => roleId && member.roles.cache.has(roleId));

  if (removableRoleIds.length > 0) {
    await member.roles.remove(
      removableRoleIds,
      "USMC admin division reassignment"
    );
  }

  await member.roles.add(
    selected.roleId,
    `USMC admin division assignment: ${selected.key}`
  );

  return {
    division: selected.key,
    team: selected.teamName
  };
}

export async function clearMemberDivisions(client, discordUserId) {
  const member = await getDiscordMember(client, discordUserId);

  const removableRoleIds = DIVISIONS
    .map((division) => division.roleId)
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
