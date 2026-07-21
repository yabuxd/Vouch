import { supabase } from '../lib/supabase.js';
import { notifyUser } from './notifications/service.js';

const CREW_CATEGORIES = ['fitness', 'study', 'creative', 'productivity', 'other'];

function keywordCategory(text: string): string | null {
  const lower = text.toLowerCase();
  if (/study|read|homework|exam|learn/.test(lower)) return 'study';
  if (/run|gym|workout|fitness|exercise/.test(lower)) return 'fitness';
  if (/draw|write|art|creative|design|music/.test(lower)) return 'creative';
  if (/work|code|build|ship|focus/.test(lower)) return 'productivity';
  return null;
}

export async function runColdStartMatching(): Promise<number> {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, created_at')
    .lte('created_at', cutoff);

  if (!profiles?.length) return 0;

  let sent = 0;

  for (const profile of profiles) {
    const { count } = await supabase
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id);

    if ((count ?? 0) > 0) continue;

    const { data: soloGoals } = await supabase
      .from('goals')
      .select('title, group_id, groups(category, is_discoverable, name)')
      .eq('created_by', profile.id)
      .eq('type', 'individual')
      .limit(5);

    const categories = new Set<string>();
    for (const g of soloGoals ?? []) {
      const grp = g.groups as unknown as { category: string | null } | null;
      if (grp?.category) categories.add(grp.category);
      const inferred = keywordCategory(g.title);
      if (inferred) categories.add(inferred);
    }

    const categoryList = categories.size ? [...categories] : CREW_CATEGORIES;

    const { data: discoverable } = await supabase
      .from('groups')
      .select('id, name, description, category')
      .eq('is_discoverable', true)
      .in('category', categoryList)
      .limit(5);

    if (!discoverable?.length) continue;

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentNotifs } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('type', 'crew_suggestion')
      .gte('created_at', since);

    if ((recentNotifs ?? 0) > 0) continue;

    const ok = await notifyUser(profile.id, 'crew_suggestion', {
      cold_start: true,
      message: 'Discover crews that match your quests',
      suggested_crews: discoverable,
      discover_url: '/dashboard/discover',
    });

    if (ok) sent++;
  }

  return sent;
}
