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

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/internal', internalRouter);

app.use('/api/v1/groups', requireAuth, groupsRouter);
app.use('/api/v1/groups/:id/goals', requireAuth, goalsRouter);
app.use('/api/v1/groups/:id', requireAuth, leaderboardRouter);
app.use('/api/v1/goals', requireAuth, assignmentsRouter);
app.use('/api/v1', requireAuth, submissionsRouter);
app.use('/api/v1/submissions', requireAuth, approvalsRouter);

app.listen(port, () => {
  console.log(`Vouch API running on http://localhost:${port}`);
});
