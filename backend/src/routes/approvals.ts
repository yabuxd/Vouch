import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { getGroupIdFromSubmission, isGroupMember, reqParam } from '../lib/helpers.js';
import { processVote } from '../services/approvals.js';
import type { AuthRequest } from '../middleware/auth.js';
import { voteRateLimit } from '../middleware/rate-limit.js';

const router = Router();

router.post('/:id/vote', voteRateLimit, async (req: AuthRequest, res) => {
  try {
    const submissionId = reqParam(req.params.id);
    const { decision, comment } = req.body;

    if (!['approve', 'reject'].includes(decision)) {
      res.status(400).json({ error: 'decision must be approve or reject' });
      return;
    }

    const groupId = await getGroupIdFromSubmission(submissionId);
    if (!groupId || !(await isGroupMember(groupId, req.userId!))) {
      res.status(403).json({ error: 'Not a group member' });
      return;
    }

    const result = await processVote(submissionId, req.userId!, decision, comment);
    res.json(result);
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes('Already') || msg.includes('Cannot') ? 400 : 500;
    res.status(status).json({ error: msg });
  }
});

router.get('/:id/approvals', async (req: AuthRequest, res) => {
  try {
    const submissionId = reqParam(req.params.id);
    const groupId = await getGroupIdFromSubmission(submissionId);
    if (!groupId || !(await isGroupMember(groupId, req.userId!))) {
      res.status(403).json({ error: 'Not a group member' });
      return;
    }

    const { data } = await supabase
      .from('approvals')
      .select('*, profiles(id, name)')
      .eq('submission_id', submissionId);

    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
