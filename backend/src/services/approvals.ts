import { supabase } from '../lib/supabase.js';

export async function processVote(
  submissionId: string,
  approverId: string,
  decision: 'approve' | 'reject',
  comment?: string
) {
  const { data: submission, error: subErr } = await supabase
    .from('submissions')
    .select('*, goal_assignments(goal_id, goals(group_id, points_value, frequency))')
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
    goals: { group_id: string; points_value: number; frequency: string };
  };
  const groupId = ga.goals.group_id;

  const { data: group } = await supabase
    .from('groups')
    .select('approval_threshold')
    .eq('id', groupId)
    .single();

  const threshold = Math.max(1, group?.approval_threshold ?? 2);

  const { data: votes } = await supabase
    .from('approvals')
    .select('decision')
    .eq('submission_id', submissionId);

  const approvals = (votes ?? []).filter((v) => v.decision === 'approve').length;
  const rejections = (votes ?? []).filter((v) => v.decision === 'reject').length;

  if (approvals >= threshold) {
    const result = await finalizeApproval(submission, groupId, ga.goals.points_value, ga.goals.frequency);
    return { approvals, rejections, threshold, resolved: result.claimed, approved: true, ...result };
  } else if (rejections >= threshold) {
    const { data: rejected } = await supabase
      .from('submissions')
      .update({ status: 'rejected' })
      .eq('id', submissionId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (rejected) {
      await supabase
        .from('goal_assignments')
        .update({ status: 'rejected' })
        .eq('id', submission.goal_assignment_id);
    }

    return { approvals, rejections, threshold, resolved: true, approved: false };
  }

  return { approvals, rejections, threshold, resolved: false };
}

async function finalizeApproval(
  submission: { id: string; user_id: string; goal_assignment_id: string },
  groupId: string,
  pointsValue: number,
  frequency: string
) {
  // Claim the submission atomically — only one concurrent finalizer wins
  const { data: claimed } = await supabase
    .from('submissions')
    .update({ status: 'approved' })
    .eq('id', submission.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (!claimed) {
    return { claimed: false, points_awarded: 0 };
  }

  await supabase
    .from('goal_assignments')
    .update({ status: 'approved' })
    .eq('id', submission.goal_assignment_id);

  const { data: member } = await supabase
    .from('group_members')
    .select('points, current_streak')
    .eq('group_id', groupId)
    .eq('user_id', submission.user_id)
    .single();

  const newPoints = (member?.points ?? 0) + pointsValue;
  const newStreak = frequency === 'daily' ? (member?.current_streak ?? 0) + 1 : (member?.current_streak ?? 0);

  await supabase
    .from('group_members')
    .update({ points: newPoints, current_streak: newStreak })
    .eq('group_id', groupId)
    .eq('user_id', submission.user_id);

  await supabase.from('points_log').insert({
    user_id: submission.user_id,
    group_id: groupId,
    submission_id: submission.id,
    points: pointsValue,
  });

  return { claimed: true, points_awarded: pointsValue, new_points: newPoints, new_streak: newStreak };
}
