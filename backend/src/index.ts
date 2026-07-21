import express from 'express';
import dotenv from 'dotenv';
import { createCorsMiddleware } from './cors-config.js';
import { requireAuth } from './middleware/auth.js';
import groupsRouter from './routes/groups.js';
import goalsRouter from './routes/goals.js';
import assignmentsRouter from './routes/assignments.js';
import submissionsRouter from './routes/submissions.js';
import approvalsRouter from './routes/approvals.js';
import dashboardRouter from './routes/dashboard.js';
import internalRouter from './routes/internal.js';
import { missedFeedRouter, missedEventRouter } from './routes/missed-events.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(createCorsMiddleware());
app.use(express.json());

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/internal', internalRouter);

app.use('/api/v1/groups', requireAuth, groupsRouter);
app.use('/api/v1/groups/:id/goals', requireAuth, goalsRouter);
app.use('/api/v1/groups/:id', requireAuth, dashboardRouter);
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
  const status = (err as Error & { status?: number }).status;
  res.status(typeof status === 'number' ? status : 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(`Vouch API running on http://localhost:${port}`);
});
