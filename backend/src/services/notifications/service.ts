import { supabase } from '../../lib/supabase.js';
import {
  getDeliveries,
  type NotificationPayload,
  type NotificationType,
} from './delivery.js';

type Preferences = {
  deadline_approaching: boolean;
  vouch_needed: boolean;
  quest_missed: boolean;
  submission_resolved: boolean;
  crew_suggestion: boolean;
};

const PREF_KEY: Record<NotificationType, keyof Preferences> = {
  deadline_approaching: 'deadline_approaching',
  vouch_needed: 'vouch_needed',
  quest_missed: 'quest_missed',
  submission_resolved: 'submission_resolved',
  crew_suggestion: 'crew_suggestion',
};

export async function ensurePreferences(userId: string): Promise<Preferences> {
  const { data: existing } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing as Preferences;

  const defaults = {
    user_id: userId,
    deadline_approaching: true,
    vouch_needed: true,
    quest_missed: true,
    submission_resolved: true,
    crew_suggestion: true,
  };

  const { data, error } = await supabase
    .from('notification_preferences')
    .insert(defaults)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Preferences;
}

export async function notifyUser(
  userId: string,
  type: NotificationType,
  payload: NotificationPayload
): Promise<boolean> {
  const prefs = await ensurePreferences(userId);
  if (!prefs[PREF_KEY[type]]) return false;

  for (const delivery of getDeliveries()) {
    await delivery.deliver(userId, type, payload);
  }
  return true;
}

export async function listNotifications(userId: string, limit = 30, offset = 0) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markRead(userId: string, notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function markAllRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw new Error(error.message);
}

export async function updatePreferences(userId: string, updates: Partial<Preferences>) {
  await ensurePreferences(userId);
  const { data, error } = await supabase
    .from('notification_preferences')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function wasNotifiedRecently(
  userId: string,
  type: NotificationType,
  payloadKey: string,
  payloadValue: string,
  withinHours: number
): Promise<boolean> {
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('notifications')
    .select('id, payload')
    .eq('user_id', userId)
    .eq('type', type)
    .gte('created_at', since);

  return (data ?? []).some((n) => {
    const payload = n.payload as Record<string, unknown>;
    return payload[payloadKey] === payloadValue;
  });
}
