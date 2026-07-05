import { supabase } from '../lib/supabase.js';

export async function getLeaderboard(groupId: string) {
  const { data: group } = await supabase
    .from('groups')
    .select('weekly_reset_enabled')
    .eq('id', groupId)
    .single();

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, points, current_streak, role, profiles(id, name, avatar_url)')
    .eq('group_id', groupId);

  if (!members) return [];

  if (group?.weekly_reset_enabled) {
    const weekStart = getWeekStart();
    const enriched = await Promise.all(
      members.map(async (m) => {
        const { data: logs } = await supabase
          .from('points_log')
          .select('points')
          .eq('group_id', groupId)
          .eq('user_id', m.user_id)
          .gte('created_at', weekStart);

        const weeklyPoints = (logs ?? []).reduce((sum, l) => sum + l.points, 0);
        return { ...m, points: weeklyPoints };
      })
    );
    return rankMembers(enriched);
  }

  return rankMembers(members);
}

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function rankMembers(
  members: Array<{
    user_id: string;
    points: number;
    current_streak: number;
    role: string;
    profiles: unknown;
  }>
) {
  const sorted = [...members].sort((a, b) => b.points - a.points);
  return sorted.map((m, i) => ({
    rank: i + 1,
    user_id: m.user_id,
    points: m.points,
    current_streak: m.current_streak,
    role: m.role,
    profile: m.profiles,
  }));
}

export async function getGroupDashboard(groupId: string, userId: string) {
  const leaderboard = await getLeaderboard(groupId);
  const myRank = leaderboard.find((e) => e.user_id === userId);

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
    my_rank: myRank?.rank ?? null,
    my_points: myRank?.points ?? 0,
    my_streak: myRank?.current_streak ?? 0,
    pending_assignments: relevant,
    pending_approvals_count: pendingApprovals,
  };
}
