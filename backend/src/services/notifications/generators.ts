import { supabase } from '../../lib/supabase.js';
import { notifyUser, wasNotifiedRecently } from './service.js';

const DAILY_HOURS = Number(process.env.NOTIF_DEADLINE_DAILY_HOURS ?? 3);
const WEEKLY_HOURS = Number(process.env.NOTIF_DEADLINE_WEEKLY_HOURS ?? 24);
const VOUCH_COOLDOWN_HOURS = 12;

function endOfDueDateUtc(dueDate: string): Date {
  return new Date(`${dueDate}T23:59:59.000Z`);
}

function hoursUntil(date: Date): number {
  return (date.getTime() - Date.now()) / (60 * 60 * 1000);
}

export async function generateDeadlineApproachingNotifications(): Promise<number> {
  const { data: assignments } = await supabase
    .from('goal_assignments')
    .select(`
      id, user_id, due_date, status,
      goals(title, frequency, group_id, groups(name))
    `)
    .in('status', ['pending', 'submitted']);

  if (!assignments?.length) return 0;

  let sent = 0;

  for (const a of assignments) {
    const goal = a.goals as unknown as {
      title: string;
      frequency: string;
      group_id: string;
      groups: { name: string };
    } | null;
    if (!goal || !['daily', 'weekly'].includes(goal.frequency)) continue;

    const windowHours = goal.frequency === 'daily' ? DAILY_HOURS : WEEKLY_HOURS;
    const hoursLeft = hoursUntil(endOfDueDateUtc(a.due_date));
    if (hoursLeft < 0 || hoursLeft > windowHours) continue;

    const already = await wasNotifiedRecently(
      a.user_id,
      'deadline_approaching',
      'assignment_id',
      a.id,
      windowHours
    );
    if (already) continue;

    const ok = await notifyUser(a.user_id, 'deadline_approaching', {
      assignment_id: a.id,
      goal_title: goal.title,
      due_date: a.due_date,
      group_id: goal.group_id,
      group_name: goal.groups?.name ?? 'Crew',
      frequency: goal.frequency,
      hours_left: Math.round(hoursLeft),
    });
    if (ok) sent++;
  }

  return sent;
}

export async function generateVouchNeededNotifications(): Promise<number> {
  const { data: pending } = await supabase
    .from('submissions')
    .select(`
      id, user_id, submitted_at,
      goal_assignments(goals(group_id, title, groups(name))),
      approvals(approver_id)
    `)
    .eq('status', 'pending');

  if (!pending?.length) return 0;

  let sent = 0;

  for (const sub of pending) {
    const ga = sub.goal_assignments as unknown as {
      goals: { group_id: string; title: string; groups: { name: string } };
    } | null;
    if (!ga?.goals?.group_id) continue;

    const groupId = ga.goals.group_id;
    const voters = new Set(
      ((sub.approvals as Array<{ approver_id: string }>) ?? []).map((v) => v.approver_id)
    );

    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    for (const m of members ?? []) {
      if (m.user_id === sub.user_id || voters.has(m.user_id)) continue;

      const recently = await wasNotifiedRecently(
        m.user_id,
        'vouch_needed',
        'submission_id',
        sub.id,
        VOUCH_COOLDOWN_HOURS
      );
      if (recently) continue;

      const ok = await notifyUser(m.user_id, 'vouch_needed', {
        submission_id: sub.id,
        group_id: groupId,
        group_name: ga.goals.groups?.name ?? 'Crew',
        goal_title: ga.goals.title,
        submitter_id: sub.user_id,
      });
      if (ok) sent++;
    }
  }

  return sent;
}

export async function notifyCrewOfMissedQuests(
  groupId: string,
  groupName: string,
  misses: Array<{ member_name: string; goal_title: string; goal_assignment_id: string }>
): Promise<number> {
  if (!misses.length) return 0;

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);

  const missedMemberIds = new Set(
    misses.map((m) => {
      /* resolved below via assignment lookup if needed */
      return m.goal_assignment_id;
    })
  );

  let sent = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const m of members ?? []) {
    const already = await wasNotifiedRecently(m.user_id, 'quest_missed', 'digest_date', today, 24);
    if (already) continue;

    const ok = await notifyUser(m.user_id, 'quest_missed', {
      group_id: groupId,
      group_name: groupName,
      digest_date: today,
      misses,
    });
    if (ok) sent++;
  }

  void missedMemberIds;
  return sent;
}

export async function notifySubmissionResolved(
  submitterId: string,
  submissionId: string,
  approved: boolean,
  goalTitle: string,
  groupId: string,
  groupName: string
): Promise<void> {
  await notifyUser(submitterId, 'submission_resolved', {
    submission_id: submissionId,
    status: approved ? 'approved' : 'rejected',
    goal_title: goalTitle,
    group_id: groupId,
    group_name: groupName,
  });
}
