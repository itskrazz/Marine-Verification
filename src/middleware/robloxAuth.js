import { env } from "../config/env.js";
import { secureCompare } from "../utils/secureCompare.js";

export function robloxAuth(req, res, next) {
  const suppliedKey = req.header("x-usmc-api-key");

  if (!suppliedKey || !secureCompare(suppliedKey, env.ROBLOX_API_SECRET)) {
    return res.status(401).json({
      error: "Invalid Roblox API credentials."
    });
  }

  next();
}
