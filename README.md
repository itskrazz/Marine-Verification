# Marine Verification v5

This version stores changing server settings in PostgreSQL. You no longer add role IDs, channel IDs, division IDs, team names, or nickname formats to `.env`.

## Only required `.env` / Render variables

- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID`
- `DISCORD_OWNER_ID` (optional)
- `DATABASE_URL`
- `DATABASE_SSL=true`
- `PUBLIC_BASE_URL`
- `ROBLOX_API_SECRET`
- `PORT=3000`

## First-time setup in Discord

Run:

- `/setup role type:Verified role:@Verified`
- `/setup role type:Admin role:@Admin`
- `/setup role type:Moderator role:@Moderator`
- `/setup role type:Trainer role:@Trainer`
- `/setup channel type:Logs channel:#logs`
- `/setup default-team name:Marine Corps Personnel`
- `/setup nickname-template template:[{rank}] {roblox}`
- `/setup division-add key:hqmc name:Headquarters Marine Corps role:@HQMC team:Headquarters Marine Corps`

Repeat `/setup division-add` for TECOM, I MEF, MARSOC, or any future division. No Render environment edits are needed.

## Added command families

- `/setup` — database-backed configuration
- `/community` — rep, commendations, daily, balance, shop, buy, inventory, use, transfer, missions, badges, awards
- `/org` — create/edit/delete/list divisions, units, billets
- `/events` — host requests, events, check-in/out, LOA
- `/legal` — counseling, NJP, investigations
- Existing `/marine`, `/training`, `/qualification`, `/moderation`, `/admin`, `/verify`, `/status`, `/owner`, `/rep`, and `/economy` remain included.

## Nicknames

Promotion/rank commands use the saved template. Default:

`[{rank}] {roblox}`

No callsigns are included.

## Deployment

Replace the full GitHub repository with v5, except `.env` and `node_modules`. Render runs database migrations and deploys commands automatically.
