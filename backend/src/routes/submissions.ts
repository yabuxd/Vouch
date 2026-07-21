import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabase.js';
import { getGroupIdFromAssignment, isGroupMember, reqParam } from '../lib/helpers.js';
import { uploadProof, getSignedUrl } from '../services/storage.js';
import type { AuthRequest } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.post('/assignments/:id/submit', upload.single('screenshot'), async (req: AuthRequest, res) => {
  try {
    const assignmentId = reqParam(req.params.id);
    const { note } = req.body;

    const { data: assignment } = await supabase
      .from('goal_assignments')
      .select('*, goals(group_id)')
      .eq('id', assignmentId)
      .single();

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    if (assignment.user_id !== req.userId) {
      res.status(403).json({ error: 'Not your assignment' });
      return;
    }

    if (!['pending', 'rejected'].includes(assignment.status)) {
      res.status(400).json({ error: 'Assignment already submitted or approved' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'Screenshot is required' });
      return;
    }

    const goals = assignment.goals as { group_id: string };
    const path = await uploadProof(goals.group_id, req.userId!, req.file);

    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({
        goal_assignment_id: assignmentId,
        user_id: req.userId,
        screenshot_url: path,
        note: note?.trim() || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    await supabase
      .from('goal_assignments')
      .update({ status: 'submitted' })
      .eq('id', assignmentId);

    const signedUrl = await getSignedUrl(path);
    res.status(201).json({ ...submission, screenshot_signed_url: signedUrl });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/groups/:id/submissions/pending', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);
    if (!(await isGroupMember(groupId, req.userId!))) {
      res.status(403).json({ error: 'Not a group member' });
      return;
    }

    const { data: group } = await supabase
      .from('groups')
      .select('approval_threshold')
      .eq('id', groupId)
      .single();

    const threshold = group?.approval_threshold ?? 2;

    const { data: submissions } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles(id, name, avatar_url),
        goal_assignments(goal_id, goals(title, group_id, points_value)),
        approvals(decision, approver_id)
      `)
      .eq('status', 'pending')
      .neq('user_id', req.userId!)
      .order('submitted_at', { ascending: false });

    const filtered = [];
    for (const sub of submissions ?? []) {
      const ga = sub.goal_assignments as { goals: { group_id: string; title: string } } | null;
      if (ga?.goals?.group_id !== groupId) continue;

      const alreadyVoted = (sub.approvals as Array<{ approver_id: string; decision: string }> ?? []).some(
        (a) => a.approver_id === req.userId
      );

      const votes = sub.approvals as Array<{ decision: string }> ?? [];
      const approval_count = votes.filter((v) => v.decision === 'approve').length;
      const rejection_count = votes.filter((v) => v.decision === 'reject').length;

      const signedUrl = await getSignedUrl(sub.screenshot_url);
      filtered.push({
        ...sub,
        screenshot_signed_url: signedUrl,
        already_voted: alreadyVoted,
        approval_count,
        rejection_count,
        approval_threshold: threshold,
      });
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/groups/:id/submissions/history', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);
    if (!(await isGroupMember(groupId, req.userId!))) {
      res.status(403).json({ error: 'Not a group member' });
      return;
    }

    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const { data: submissions } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles(id, name, avatar_url),
        goal_assignments(goal_id, due_date, goals(title, group_id, points_value)),
        approvals(decision, profiles(name))
      `)
      .in('status', ['approved', 'rejected'])
      .order('submitted_at', { ascending: false })
      .limit(limit * 3);

    const filtered = [];
    for (const sub of submissions ?? []) {
      const ga = sub.goal_assignments as { goals: { group_id: string } } | null;
      if (ga?.goals?.group_id !== groupId) continue;
      const signedUrl = await getSignedUrl(sub.screenshot_url);
      filtered.push({ ...sub, screenshot_signed_url: signedUrl });
      if (filtered.length >= limit) break;
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/groups/:id/submissions/mine', async (req: AuthRequest, res) => {
  try {
    const groupId = reqParam(req.params.id);
    if (!(await isGroupMember(groupId, req.userId!))) {
      res.status(403).json({ error: 'Not a group member' });
      return;
    }

    const { data: submissions } = await supabase
      .from('submissions')
      .select(`
        *,
        goal_assignments(goal_id, due_date, goals(title, group_id)),
        approvals(decision, profiles(name))
      `)
      .eq('user_id', req.userId!)
      .order('submitted_at', { ascending: false });

    const filtered = [];
    for (const sub of submissions ?? []) {
      const ga = sub.goal_assignments as { goals: { group_id: string } } | null;
      if (ga?.goals?.group_id !== groupId) continue;
      const signedUrl = await getSignedUrl(sub.screenshot_url);
      filtered.push({ ...sub, screenshot_signed_url: signedUrl });
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
