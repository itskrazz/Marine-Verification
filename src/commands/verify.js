import { SlashCommandBuilder } from "discord.js";
import { resolveRobloxUsername } from "../services/robloxService.js";
import { createVerificationCode } from "../services/verificationService.js";

export const data = new SlashCommandBuilder()
  .setName("verify")
  .setDescription("Link your Discord account to your Roblox account.")
  .addStringOption((option) =>
    option
      .setName("username")
      .setDescription("Your exact Roblox username.")
      .setRequired(true)
      .setMinLength(3)
      .setMaxLength(20)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const username = interaction.options.getString("username", true).trim();
  const robloxUser = await resolveRobloxUsername(username);

  if (!robloxUser) {
    return interaction.editReply(
      "That Roblox username was not found. Check the spelling and try again."
    );
  }

  const code = await createVerificationCode({
    discordUserId: interaction.user.id,
    robloxUserId: robloxUser.id,
    robloxUsername: robloxUser.name
  });

  return interaction.editReply(
    [
      `Roblox account found: **${robloxUser.name}**`,
      "",
      `Join the Roblox experience and type: \`!verify ${code}\``,
      "",
      "The code expires in 10 minutes and can only be used by that Roblox account."
    ].join("\n")
  );
}
