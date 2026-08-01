import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { pool } from "../database/pool.js";
import { claimDaily,getBalance,transferBalance,listShop,buyItem,getInventory,useItem } from "../services/economyService.js";

export const data=new SlashCommandBuilder().setName("community").setDescription("Reputation, rewards, shop, missions, badges, and awards.")
.addSubcommand(s=>s.setName("rep-give").setDescription("Give reputation.").addUserOption(o=>o.setName("member").setDescription("Member").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setRequired(true)))
.addSubcommand(s=>s.setName("rep-view").setDescription("View reputation.").addUserOption(o=>o.setName("member").setDescription("Member")))
.addSubcommand(s=>s.setName("rep-leaderboard").setDescription("Reputation leaderboard."))
.addSubcommand(s=>s.setName("commend").setDescription("Commend a member.").addUserOption(o=>o.setName("member").setDescription("Member").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setRequired(true)))
.addSubcommand(s=>s.setName("commendations").setDescription("View commendations.").addUserOption(o=>o.setName("member").setDescription("Member")))
.addSubcommand(s=>s.setName("daily").setDescription("Claim daily credits."))
.addSubcommand(s=>s.setName("balance").setDescription("View balance.").addUserOption(o=>o.setName("member").setDescription("Member")))
.addSubcommand(s=>s.setName("shop").setDescription("View shop."))
.addSubcommand(s=>s.setName("buy").setDescription("Buy item.").addStringOption(o=>o.setName("item").setDescription("Item key").setRequired(true)))
.addSubcommand(s=>s.setName("inventory").setDescription("View inventory."))
.addSubcommand(s=>s.setName("use").setDescription("Use item.").addStringOption(o=>o.setName("item").setDescription("Item key").setRequired(true)))
.addSubcommand(s=>s.setName("transfer").setDescription("Transfer credits.").addUserOption(o=>o.setName("member").setDescription("Recipient").setRequired(true)).addIntegerOption(o=>o.setName("amount").setDescription("Amount").setRequired(true).setMinValue(1)))
.addSubcommand(s=>s.setName("missions").setDescription("View missions."))
.addSubcommand(s=>s.setName("mission-complete").setDescription("Complete mission.").addStringOption(o=>o.setName("mission").setDescription("Mission key").setRequired(true)))
.addSubcommand(s=>s.setName("badges").setDescription("View badges.").addUserOption(o=>o.setName("member").setDescription("Member")))
.addSubcommand(s=>s.setName("awards").setDescription("View awards.").addUserOption(o=>o.setName("member").setDescription("Member")));

