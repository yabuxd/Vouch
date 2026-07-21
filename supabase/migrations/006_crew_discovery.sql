-- Crew discovery and join requests

alter table groups add column if not exists is_discoverable boolean not null default false;
alter table groups add column if not exists category text;

create table crew_join_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz default now(),
  unique(group_id, user_id)
);

create index idx_crew_join_requests_group on crew_join_requests(group_id, status);
create index idx_groups_discoverable on groups(is_discoverable, category) where is_discoverable = true;

alter table crew_join_requests enable row level security;

-- Extend notifications for cold-start crew suggestions
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check check (type in (
  'deadline_approaching',
  'vouch_needed',
  'quest_missed',
  'submission_resolved',
  'crew_suggestion'
));

alter table notification_preferences add column if not exists crew_suggestion boolean not null default true;

create policy "Users can view own join requests"
  on crew_join_requests for select using (auth.uid() = user_id);

create policy "Owners can view crew join requests"
  on crew_join_requests for select using (
    exists (
      select 1 from group_members
      where group_id = crew_join_requests.group_id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );

create policy "Users can request to join"
  on crew_join_requests for insert with check (auth.uid() = user_id);

create policy "Owners can update join requests"
  on crew_join_requests for update using (
    exists (
      select 1 from group_members
      where group_id = crew_join_requests.group_id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );
