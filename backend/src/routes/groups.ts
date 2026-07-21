import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { generateInviteCode, isGroupMember, isGroupOwner, reqParam } from '../lib/helpers.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', inviteCode)
        .maybeSingle();
      if (!existing) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        invite_code: inviteCode,
        owner_id: req.userId,
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: req.userId,
      role: 'owner',
    });

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/join', async (req: AuthRequest, res) => {
  try {
    const { invite_code } = req.body;
    if (!invite_code?.trim()) {
      res.status(400).json({ error: 'Invite code is required' });
      return;
    }

    const { data: group, error } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', invite_code.trim().toUpperCase())
      .single();

    if (error || !group) {
      res.status(404).json({ error: 'Invalid invite code' });
      return;
    }

    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (existing) {
      res.json({ group, already_member: true });
      return;
    }

    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: req.userId,
      role: 'member',
    });

    res.json({ group, already_member: false });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id, role, points, current_streak, groups(*)')
      .eq('user_id', req.userId);

    const groups = (memberships ?? []).map((m) => ({
      ...(m.groups as object),
      my_role: m.role,
      my_points: m.points,
      my_streak: m.current_streak,
    }));

    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);
    if (!(await isGroupMember(groupId, req.userId!))) {
      res.status(403).json({ error: 'Not a group member' });
      return;
    }

    const { data: group } = await supabase.from('groups').select('*').eq('id', groupId).single();
    const { data: members } = await supabase
      .from('group_members')
      .select('*, profiles(id, name, avatar_url)')
      .eq('group_id', groupId);

    const myMembership = members?.find((m) => m.user_id === req.userId);

    res.json({
      ...group,
      members,
      my_role: myMembership?.role,
      my_points: myMembership?.points ?? 0,
      my_streak: myMembership?.current_streak ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);
    if (!(await isGroupOwner(groupId, req.userId!))) {
      res.status(403).json({ error: 'Owner only' });
      return;
    }

    const { name, description, approval_threshold, weekly_reset_enabled, is_discoverable, category } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (approval_threshold !== undefined) updates.approval_threshold = approval_threshold;
    if (weekly_reset_enabled !== undefined) updates.weekly_reset_enabled = weekly_reset_enabled;
    if (is_discoverable !== undefined) updates.is_discoverable = is_discoverable;
    if (category !== undefined) updates.category = category;

    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', groupId)
      .select()
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
