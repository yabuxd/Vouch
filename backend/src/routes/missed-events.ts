import { Router } from 'express';
import { isGroupMember, reqParam } from '../lib/helpers.js';
import { getMissedFeed, toggleMissedReaction } from '../services/missed-events.js';
import type { AuthRequest } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const groupRouter = Router({ mergeParams: true });
const eventRouter = Router();

groupRouter.get('/missed-feed', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);
    if (!(await isGroupMember(groupId, req.userId!))) {
      res.status(403).json({ error: 'Not a group member' });
      return;
    }

    const limit = Math.min(parseInt(String(req.query.limit ?? '20'), 10) || 20, 50);
    const offset = parseInt(String(req.query.offset ?? '0'), 10) || 0;

    const feed = await getMissedFeed(groupId, req.userId!, limit, offset);
    res.json(feed);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

eventRouter.post('/:id/react', async (req: AuthRequest, res) => {
  try {
    const missedEventId = reqParam(req.params.id);
    const { emoji } = req.body;

    const { data: event } = await supabase
      .from('missed_events')
      .select('group_id')
      .eq('id', missedEventId)
      .single();

    if (!event || !(await isGroupMember(event.group_id, req.userId!))) {
      res.status(403).json({ error: 'Not a group member' });
      return;
    }

    const result = await toggleMissedReaction(missedEventId, req.userId!, emoji);
    res.json(result);
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes('Invalid') || msg.includes('not found') ? 400 : 500;
    res.status(status).json({ error: msg });
  }
});

export { groupRouter as missedFeedRouter, eventRouter as missedEventRouter };
