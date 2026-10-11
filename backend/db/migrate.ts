import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../src/db/pool.js';

const dir = path.resolve(process.cwd(), 'db', 'migrations');

async function main() {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (filename VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  const { rows } = await pool.query('SELECT filename FROM schema_migrations');
  const applied = new Set(rows.map((r: any) => r.filename));
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    if (applied.has(f)) {
      console.log(`skip ${f}`);
      continue;
    }
    console.log(`apply ${f}`);
    const sql = await fs.readFile(path.join(dir, f), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [f]);
  }
  await pool.end();
  console.log('migrations done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
