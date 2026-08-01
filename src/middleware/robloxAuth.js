import { pool } from "../database/pool.js";
import { createSignature, safeEqual } from "../utils/signature.js";

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

export async function robloxAuth(req, res, next) {
  try {
    const timestamp = req.header("x-usmc-timestamp");
    const nonce = req.header("x-usmc-nonce");
    const signature = req.header("x-usmc-signature");

    if (!timestamp || !nonce || !signature) {
      return res.status(401).json({ error: "Missing authentication headers." });
    }

    const timestampNumber = Number(timestamp);
    if (
      !Number.isFinite(timestampNumber) ||
      Math.abs(Date.now() - timestampNumber) > MAX_CLOCK_SKEW_MS
    ) {
      return res.status(401).json({ error: "Expired request timestamp." });
    }

    const body = req.rawBody ?? "";
    const expected = createSignature({ timestamp, nonce, body });

    if (!safeEqual(signature, expected)) {
      return res.status(401).json({ error: "Invalid request signature." });
    }

    const insert = await pool.query(
      `
        INSERT INTO api_nonces (nonce)
        VALUES ($1)
        ON CONFLICT DO NOTHING
        RETURNING nonce
      `,
      [nonce]
    );

    if (insert.rowCount === 0) {
      return res.status(409).json({ error: "Request nonce already used." });
    }

    await pool.query(
      `DELETE FROM api_nonces WHERE created_at < NOW() - INTERVAL '10 minutes'`
    );

    next();
  } catch (error) {
    next(error);
  }
}
