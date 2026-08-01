import { Client, GatewayIntentBits } from 'discord.js';
import { env } from './config/env.js';
import { pool } from './database/pool.js';
import { handleInteraction } from './events/interactionCreate.js';
import { createServer } from './http/createServer.js';
import { logError, logInfo } from './utils/logger.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', () => {
  logInfo('Discord client ready', { user: client.user.tag, guilds: client.guilds.cache.size });
});

client.on('interactionCreate', handleInteraction);
client.on('error', (error) => logError('Discord client error', error));

const app = createServer(client);
const server = app.listen(env.PORT, () => {
  logInfo('HTTP server listening', { port: env.PORT });
});

async function shutdown(signal) {
  logInfo('Shutdown requested', { signal });
  server.close();
  client.destroy();
  await pool.end();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (error) => logError('Unhandled rejection', error));
process.on('uncaughtException', (error) => {
  logError('Uncaught exception', error);
  process.exit(1);
});

await client.login(env.DISCORD_TOKEN);
