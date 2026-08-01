import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { findRobloxUserByUsername } from '../services/roblox.js';
import { createVerification } from '../services/verifications.js';

export const data = new SlashCommandBuilder()
  .setName('verify')
  .setDescription('Link your Roblox account to your Discord account.')
  .addStringOption((option) =>
    option.setName('username').setDescription('Your exact Roblox username').setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const username = interaction.options.getString('username', true).trim();
  const robloxUser = await findRobloxUserByUsername(username);

  if (!robloxUser) {
    await interaction.editReply('That Roblox username could not be found.');
    return;
  }

  const code = await createVerification({
    discordUserId: interaction.user.id,
    robloxUserId: robloxUser.id,
    robloxUsername: robloxUser.name
  });

  const embed = new EmbedBuilder()
    .setTitle('USMC Account Verification')
    .setDescription(
      `Join the Roblox experience on **${robloxUser.name}** and type:\n\n` +
      `\`!verify ${code}\`\n\n` +
      'The code expires in 10 minutes and can only be used by that Roblox account.'
    )
    .setFooter({ text: 'Never share your verification code.' });

  await interaction.editReply({ embeds: [embed] });
}
