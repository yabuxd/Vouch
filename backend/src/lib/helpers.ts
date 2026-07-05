import { supabase } from '../lib/supabase.js';

export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

export async function isGroupOwner(groupId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('role', 'owner')
    .single();
  return !!data;
}

export async function getGroupIdFromAssignment(assignmentId: string): Promise<string | null> {
  const { data } = await supabase
    .from('goal_assignments')
    .select('goals(group_id)')
    .eq('id', assignmentId)
    .single();
  if (!data?.goals) return null;
  const goals = data.goals as unknown as { group_id: string };
  return goals.group_id;
}

export async function getGroupIdFromSubmission(submissionId: string): Promise<string | null> {
  const { data } = await supabase
    .from('submissions')
    .select('goal_assignments(goals(group_id))')
    .eq('id', submissionId)
    .single();
  if (!data?.goal_assignments) return null;
  const ga = data.goal_assignments as unknown as { goals: { group_id: string } };
  return ga.goals.group_id;
}

export function reqParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
