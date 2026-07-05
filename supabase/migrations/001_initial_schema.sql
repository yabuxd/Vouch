-- Vouch initial schema + RLS

create extension if not exists "pgcrypto";

-- profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- groups
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  invite_code text unique not null,
  owner_id uuid references profiles(id),
  approval_threshold int default 2,
  weekly_reset_enabled boolean default false,
  created_at timestamptz default now()
);

-- group_members
create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member',
  points integer default 0,
  current_streak integer default 0,
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- goals
create table goals (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  created_by uuid references profiles(id),
  title text not null,
  description text,
  type text not null check (type in ('group', 'individual')),
  frequency text not null check (frequency in ('daily', 'weekly', 'one_time')),
  points_value integer default 10,
  due_date date,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- goal_assignments
create table goal_assignments (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  due_date date not null,
  status text default 'pending' check (status in ('pending', 'submitted', 'approved', 'rejected'))
);

-- submissions
create table submissions (
  id uuid primary key default gen_random_uuid(),
  goal_assignment_id uuid references goal_assignments(id) on delete cascade,
  user_id uuid references profiles(id),
  screenshot_url text not null,
  note text,
  submitted_at timestamptz default now(),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected'))
);

-- approvals
create table approvals (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  approver_id uuid references profiles(id),
  decision text not null check (decision in ('approve', 'reject')),
  comment text,
  created_at timestamptz default now(),
  unique(submission_id, approver_id)
);

-- points_log
create table points_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  group_id uuid references groups(id),
  submission_id uuid references submissions(id),
  points integer,
  created_at timestamptz default now()
);

-- indexes
create index idx_group_members_user on group_members(user_id);
create index idx_group_members_group on group_members(group_id);
create index idx_goals_group on goals(group_id);
create index idx_goal_assignments_user on goal_assignments(user_id);
create index idx_goal_assignments_goal on goal_assignments(goal_id);
create index idx_submissions_assignment on submissions(goal_assignment_id);
create index idx_approvals_submission on approvals(submission_id);
create index idx_points_log_group on points_log(group_id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

alter function public.handle_new_user() owner to postgres;

grant usage on schema public to supabase_auth_admin;
grant all on table public.profiles to supabase_auth_admin;
grant all on all sequences in schema public to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- prevent self-approval
create or replace function prevent_self_approval()
returns trigger as $$
declare
  submission_owner uuid;
begin
  select user_id into submission_owner from submissions where id = new.submission_id;
  if submission_owner = new.approver_id then
    raise exception 'Cannot approve your own submission';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_self_approval
  before insert on approvals
  for each row execute function prevent_self_approval();

-- RLS
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table goals enable row level security;
alter table goal_assignments enable row level security;
alter table submissions enable row level security;
alter table approvals enable row level security;
alter table points_log enable row level security;

-- helper: is group member
create or replace function is_group_member(gid uuid)
returns boolean as $$
  select exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- helper: is group owner
create or replace function is_group_owner(gid uuid)
returns boolean as $$
  select exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid() and role = 'owner'
  );
$$ language sql security definer stable;

-- profiles policies
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can view co-member profiles"
  on profiles for select using (
    exists (
      select 1 from group_members gm1
      join group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid() and gm2.user_id = profiles.id
    )
  );

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- groups policies
create policy "Members can view their groups"
  on groups for select using (is_group_member(id));

create policy "Authenticated users can create groups"
  on groups for insert with check (auth.uid() = owner_id);

create policy "Owners can update groups"
  on groups for update using (is_group_owner(id));

create policy "Owners can delete groups"
  on groups for delete using (is_group_owner(id));

-- group_members policies
create policy "Members can view group members"
  on group_members for select using (is_group_member(group_id));

create policy "Users can join groups"
  on group_members for insert with check (auth.uid() = user_id);

create policy "Owners can update members"
  on group_members for update using (is_group_owner(group_id));

create policy "Users can leave or owners can remove"
  on group_members for delete using (
    auth.uid() = user_id or is_group_owner(group_id)
  );

-- goals policies
create policy "Members can view goals"
  on goals for select using (is_group_member(group_id));

create policy "Owners can create group goals"
  on goals for insert with check (
    is_group_member(group_id) and (
      (type = 'group' and is_group_owner(group_id)) or
      (type = 'individual' and auth.uid() = created_by)
    )
  );

create policy "Creators and owners can update goals"
  on goals for update using (
    auth.uid() = created_by or is_group_owner(group_id)
  );

create policy "Creators and owners can delete goals"
  on goals for delete using (
    auth.uid() = created_by or is_group_owner(group_id)
  );

-- goal_assignments policies
create policy "Members can view assignments"
  on goal_assignments for select using (
    exists (
      select 1 from goals g
      where g.id = goal_assignments.goal_id and is_group_member(g.group_id)
    )
  );

create policy "Members can update own assignments"
  on goal_assignments for update using (auth.uid() = user_id);

-- submissions policies
create policy "Members can view submissions"
  on submissions for select using (
    exists (
      select 1 from goal_assignments ga
      join goals g on g.id = ga.goal_id
      where ga.id = submissions.goal_assignment_id and is_group_member(g.group_id)
    )
  );

create policy "Users can submit own assignments"
  on submissions for insert with check (auth.uid() = user_id);

-- approvals policies
create policy "Members can view approvals"
  on approvals for select using (
    exists (
      select 1 from submissions s
      join goal_assignments ga on ga.id = s.goal_assignment_id
      join goals g on g.id = ga.goal_id
      where s.id = approvals.submission_id and is_group_member(g.group_id)
    )
  );

create policy "Members can vote on others submissions"
  on approvals for insert with check (
    auth.uid() = approver_id and
    exists (
      select 1 from submissions s
      join goal_assignments ga on ga.id = s.goal_assignment_id
      join goals g on g.id = ga.goal_id
      where s.id = approvals.submission_id
        and is_group_member(g.group_id)
        and s.user_id != auth.uid()
    )
  );

-- points_log policies
create policy "Members can view points log"
  on points_log for select using (is_group_member(group_id));

-- storage bucket (run in Supabase dashboard or via API)
insert into storage.buckets (id, name, public)
values ('proof-screenshots', 'proof-screenshots', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload proof"
  on storage.objects for insert
  with check (
    bucket_id = 'proof-screenshots' and
    auth.role() = 'authenticated'
  );

create policy "Group members can view proof images"
  on storage.objects for select
  using (
    bucket_id = 'proof-screenshots' and
    auth.role() = 'authenticated'
  );
