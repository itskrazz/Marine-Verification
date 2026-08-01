import "dotenv/config";
import { z } from "zod";

const snowflake = z.string().regex(/^\d{17,20}$/);
const schema = z.object({
  DISCORD_TOKEN: z.string().min(20),
  DISCORD_CLIENT_ID: snowflake,
  DISCORD_GUILD_ID: snowflake,
  DISCORD_OWNER_ID: snowflake.optional().or(z.literal("")),
  PORT: z.coerce.number().int().positive().default(3000),
  PUBLIC_BASE_URL: z.string().url().default("https://marine-verification.onrender.com"),
  ROBLOX_API_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: z.enum(["true", "false"]).default("true").transform(v => v === "true")
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = Object.freeze(parsed.data);
