import { Router } from 'express';
import {
  getUnreadCount,
  listNotifications,
  markAllRead,
  markRead,
  ensurePreferences,
  updatePreferences,
} from '../services/notifications/service.js';
import type { AuthRequest } from '../middleware/auth.js';
import { reqParam } from '../lib/helpers.js';

const router = Router();

router.get('/', async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const offset = Number(req.query.offset) || 0;
    const notifications = await listNotifications(req.userId!, limit, offset);
    const unread_count = await getUnreadCount(req.userId!);
    res.json({ notifications, unread_count });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/unread-count', async (req: AuthRequest, res) => {
  try {
    const count = await getUnreadCount(req.userId!);
    res.json({ unread_count: count });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/mark-all-read', async (req: AuthRequest, res) => {
  try {
    await markAllRead(req.userId!);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/:id/read', async (req: AuthRequest, res) => {
  try {
    await markRead(req.userId!, reqParam(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/preferences', async (req: AuthRequest, res) => {
  try {
    const prefs = await ensurePreferences(req.userId!);
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/preferences', async (req: AuthRequest, res) => {
  try {
    const {
      deadline_approaching,
      vouch_needed,
      quest_missed,
      submission_resolved,
    } = req.body;
    const updates: Record<string, boolean> = {};
    if (deadline_approaching !== undefined) updates.deadline_approaching = deadline_approaching;
    if (vouch_needed !== undefined) updates.vouch_needed = vouch_needed;
    if (quest_missed !== undefined) updates.quest_missed = quest_missed;
    if (submission_resolved !== undefined) updates.submission_resolved = submission_resolved;

    const prefs = await updatePreferences(req.userId!, updates);
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
