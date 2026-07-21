import { supabase } from '../lib/supabase.js';

export async function processVote(
  submissionId: string,
  approverId: string,
  decision: 'approve' | 'reject',
  comment?: string
) {
  const { data: submission, error: subErr } = await supabase
    .from('submissions')
    .select('*, goal_assignments(goal_id, goals(group_id))')
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
    goals: { group_id: string };
  };
  const groupId = ga.goals.group_id;

  const { data: group } = await supabase
    .from('groups')
    .select('approval_threshold')
    .eq('id', groupId)
    .single();

  const threshold = group?.approval_threshold ?? 2;

  const { data: result, error: resolveErr } = await supabase.rpc('resolve_submission_if_quorum', {
    p_submission_id: submissionId,
    p_threshold: threshold,
  });

  if (resolveErr) throw new Error(resolveErr.message);

  const resolved = result as {
    resolved: boolean;
    approved?: boolean;
    failed?: boolean;
    already_resolved?: boolean;
    approvals: number;
    rejections: number;
    threshold: number;
  };

  return {
    approvals: resolved.approvals,
    rejections: resolved.rejections,
    threshold: resolved.threshold ?? threshold,
    resolved: resolved.resolved,
    approved: resolved.approved,
    failed: resolved.failed,
  };
}
