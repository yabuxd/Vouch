import { supabase } from '../lib/supabase.js';

const DEFAULT_EMOJIS = ['😅', '💀', '🫡', '👀', '🔥'];

export async function getMissedFeed(
  groupId: string,
  userId: string,
  limit = 20,
  offset = 0
) {
  const { data: events, count } = await supabase
    .from('missed_events')
    .select(
      '*, profiles:member_id(id, name, avatar_url), goals:goal_id(id, title)',
      { count: 'exact' }
    )
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!events?.length) {
    return { events: [], total: count ?? 0, has_more: false };
  }

  const eventIds = events.map((e) => e.id);
  const { data: reactions } = await supabase
    .from('missed_reactions')
    .select('missed_event_id, reactor_member_id, emoji')
    .in('missed_event_id', eventIds);

  const enriched = events.map((event) => {
    const eventReactions = (reactions ?? []).filter((r) => r.missed_event_id === event.id);
    const myReaction = eventReactions.find((r) => r.reactor_member_id === userId)?.emoji ?? null;

    const emojiMap = new Map<string, number>();
    for (const r of eventReactions) {
      emojiMap.set(r.emoji, (emojiMap.get(r.emoji) ?? 0) + 1);
    }

    const reaction_counts = [...emojiMap.entries()]
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count);

    const profiles = event.profiles as { id: string; name: string; avatar_url: string | null };
    const goals = event.goals as { id: string; title: string };

    return {
      id: event.id,
      group_id: event.group_id,
      member_id: event.member_id,
      goal_id: event.goal_id,
      goal_assignment_id: event.goal_assignment_id,
      streak_before: event.streak_before,
      created_at: event.created_at,
      member: profiles,
      goal: goals,
      reaction_counts,
      my_reaction: myReaction,
    };
  });

  const total = count ?? 0;
  return {
    events: enriched,
    total,
    has_more: offset + limit < total,
    available_emojis: DEFAULT_EMOJIS,
  };
}

export async function toggleMissedReaction(
  missedEventId: string,
  userId: string,
  emoji: string
) {
  if (!emoji?.trim() || emoji.length > 8) {
    throw new Error('Invalid emoji');
  }

  const { data: event } = await supabase
    .from('missed_events')
    .select('id, group_id, member_id')
    .eq('id', missedEventId)
    .single();

  if (!event) throw new Error('Missed event not found');

  const { data: existing } = await supabase
    .from('missed_reactions')
    .select('id, emoji')
    .eq('missed_event_id', missedEventId)
    .eq('reactor_member_id', userId)
    .maybeSingle();

  if (existing) {
    if (existing.emoji === emoji) {
      await supabase.from('missed_reactions').delete().eq('id', existing.id);
      return { action: 'removed' as const, emoji: null };
    }
    await supabase
      .from('missed_reactions')
      .update({ emoji })
      .eq('id', existing.id);
    return { action: 'updated' as const, emoji };
  }

  const { error } = await supabase.from('missed_reactions').insert({
    missed_event_id: missedEventId,
    reactor_member_id: userId,
    emoji,
  });

  if (error) throw new Error(error.message);
  return { action: 'added' as const, emoji };
}
