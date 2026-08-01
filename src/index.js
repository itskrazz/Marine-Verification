import { Client,Collection,Events,GatewayIntentBits,REST,Routes } from "discord.js";
import { env } from "./config/env.js";
import { pool } from "./database/pool.js";
import { schemaSql } from "./database/schema.js";
import { commands,commandJson } from "./commands/index.js";
import { createApp } from "./http/createApp.js";
const client=new Client({intents:[GatewayIntentBits.Guilds]});
client.commands=new Collection(commands);
client.once(Events.ClientReady,c=>console.log(`Discord bot logged in as ${c.user.tag}.`));
client.on(Events.InteractionCreate,async i=>{if(!i.isChatInputCommand())return;const c=client.commands.get(i.commandName);if(!c)return;try{await c.execute(i);}catch(e){console.error(`Command ${i.commandName} failed:`,e);const payload={content:"Command failed. Check Render logs.",ephemeral:true};try{i.deferred||i.replied?await i.editReply(payload):await i.reply(payload);}catch{}}});
async function register(){const rest=new REST({version:"10"}).setToken(env.DISCORD_TOKEN);await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID,env.DISCORD_GUILD_ID),{body:commandJson});console.log(`Registered ${commandJson.length} command families.`);}
async function start(){await pool.query(schemaSql);console.log("PostgreSQL migration completed.");await client.login(env.DISCORD_TOKEN);await register();createApp(client).listen(env.PORT,"0.0.0.0",()=>console.log(`HTTP server listening on ${env.PORT}.`));}
start().catch(e=>{console.error("Application startup failed:",e);process.exit(1);});
