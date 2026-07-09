import { supabase } from '../lib/supabase.js';
import type { Goal } from '../lib/supabase.js';

function endOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export async function getGoalUserIds(goal: Goal): Promise<string[]> {
  if (goal.type === 'individual') {
    return [goal.created_by];
  }
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', goal.group_id);
  return (members ?? []).map((m) => m.user_id);
}

export async function generateAssignmentsForGoal(goal: Goal): Promise<void> {
  const userIds = await getGoalUserIds(goal);
  let dueDate: string;

  switch (goal.frequency) {
    case 'daily':
      dueDate = today();
      break;
    case 'weekly':
      dueDate = endOfWeek(new Date());
      break;
    case 'one_time':
      dueDate = goal.due_date ?? today();
      break;
    default:
      return;
  }

  const rows = userIds.map((userId) => ({
    goal_id: goal.id,
    user_id: userId,
    due_date: dueDate,
    status: 'pending' as const,
  }));

  const { error } = await supabase.from('goal_assignments').insert(rows);
  if (error) throw new Error(error.message);
}

export async function generateDailyAssignments(): Promise<number> {
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('is_active', true)
    .in('frequency', ['daily', 'weekly']);

  if (!goals?.length) return 0;

  let created = 0;
  const todayStr = today();

  for (const goal of goals) {
    const userIds = await getGoalUserIds(goal as Goal);
    let dueDate: string;

    if (goal.frequency === 'daily') {
      dueDate = todayStr;
    } else {
      dueDate = endOfWeek(new Date());
    }

    for (const userId of userIds) {
      const { data: existing } = await supabase
        .from('goal_assignments')
        .select('id')
        .eq('goal_id', goal.id)
        .eq('user_id', userId)
        .eq('due_date', dueDate)
        .maybeSingle();

      if (!existing) {
        await supabase.from('goal_assignments').insert({
          goal_id: goal.id,
          user_id: userId,
          due_date: dueDate,
          status: 'pending',
        });
        created++;
      }
    }
  }

  return created;
}

export async function resetMissedStreaks(): Promise<number> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const { data: missed } = await supabase
    .from('goal_assignments')
    .select('id, user_id, goal_id, goals!inner(group_id, frequency, is_active)')
    .eq('due_date', yesterdayStr)
    .neq('status', 'approved');

  if (!missed?.length) return 0;

  let eventsCreated = 0;

  for (const assignment of missed) {
    const goal = assignment.goals as unknown as {
      group_id: string;
      frequency: string;
      is_active: boolean;
    };

    if (!goal.is_active || !['daily', 'weekly'].includes(goal.frequency)) continue;

    const { data: membership } = await supabase
      .from('group_members')
      .select('current_streak')
      .eq('user_id', assignment.user_id)
      .eq('group_id', goal.group_id)
      .single();

    const streakBefore = membership?.current_streak ?? 0;

    const { error: insertError } = await supabase.from('missed_events').insert({
      group_id: goal.group_id,
      member_id: assignment.user_id,
      goal_id: assignment.goal_id,
      goal_assignment_id: assignment.id,
      streak_before: streakBefore,
    });

    if (!insertError) eventsCreated++;

    await supabase
      .from('group_members')
      .update({ current_streak: 0 })
      .eq('user_id', assignment.user_id)
      .eq('group_id', goal.group_id);
  }

  return eventsCreated;
}
