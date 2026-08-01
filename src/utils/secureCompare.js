import crypto from "node:crypto";

export function secureCompare(left, right) {
  const a = Buffer.from(String(left ?? ""), "utf8");
  const b = Buffer.from(String(right ?? ""), "utf8");

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
