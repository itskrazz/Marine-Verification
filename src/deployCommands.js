import { REST, Routes } from "discord.js";
import { env } from "./config/env.js";
import { commandData } from "./commands/index.js";

const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

try {
  console.log(`Deploying ${commandData.length} guild commands...`);

  await rest.put(
    Routes.applicationGuildCommands(
      env.DISCORD_CLIENT_ID,
      env.DISCORD_GUILD_ID
    ),
    { body: commandData }
  );

  console.log("Discord commands deployed.");
} catch (error) {
  console.error("Command deployment failed:", error);
  process.exitCode = 1;
}
