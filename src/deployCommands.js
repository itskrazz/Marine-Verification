import { REST, Routes } from "discord.js";
import { env } from "./config/env.js";
import { commandJson } from "./commands/index.js";

const rest = new REST({ version: "10" }).setToken(
  env.DISCORD_TOKEN
);

try {
  await rest.put(
    Routes.applicationGuildCommands(
      env.DISCORD_CLIENT_ID,
      env.DISCORD_GUILD_ID
    ),
    {
      body: commandJson
    }
  );

  console.log(
    `Deployed ${commandJson.length} Discord guild commands.`
  );
} catch (error) {
  console.error("Command deployment failed:", error);
  process.exitCode = 1;
}
