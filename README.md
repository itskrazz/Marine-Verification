# Marine Verification v5.1

This release fixes the v5 startup crash caused by the old static `DIVISIONS` import.
All divisions, system roles, logging channels, default teams, and nickname templates are now read from PostgreSQL through `/setup`.

## Minimal Render environment

```env
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
DISCORD_OWNER_ID=
DATABASE_URL=
DATABASE_SSL=true
PUBLIC_BASE_URL=https://marine-verification.onrender.com
ROBLOX_API_SECRET=
PORT=3000
```

## First setup commands

```text
/setup role type:Verified role:@Verified
/setup role type:Admin role:@Administration
/setup channel type:Logs channel:#bot-logs
/setup default-team name:Marine Corps Personnel
/setup nickname-template template:[{rank}] {roblox}
```

Add each division with `/setup division-add`. Use the short key later in `/admin set-division`.

Example:

```text
/setup division-add key:hqmc name:Headquarters Marine Corps role:@HQMC team:Headquarters Marine Corps
```

Do not mix this version with older v5 files. Replace the whole GitHub repository except `.env` and `node_modules`.
