#!/usr/bin/env node
/**
 * Hit internal cron endpoints. Used by Render cron jobs or local testing.
 *
 * Usage:
 *   node scripts/run-cron.mjs daily
 *   node scripts/run-cron.mjs hourly
 *
 * Env: API_BASE_URL (default http://localhost:3001/api/v1), CRON_SECRET
 */

const job = process.argv[2];
const base = (process.env.API_BASE_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error('Missing CRON_SECRET');
  process.exit(1);
}

const paths = {
  daily: '/internal/generate-daily-assignments',
  hourly: '/internal/run-hourly-jobs',
};

const path = paths[job];
if (!path) {
  console.error('Usage: node scripts/run-cron.mjs <daily|hourly>');
  process.exit(1);
}

const res = await fetch(`${base}${path}`, {
  method: 'POST',
  headers: { 'x-cron-secret': secret },
});

const body = await res.text();
console.log(res.status, body);
if (!res.ok) process.exit(1);
