import crypto from "node:crypto";
import { pool } from "../database/pool.js";
import { upsertPersonnel } from "../database/personnelRepository.js";

function generateCode() {
  return crypto.randomBytes(5).toString("hex").toUpperCase();
}

export async function createVerificationCode({
  discordUserId,
  robloxUserId,
  robloxUsername
}) {
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

  return code;
}

export async function consumeVerificationCode({ code, robloxUserId }) {
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
      [code.toUpperCase(), robloxUserId]
    );

    const record = result.rows[0];
    if (!record) {
      await client.query("ROLLBACK");
      return null;
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

    return record;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