export async function execute(i){const s=i.options.getSubcommand();
 if(s==="rep-give"){const u=i.options.getUser("member",true),r=i.options.getString("reason",true);if(u.id===i.user.id||u.bot)return i.reply({content:"Invalid recipient.",ephemeral:true});const q=await pool.query(`SELECT 1 FROM reputation WHERE giver_id=$1 AND receiver_id=$2 AND created_at>NOW()-INTERVAL '24 hours'`,[i.user.id,u.id]);if(q.rows[0])return i.reply({content:"You already gave them rep in the last 24 hours.",ephemeral:true});await pool.query(`INSERT INTO reputation(giver_id,receiver_id,reason) VALUES($1,$2,$3)`,[i.user.id,u.id,r]);return i.reply(`${u} received +1 reputation: **${r}**`);}
 if(s==="rep-view"){const u=i.options.getUser("member")??i.user,r=await pool.query(`SELECT COUNT(*)::int count FROM reputation WHERE receiver_id=$1`,[u.id]);return i.reply({content:`${u} has **${r.rows[0].count}** reputation.`,ephemeral:true});}
 if(s==="rep-leaderboard"){const r=await pool.query(`SELECT receiver_id,COUNT(*)::int count FROM reputation GROUP BY receiver_id ORDER BY count DESC LIMIT 10`);return i.reply(["**Reputation Leaderboard**",...r.rows.map((x,n)=>`${n+1}. <@${x.receiver_id}> — **${x.count}**`)].join("\n"));}
 if(s==="commend"){if(!i.memberPermissions.has(PermissionFlagsBits.ManageGuild))return i.reply({content:"Manage Server required.",ephemeral:true});const u=i.options.getUser("member",true),r=i.options.getString("reason",true);await pool.query(`INSERT INTO commendations(giver_id,receiver_id,reason) VALUES($1,$2,$3)`,[i.user.id,u.id,r]);return i.reply(`${u} was commended: **${r}**`);}
 if(s==="commendations"){const u=i.options.getUser("member")??i.user,r=await pool.query(`SELECT reason,giver_id FROM commendations WHERE receiver_id=$1 ORDER BY created_at DESC LIMIT 20`,[u.id]);return i.reply({content:r.rows.length?[`**Commendations: ${u.username}**`,...r.rows.map(x=>`• ${x.reason} — <@${x.giver_id}>`)].join("\n"):"No commendations.",ephemeral:true});}
 if(s==="daily"){const r=await claimDaily(i.user.id);return i.reply({content:r.ok?`Claimed **${r.reward} credits**. Streak: **${r.account.daily_streak}**.`:`Claim again <t:${Math.floor(r.nextAt.getTime()/1000)}:R>.`,ephemeral:true});}
 if(s==="balance"){const u=i.options.getUser("member")??i.user,b=await getBalance(u.id);return i.reply({content:`${u} has **${b.balance} credits**.`,ephemeral:true});}
 if(s==="shop"){const r=await listShop();return i.reply({content:["**Shop**",...r.map(x=>`\`${x.item_key}\` — **${x.name}** — ${x.price}\n${x.description}`)].join("\n\n"),ephemeral:true});}
 if(s==="buy"){const r=await buyItem(i.user.id,i.options.getString("item",true));return i.reply({content:r.ok?`Purchased **${r.item.name}**. Balance: ${r.balance}.`:r.reason==="insufficient"?"Not enough credits.":"Item not found.",ephemeral:true});}
 if(s==="inventory"){const r=await getInventory(i.user.id);return i.reply({content:r.length?["**Inventory**",...r.map(x=>`\`${x.item_key}\` — ${x.name} ×${x.quantity}`)].join("\n"):"Inventory empty.",ephemeral:true});}
 if(s==="use"){const r=await useItem(i.user.id,i.options.getString("item",true));return i.reply({content:r?`Item used. Remaining: **${r.quantity}**.`:"You do not own that item.",ephemeral:true});}
 if(s==="transfer"){const u=i.options.getUser("member",true),a=i.options.getInteger("amount",true);const r=await transferBalance(i.user.id,u.id,a);return i.reply({content:r.ok?`Transferred **${a}** credits to ${u}.`:"Insufficient credits.",ephemeral:true});}
 if(s==="missions"){const r=await pool.query(`SELECT * FROM missions WHERE enabled=TRUE ORDER BY reward`);return i.reply({content:["**Missions**",...r.rows.map(x=>`\`${x.mission_key}\` — **${x.name}** — ${x.reward} credits\n${x.description}`)].join("\n\n"),ephemeral:true});}
 if(s==="mission-complete"){const key=i.options.getString("mission",true);const m=await pool.query(`SELECT * FROM missions WHERE mission_key=$1 AND enabled=TRUE`,[key]);if(!m.rows[0])return i.reply({content:"Mission not found.",ephemeral:true});const q=await pool.query(`INSERT INTO mission_completions(discord_user_id,mission_key) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING *`,[i.user.id,key]);if(!q.rows[0])return i.reply({content:"You already completed that mission.",ephemeral:true});await pool.query(`INSERT INTO balances(discord_user_id,balance) VALUES($1,$2) ON CONFLICT(discord_user_id) DO UPDATE SET balance=balances.balance+$2`,[i.user.id,m.rows[0].reward]);return i.reply(`Mission complete: **${m.rows[0].name}** (+${m.rows[0].reward} credits).`);}
 const u=i.options.getUser("member")??i.user;if(s==="badges"){const r=await pool.query(`SELECT badge FROM badges WHERE discord_user_id=$1 ORDER BY awarded_at`,[u.id]);return i.reply({content:r.rows.length?[`**Badges: ${u.username}**`,...r.rows.map(x=>`• ${x.badge}`)].join("\n"):"No badges.",ephemeral:true});}
 const r=await pool.query(`SELECT award,reason FROM service_awards WHERE discord_user_id=$1 ORDER BY awarded_at DESC`,[u.id]);return i.reply({content:r.rows.length?[`**Awards: ${u.username}**`,...r.rows.map(x=>`• **${x.award}** — ${x.reason??"No reason"}`)].join("\n"):"No awards.",ephemeral:true});}
