import { pool } from "./pool.js";
import { schemaSql } from "./schema.js";

try {
  await pool.query(schemaSql);
  console.log("Database migration completed.");
} catch (error) {
  console.error("Database migration failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
