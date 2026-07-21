import { supabase } from '../lib/supabase.js';
import { notifySubmissionResolved } from './notifications/generators.js';

export async function processVote(
  submissionId: string,
  approverId: string,
  decision: 'approve' | 'reject',
  comment?: string
) {
  const { data: submission, error: subErr } = await supabase
    .from('submissions')
    .select('*, goal_assignments(goal_id, goals(group_id, frequency))')
    .eq('id', submissionId)
    .single();

  if (subErr || !submission) throw new Error('Submission not found');
  if (submission.status !== 'pending') throw new Error('Submission already resolved');
  if (submission.user_id === approverId) throw new Error('Cannot vote on your own submission');

  const { data: existing } = await supabase
    .from('approvals')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('approver_id', approverId)
    .maybeSingle();

  if (existing) throw new Error('Already voted');

  const { error: voteErr } = await supabase.from('approvals').insert({
    submission_id: submissionId,
    approver_id: approverId,
    decision,
    comment: comment ?? null,
  });

  if (voteErr) throw new Error(voteErr.message);

  const ga = submission.goal_assignments as unknown as {
    goal_id: string;
    goals: { group_id: string; frequency: string };
  };
  const groupId = ga.goals.group_id;

  const { data: group } = await supabase
    .from('groups')
    .select('approval_threshold')
    .eq('id', groupId)
    .single();

  const threshold = group?.approval_threshold ?? 2;

  const { data: votes } = await supabase
    .from('approvals')
    .select('decision')
    .eq('submission_id', submissionId);

  const approvals = (votes ?? []).filter((v) => v.decision === 'approve').length;
  const rejections = (votes ?? []).filter((v) => v.decision === 'reject').length;

  if (approvals >= threshold) {
    await finalizeApproval(submission);
    await sendResolvedNotification(submission, groupId, true);
    return { approvals, rejections, threshold, resolved: true, approved: true };
  }

  if (rejections >= threshold) {
    await supabase.from('submissions').update({ status: 'rejected' }).eq('id', submissionId);
    await supabase
      .from('goal_assignments')
      .update({ status: 'rejected' })
      .eq('id', submission.goal_assignment_id);
    await sendResolvedNotification(submission, groupId, false);
    return { approvals, rejections, threshold, resolved: true, approved: false };
  }

  return { approvals, rejections, threshold, resolved: false };
}

async function finalizeApproval(submission: {
  id: string;
  goal_assignment_id: string;
}) {
  await supabase.from('submissions').update({ status: 'approved' }).eq('id', submission.id);
  await supabase
    .from('goal_assignments')
    .update({ status: 'approved' })
    .eq('id', submission.goal_assignment_id);
}

async function sendResolvedNotification(
  submission: { id: string; user_id: string; goal_assignment_id: string },
  groupId: string,
  approved: boolean
) {
  const { data: ga } = await supabase
    .from('goal_assignments')
    .select('goals(title, groups(name))')
    .eq('id', submission.goal_assignment_id)
    .single();

  const goals = ga?.goals as { title: string; groups: { name: string } } | undefined;
  await notifySubmissionResolved(
    submission.user_id,
    submission.id,
    approved,
    goals?.title ?? 'Quest',
    groupId,
    goals?.groups?.name ?? 'Crew'
  ).catch((err) => console.error('submission_resolved notification failed', err));
}
