import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { requireRobloxAuth } from '../middleware/robloxAuth.js';
import { consumeVerification, getLinkByRobloxUserId } from '../services/verifications.js';
import { resolveTeam } from '../services/teamResolver.js';
import { env } from '../config/env.js';
import { logError } from '../utils/logger.js';

const completeSchema = z.object({
  code: z.string().min(6).max(12),
  robloxUserId: z.number().int().positive()
});

const resolveSchema = z.object({
  robloxUserId: z.coerce.number().int().positive()
});

export function createServer(discordClient) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(express.json({ limit: '32kb' }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7' }));

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok', discordReady: discordClient.isReady() });
  });

  app.post('/v1/verification/complete', requireRobloxAuth, async (request, response, next) => {
    try {
      const input = completeSchema.parse(request.body);
      const verification = await consumeVerification(input);
      if (!verification) {
        return response.status(404).json({ error: 'Invalid or expired verification code' });
      }

      const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
      const member = await guild.members.fetch(verification.discord_user_id);
      await member.roles.add(env.DISCORD_VERIFIED_ROLE_ID, 'Roblox account verification completed');

      return response.json({
        ok: true,
        discordUserId: verification.discord_user_id,
        robloxUsername: verification.roblox_username
      });
    } catch (error) {
      return next(error);
    }
  });

  app.get('/v1/team/resolve', requireRobloxAuth, async (request, response, next) => {
    try {
      const input = resolveSchema.parse(request.query);
      const link = await getLinkByRobloxUserId(input.robloxUserId);
      if (!link) {
        return response.status(404).json({ error: 'Roblox account is not verified' });
      }

      const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
      const member = await guild.members.fetch(link.discord_user_id).catch(() => null);
      if (!member) {
        return response.status(404).json({ error: 'Linked Discord member is not in the server' });
      }

      return response.json({ ok: true, ...resolveTeam(member) });
    } catch (error) {
      return next(error);
    }
  });

  app.use((error, _request, response, _next) => {
    logError('HTTP request failed', error);
    if (error instanceof z.ZodError) {
      return response.status(400).json({ error: 'Invalid request', details: error.flatten() });
    }
    return response.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
