import crypto from 'node:crypto';
import { pool } from '../database/pool.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createCode(length = 8) {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    code += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }
  return code;
}

export async function createVerification({ discordUserId, robloxUserId, robloxUsername }) {
  await pool.query(
    `UPDATE verification_codes
     SET consumed_at = NOW()
     WHERE discord_user_id = $1 AND consumed_at IS NULL`,
    [discordUserId]
  );

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createCode();
    try {
      await pool.query(
        `INSERT INTO verification_codes
          (code, discord_user_id, roblox_user_id, roblox_username, expires_at)
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '10 minutes')`,
        [code, discordUserId, robloxUserId, robloxUsername]
      );
      return code;
    } catch (error) {
      if (error.code !== '23505') throw error;
    }
  }

  throw new Error('Unable to allocate a unique verification code.');
}

export async function consumeVerification({ code, robloxUserId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT code, discord_user_id, roblox_user_id, roblox_username
       FROM verification_codes
       WHERE code = $1
         AND roblox_user_id = $2
         AND consumed_at IS NULL
         AND expires_at > NOW()
       FOR UPDATE`,
      [code.toUpperCase(), robloxUserId]
    );

    const verification = result.rows[0];
    if (!verification) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `INSERT INTO personnel_links
        (discord_user_id, roblox_user_id, roblox_username)
       VALUES ($1, $2, $3)
       ON CONFLICT (discord_user_id)
       DO UPDATE SET
         roblox_user_id = EXCLUDED.roblox_user_id,
         roblox_username = EXCLUDED.roblox_username,
         updated_at = NOW()`,
      [verification.discord_user_id, verification.roblox_user_id, verification.roblox_username]
    );

    await client.query(
      'UPDATE verification_codes SET consumed_at = NOW() WHERE code = $1',
      [verification.code]
    );

    await client.query('COMMIT');
    return verification;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getLinkByRobloxUserId(robloxUserId) {
  const result = await pool.query(
    `SELECT discord_user_id, roblox_user_id, roblox_username
     FROM personnel_links
     WHERE roblox_user_id = $1`,
    [robloxUserId]
  );
  return result.rows[0] ?? null;
}
