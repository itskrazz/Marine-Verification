import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";

import { env } from "./config/env.js";
import { pool } from "./database/pool.js";
import { schemaSql } from "./database/schema.js";
import { commands, commandJson } from "./commands/index.js";
import { createApp } from "./http/createApp.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection(commands);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Discord bot logged in as ${readyClient.user.tag}.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.warn(`Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Command ${interaction.commandName} failed:`, error);

    const response = {
      content: "The command failed. Check the logs for details.",
      ephemeral: true,
    };

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(response);
      } else {
        await interaction.reply(response);
      }
    } catch (replyError) {
      console.error("Failed to send command error response:", replyError);
    }
  }
});

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      env.DISCORD_CLIENT_ID,
      env.DISCORD_GUILD_ID,
    ),
    {
      body: commandJson,
    },
  );

  console.log(`Registered ${commandJson.length} Discord commands.`);
}

async function start() {
  await pool.query(schemaSql);
  console.log("PostgreSQL connection and migration completed.");

  await client.login(env.DISCORD_TOKEN);
  await registerCommands();

  const app = createApp(client);

  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`HTTP server listening on port ${env.PORT}.`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  try {
    client.destroy();
    await pool.end();
  } catch (error) {
    console.error("Shutdown error:", error);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch((error) => {
  console.error("Application startup failed:", error);
  process.exit(1);
});