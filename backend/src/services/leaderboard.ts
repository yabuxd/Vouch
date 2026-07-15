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

function getWeekStartDate(weekOffset = 0): Date {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekStart(): string {
  return getWeekStartDate(0).toISOString();
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type WeekMetrics = { points: number; completions: number };

function aggregateWeekLogs(
  logs: Array<{ points: number; created_at: string }>,
  start: Date,
  end: Date
): WeekMetrics {
  let points = 0;
  let completions = 0;
  for (const log of logs) {
    const at = new Date(log.created_at);
    if (at >= start && at < end) {
      points += log.points;
      completions += 1;
    }
  }
  return { points, completions };
}

function findBestDayThisWeek(
  logs: Array<{ created_at: string }>,
  start: Date,
  end: Date
): { date: string; label: string; count: number } | null {
  const counts: Record<string, number> = {};
  for (const log of logs) {
    const at = new Date(log.created_at);
    if (at >= start && at < end) {
      const key = log.created_at.slice(0, 10);
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }

  let best: { date: string; label: string; count: number } | null = null;
  for (const [date, count] of Object.entries(counts)) {
    if (!best || count > best.count) {
      const dayIndex = new Date(`${date}T12:00:00`).getDay();
      best = { date, label: DAY_NAMES[dayIndex], count };
    }
  }
  return best;
}

function buildWeeklyInsights(
  thisWeek: WeekMetrics,
  lastWeek: WeekMetrics,
  streak: number,
  bestDay: { date: string; label: string; count: number } | null
): string[] {
  const insights: string[] = [];

  if (lastWeek.points > 0) {
    const pct = Math.round(((thisWeek.points - lastWeek.points) / lastWeek.points) * 100);
    if (pct > 0) insights.push(`Up ${pct}% on points vs last week`);
    else if (pct < 0) insights.push(`Down ${Math.abs(pct)}% on points vs last week`);
    else insights.push('Same points pace as last week');
  } else if (thisWeek.points > 0) {
    insights.push(`${thisWeek.points} pts this week — off to a strong start`);
  }

  if (thisWeek.completions > 0) {
    insights.push(
      `${thisWeek.completions} quest${thisWeek.completions === 1 ? '' : 's'} vouched this week`
    );
  }

  if (streak > 0) {
    insights.push(`${streak}-day streak active`);
  } else if (insights.length < 3) {
    insights.push('No active streak — vouch a daily quest to start one');
  }

  if (bestDay && insights.length < 3) {
    insights.push(
      `Best day: ${bestDay.label} (${bestDay.count} vouch${bestDay.count === 1 ? '' : 'es'})`
    );
  }

  return insights.slice(0, 3);
}

export async function getWeeklyAnalysis(groupId: string, userId: string) {
  const thisWeekStart = getWeekStartDate(0);
  const lastWeekStart = getWeekStartDate(-1);
  const nextWeekStart = getWeekStartDate(1);

  const { data: member } = await supabase
    .from('group_members')
    .select('current_streak')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  const { data: logs } = await supabase
    .from('points_log')
    .select('points, created_at')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .gte('created_at', lastWeekStart.toISOString());

  const allLogs = logs ?? [];
  const thisWeek = aggregateWeekLogs(allLogs, thisWeekStart, nextWeekStart);
  const lastWeek = aggregateWeekLogs(allLogs, lastWeekStart, thisWeekStart);
  const streak = member?.current_streak ?? 0;
  const bestDay = findBestDayThisWeek(allLogs, thisWeekStart, nextWeekStart);

  const pointsChangePct =
    lastWeek.points > 0
      ? Math.round(((thisWeek.points - lastWeek.points) / lastWeek.points) * 100)
      : null;

  return {
    this_week: thisWeek,
    last_week: lastWeek,
    streak,
    points_change_pct: pointsChangePct,
    completions_change: thisWeek.completions - lastWeek.completions,
    best_day: bestDay,
    insights: buildWeeklyInsights(thisWeek, lastWeek, streak, bestDay),
  };
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

export async function getActivityHeatmap(groupId: string, userId: string) {
  const daysBack = 84;
  const since = new Date();
  since.setDate(since.getDate() - daysBack + 1);
  since.setHours(0, 0, 0, 0);

  const { data: logs } = await supabase
    .from('points_log')
    .select('created_at')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());

  const days: Record<string, number> = {};
  for (const log of logs ?? []) {
    const key = log.created_at.slice(0, 10);
    days[key] = (days[key] ?? 0) + 1;
  }

  return { days };
}
