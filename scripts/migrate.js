require("dotenv").config();
const { pool }=require("../src/db");
const sql=`
CREATE TABLE IF NOT EXISTS marine_members(
 guild_id VARCHAR(32) NOT NULL,
 discord_user_id VARCHAR(32) NOT NULL,
 roblox_username VARCHAR(64),
 rank_key VARCHAR(64),
 rank_name VARCHAR(100),
 rank_abbreviation VARCHAR(20),
 paygrade VARCHAR(10),
 rank_order INTEGER,
 nickname_preset VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK(nickname_preset IN('standard','divider')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(guild_id,discord_user_id)
);
CREATE TABLE IF NOT EXISTS rank_history(
 id BIGSERIAL PRIMARY KEY,guild_id VARCHAR(32) NOT NULL,discord_user_id VARCHAR(32) NOT NULL,
 old_rank_key VARCHAR(64),new_rank_key VARCHAR(64) NOT NULL,action VARCHAR(20) NOT NULL,
 reason VARCHAR(500),changed_by VARCHAR(32) NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS warnings(
 id BIGSERIAL PRIMARY KEY,guild_id VARCHAR(32) NOT NULL,user_id VARCHAR(32) NOT NULL,
 moderator_id VARCHAR(32) NOT NULL,reason VARCHAR(500) NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trainings(
 id BIGSERIAL PRIMARY KEY,guild_id VARCHAR(32) NOT NULL,title VARCHAR(200) NOT NULL,
 time_text VARCHAR(200) NOT NULL,host_id VARCHAR(32) NOT NULL,status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS training_attendance(
 training_id BIGINT NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,guild_id VARCHAR(32) NOT NULL,
 user_id VARCHAR(32) NOT NULL,result VARCHAR(20) NOT NULL DEFAULT 'attending',
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(training_id,user_id)
);
CREATE TABLE IF NOT EXISTS bot_settings(
 guild_id VARCHAR(32) PRIMARY KEY,enabled BOOLEAN NOT NULL DEFAULT FALSE,message VARCHAR(500),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rank_history_user ON rank_history(guild_id,discord_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_warnings_user ON warnings(guild_id,user_id,created_at DESC);
`;
pool.query(sql).then(()=>console.log("Full USMC bot database migration completed.")).then(()=>pool.end()).catch(async e=>{console.error(e);await pool.end();process.exitCode=1;});
