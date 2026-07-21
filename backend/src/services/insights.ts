import { supabase } from '../lib/supabase.js';

export async function getUserInsights(userId: string) {
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since90 = new Date();
  since90.setDate(since90.getDate() - 90);

  const { data: assignments } = await supabase
    .from('goal_assignments')
    .select('id, status, due_date, goals(title, frequency)')
    .eq('user_id', userId)
    .gte('due_date', since90.toISOString().split('T')[0]);

  const all = assignments ?? [];

  const rateForWindow = (since: Date) => {
    const window = all.filter((a) => new Date(a.due_date) >= since);
    const total = window.length;
    const completed = window.filter((a) => a.status === 'approved').length;
    return total ? Math.round((completed / total) * 100) : 0;
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const byDay: Record<string, { total: number; missed: number }> = {};
  for (const name of dayNames) byDay[name] = { total: 0, missed: 0 };

  for (const a of all) {
    const day = dayNames[new Date(`${a.due_date}T12:00:00`).getDay()];
    byDay[day].total++;
    if (a.status !== 'approved') byDay[day].missed++;
  }

  const dayOfWeek = dayNames.map((day) => ({
    day,
    total: byDay[day].total,
    missed: byDay[day].missed,
    miss_rate: byDay[day].total
      ? Math.round((byDay[day].missed / byDay[day].total) * 100)
      : 0,
  }));

  const questMap = new Map<string, { title: string; total: number; completed: number }>();
  for (const a of all) {
    const goal = a.goals as unknown as { title: string } | null;
    const title = goal?.title ?? 'Unknown';
    const entry = questMap.get(title) ?? { title, total: 0, completed: 0 };
    entry.total++;
    if (a.status === 'approved') entry.completed++;
    questMap.set(title, entry);
  }

  const perQuest = [...questMap.values()]
    .map((q) => ({
      ...q,
      completion_rate: q.total ? Math.round((q.completed / q.total) * 100) : 0,
    }))
    .sort((a, b) => b.completion_rate - a.completion_rate);

  return {
    completion_rate_30d: rateForWindow(since30),
    completion_rate_90d: rateForWindow(since90),
    day_of_week: dayOfWeek,
    per_quest: perQuest,
  };
}
