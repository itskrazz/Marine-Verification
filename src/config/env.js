import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_GUILD_ID: z.string().min(1),
  DISCORD_VERIFIED_ROLE_ID: z.string().min(1),
  DISCORD_LOG_CHANNEL_ID: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  PUBLIC_BASE_URL: z.string().url(),
  ROBLOX_API_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: z.enum(['true', 'false']).default('true'),
  ROLE_HQMC: z.string().optional(),
  ROLE_TECOM: z.string().optional(),
  ROLE_MCRD: z.string().optional(),
  ROLE_I_MEF: z.string().optional(),
  ROLE_MARSOC: z.string().optional()
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
