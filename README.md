# Marine Verification v3

One complete Discord ↔ Roblox verification and personnel administration system.

Do not mix this version with v1, v2, or individual patch ZIPs.

## Main features

### Member commands

- `/verify username`
- `/status`

### Administration commands

All administration tools are under `/admin`.

- `/admin lookup`
- `/admin force-link`
- `/admin unlink`
- `/admin set-division`
- `/admin clear-division`
- `/admin sync`
- `/admin blacklist`
- `/admin unblacklist`
- `/admin stats`
- `/admin recent`
- `/admin audit`
- `/admin maintenance`

Administrators, members with Manage Server, and members holding
`DISCORD_ADMIN_ROLE_ID` can use these commands.

## Administration behavior

### Force-link

Directly links a Discord member to a valid Roblox username and grants the
Verified role.

### Unlink

Removes the database link and removes the Verified role.

### Set division

Removes other configured division roles and assigns the selected division.
The player's Roblox team updates on their next join or sync.

### Blacklist

Blocks the Discord member from generating or using verification codes.

### Maintenance

Temporarily disables new verification while leaving normal verified-player
team synchronization online.

### Audit logs

Administrative actions and verification events are stored in PostgreSQL.
Important staff actions are also posted to `DISCORD_LOG_CHANNEL_ID`.

## New Render variable

Add this optional variable:

```text
DISCORD_ADMIN_ROLE_ID=<Discord role ID for verification administrators>
```

If left blank, Discord Administrator or Manage Server permission is required.

## Database migration

Version 3 automatically creates all required tables on startup.

The new tables are:

- `verification_blacklist`
- `audit_logs`
- `app_settings`

No manual SQL command is required after deployment.

## Deployment

1. Replace the full GitHub repository with v3.
2. Do not upload `.env`.
3. Add all variables from `.env.example` to Render.
4. Redeploy the latest commit.
5. The bot automatically migrates the database and registers commands.
6. Restart Discord if the new `/admin` options do not appear immediately.

## Roblox

The Roblox scripts from v2 remain compatible with v3. The complete matching
Roblox files are included again in this ZIP.

## Required Discord bot permissions

- View Channels
- Send Messages
- Use Application Commands
- Manage Roles
- Read Message History

Place the bot role above:

- Verified
- HQMC
- TECOM
- MCRD
- I MEF
- MARSOC

The bot cannot add or remove roles positioned above its highest role.
