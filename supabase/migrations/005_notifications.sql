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
