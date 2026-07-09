-- missed quest feed: events when assignments pass due without approval

-- Reaction model: ONE emoji per member per event (unique on missed_event_id + reactor_member_id).
-- Tradeoff vs multiple emojis per member:
--   • Chosen (one per member): simpler counts, clear toggle UX, mirrors approvals uniqueness.
--   • Alternative (many per member): richer expression but noisy aggregation and ambiguous toggles.

create table missed_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade not null,
  member_id uuid references profiles(id) on delete cascade not null,
  goal_id uuid references goals(id) on delete cascade not null,
  goal_assignment_id uuid references goal_assignments(id) on delete cascade not null unique,
  streak_before integer not null default 0,
  created_at timestamptz default now()
);

create table missed_reactions (
  id uuid primary key default gen_random_uuid(),
  missed_event_id uuid references missed_events(id) on delete cascade not null,
  reactor_member_id uuid references profiles(id) on delete cascade not null,
  emoji text not null check (char_length(emoji) between 1 and 8),
  created_at timestamptz default now(),
  unique(missed_event_id, reactor_member_id)
);

create index idx_missed_events_group_created on missed_events(group_id, created_at desc);
create index idx_missed_reactions_event on missed_reactions(missed_event_id);

alter table missed_events enable row level security;
alter table missed_reactions enable row level security;

create policy "Members can view missed events"
  on missed_events for select using (is_group_member(group_id));

create policy "Service can insert missed events"
  on missed_events for insert with check (is_group_member(group_id));

create policy "Members can view missed reactions"
  on missed_reactions for select using (
    exists (
      select 1 from missed_events me
      where me.id = missed_reactions.missed_event_id
        and is_group_member(me.group_id)
    )
  );

create policy "Members can react on missed events"
  on missed_reactions for insert with check (
    auth.uid() = reactor_member_id and
    exists (
      select 1 from missed_events me
      where me.id = missed_reactions.missed_event_id
        and is_group_member(me.group_id)
    )
  );

create policy "Members can update own missed reactions"
  on missed_reactions for update using (auth.uid() = reactor_member_id);

create policy "Members can remove own missed reactions"
  on missed_reactions for delete using (auth.uid() = reactor_member_id);
