import express from 'express';
import dotenv from 'dotenv';
import { createCorsMiddleware } from './cors-config.js';
import { requireAuth } from './middleware/auth.js';
import {
  apiRateLimit,
  joinRateLimit,
  uploadRateLimit,
  voteRateLimit,
} from './middleware/rate-limit.js';
import groupsRouter from './routes/groups.js';
import goalsRouter from './routes/goals.js';
import assignmentsRouter from './routes/assignments.js';
import submissionsRouter from './routes/submissions.js';
import approvalsRouter from './routes/approvals.js';
import dashboardRouter from './routes/dashboard.js';
import internalRouter from './routes/internal.js';
import notificationsRouter from './routes/notifications.js';
import crewsRouter from './routes/crews.js';
import usersRouter from './routes/users.js';
import reportsRouter from './routes/reports.js';
import commentsRouter from './routes/comments.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(createCorsMiddleware());
app.use(express.json());
app.use('/api/v1', apiRateLimit);

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/internal', internalRouter);

app.use('/api/v1/notifications', requireAuth, notificationsRouter);
app.use('/api/v1/crews', requireAuth, crewsRouter);
app.use('/api/v1/users', requireAuth, usersRouter);
app.use('/api/v1/reports', requireAuth, reportsRouter);
app.use('/api/v1/submissions', requireAuth, commentsRouter);
app.use('/api/v1/groups', requireAuth, groupsRouter);
app.use('/api/v1/groups/:id/goals', requireAuth, goalsRouter);
app.use('/api/v1/groups/:id', requireAuth, dashboardRouter);
app.use('/api/v1/goals', requireAuth, assignmentsRouter);
app.use('/api/v1', requireAuth, submissionsRouter);
app.use('/api/v1/submissions', requireAuth, approvalsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const status = (err as Error & { status?: number }).status;
  res.status(typeof status === 'number' ? status : 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(`Vouch API running on http://localhost:${port}`);
});
