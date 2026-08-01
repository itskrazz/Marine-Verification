import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pool } from './pool.js';

const currentFile = fileURLToPath(import.meta.url);
const sqlPath = path.resolve(path.dirname(currentFile), '../../sql/001_init.sql');

try {
  const sql = await readFile(sqlPath, 'utf8');
  await pool.query(sql);
  console.log('Database schema is ready.');
} finally {
  await pool.end();
}
