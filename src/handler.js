const { PermissionFlagsBits } = require("discord.js");
const { pool } = require("./db");
const { ranks, getRank } = require("./config/ranks");
const members = require("./services/members");
const { isOwner,isAdmin,isMod,isTrainer,embed,nickname,safeReply,logTo } = require("./utils");

const facts = [
  "The Marine Corps was established on November 10, 1775.",
  "Semper Fidelis means Always Faithful.",
  "The Eagle, Globe, and Anchor is the Marine Corps emblem.",
  "Marines celebrate the Marine Corps Birthday every November 10.",
  "Honor, Courage, and Commitment are Marine Corps core values."
];
const opsA=["IRON","PACIFIC","SILENT","CRIMSON","STEEL","NOBLE","DARK","FROZEN"];
const opsB=["SHIELD","SABER","STORM","LANCE","GUARDIAN","FALCON","TIDE","SPEAR"];
const callA=["Viper","Reaper","Ghost","Havoc","Raven","Viking","Spartan","Warlock"];
const mres=["Chili Mac","Beef Stew","Chicken Burrito Bowl","Pepperoni Pizza Slice","Spaghetti with Beef Sauce","Maple Sausage Patty"];

async function targetMember(i) {
  const u=i.options.getUser("member",true);
  return i.guild.members.fetch(u.id);
}
async function applyRankNickname(member, record) {
  if (!record.roblox_username) throw new Error("That member must link a Roblox username first.");
  if (!member.manageable) throw new Error("The bot role must be above that member.");
  const nn=nickname({abbreviation:record.rank_abbreviation},record.roblox_username,record.nickname_preset);
  await member.setNickname(nn,"USMC rank nickname synchronization");
  return nn;
}
async function syncRole(member, rank) {
  const ids=ranks.map(r=>r.roleId).filter(Boolean);
  const old=member.roles.cache.filter(r=>ids.includes(r.id)).map(r=>r.id);
  if(old.length) await member.roles.remove(old,"USMC rank synchronization");
  if(rank.roleId) await member.roles.add(rank.roleId,"USMC rank synchronization");
}
async function requireLevel(i, fn, text) {
  if (!fn(i.member)) { await i.reply({content:`❌ ${text}`,ephemeral:true}); return false; }
  return true;
}
async function rankChange(i,action) {
  if(!await requireLevel(i,isAdmin,"Administrator access required.")) return;
  await i.deferReply();
  const m=await targetMember(i), key=i.options.getString("rank",true), r=getRank(key), reason=i.options.getString("reason",true);
  if(!r) throw new Error("Invalid rank.");
  const old=await members.getMember(i.guildId,m.id);
  if(!old?.roblox_username) throw new Error("That member must use /linkroblox first.");
  if(action==="promotion" && old?.rank_order!=null && r.order<=old.rank_order) throw new Error("The selected rank is not above the current rank.");
  if(action==="demotion" && (!old || r.order>=old.rank_order)) throw new Error("The selected rank is not below the current rank.");
  await syncRole(m,r);
  const change=await members.setRank(i.guildId,m.id,r,old?.nickname_preset||"standard",i.user.id,reason,action);
  const nn=await applyRankNickname(m,change.current);
  const e=embed(action==="promotion"?"Promotion Completed":action==="demotion"?"Demotion Completed":"Rank Updated")
    .addFields(
      {name:"Marine",value:`<@${m.id}>`,inline:true},
      {name:"Previous Rank",value:change.previous?.rank_name||"None",inline:true},
      {name:"New Rank",value:r.name,inline:true},
      {name:"Nickname",value:nn,inline:true},
      {name:"Changed By",value:`<@${i.user.id}>`,inline:true},
      {name:"Reason",value:reason}
    );
  await i.editReply({embeds:[e]});
  await logTo(i.guild,"RANK_LOG_CHANNEL_ID",{embeds:[e]});
}

