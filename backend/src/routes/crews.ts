import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { isGroupOwner, reqParam } from '../lib/helpers.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/discover', async (req: AuthRequest, res) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;

    const { data: myGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', req.userId!);

    const excludeIds = (myGroups ?? []).map((m) => m.group_id);

    let query = supabase
      .from('groups')
      .select('id, name, description, category')
      .eq('is_discoverable', true);

    if (category) query = query.eq('category', category);

    const { data: groups, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    const filtered = (groups ?? []).filter((g) => !excludeIds.includes(g.id));

    const enriched = await Promise.all(
      filtered.map(async (g) => {
        const { count } = await supabase
          .from('group_members')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', g.id);

        const { data: pending } = await supabase
          .from('crew_join_requests')
          .select('status')
          .eq('group_id', g.id)
          .eq('user_id', req.userId!)
          .maybeSingle();

        return {
          ...g,
          member_count: count ?? 0,
          my_join_request: pending?.status ?? null,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/:id/request-join', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);

    const { data: group } = await supabase
      .from('groups')
      .select('id, is_discoverable')
      .eq('id', groupId)
      .single();

    if (!group?.is_discoverable) {
      res.status(400).json({ error: 'This crew is not open for discovery requests' });
      return;
    }

    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', req.userId!)
      .maybeSingle();

    if (existingMember) {
      res.status(400).json({ error: 'Already a member' });
      return;
    }

    const { data: request, error } = await supabase
      .from('crew_join_requests')
      .upsert(
        { group_id: groupId, user_id: req.userId!, status: 'pending' },
        { onConflict: 'group_id,user_id' }
      )
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/:id/join-requests', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);
    if (!(await isGroupOwner(groupId, req.userId!))) {
      res.status(403).json({ error: 'Owner only' });
      return;
    }

    const { data, error } = await supabase
      .from('crew_join_requests')
      .select('*, profiles(id, name, avatar_url)')
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/:id/join-requests/:requestId', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);
    const requestId = reqParam(req.params.requestId);
    const { action } = req.body as { action: 'approve' | 'deny' };

    if (!(await isGroupOwner(groupId, req.userId!))) {
      res.status(403).json({ error: 'Owner only' });
      return;
    }

    if (!['approve', 'deny'].includes(action)) {
      res.status(400).json({ error: 'action must be approve or deny' });
      return;
    }

    const { data: joinReq } = await supabase
      .from('crew_join_requests')
      .select('*')
      .eq('id', requestId)
      .eq('group_id', groupId)
      .single();

    if (!joinReq || joinReq.status !== 'pending') {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    const newStatus = action === 'approve' ? 'approved' : 'denied';
    await supabase
      .from('crew_join_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (action === 'approve') {
      await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: joinReq.user_id,
        role: 'member',
      });
    }

    res.json({ status: newStatus });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete('/:id/members/me', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);

    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', req.userId!)
      .single();

    if (!membership) {
      res.status(404).json({ error: 'Not a member' });
      return;
    }

    if (membership.role === 'owner') {
      const { count } = await supabase
        .from('group_members')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('role', 'owner');

      if ((count ?? 0) <= 1) {
        res.status(400).json({
          error: 'Transfer ownership before leaving — you are the sole owner',
        });
        return;
      }
    }

    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', req.userId!);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete('/:id/members/:userId', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);
    const targetUserId = reqParam(req.params.userId);

    if (!(await isGroupOwner(groupId, req.userId!))) {
      res.status(403).json({ error: 'Owner only' });
      return;
    }

    if (targetUserId === req.userId) {
      res.status(400).json({ error: 'Use leave crew to remove yourself' });
      return;
    }

    const { data: target } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!target) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    if (target.role === 'owner') {
      res.status(400).json({ error: 'Transfer ownership before removing an owner' });
      return;
    }

    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', targetUserId);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/:id/owner', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);
    const { new_owner_id } = req.body;

    if (!(await isGroupOwner(groupId, req.userId!))) {
      res.status(403).json({ error: 'Owner only' });
      return;
    }

    if (!new_owner_id || new_owner_id === req.userId) {
      res.status(400).json({ error: 'new_owner_id must be a different member' });
      return;
    }

    const { data: targetMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', new_owner_id)
      .maybeSingle();

    if (!targetMember) {
      res.status(400).json({ error: 'Target must be an existing member' });
      return;
    }

    await supabase
      .from('group_members')
      .update({ role: 'member' })
      .eq('group_id', groupId)
      .eq('user_id', req.userId!);

    await supabase
      .from('group_members')
      .update({ role: 'owner' })
      .eq('group_id', groupId)
      .eq('user_id', new_owner_id);

    await supabase.from('groups').update({ owner_id: new_owner_id }).eq('id', groupId);

    res.json({ ok: true, new_owner_id });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
