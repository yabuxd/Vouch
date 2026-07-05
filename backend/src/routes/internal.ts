import { Router } from 'express';
import { generateDailyAssignments, resetMissedStreaks } from '../services/assignments.js';
import { requireCronSecret } from '../middleware/auth.js';

const router = Router();

router.post('/generate-daily-assignments', requireCronSecret, async (_req, res) => {
  try {
    await resetMissedStreaks();
    const created = await generateDailyAssignments();
    res.json({ created });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
