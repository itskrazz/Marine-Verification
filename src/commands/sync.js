import {
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import { findByDiscordUserId } from "../database/personnelRepository.js";
import { getMemberSyncData } from "../services/discordSyncService.js";

export const data = new SlashCommandBuilder()
  .setName("sync")
  .setDescription("Check the Roblox team assignment for a verified member.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addUserOption((option) =>
    option
      .setName("member")
      .setDescription("The Discord member to check.")
      .setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const user = interaction.options.getUser("member", true);
  const personnel = await findByDiscordUserId(user.id);

  if (!personnel) {
    return interaction.editReply("That member has not linked a Roblox account.");
  }

  const sync = await getMemberSyncData(interaction.client, user.id);

  return interaction.editReply(
    [
      `Member: **${user.username}**`,
      `Roblox: **${personnel.roblox_username}**`,
      `Division: **${sync.division}**`,
      `Assigned Team: **${sync.team}**`
    ].join("\n")
  );
}
