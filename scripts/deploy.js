require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { commands } = require("../src/commands");
for(const k of ["DISCORD_TOKEN","DISCORD_CLIENT_ID","DISCORD_GUILD_ID"])if(!process.env[k])throw new Error(`Missing ${k}`);
new REST({version:"10"}).setToken(process.env.DISCORD_TOKEN)
  .put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID,process.env.DISCORD_GUILD_ID),{body:commands})
  .then(()=>console.log(`Deployed ${commands.length} top-level commands.`))
  .catch(e=>{console.error(e);process.exitCode=1;});
