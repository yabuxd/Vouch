import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { isGroupMember, isGroupOwner, reqParam } from '../lib/helpers.js';
import { generateAssignmentsForGoal } from '../services/assignments.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { Goal } from '../lib/supabase.js';

const router = Router({ mergeParams: true });

router.post('/', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);
    const { title, description, type, frequency, due_date } = req.body;

    if (!title?.trim() || !type || !frequency) {
      res.status(400).json({ error: 'title, type, and frequency are required' });
      return;
    }

    if (!(await isGroupMember(groupId, req.userId!))) {
      res.status(403).json({ error: 'Not a group member' });
      return;
    }

    if (type === 'group' && !(await isGroupOwner(groupId, req.userId!))) {
      res.status(403).json({ error: 'Only owners can create group goals' });
      return;
    }

    const { data: goal, error } = await supabase
      .from('goals')
      .insert({
        group_id: groupId,
        created_by: req.userId,
        title: title.trim(),
        description: description?.trim() || null,
        type,
        frequency,
        due_date: due_date || null,
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    await generateAssignmentsForGoal(goal as Goal);
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);
    if (!(await isGroupMember(groupId, req.userId!))) {
      res.status(403).json({ error: 'Not a group member' });
      return;
    }

    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    res.json(goals ?? []);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
