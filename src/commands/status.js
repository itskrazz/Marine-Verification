import { SlashCommandBuilder } from "discord.js";
import { findByDiscordUserId } from "../database/personnelRepository.js";
import { getMemberSyncData } from "../services/discordSyncService.js";

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("View your Roblox verification and division sync status.");

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const personnel = await findByDiscordUserId(interaction.user.id);

  if (!personnel) {
    return interaction.editReply(
      "Your Discord account is not linked. Run `/verify username` first."
    );
  }

  const sync = await getMemberSyncData(interaction.client, interaction.user.id);

  return interaction.editReply(
    [
      "**USMC Personnel Status**",
      `Roblox: **${personnel.roblox_username}**`,
      `Roblox User ID: \`${personnel.roblox_user_id}\``,
      `Division: **${sync.division}**`,
      `Roblox Team: **${sync.team}**`
    ].join("\n")
  );
}
