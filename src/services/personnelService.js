import { pool } from "../database/pool.js";
import { getRank } from "../config/ranks.js";
import { findPersonnelByDiscordId } from "../database/repositories.js";
import { getDiscordMember } from "./discordService.js";
import { getGuildConfig } from "./configService.js";
import { env } from "../config/env.js";
export async function syncNickname(client,userId){const p=await findPersonnelByDiscordId(userId);if(!p)throw new Error("Member is not verified.");const nickname=`[${p.rank_abbreviation??"Pvt"}] ${p.roblox_username}`.slice(0,32);const m=await getDiscordMember(client,userId);await m.setNickname(nickname,"USMC rank-linked nickname");return nickname;}
export async function setRank(client,userId,abbr,actor,reason){const rank=getRank(abbr);if(!rank)throw new Error("Invalid rank.");const r=await pool.query(`UPDATE personnel SET usmc_rank=$2,rank_abbreviation=$3,updated_at=NOW() WHERE discord_user_id=$1 RETURNING *`,[userId,rank.name,rank.abbreviation]);if(!r.rows[0])throw new Error("Member is not verified.");const nickname=await syncNickname(client,userId);await pool.query(`INSERT INTO audit_logs(action,actor_discord_id,target_discord_id,details) VALUES('rank_changed',$1,$2,$3::jsonb)`,[actor,userId,JSON.stringify({rank,reason,nickname})]);return{rank,nickname};}
export async function setField(userId,field,value){if(!["division","unit_name","billet"].includes(field))throw new Error("Invalid field");const r=await pool.query(`UPDATE personnel SET ${field}=$2,updated_at=NOW() WHERE discord_user_id=$1 RETURNING *`,[userId,value]);return r.rows[0]??null;}
