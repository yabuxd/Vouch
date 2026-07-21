-- In-app notifications and per-user preferences

create table notification_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  deadline_approaching boolean not null default true,
  vouch_needed boolean not null default true,
  quest_missed boolean not null default true,
  submission_resolved boolean not null default true,
  updated_at timestamptz default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null check (type in (
    'deadline_approaching',
    'vouch_needed',
    'quest_missed',
    'submission_resolved'
  )),
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz default now()
);

create index idx_notifications_user_created on notifications(user_id, created_at desc);
create index idx_notifications_user_unread on notifications(user_id) where read_at is null;
create index idx_notifications_type_created on notifications(type, created_at desc);

alter table notification_preferences enable row level security;
alter table notifications enable row level security;

create policy "Users can view own notification preferences"
  on notification_preferences for select using (auth.uid() = user_id);

create policy "Users can update own notification preferences"
  on notification_preferences for update using (auth.uid() = user_id);

create policy "Users can insert own notification preferences"
  on notification_preferences for insert with check (auth.uid() = user_id);

create policy "Users can view own notifications"
  on notifications for select using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on notifications for update using (auth.uid() = user_id);

-- Default preferences for new profiles
create or replace function create_default_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notification_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_profile_created_notification_prefs
  after insert on profiles
  for each row execute function create_default_notification_preferences();
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
-- Submission comments (flat thread, no nesting)

create table submission_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz default now()
);

create index idx_submission_comments_submission on submission_comments(submission_id, created_at asc);

alter table submission_comments enable row level security;

create policy "Members can view submission comments"
  on submission_comments for select using (
    exists (
      select 1 from submissions s
      join goal_assignments ga on ga.id = s.goal_assignment_id
      join goals g on g.id = ga.goal_id
      where s.id = submission_comments.submission_id
        and is_group_member(g.group_id)
    )
  );

create policy "Members can add submission comments"
  on submission_comments for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from submissions s
      join goal_assignments ga on ga.id = s.goal_assignment_id
      join goals g on g.id = ga.goal_id
      where s.id = submission_comments.submission_id
        and is_group_member(g.group_id)
    )
  );
-- Content reports

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete cascade not null,
  target_type text not null check (target_type in ('submission', 'comment', 'user')),
  target_id uuid not null,
  reason text not null check (reason in ('inappropriate', 'spam', 'harassment', 'other')),
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz default now()
);

create index idx_reports_status on reports(status, created_at desc);

alter table reports enable row level security;

create policy "Users can view own reports"
  on reports for select using (auth.uid() = reporter_id);

create policy "Users can submit reports"
  on reports for insert with check (auth.uid() = reporter_id);
-- User timezone for assignment deadlines

alter table profiles add column if not exists timezone text not null default 'UTC';

create index idx_profiles_timezone on profiles(timezone);

-- ========== 010_remove_gamification.sql ==========

drop table if exists missed_reactions cascade;
drop table if exists missed_events cascade;
drop table if exists points_log cascade;

alter table group_members drop column if exists points;
alter table group_members drop column if exists current_streak;

alter table goals drop column if exists points_value;

alter table groups drop column if exists weekly_reset_enabled;
