import {
  SlashCommandBuilder
} from "discord.js";
import {
  deletePersonnelByDiscordId,
  findPersonnelByDiscordId,
  getBlacklistCount,
  getBlacklistEntry,
  getPersonnelCount,
  getRecentAuditLogs,
  getRecentPersonnel,
  getSetting,
  removeBlacklistEntry,
  setBlacklistEntry,
  setSetting,
  upsertPersonnel,
  writeAuditLog
} from "../database/repositories.js";
import { resolveRobloxUsername } from "../services/robloxService.js";
import {
  clearMemberDivisions,
  getMemberTeamData,
  grantVerifiedRole,
  isAuthorizedAdmin,
  removeVerifiedRole,
  sendLog,
  setMemberDivision
} from "../services/discordService.js";


export const data = new SlashCommandBuilder()
  .setName("admin")
  .setDescription("USMC personnel administration commands.")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("lookup")
      .setDescription("View a member's personnel record.")
      .addUserOption((option) =>
        option
          .setName("member")
          .setDescription("Discord member.")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("force-link")
      .setDescription("Force-link a Discord member to a Roblox account.")
      .addUserOption((option) =>
        option
          .setName("member")
          .setDescription("Discord member.")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Exact Roblox username.")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("unlink")
      .setDescription("Remove a member's Roblox account link.")
      .addUserOption((option) =>
        option
          .setName("member")
          .setDescription("Discord member.")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) => {
    const builder = subcommand
      .setName("set-division")
      .setDescription("Assign a member's primary division role.")
      .addUserOption((option) =>
        option
          .setName("member")
          .setDescription("Discord member.")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("division")
          .setDescription("Division key from /setup divisions, such as hqmc or tecom.")
          .setRequired(true)
      );

    return builder;
  })
  .addSubcommand((subcommand) =>
    subcommand
      .setName("clear-division")
      .setDescription("Remove all configured division roles from a member.")
      .addUserOption((option) =>
        option
          .setName("member")
          .setDescription("Discord member.")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("sync")
      .setDescription("Show the Roblox team currently resolved for a member.")
      .addUserOption((option) =>
        option
          .setName("member")
          .setDescription("Discord member.")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("blacklist")
      .setDescription("Block a member from verification.")
      .addUserOption((option) =>
        option
          .setName("member")
          .setDescription("Discord member.")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("reason")
          .setDescription("Reason for the blacklist.")
          .setRequired(true)
          .setMaxLength(500)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("unblacklist")
      .setDescription("Remove a member from the verification blacklist.")
      .addUserOption((option) =>
        option
          .setName("member")
          .setDescription("Discord member.")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("stats")
      .setDescription("View verification system statistics.")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("recent")
      .setDescription("View recently verified personnel.")
      .addIntegerOption((option) =>
        option
          .setName("amount")
          .setDescription("Number of records from 1 to 20.")
          .setMinValue(1)
          .setMaxValue(20)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("audit")
      .setDescription("View recent administrative audit entries.")
      .addIntegerOption((option) =>
        option
          .setName("amount")
          .setDescription("Number of entries from 1 to 20.")
          .setMinValue(1)
          .setMaxValue(20)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("maintenance")
      .setDescription("Enable or disable verification maintenance mode.")
      .addBooleanOption((option) =>
        option
          .setName("enabled")
          .setDescription("Whether maintenance mode is enabled.")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("Message shown while maintenance is enabled.")
          .setMaxLength(300)
      )
  );

export async function execute(interaction) {
  if (!(await isAuthorizedAdmin(interaction))) {
    return interaction.reply({
      content: "You are not authorized to use USMC administration commands.",
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "lookup") {
    const user = interaction.options.getUser("member", true);
    const personnel = await findPersonnelByDiscordId(user.id);
    const blacklist = await getBlacklistEntry(user.id);

    if (!personnel) {
      return interaction.editReply(
        [
          `**Personnel Lookup: ${user.username}**`,
          "Linked account: **No**",
          `Blacklisted: **${blacklist ? "Yes" : "No"}**`,
          blacklist ? `Reason: ${blacklist.reason}` : ""
        ].filter(Boolean).join("\n")
      );
    }

    const teamData = await getMemberTeamData(interaction.client, user.id);

    return interaction.editReply(
      [
        `**Personnel Lookup: ${user.username}**`,
        "Linked account: **Yes**",
        `Roblox username: **${personnel.roblox_username}**`,
        `Roblox User ID: \`${personnel.roblox_user_id}\``,
        `Division: **${teamData.division}**`,
        `Roblox team: **${teamData.team}**`,
        `Verified: <t:${Math.floor(new Date(personnel.verified_at).getTime() / 1000)}:R>`,
        `Blacklisted: **${blacklist ? "Yes" : "No"}**`
      ].join("\n")
    );
  }

  if (subcommand === "force-link") {
    const user = interaction.options.getUser("member", true);
    const username = interaction.options.getString("username", true).trim();
    const roblox = await resolveRobloxUsername(username);

    if (!roblox) {
      return interaction.editReply("That Roblox username was not found.");
    }

    await upsertPersonnel({
      discordUserId: user.id,
      robloxUserId: roblox.id,
      robloxUsername: roblox.name
    });

    await grantVerifiedRole(interaction.client, user.id);

    await writeAuditLog({
      action: "admin_force_link",
      actorDiscordId: interaction.user.id,
      targetDiscordId: user.id,
      targetRobloxId: roblox.id,
      details: { robloxUsername: roblox.name }
    });

    await sendLog(interaction.client, {
      title: "Personnel Force-Linked",
      description: `${interaction.user} linked ${user} to **${roblox.name}**.`,
      fields: [
        { name: "Roblox User ID", value: String(roblox.id), inline: true }
      ]
    });

    return interaction.editReply(
      `${user} was linked to **${roblox.name}** (\`${roblox.id}\`).`
    );
  }

  if (subcommand === "unlink") {
    const user = interaction.options.getUser("member", true);
    const removed = await deletePersonnelByDiscordId(user.id);

    if (!removed) {
      return interaction.editReply("That member does not have a linked account.");
    }

    await removeVerifiedRole(interaction.client, user.id);

    await writeAuditLog({
      action: "admin_unlink",
      actorDiscordId: interaction.user.id,
      targetDiscordId: user.id,
      targetRobloxId: Number(removed.roblox_user_id),
      details: { robloxUsername: removed.roblox_username }
    });

    await sendLog(interaction.client, {
      title: "Personnel Unlinked",
      description: `${interaction.user} unlinked ${user} from **${removed.roblox_username}**.`
    });

    return interaction.editReply(
      `${user}'s Roblox account link was removed.`
    );
  }

  if (subcommand === "set-division") {
    const user = interaction.options.getUser("member", true);
    const division = interaction.options.getString("division", true);
    const result = await setMemberDivision(
      interaction.client,
      user.id,
      division
    );

    await writeAuditLog({
      action: "admin_set_division",
      actorDiscordId: interaction.user.id,
      targetDiscordId: user.id,
      details: result
    });

    await sendLog(interaction.client, {
      title: "Division Assignment",
      description: `${interaction.user} assigned ${user} to **${result.division}**.`,
      fields: [
        { name: "Roblox Team", value: result.team, inline: false }
      ]
    });

    return interaction.editReply(
      `${user} was assigned to **${result.division}**. Roblox team: **${result.team}**.`
    );
  }

  if (subcommand === "clear-division") {
    const user = interaction.options.getUser("member", true);
    const removedCount = await clearMemberDivisions(
      interaction.client,
      user.id
    );

    await writeAuditLog({
      action: "admin_clear_divisions",
      actorDiscordId: interaction.user.id,
      targetDiscordId: user.id,
      details: { removedCount }
    });

    return interaction.editReply(
      `Removed **${removedCount}** configured division role(s) from ${user}.`
    );
  }

  if (subcommand === "sync") {
    const user = interaction.options.getUser("member", true);
    const personnel = await findPersonnelByDiscordId(user.id);

    if (!personnel) {
      return interaction.editReply(
        "That member is not linked to a Roblox account."
      );
    }

    const result = await getMemberTeamData(
      interaction.client,
      user.id
    );

    return interaction.editReply(
      [
        `Member: ${user}`,
        `Roblox: **${personnel.roblox_username}**`,
        `Division: **${result.division}**`,
        `Resolved Roblox team: **${result.team}**`,
        "",
        "The player will receive this team when they rejoin or when the game syncs them."
      ].join("\n")
    );
  }

  if (subcommand === "blacklist") {
    const user = interaction.options.getUser("member", true);
    const reason = interaction.options.getString("reason", true);

    await setBlacklistEntry({
      discordUserId: user.id,
      reason,
      createdBy: interaction.user.id
    });

    await writeAuditLog({
      action: "admin_blacklist",
      actorDiscordId: interaction.user.id,
      targetDiscordId: user.id,
      details: { reason }
    });

    await sendLog(interaction.client, {
      title: "Verification Blacklist",
      description: `${interaction.user} blacklisted ${user}.`,
      fields: [{ name: "Reason", value: reason }]
    });

    return interaction.editReply(
      `${user} is now blocked from verification.`
    );
  }

  if (subcommand === "unblacklist") {
    const user = interaction.options.getUser("member", true);
    const removed = await removeBlacklistEntry(user.id);

    if (!removed) {
      return interaction.editReply(
        "That member is not on the verification blacklist."
      );
    }

    await writeAuditLog({
      action: "admin_unblacklist",
      actorDiscordId: interaction.user.id,
      targetDiscordId: user.id
    });

    return interaction.editReply(
      `${user} was removed from the verification blacklist.`
    );
  }

  if (subcommand === "stats") {
    const [personnelCount, blacklistCount, maintenance] = await Promise.all([
      getPersonnelCount(),
      getBlacklistCount(),
      getSetting("maintenance")
    ]);

    return interaction.editReply(
      [
        "**Marine Verification Statistics**",
        `Verified personnel: **${personnelCount}**`,
        `Blacklisted members: **${blacklistCount}**`,
        `Maintenance mode: **${maintenance?.enabled ? "Enabled" : "Disabled"}**`,
        `Discord connection: **${interaction.client.isReady() ? "Ready" : "Unavailable"}**`,
        `Process uptime: **${Math.floor(process.uptime())} seconds**`
      ].join("\n")
    );
  }

  if (subcommand === "recent") {
    const amount = interaction.options.getInteger("amount") ?? 10;
    const rows = await getRecentPersonnel(amount);

    if (rows.length === 0) {
      return interaction.editReply("No verified personnel records exist.");
    }

    return interaction.editReply(
      [
        "**Recently Verified Personnel**",
        ...rows.map((row, index) =>
          `${index + 1}. <@${row.discord_user_id}> → **${row.roblox_username}** (\`${row.roblox_user_id}\`)`
        )
      ].join("\n")
    );
  }

  if (subcommand === "audit") {
    const amount = interaction.options.getInteger("amount") ?? 10;
    const rows = await getRecentAuditLogs(amount);

    if (rows.length === 0) {
      return interaction.editReply("No audit entries exist.");
    }

    return interaction.editReply(
      [
        "**Recent USMC Audit Entries**",
        ...rows.map((row) => {
          const actor = row.actor_discord_id
            ? `<@${row.actor_discord_id}>`
            : "System";
          const target = row.target_discord_id
            ? ` → <@${row.target_discord_id}>`
            : "";
          return `• **${row.action}** — ${actor}${target} — <t:${Math.floor(new Date(row.created_at).getTime() / 1000)}:R>`;
        })
      ].join("\n")
    );
  }

  if (subcommand === "maintenance") {
    const enabled = interaction.options.getBoolean("enabled", true);
    const message =
      interaction.options.getString("message") ??
      "Verification is temporarily unavailable while maintenance is performed.";

    await setSetting(
      "maintenance",
      { enabled, message },
      interaction.user.id
    );

    await writeAuditLog({
      action: "admin_maintenance_changed",
      actorDiscordId: interaction.user.id,
      details: { enabled, message }
    });

    await sendLog(interaction.client, {
      title: "Verification Maintenance",
      description: `${interaction.user} ${enabled ? "enabled" : "disabled"} maintenance mode.`,
      fields: [{ name: "Message", value: message }]
    });

    return interaction.editReply(
      `Maintenance mode is now **${enabled ? "enabled" : "disabled"}**.`
    );
  }

  return interaction.editReply("Unknown administration subcommand.");
}
