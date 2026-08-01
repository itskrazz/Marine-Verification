import "dotenv/config";
import { z } from "zod";

const optionalSnowflake = z
  .string()
  .regex(/^\d{17,20}$/)
  .optional()
  .or(z.literal(""));

const schema = z.object({
  DISCORD_TOKEN: z.string().min(20),
  DISCORD_CLIENT_ID: z.string().regex(/^\d{17,20}$/),
  DISCORD_GUILD_ID: z.string().regex(/^\d{17,20}$/),
  DISCORD_VERIFIED_ROLE_ID: optionalSnowflake,
  DISCORD_LOG_CHANNEL_ID: optionalSnowflake,

  PORT: z.coerce.number().int().positive().default(3000),
  PUBLIC_BASE_URL: z.string().url(),
  ROBLOX_API_SECRET: z.string().min(32),

  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),

  ROLE_HQMC: optionalSnowflake,
  ROLE_TECOM: optionalSnowflake,
  ROLE_I_MEF: optionalSnowflake,
  ROLE_MARSOC: optionalSnowflake,

  TEAM_HQMC: z.string().default("Headquarters Marine Corps"),
  TEAM_TECOM: z.string().default("Training and Education Command"),
  TEAM_I_MEF: z.string().default("I Marine Expeditionary Force"),
  TEAM_MARSOC: z.string().default("Marine Forces Special Operations Command"),
  TEAM_DEFAULT: z.string().default("Marine Personnel")
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
