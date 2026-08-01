require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { handle } = require("./handler");

for(const key of ["DISCORD_TOKEN","DATABASE_URL"]){
  if(!process.env[key]) throw new Error(`Missing environment variable ${key}`);
}
const client=new Client({
  intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages],
  partials:[Partials.GuildMember]
});
client.once("ready",()=>console.log(`USMC Community Bot online as ${client.user.tag}`));
client.on("interactionCreate",i=>handle(i,client).catch(console.error));
client.login(process.env.DISCORD_TOKEN);
