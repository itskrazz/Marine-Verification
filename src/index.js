import {
  Client,
  Collection,
  Events,
  GatewayIntentBits
} from "discord.js";
import { env } from "./config/env.js";
import { commands } from "./commands/index.js";
import { createApp } from "./http/createApp.js";
import { pool } from "./database/pool.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
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
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Command ${interaction.commandName} failed:`, error);

    const message = {
      content: "The command failed. Check the Render logs for details.",
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(message);
    } else {
      await interaction.reply(message);
    }
  }
});

async function start() {
  await pool.query("SELECT 1");
  console.log("PostgreSQL connection established.");

  await client.login(env.DISCORD_TOKEN);

  const app = createApp(client);
  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`HTTP server listening on port ${env.PORT}.`);
  });
}

start().catch((error) => {
  console.error("Application startup failed:", error);
  process.exit(1);
});
