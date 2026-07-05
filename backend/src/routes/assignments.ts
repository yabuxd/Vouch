import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { reqParam } from '../lib/helpers.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/:id/assignments', async (req: AuthRequest, res) => {
  try {
    const goalId = reqParam(req.params.id);
    const { data: goal } = await supabase.from('goals').select('group_id').eq('id', goalId).single();
    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    const { data: membership } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', goal.group_id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (!membership) {
      res.status(403).json({ error: 'Not a group member' });
      return;
    }

    const all = req.query.all === 'true';
    let query = supabase
      .from('goal_assignments')
      .select('*, profiles(id, name), goals(*)')
      .eq('goal_id', goalId)
      .order('due_date', { ascending: false });

    if (!all) {
      query = query.eq('user_id', req.userId!);
    }

    const { data } = await query;
    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
