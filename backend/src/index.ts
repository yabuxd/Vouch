import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requireAuth } from './middleware/auth.js';
import groupsRouter from './routes/groups.js';
import goalsRouter from './routes/goals.js';
import assignmentsRouter from './routes/assignments.js';
import submissionsRouter from './routes/submissions.js';
import approvalsRouter from './routes/approvals.js';
import leaderboardRouter from './routes/leaderboard.js';
import internalRouter from './routes/internal.js';
import { missedFeedRouter, missedEventRouter } from './routes/missed-events.js';

dotenv.config();

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'FRONTEND_URL'] as const;
const missing = requiredEnv.filter((key) => {
  const value = process.env[key]?.trim();
  return !value || value.includes('your-project') || value.includes('your-secret') || value.includes('your-anon');
});

if (missing.length > 0) {
  console.error(`Missing or placeholder env vars: ${missing.join(', ')}`);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

if (!process.env.CRON_SECRET || process.env.CRON_SECRET === 'change-me-for-daily-cron') {
  console.warn('CRON_SECRET is weak or default — set a strong secret before enabling cron.');
}

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const clean = origin.replace(/\/$/, '');
      callback(null, allowedOrigins.includes(clean));
    },
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/internal', internalRouter);

app.use('/api/v1/groups', requireAuth, groupsRouter);
app.use('/api/v1/groups/:id/goals', requireAuth, goalsRouter);
app.use('/api/v1/groups/:id', requireAuth, leaderboardRouter);
app.use('/api/v1/groups/:id', requireAuth, missedFeedRouter);
app.use('/api/v1/missed-events', requireAuth, missedEventRouter);
app.use('/api/v1/goals', requireAuth, assignmentsRouter);
app.use('/api/v1', requireAuth, submissionsRouter);
app.use('/api/v1/submissions', requireAuth, approvalsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Vouch API running on port ${port}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ') || '(none)'}`);
});
