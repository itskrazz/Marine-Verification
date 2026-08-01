const { Pool } = require("pg");
const ssl = String(process.env.DATABASE_SSL || "true").toLowerCase() === "true";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: ssl ? { rejectUnauthorized: false } : false
});
module.exports = { pool };
