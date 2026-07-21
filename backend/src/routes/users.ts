import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { getUserInsights } from '../services/insights.js';
import { isValidTimezone } from '../lib/timezone.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/me/insights', async (req: AuthRequest, res) => {
  try {
    const insights = await getUserInsights(req.userId!);
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/me', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, timezone, created_at')
      .eq('id', req.userId!)
      .single();

    if (error) throw new Error(error.message);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/me', async (req: AuthRequest, res) => {
  try {
    const { timezone, name } = req.body;
    const updates: Record<string, string> = {};

    if (timezone !== undefined) {
      if (!isValidTimezone(timezone)) {
        res.status(400).json({ error: 'Invalid timezone' });
        return;
      }
      updates.timezone = timezone;
    }
    if (name !== undefined) updates.name = name.trim();

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.userId!)
      .select('id, name, avatar_url, timezone')
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