async function handle(i,client) {
  if(i.isAutocomplete()){
    const q=i.options.getFocused().toLowerCase();
    return i.respond(ranks.filter(r=>`${r.name} ${r.abbreviation} ${r.paygrade}`.toLowerCase().includes(q)).slice(0,25).map(r=>({name:`${r.name} — ${r.abbreviation} (${r.paygrade})`,value:r.key})));
  }
  if(!i.isChatInputCommand()) return;

  const maint=(await pool.query(`SELECT enabled,message FROM bot_settings WHERE guild_id=$1`,[i.guildId])).rows[0];
  if(maint?.enabled && !isAdmin(i.member) && !["maintenance","ping","uptime"].includes(i.commandName))
    return i.reply({content:`🔧 Bot maintenance: ${maint.message||"Please try again later."}`,ephemeral:true});

  try {
    const c=i.commandName;
    if(c==="linkroblox"){
      const username=i.options.getString("username",true);
      const rec=await members.linkRoblox(i.guildId,i.user.id,username);
      const roleId=process.env.VERIFIED_ROLE_ID;
      if(roleId) await i.member.roles.add(roleId).catch(()=>null);
      if(rec.rank_abbreviation) await applyRankNickname(i.member,rec).catch(()=>null);
      return i.reply({embeds:[embed("Roblox Account Linked",`<@${i.user.id}> is now linked to **${username}**.`)],ephemeral:true});
    }
    if(c==="profile"){
      const u=i.options.getUser("member")||i.user, rec=await members.getMember(i.guildId,u.id);
      return i.reply({embeds:[embed("Marine Profile").setThumbnail(u.displayAvatarURL()).addFields(
        {name:"Discord",value:`<@${u.id}>`,inline:true},
        {name:"Roblox",value:rec?.roblox_username||"Not linked",inline:true},
        {name:"Rank",value:rec?.rank_name?`${rec.rank_name} (${rec.paygrade})`:"Not assigned",inline:true}
      )]});
    }
    if(c==="whois"){
      const m=await targetMember(i),rec=await members.getMember(i.guildId,m.id);
      return i.reply({embeds:[embed("Member Information").setThumbnail(m.user.displayAvatarURL()).addFields(
        {name:"User",value:`${m.user.tag}\n${m.id}`},
        {name:"Joined Discord",value:`<t:${Math.floor(m.joinedTimestamp/1000)}:R>`,inline:true},
        {name:"Account Created",value:`<t:${Math.floor(m.user.createdTimestamp/1000)}:R>`,inline:true},
        {name:"Roblox",value:rec?.roblox_username||"Not linked",inline:true},
        {name:"USMC Rank",value:rec?.rank_name||"None",inline:true}
      )]});
    }
    if(c==="serverstats"){
      const verified=(await pool.query(`SELECT COUNT(*)::int n FROM marine_members WHERE guild_id=$1 AND roblox_username IS NOT NULL`,[i.guildId])).rows[0].n;
      return i.reply({embeds:[embed("Server Statistics").addFields(
        {name:"Members",value:String(i.guild.memberCount),inline:true},
        {name:"Verified",value:String(verified),inline:true},
        {name:"Channels",value:String(i.guild.channels.cache.size),inline:true},
        {name:"Roles",value:String(i.guild.roles.cache.size),inline:true}
      )]});
    }
    if(c==="membercount") return i.reply(`👥 **${i.guild.name}** has **${i.guild.memberCount}** members.`);
    if(c==="ping") return i.reply(`🏓 Gateway: **${client.ws.ping}ms**`);
    if(c==="uptime") return i.reply(`⏱️ Uptime: **${Math.floor(process.uptime()/3600)}h ${Math.floor(process.uptime()%3600/60)}m**`);
    if(c==="rules") return i.reply({embeds:[embed("Community Rules","1. Respect all members.\n2. Follow the chain of command.\n3. No harassment, discrimination, exploiting, or cheating.\n4. Use channels correctly.\n5. Follow Discord and Roblox rules.\n6. Staff decisions may be appealed respectfully.")]});
    if(c==="suggest"){
      const text=i.options.getString("suggestion",true),e=embed("Community Suggestion",text).setFooter({text:`Submitted by ${i.user.tag}`});
      await logTo(i.guild,"SUGGESTION_CHANNEL_ID",{embeds:[e]});
      return i.reply({content:"✅ Suggestion submitted.",ephemeral:true});
    }
    if(c==="report"){
      const m=await targetMember(i),reason=i.options.getString("reason",true),e=embed("Member Report").addFields({name:"Reported Member",value:`<@${m.id}>`},{name:"Reporter",value:`<@${i.user.id}>`},{name:"Reason",value:reason});
      await logTo(i.guild,"REPORT_CHANNEL_ID",{embeds:[e]});
      return i.reply({content:"✅ Your report was sent privately to staff.",ephemeral:true});
    }

    if(c==="promote") return rankChange(i,"promotion");
    if(c==="demote") return rankChange(i,"demotion");
    if(c==="setrank") return rankChange(i,"rank_set");
    if(c==="rank"){
      const sub=i.options.getSubcommand(),m=await targetMember(i);
      if(sub==="view"){
        const rec=await members.getMember(i.guildId,m.id);
        return i.reply({embeds:[embed("Current Rank",rec?.rank_name?`<@${m.id}> — **${rec.rank_name} (${rec.paygrade})**`:`<@${m.id}> has no saved rank.`)]});
      }
      const rows=(await pool.query(`SELECT * FROM rank_history WHERE guild_id=$1 AND discord_user_id=$2 ORDER BY created_at DESC LIMIT 10`,[i.guildId,m.id])).rows;
      return i.reply({embeds:[embed("Rank History",rows.length?rows.map(x=>`**${x.action}** → ${x.new_rank_key.replaceAll("_"," ")} • <t:${Math.floor(new Date(x.created_at).getTime()/1000)}:R>`).join("\n"):"No rank history.")],ephemeral:true});
    }
    if(c==="nickname"||c==="syncnickname"){
      if(!await requireLevel(i,isAdmin,"Administrator access required.")) return;
      const sub=c==="nickname"?i.options.getSubcommand():"refresh",m=await targetMember(i);
      let rec=await members.getMember(i.guildId,m.id);
      if(!rec?.rank_abbreviation||!rec?.roblox_username) throw new Error("Member needs a saved rank and linked Roblox username.");
      if(sub==="set"){ rec=await members.setPreset(i.guildId,m.id,i.options.getString("preset",true)); }
      const nn=await applyRankNickname(m,rec);
      return i.reply({content:`✅ Nickname updated to **${nn}**.`,ephemeral:true});
    }
    if(c==="syncnicknames"){
      if(!await requireLevel(i,isAdmin,"Administrator access required.")) return;
      await i.deferReply({ephemeral:true});
      const rows=(await pool.query(`SELECT * FROM marine_members WHERE guild_id=$1 AND rank_abbreviation IS NOT NULL AND roblox_username IS NOT NULL`,[i.guildId])).rows;
      let ok=0,fail=0;
      for(const rec of rows){const m=await i.guild.members.fetch(rec.discord_user_id).catch(()=>null);if(!m){fail++;continue;}await applyRankNickname(m,rec).then(()=>ok++).catch(()=>fail++);}
      return i.editReply(`✅ Updated **${ok}** nicknames. Failed: **${fail}**.`);
    }

    if(["warn","warnings","clearwarnings","timeout","untimeout","kick","ban","purge","lock","unlock","slowmode","role","announce"].includes(c)){
      if(!await requireLevel(i,isMod,"Moderator access required.")) return;
    }
    if(c==="warn"){
      const m=await targetMember(i),r=i.options.getString("reason",true);
      const row=(await pool.query(`INSERT INTO warnings(guild_id,user_id,moderator_id,reason) VALUES($1,$2,$3,$4) RETURNING id`,[i.guildId,m.id,i.user.id,r])).rows[0];
      await logTo(i.guild,"MOD_LOG_CHANNEL_ID",{embeds:[embed("Warning Issued").addFields({name:"Case",value:String(row.id)},{name:"Member",value:`<@${m.id}>`},{name:"Moderator",value:`<@${i.user.id}>`},{name:"Reason",value:r})]});
      return i.reply(`✅ Warned <@${m.id}>. Case **#${row.id}**.`);
    }
    if(c==="warnings"){
      const m=await targetMember(i),rows=(await pool.query(`SELECT * FROM warnings WHERE guild_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 15`,[i.guildId,m.id])).rows;
      return i.reply({embeds:[embed(`Warnings — ${m.user.username}`,rows.length?rows.map(x=>`**#${x.id}** ${x.reason} — <@${x.moderator_id}>`).join("\n"):"No warnings.")],ephemeral:true});
    }
    if(c==="clearwarnings"){const m=await targetMember(i);const r=await pool.query(`DELETE FROM warnings WHERE guild_id=$1 AND user_id=$2`,[i.guildId,m.id]);return i.reply(`✅ Cleared **${r.rowCount}** warnings for <@${m.id}>.`);}
    if(c==="timeout"){const m=await targetMember(i),mins=i.options.getInteger("minutes",true),r=i.options.getString("reason",true);await m.timeout(mins*60000,r);return i.reply(`✅ Timed out <@${m.id}> for **${mins} minutes**.`);}
    if(c==="untimeout"){const m=await targetMember(i);await m.timeout(null,"Timeout removed");return i.reply(`✅ Removed timeout from <@${m.id}>.`);}
    if(c==="kick"){const m=await targetMember(i),r=i.options.getString("reason",true);await m.kick(r);return i.reply(`✅ Kicked **${m.user.tag}**.`);}
    if(c==="ban"){const m=await targetMember(i),r=i.options.getString("reason",true);await i.guild.members.ban(m.id,{reason:r});return i.reply(`✅ Banned **${m.user.tag}**.`);}
    if(c==="purge"){const n=i.options.getInteger("amount",true);const d=await i.channel.bulkDelete(n,true);return i.reply({content:`✅ Deleted **${d.size}** messages.`,ephemeral:true});}
    if(c==="lock"||c==="unlock"){await i.channel.permissionOverwrites.edit(i.guild.roles.everyone,{SendMessages:c==="unlock"?null:false});return i.reply(`✅ Channel ${c==="lock"?"locked":"unlocked"}.`);}
    if(c==="slowmode"){const s=i.options.getInteger("seconds",true);await i.channel.setRateLimitPerUser(s);return i.reply(`✅ Slowmode set to **${s} seconds**.`);}
    if(c==="role"){const m=await targetMember(i),role=i.options.getRole("role",true),sub=i.options.getSubcommand();if(role.position>=i.guild.members.me.roles.highest.position)throw new Error("That role is above the bot.");await m.roles[sub==="add"?"add":"remove"](role);return i.reply(`✅ ${sub==="add"?"Added":"Removed"} <@&${role.id}> ${sub==="add"?"to":"from"} <@${m.id}>.`);}
    if(c==="announce"){const ch=i.options.getChannel("channel",true),msg=i.options.getString("message",true);if(!ch.isTextBased())throw new Error("Choose a text channel.");await ch.send({embeds:[embed("Official Announcement",msg).setFooter({text:`Posted by ${i.user.tag}`})]});return i.reply({content:"✅ Announcement posted.",ephemeral:true});}

    if(c==="training"){
      if(!await requireLevel(i,isTrainer,"Trainer access required.")) return;
      const sub=i.options.getSubcommand();
      if(sub==="create"){const title=i.options.getString("title",true),time=i.options.getString("time",true);const row=(await pool.query(`INSERT INTO trainings(guild_id,title,time_text,host_id,status) VALUES($1,$2,$3,$4,'scheduled') RETURNING *`,[i.guildId,title,time,i.user.id])).rows[0];const e=embed(`Training #${row.id}: ${title}`).addFields({name:"Time",value:time},{name:"Host",value:`<@${i.user.id}>`},{name:"Status",value:"Scheduled"});await logTo(i.guild,"TRAINING_CHANNEL_ID",{embeds:[e]});return i.reply({embeds:[e]});}
      if(["start","end","cancel"].includes(sub)){const id=i.options.getInteger("id",true),status=sub==="start"?"active":sub==="end"?"completed":"cancelled";const r=await pool.query(`UPDATE trainings SET status=$3,updated_at=NOW() WHERE guild_id=$1 AND id=$2 RETURNING *`,[i.guildId,id,status]);if(!r.rowCount)throw new Error("Training not found.");return i.reply(`✅ Training **#${id}** is now **${status}**.`);}
      if(["attend","pass","fail"].includes(sub)){const id=i.options.getInteger("id",true),m=await targetMember(i),result=sub==="attend"?"attending":sub;await pool.query(`INSERT INTO training_attendance(training_id,guild_id,user_id,result) VALUES($1,$2,$3,$4) ON CONFLICT(training_id,user_id) DO UPDATE SET result=EXCLUDED.result,updated_at=NOW()`,[id,i.guildId,m.id,result]);return i.reply(`✅ <@${m.id}> marked **${result}** for training #${id}.`);}
      if(sub==="history"){const m=await targetMember(i),rows=(await pool.query(`SELECT t.title,a.result,t.created_at FROM training_attendance a JOIN trainings t ON t.id=a.training_id WHERE a.guild_id=$1 AND a.user_id=$2 ORDER BY t.created_at DESC LIMIT 15`,[i.guildId,m.id])).rows;return i.reply({embeds:[embed(`Training History — ${m.user.username}`,rows.length?rows.map(x=>`**${x.title}** — ${x.result}`).join("\n"):"No training history.")],ephemeral:true});}
      const rows=(await pool.query(`SELECT * FROM trainings WHERE guild_id=$1 ORDER BY created_at DESC LIMIT 10`,[i.guildId])).rows;
      return i.reply({embeds:[embed("Recent Trainings",rows.length?rows.map(x=>`**#${x.id} ${x.title}** — ${x.status} — ${x.time_text}`).join("\n"):"No trainings created.")]});
    }

    if(c==="maintenance"){
      const sub=i.options.getSubcommand();
      if(sub==="status"){const r=(await pool.query(`SELECT * FROM bot_settings WHERE guild_id=$1`,[i.guildId])).rows[0];return i.reply(`🔧 Maintenance: **${r?.enabled?"Enabled":"Disabled"}**${r?.message?`\n${r.message}`:""}`);}
      if(!isOwner(i.user.id)&&!isAdmin(i.member))return i.reply({content:"❌ Bot owner or administrator access required.",ephemeral:true});
      const enabled=sub==="enable",message=enabled?i.options.getString("message",true):null;
      await pool.query(`INSERT INTO bot_settings(guild_id,enabled,message) VALUES($1,$2,$3) ON CONFLICT(guild_id) DO UPDATE SET enabled=EXCLUDED.enabled,message=EXCLUDED.message,updated_at=NOW()`,[i.guildId,enabled,message]);
      return i.reply(`✅ Maintenance mode **${enabled?"enabled":"disabled"}**.`);
    }
    if(c==="botstats"){
      if(!await requireLevel(i,isAdmin,"Administrator access required.")) return;
      const db=await pool.query("SELECT NOW() now");
      const count=(await pool.query(`SELECT COUNT(*)::int n FROM marine_members WHERE guild_id=$1`,[i.guildId])).rows[0].n;
      return i.reply({embeds:[embed("Bot Statistics").addFields({name:"Guilds",value:String(client.guilds.cache.size),inline:true},{name:"Users Cached",value:String(client.users.cache.size),inline:true},{name:"Marine Records",value:String(count),inline:true},{name:"Database",value:"Connected",inline:true},{name:"Node",value:process.version,inline:true})],ephemeral:true});
    }

    if(c==="coinflip") return i.reply(`🪙 **${Math.random()<.5?"Heads":"Tails"}**`);
    if(c==="dice"){const s=i.options.getInteger("sides")||6;return i.reply(`🎲 You rolled **${1+Math.floor(Math.random()*s)}** (d${s}).`);}
    if(c==="eightball"){const a=["Yes.","No.","Definitely.","Probably.","Ask again later.","Not looking good.","Without a doubt.","Very doubtful."];return i.reply(`🎱 ${a[Math.floor(Math.random()*a.length)]}`);}
    if(c==="choose"){const a=i.options.getString("choices",true).split("|").map(x=>x.trim()).filter(Boolean);if(a.length<2)throw new Error("Separate at least two choices with |.");return i.reply(`I choose: **${a[Math.floor(Math.random()*a.length)]}**`);}
    if(c==="rate"){const t=i.options.getString("thing",true);return i.reply(`⭐ I rate **${t}** a **${Math.floor(Math.random()*11)}/10**.`);}
    if(c==="rps"){const u=i.options.getString("choice",true),a=["rock","paper","scissors"],b=a[Math.floor(Math.random()*3)],win=(u==="rock"&&b==="scissors")||(u==="paper"&&b==="rock")||(u==="scissors"&&b==="paper");return i.reply(`You chose **${u}**. I chose **${b}**. **${u===b?"Tie!":win?"You win!":"I win!"}**`);}
    if(c==="marinefact") return i.reply(`🦅 ${facts[Math.floor(Math.random()*facts.length)]}`);
    if(c==="operationname") return i.reply(`📋 **OPERATION ${opsA[Math.floor(Math.random()*opsA.length)]} ${opsB[Math.floor(Math.random()*opsB.length)]}**`);
    if(c==="callsign") return i.reply(`📻 Your fun callsign is **${callA[Math.floor(Math.random()*callA.length)]}-${1+Math.floor(Math.random()*9)}**.`);
    if(c==="salute"){const m=await targetMember(i);return i.reply(`🫡 <@${i.user.id}> salutes <@${m.id}>!`);}
    if(c==="mre") return i.reply(`🥫 You received: **${mres[Math.floor(Math.random()*mres.length)]}**.`);
  } catch(e) {
    console.error(e);
    return safeReply(i,{content:`❌ ${e.message||"Command failed."}`,ephemeral:true});
  }
}
module.exports={handle};
