import { REST, Routes } from 'discord.js';
import { env } from './config/env.js';
import * as verify from './commands/verify.js';
import * as sync from './commands/sync.js';

const commands = [verify.data.toJSON(), sync.data.toJSON()];
const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID), {
  body: commands
});

console.log(`Deployed ${commands.length} guild commands.`);
