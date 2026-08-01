# USMC Community Foundation

This repository is the first production layer for the USMC Roblox community.

## Included

- Discord.js v14 bot
- `/verify` account-linking command
- `/sync` staff diagnostic command
- PostgreSQL personnel-link storage
- Secure Render-hosted API
- Request replay protection
- Discord-role-to-Roblox-team resolution
- Roblox verification command (`!verify CODE`)
- Roblox automatic team assignment
- Render Blueprint deployment file

## Repository layout

```text
src/                         Node.js Discord bot and API
  commands/                  Discord slash commands
  config/                    Environment and division configuration
  database/                  PostgreSQL connection and migrations
  events/                    Discord event handlers
  http/                      Express API
  middleware/                API authentication and replay protection
  services/                  Roblox lookup, verification, team resolver
roblox/
  ServerScriptService/       Scripts copied into Roblox Studio
  ServerStorage/USMC/        Private server configuration
sql/                         PostgreSQL schema
render.yaml                  Render Blueprint
```

## Discord application setup

Enable the **Server Members Intent** in the Discord Developer Portal.

Invite the bot with these scopes:

- `bot`
- `applications.commands`

Required bot permissions:

- Manage Roles
- View Channels
- Send Messages
- Embed Links

The bot's Discord role must be above the verified role and any roles it will manage.

## Render deployment

1. Push this repository to GitHub.
2. In Render, create a Blueprint from the repository.
3. Fill every environment variable marked `sync: false`.
4. Use a random secret of at least 32 characters for `ROBLOX_API_SECRET`.
5. Set `PUBLIC_BASE_URL` to the final Render web-service URL.
6. Deploy. The Blueprint runs the database migration and deploys the guild slash commands.

## Roblox Studio installation

Enable **Game Settings → Security → Allow HTTP Requests**.

Create these exact objects:

```text
ServerStorage
└── USMC
    └── Config                         ModuleScript

ServerScriptService
├── USMCBootstrap                     Script
└── Services                          Folder
    └── USMCApiService                ModuleScript
```

Copy the matching files from the `roblox` directory into those objects.

Inside `ServerStorage/USMC/Config`:

- Set `ApiBaseUrl` to the Render URL.
- Set `ApiSecret` to exactly the same value as `ROBLOX_API_SECRET`.

Create Roblox Teams whose names exactly match the names in `src/config/divisions.js`:

- Civilian
- Marine Corps Personnel
- Headquarters Marine Corps
- Marine Forces Special Operations Command
- Training and Education Command
- Marine Corps Recruit Depot
- I Marine Expeditionary Force

Only teams whose Discord role environment variable is configured will be selected.

## Division priority

When a member has multiple division roles, the highest-priority role wins. Priority is currently:

1. Headquarters Marine Corps
2. Marine Forces Special Operations Command
3. Training and Education Command
4. Marine Corps Recruit Depot
5. I Marine Expeditionary Force

Edit `src/config/divisions.js` to add or reorganize commands. Do not hardcode Discord role IDs in source code; use Render environment variables.

## Verification flow

1. Member runs `/verify username` in Discord.
2. Bot creates a one-use code valid for ten minutes.
3. Member joins Roblox using that exact account.
4. Member types `!verify CODE`.
5. Roblox sends the code and Roblox user ID to the private API.
6. The API links both accounts and gives the verified Discord role.
7. Roblox immediately resolves and assigns the correct team.

## Security notes

- The API secret is stored only in Render and `ServerStorage`.
- Roblox requests include a timestamp and unique nonce.
- Used nonces are rejected to prevent replay attacks.
- Verification codes are account-bound, one-use, and expire after ten minutes.
- SQL queries are parameterized.
- API responses do not expose Discord roles or private personnel data.

A determined exploiter may read values sent by their active Roblox client, but these API calls run only from server scripts. Never move the API secret into ReplicatedStorage, a LocalScript, or a RemoteEvent payload.
