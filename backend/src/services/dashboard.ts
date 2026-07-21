import { supabase } from '../lib/supabase.js';

export async function getGroupDashboard(groupId: string, userId: string) {
  const { data: myAssignments } = await supabase
    .from('goal_assignments')
    .select('*, goals(*)')
    .eq('user_id', userId)
    .in('status', ['pending', 'submitted'])
    .order('due_date', { ascending: true });

  const relevant = (myAssignments ?? []).filter((a) => {
    const goal = a.goals as { group_id: string } | null;
    return goal?.group_id === groupId;
  });

  const { data: pendingSubs } = await supabase
    .from('submissions')
    .select('id, user_id, goal_assignments!inner(goal_id, goals!inner(group_id))')
    .eq('status', 'pending')
    .neq('user_id', userId);

  const pendingApprovals = (pendingSubs ?? []).filter((s) => {
    const ga = s.goal_assignments as unknown as { goals: { group_id: string } };
    return ga?.goals?.group_id === groupId;
  }).length;

  return {
    pending_assignments: relevant,
    pending_approvals_count: pendingApprovals,
  };
}
