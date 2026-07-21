import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import type { AuthRequest } from '../middleware/auth.js';

const VALID_REASONS = ['inappropriate', 'spam', 'harassment', 'other'] as const;
const VALID_TARGETS = ['submission', 'comment', 'user'] as const;

const router = Router();

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { target_type, target_id, reason, details } = req.body;

    if (!VALID_TARGETS.includes(target_type)) {
      res.status(400).json({ error: 'Invalid target_type' });
      return;
    }
    if (!VALID_REASONS.includes(reason)) {
      res.status(400).json({ error: 'Invalid reason' });
      return;
    }
    if (!target_id) {
      res.status(400).json({ error: 'target_id is required' });
      return;
    }

    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: req.userId,
        target_type,
        target_id,
        reason,
        details: details?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    const adminEmail = process.env.ADMIN_ALERT_EMAIL;
    if (adminEmail) {
      console.info('[report alert]', {
        to: adminEmail,
        report_id: data.id,
        target_type,
        target_id,
        reason,
        reporter_id: req.userId,
      });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
