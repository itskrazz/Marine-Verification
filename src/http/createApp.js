import express from "express";
import helmet from "helmet";
import { robloxAuth } from "../middleware/robloxAuth.js";
import {
  findPersonnelByRobloxId,
  getSetting
} from "../database/repositories.js";
import {
  consumeVerificationCode
} from "../services/verificationService.js";
import {
  getMemberTeamData,
  grantVerifiedRole
} from "../services/discordService.js";

export function createApp(client) {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "32kb" }));

  app.get("/", (_req, res) => {
    res.json({
      service: "Marine Verification",
      version: "3.0.0",
      status: "online"
    });
  });

  app.get("/health", async (_req, res, next) => {
    try {
      const maintenance = await getSetting("maintenance");

      res.json({
        status: "ok",
        discordReady: client.isReady(),
        maintenance: Boolean(maintenance?.enabled),
        uptimeSeconds: Math.floor(process.uptime())
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/v1/roblox/verify",
    robloxAuth,
    async (req, res, next) => {
      try {
        const maintenance = await getSetting("maintenance");
        if (maintenance?.enabled) {
          return res.status(503).json({
            error:
              maintenance.message ||
              "Verification is temporarily unavailable."
          });
        }

        const code = String(req.body.code ?? "")
          .trim()
          .toUpperCase();

        const robloxUserId = Number(req.body.robloxUserId);

        if (
          !/^[A-F0-9]{10}$/.test(code) ||
          !Number.isSafeInteger(robloxUserId)
        ) {
          return res.status(400).json({
            error: "Invalid verification request."
          });
        }

        const record = await consumeVerificationCode({
          code,
          robloxUserId
        });

        if (!record) {
          return res.status(404).json({
            error:
              "Verification code is invalid, expired, or belongs to another Roblox account."
          });
        }

        await grantVerifiedRole(client, record.discord_user_id);

        const teamData = await getMemberTeamData(
          client,
          record.discord_user_id
        );

        return res.json({
          verified: true,
          discordUserId: record.discord_user_id,
          robloxUsername: record.roblox_username,
          division: teamData.division,
          team: teamData.team
        });
      } catch (error) {
        if (error.code === "BLACKLISTED") {
          return res.status(403).json({
            error: `Verification blocked: ${error.message}`
          });
        }
        next(error);
      }
    }
  );

  app.post(
    "/api/v1/roblox/sync",
    robloxAuth,
    async (req, res, next) => {
      try {
        const robloxUserId = Number(req.body.robloxUserId);

        if (!Number.isSafeInteger(robloxUserId)) {
          return res.status(400).json({
            error: "Invalid Roblox user ID."
          });
        }

        const personnel = await findPersonnelByRobloxId(
          robloxUserId
        );

        if (!personnel) {
          return res.status(404).json({
            verified: false,
            error: "Roblox account is not linked."
          });
        }

        const teamData = await getMemberTeamData(
          client,
          personnel.discord_user_id
        );

        return res.json({
          verified: true,
          discordUserId: personnel.discord_user_id,
          robloxUsername: personnel.roblox_username,
          division: teamData.division,
          team: teamData.team
        });
      } catch (error) {
        next(error);
      }
    }
  );

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({
      error: "Internal server error."
    });
  });

  return app;
}
