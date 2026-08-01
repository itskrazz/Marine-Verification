import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getGuildConfig, setConfigValue, listEntities, upsertEntity, deleteEntity } from "../services/configService.js";

export const data = new SlashCommandBuilder().setName("setup").setDescription("Configure the bot without editing .env.")
 .addSubcommand(s=>s.setName("show").setDescription("Show saved configuration."))
 .addSubcommand(s=>s.setName("role").setDescription("Set a system role.").addStringOption(o=>o.setName("type").setDescription("Role type").setRequired(true).addChoices({name:"Verified",value:"verified"},{name:"Admin",value:"admin"},{name:"Moderator",value:"moderator"},{name:"Trainer",value:"trainer"})).addRoleOption(o=>o.setName("role").setDescription("Discord role").setRequired(true)))
 .addSubcommand(s=>s.setName("channel").setDescription("Set a system channel.").addStringOption(o=>o.setName("type").setDescription("Channel type").setRequired(true).addChoices({name:"Logs",value:"logs"},{name:"Moderation",value:"moderation"},{name:"Training",value:"training"},{name:"Suggestions",value:"suggestions"},{name:"Reports",value:"reports"})).addChannelOption(o=>o.setName("channel").setDescription("Discord channel").setRequired(true)))
 .addSubcommand(s=>s.setName("nickname-template").setDescription("Set nickname template. Variables: {rank}, {roblox}").addStringOption(o=>o.setName("template").setDescription("Example: [{rank}] {roblox}").setRequired(true)))
 .addSubcommand(s=>s.setName("default-team").setDescription("Set fallback Roblox team.").addStringOption(o=>o.setName("name").setDescription("Exact Roblox team name").setRequired(true)))
 .addSubcommand(s=>s.setName("division-add").setDescription("Add/update a division mapping.").addStringOption(o=>o.setName("key").setDescription("Short key, e.g. hqmc").setRequired(true)).addStringOption(o=>o.setName("name").setDescription("Display name").setRequired(true)).addRoleOption(o=>o.setName("role").setDescription("Discord division role").setRequired(true)).addStringOption(o=>o.setName("team").setDescription("Exact Roblox team name").setRequired(true)))
 .addSubcommand(s=>s.setName("division-remove").setDescription("Remove division mapping.").addStringOption(o=>o.setName("key").setDescription("Division key").setRequired(true)))
 .addSubcommand(s=>s.setName("divisions").setDescription("List division mappings."))
 .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(i){
 const s=i.options.getSubcommand(),g=i.guildId;
 if(s==="show"){const c=await getGuildConfig(g);return i.reply({content:"```json\n"+JSON.stringify(c,null,2)+"\n```",ephemeral:true});}
 if(s==="role"){const t=i.options.getString("type",true),r=i.options.getRole("role",true);await setConfigValue(g,`roles.${t}`,r.id,i.user.id);return i.reply({content:`Saved ${t} role as ${r}.`,ephemeral:true});}
 if(s==="channel"){const t=i.options.getString("type",true),c=i.options.getChannel("channel",true);await setConfigValue(g,`channels.${t}`,c.id,i.user.id);return i.reply({content:`Saved ${t} channel as ${c}.`,ephemeral:true});}
 if(s==="nickname-template"){const t=i.options.getString("template",true);if(!t.includes("{roblox}"))return i.reply({content:"Template must include {roblox}.",ephemeral:true});await setConfigValue(g,"nicknameTemplate",t,i.user.id);return i.reply({content:`Nickname template saved: \`${t}\``,ephemeral:true});}
 if(s==="default-team"){const n=i.options.getString("name",true);await setConfigValue(g,"defaultTeam",n,i.user.id);return i.reply({content:`Default Roblox team saved as **${n}**.`,ephemeral:true});}
 if(s==="division-add"){const key=i.options.getString("key",true).toLowerCase(),name=i.options.getString("name",true),role=i.options.getRole("role",true),team=i.options.getString("team",true);await upsertEntity({guildId:g,type:"division",key,name,roleId:role.id,teamName:team,actorId:i.user.id});return i.reply({content:`Saved **${name}** → ${role} → **${team}**.`,ephemeral:true});}
 if(s==="division-remove"){const key=i.options.getString("key",true).toLowerCase(),r=await deleteEntity(g,"division",key);return i.reply({content:r?`Removed **${r.name}**.`:"Division not found.",ephemeral:true});}
 const rows=await listEntities(g,"division");return i.reply({content:rows.length?["**Configured Divisions**",...rows.map(x=>`\`${x.entity_key}\` — ${x.name} — <@&${x.discord_role_id}> → **${x.roblox_team_name}**`)].join("\n"):"No divisions configured. Use `/setup division-add`.",ephemeral:true});
}
