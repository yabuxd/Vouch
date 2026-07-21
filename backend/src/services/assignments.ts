import { supabase } from '../lib/supabase.js';
import type { Goal } from '../lib/supabase.js';
import { endOfWeekLocal, todayLocal, yesterdayLocal } from '../lib/timezone.js';
import { notifyCrewOfMissedQuests } from './notifications/generators.js';

async function getUserTimezones(userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!userIds.length) return map;

  const { data } = await supabase
    .from('profiles')
    .select('id, timezone')
    .in('id', userIds);

  for (const p of data ?? []) {
    map.set(p.id, p.timezone ?? 'UTC');
  }
  for (const id of userIds) {
    if (!map.has(id)) map.set(id, 'UTC');
  }
  return map;
}

function dueDateForUser(goal: Goal, timezone: string): string {
  switch (goal.frequency) {
    case 'daily':
      return todayLocal(timezone);
    case 'weekly':
      return endOfWeekLocal(timezone);
    case 'one_time':
      return goal.due_date ?? todayLocal(timezone);
    default:
      return todayLocal(timezone);
  }
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
  if (!userIds.length) return;

  const timezones = await getUserTimezones(userIds);
  const rows = userIds.map((userId) => ({
    goal_id: goal.id,
    user_id: userId,
    due_date: dueDateForUser(goal, timezones.get(userId) ?? 'UTC'),
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

  for (const goal of goals) {
    const userIds = await getGoalUserIds(goal as Goal);
    const timezones = await getUserTimezones(userIds);

    for (const userId of userIds) {
      const tz = timezones.get(userId) ?? 'UTC';
      const dueDate = dueDateForUser(goal as Goal, tz);

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

export async function processMissedAssignments(): Promise<number> {
  const { data: candidates } = await supabase
    .from('goal_assignments')
    .select('id, user_id, goal_id, due_date, goals!inner(group_id, frequency, is_active)')
    .neq('status', 'approved');

  if (!candidates?.length) return 0;

  const userIds = [...new Set(candidates.map((a) => a.user_id))];
  const timezones = await getUserTimezones(userIds);

  const missed = candidates.filter((assignment) => {
    const goal = assignment.goals as unknown as { frequency: string; is_active: boolean };
    if (!goal.is_active || !['daily', 'weekly'].includes(goal.frequency)) return false;
    const tz = timezones.get(assignment.user_id) ?? 'UTC';
    return assignment.due_date === yesterdayLocal(tz);
  });

  if (!missed.length) return 0;

  const missesByGroup = new Map<
    string,
    { groupName: string; misses: Array<{ member_name: string; goal_title: string; goal_assignment_id: string }> }
  >();

  for (const assignment of missed) {
    const goal = assignment.goals as unknown as {
      group_id: string;
      frequency: string;
      is_active: boolean;
    };

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', assignment.user_id)
      .single();

    const { data: goalRow } = await supabase
      .from('goals')
      .select('title')
      .eq('id', assignment.goal_id)
      .single();

    const { data: groupRow } = await supabase
      .from('groups')
      .select('name')
      .eq('id', goal.group_id)
      .single();

    const bucket = missesByGroup.get(goal.group_id) ?? {
      groupName: groupRow?.name ?? 'Crew',
      misses: [] as Array<{ member_name: string; goal_title: string; goal_assignment_id: string }>,
    };
    bucket.misses.push({
      member_name: profile?.name ?? 'Member',
      goal_title: goalRow?.title ?? 'Quest',
      goal_assignment_id: assignment.id,
    });
    missesByGroup.set(goal.group_id, bucket);
  }

  for (const [groupId, { groupName, misses }] of missesByGroup) {
    await notifyCrewOfMissedQuests(groupId, groupName, misses).catch((err) =>
      console.error('quest_missed notification failed', err)
    );
  }

  return missed.length;
}
