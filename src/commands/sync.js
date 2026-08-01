import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getLinkByRobloxUserId } from '../services/verifications.js';
import { resolveTeam } from '../services/teamResolver.js';

export const data = new SlashCommandBuilder()
  .setName('sync')
  .setDescription('View the resolved Roblox team for a linked Roblox user.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addIntegerOption((option) =>
    option.setName('roblox_user_id').setDescription('Roblox numeric user ID').setRequired(true).setMinValue(1)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const robloxUserId = interaction.options.getInteger('roblox_user_id', true);
  const link = await getLinkByRobloxUserId(robloxUserId);

  if (!link) {
    await interaction.editReply('No verified Discord account is linked to that Roblox user ID.');
    return;
  }

  const member = await interaction.guild.members.fetch(link.discord_user_id).catch(() => null);
  if (!member) {
    await interaction.editReply('The linked Discord account is not currently in this server.');
    return;
  }

  const resolved = resolveTeam(member);
  await interaction.editReply(
    `**${link.roblox_username}** resolves to **${resolved.teamName}**` +
      (resolved.division ? ` through **${resolved.division}**.` : '.')
  );
}
