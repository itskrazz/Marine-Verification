import crypto from "node:crypto";
import { pool } from "../database/pool.js";
import {
  getBlacklistEntry,
  getSetting,
  upsertPersonnel,
  writeAuditLog
} from "../database/repositories.js";

function generateCode() {
  return crypto.randomBytes(5).toString("hex").toUpperCase();
}

export async function createVerificationCode({
  discordUserId,
  robloxUserId,
  robloxUsername
}) {
  const maintenance = await getSetting("maintenance");
  if (maintenance?.enabled) {
    const error = new Error(
      maintenance.message || "Verification is temporarily unavailable."
    );
    error.code = "MAINTENANCE";
    throw error;
  }

  const blacklist = await getBlacklistEntry(discordUserId);
  if (blacklist) {
    const error = new Error(blacklist.reason);
    error.code = "BLACKLISTED";
    throw error;
  }

  await pool.query(
    `
      DELETE FROM verification_codes
      WHERE discord_user_id = $1
         OR expires_at < NOW()
    `,
    [discordUserId]
  );

  const code = generateCode();

  await pool.query(
    `
      INSERT INTO verification_codes (
        code,
        discord_user_id,
        roblox_user_id,
        roblox_username,
        expires_at
      )
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '10 minutes')
    `,
    [code, discordUserId, robloxUserId, robloxUsername]
  );

  await writeAuditLog({
    action: "verification_code_created",
    targetDiscordId: discordUserId,
    targetRobloxId: robloxUserId,
    details: { robloxUsername }
  });

  return code;
}

export async function consumeVerificationCode({
  code,
  robloxUserId
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        SELECT *
        FROM verification_codes
        WHERE code = $1
          AND roblox_user_id = $2
          AND consumed_at IS NULL
          AND expires_at > NOW()
        FOR UPDATE
      `,
      [code, robloxUserId]
    );

    const record = result.rows[0];

    if (!record) {
      await client.query("ROLLBACK");
      return null;
    }

    const blacklist = await client.query(
      `
        SELECT *
        FROM verification_blacklist
        WHERE discord_user_id = $1
      `,
      [record.discord_user_id]
    );

    if (blacklist.rows[0]) {
      await client.query("ROLLBACK");
      const error = new Error(blacklist.rows[0].reason);
      error.code = "BLACKLISTED";
      throw error;
    }

    await client.query(
      `
        UPDATE verification_codes
        SET consumed_at = NOW()
        WHERE code = $1
      `,
      [record.code]
    );

    await client.query("COMMIT");

    await upsertPersonnel({
      discordUserId: record.discord_user_id,
      robloxUserId: Number(record.roblox_user_id),
      robloxUsername: record.roblox_username
    });

    await writeAuditLog({
      action: "verification_completed",
      targetDiscordId: record.discord_user_id,
      targetRobloxId: Number(record.roblox_user_id),
      details: { robloxUsername: record.roblox_username }
    });

    return record;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    throw error;
  } finally {
    client.release();
  }
}
