#!/usr/bin/env node
/**
 * Apply Supabase SQL migrations 005–009 using DATABASE_URL (Postgres connection string).
 *
 * Usage (from backend/):
 *   DATABASE_URL="postgresql://..." npm run apply-migrations
 *   DATABASE_URL="postgresql://..." npm run apply-migrations -- --from 006
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', '..', 'supabase', 'migrations');

const FROM = process.argv.includes('--from')
  ? process.argv[process.argv.indexOf('--from') + 1]
  : '005';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL. Supabase Dashboard → Database → Connection string (URI).');
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql') && f >= `${FROM}_`)
  .sort();

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  await client.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz default now()
    )
  `);

  for (const file of files) {
    const { rows } = await client.query(
      'select 1 from schema_migrations where filename = $1',
      [file]
    );
    if (rows.length) {
      console.log(`skip ${file}`);
      continue;
    }

    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    console.log(`apply ${file}...`);
    await client.query('begin');
    try {
      await client.query(sql);
      await client.query('insert into schema_migrations (filename) values ($1)', [file]);
      await client.query('commit');
      console.log(`ok ${file}`);
    } catch (err) {
      await client.query('rollback');
      throw err;
    }
  }

  await client.end();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
