import express from "express";
import helmet from "helmet";
import { robloxAuth } from "../middleware/robloxAuth.js";
import {
  findByRobloxUserId
} from "../database/personnelRepository.js";
import {
  consumeVerificationCode
} from "../services/verificationService.js";
import {
  getMemberSyncData,
  grantVerifiedRole
} from "../services/discordSyncService.js";

export function createApp(client) {
  const app = express();

  app.use(helmet());
  app.use(
    express.json({
      limit: "32kb",
      verify: (req, _res, buffer) => {
        req.rawBody = buffer.toString("utf8");
      }
    })
  );

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      discordReady: client.isReady(),
      uptimeSeconds: Math.floor(process.uptime())
    });
  });

  app.post("/api/v1/roblox/verify", robloxAuth, async (req, res, next) => {
    try {
      const code = String(req.body.code ?? "").trim().toUpperCase();
      const robloxUserId = Number(req.body.robloxUserId);

      if (!/^[A-F0-9]{10}$/.test(code) || !Number.isSafeInteger(robloxUserId)) {
        return res.status(400).json({ error: "Invalid verification request." });
      }

      const record = await consumeVerificationCode({ code, robloxUserId });

      if (!record) {
        return res.status(404).json({
          error: "Verification code is invalid, expired, or belongs to another account."
        });
      }

      await grantVerifiedRole(client, record.discord_user_id);

      const sync = await getMemberSyncData(client, record.discord_user_id);

      res.json({
        verified: true,
        discordUserId: record.discord_user_id,
        robloxUsername: record.roblox_username,
        division: sync.division,
        team: sync.team
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/v1/roblox/sync", robloxAuth, async (req, res, next) => {
    try {
      const robloxUserId = Number(req.body.robloxUserId);

      if (!Number.isSafeInteger(robloxUserId)) {
        return res.status(400).json({ error: "Invalid Roblox user ID." });
      }

      const personnel = await findByRobloxUserId(robloxUserId);

      if (!personnel) {
        return res.status(404).json({
          verified: false,
          error: "Roblox account is not linked."
        });
      }

      const sync = await getMemberSyncData(
        client,
        personnel.discord_user_id
      );

      res.json({
        verified: true,
        discordUserId: personnel.discord_user_id,
        robloxUsername: personnel.roblox_username,
        division: sync.division,
        team: sync.team
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  });

  return app;
}
