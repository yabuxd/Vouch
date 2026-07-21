import { supabase } from '../lib/supabase.js';
import { getSignedUrl } from './storage.js';

export async function getGroupDashboard(groupId: string, userId: string) {
  const { data: myAssignments } = await supabase
    .from('goal_assignments')
    .select('*, goals(*)')
    .eq('user_id', userId)
    .in('status', ['pending', 'submitted'])
    .order('due_date', { ascending: true });

  const pendingAssignments = (myAssignments ?? []).filter((a) => {
    const goal = a.goals as { group_id: string } | null;
    return goal?.group_id === groupId;
  });

  const { data: pendingSubs } = await supabase
    .from('submissions')
    .select('id, user_id, goal_assignments!inner(goal_id, goals!inner(group_id))')
    .eq('status', 'pending')
    .neq('user_id', userId);

  const pendingApprovalsCount = (pendingSubs ?? []).filter((s) => {
    const ga = s.goal_assignments as unknown as { goals: { group_id: string } };
    return ga?.goals?.group_id === groupId;
  }).length;

  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id,
      status,
      note,
      submitted_at,
      screenshot_url,
      capture_date_flag,
      capture_date_note,
      goal_assignments(goal_id, due_date, goals(title, group_id))
    `)
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(50);

  const completionHistory = [];
  for (const sub of submissions ?? []) {
    const ga = sub.goal_assignments as unknown as {
      due_date: string;
      goals: { title: string; group_id: string };
    } | null;
    if (ga?.goals?.group_id !== groupId) continue;

    const signedUrl = await getSignedUrl(sub.screenshot_url);
    completionHistory.push({
      id: sub.id,
      assignment_title: ga.goals.title,
      due_date: ga.due_date,
      status: sub.status,
      note: sub.note,
      submitted_at: sub.submitted_at,
      screenshot_signed_url: signedUrl,
      capture_date_flag: sub.capture_date_flag,
      capture_date_note: sub.capture_date_note,
    });
  }

  return {
    pending_assignments: pendingAssignments,
    pending_approvals_count: pendingApprovalsCount,
    completion_history: completionHistory,
  };
}
