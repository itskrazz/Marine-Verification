import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { pool } from '../database/pool.js';

function safeEqual(left, right) {
  const a = Buffer.from(left ?? '');
  const b = Buffer.from(right ?? '');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function requireRobloxAuth(request, response, next) {
  try {
    const secret = request.header('x-usmc-secret');
    const nonce = request.header('x-usmc-nonce');
    const timestamp = Number(request.header('x-usmc-timestamp'));

    if (!safeEqual(secret, env.ROBLOX_API_SECRET)) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    if (!nonce || !Number.isFinite(timestamp)) {
      return response.status(400).json({ error: 'Missing request security headers' });
    }

    const age = Math.abs(Date.now() - timestamp * 1000);
    if (age > 120_000) {
      return response.status(401).json({ error: 'Expired request' });
    }

    await pool.query('DELETE FROM api_nonces WHERE expires_at <= NOW()');
    try {
      await pool.query(
        `INSERT INTO api_nonces (nonce, expires_at)
         VALUES ($1, NOW() + INTERVAL '5 minutes')`,
        [nonce]
      );
    } catch (error) {
      if (error.code === '23505') {
        return response.status(409).json({ error: 'Replayed request' });
      }
      throw error;
    }

    return next();
  } catch (error) {
    return next(error);
  }
}
