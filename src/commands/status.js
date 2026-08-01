import { SlashCommandBuilder } from "discord.js";
import {
  findPersonnelByDiscordId
} from "../database/repositories.js";
import {
  getMemberTeamData
} from "../services/discordService.js";

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("View your verification and Roblox team status.");

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const personnel = await findPersonnelByDiscordId(
    interaction.user.id
  );

  if (!personnel) {
    return interaction.editReply(
      "Your Discord account is not linked. Run `/verify username` first."
    );
  }

  const teamData = await getMemberTeamData(
    interaction.client,
    interaction.user.id
  );

  return interaction.editReply(
    [
      "**USMC Personnel Status**",
      `Roblox: **${personnel.roblox_username}**`,
      `Roblox User ID: \`${personnel.roblox_user_id}\``,
      `Division: **${teamData.division}**`,
      `Roblox Team: **${teamData.team}**`
    ].join("\n")
  );
}
