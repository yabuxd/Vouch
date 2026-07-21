import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { getGroupIdFromSubmission, isGroupMember, reqParam } from '../lib/helpers.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.get('/:id/comments', async (req: AuthRequest, res) => {
  try {
    const submissionId = reqParam(req.params.id);
    const groupId = await getGroupIdFromSubmission(submissionId);
    if (!groupId || !(await isGroupMember(groupId, req.userId!))) {
      res.status(403).json({ error: 'Not a group member' });
      return;
    }

    const { data, error } = await supabase
      .from('submission_comments')
      .select('*, profiles(id, name, avatar_url)')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/:id/comments', async (req: AuthRequest, res) => {
  try {
    const submissionId = reqParam(req.params.id);
    const { body } = req.body;

    if (!body?.trim()) {
      res.status(400).json({ error: 'Comment body is required' });
      return;
    }

    const groupId = await getGroupIdFromSubmission(submissionId);
    if (!groupId || !(await isGroupMember(groupId, req.userId!))) {
      res.status(403).json({ error: 'Not a group member' });
      return;
    }

    const { data, error } = await supabase
      .from('submission_comments')
      .insert({
        submission_id: submissionId,
        user_id: req.userId,
        body: body.trim(),
      })
      .select('*, profiles(id, name, avatar_url)')
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
