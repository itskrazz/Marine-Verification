import crypto from "node:crypto";
import { env } from "../config/env.js";

export function createSignature({ timestamp, nonce, body }) {
  return crypto
    .createHmac("sha256", env.ROBLOX_API_SECRET)
    .update(`${timestamp}.${nonce}.${body}`)
    .digest("hex");
}

export function safeEqual(left, right) {
  const a = Buffer.from(left ?? "", "utf8");
  const b = Buffer.from(right ?? "", "utf8");

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
