import { Router } from 'express';
import { isGroupMember, reqParam } from '../lib/helpers.js';
import { getLeaderboard, getGroupDashboard } from '../services/leaderboard.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.get('/leaderboard', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);
    if (!(await isGroupMember(groupId, req.userId!))) {
      res.status(403).json({ error: 'Not a group member' });
      return;
    }
    const leaderboard = await getLeaderboard(groupId);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);
    if (!(await isGroupMember(groupId, req.userId!))) {
      res.status(403).json({ error: 'Not a group member' });
      return;
    }
    const dashboard = await getGroupDashboard(groupId, req.userId!);
    res.json(dashboard);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
