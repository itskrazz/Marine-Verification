import * as verify from '../commands/verify.js';
import * as sync from '../commands/sync.js';
import { logError } from '../utils/logger.js';

const commands = new Map([
  [verify.data.name, verify],
  [sync.data.name, sync]
]);

export async function handleInteraction(interaction) {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    logError('Slash command failed', error, {
      command: interaction.commandName,
      userId: interaction.user.id
    });

    const message = 'The command failed. The incident has been logged.';
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(message).catch(() => undefined);
    } else {
      await interaction.reply({ content: message, ephemeral: true }).catch(() => undefined);
    }
  }
}
