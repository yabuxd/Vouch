-- Harden RLS: close privilege escalation and storage holes.
-- Apply in Supabase SQL Editor after 001–003.

-- Lock search_path on SECURITY DEFINER helpers
create or replace function is_group_member(gid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

create or replace function is_group_owner(gid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid() and role = 'owner'
  );
$$;

-- Constrain roles
alter table group_members
  drop constraint if exists group_members_role_check;
alter table group_members
  add constraint group_members_role_check check (role in ('owner', 'member'));

alter table groups
  drop constraint if exists groups_approval_threshold_check;
alter table groups
  add constraint groups_approval_threshold_check
  check (approval_threshold >= 1 and approval_threshold <= 20);

-- Clients must join via backend (service role). Block direct self-join / role escalation.
drop policy if exists "Users can join groups" on group_members;

-- Owners may change role only through backend; block client point/streak tampering.
drop policy if exists "Owners can update members" on group_members;

create or replace function protect_member_stats()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- service_role / postgres can change anything
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if new.points is distinct from old.points
     or new.current_streak is distinct from old.current_streak
     or new.role is distinct from old.role then
    raise exception 'Direct updates to points, streak, or role are not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_member_stats on group_members;
create trigger trg_protect_member_stats
  before update on group_members
  for each row execute function protect_member_stats();

-- Re-add owner update for non-stat columns only via trigger gate above
create policy "Owners can update members"
  on group_members for update
  using (is_group_owner(group_id))
  with check (is_group_owner(group_id));

-- Assignments: clients cannot change status (approval flow is backend-only)
drop policy if exists "Members can update own assignments" on goal_assignments;

-- Submissions: must own the assignment being submitted against
drop policy if exists "Users can submit own assignments" on submissions;
create policy "Users can submit own assignments"
  on submissions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from goal_assignments ga
      where ga.id = goal_assignment_id
        and ga.user_id = auth.uid()
    )
  );

-- Prevent duplicate pending/approved submissions for one assignment (race)
create unique index if not exists submissions_one_active_per_assignment
  on submissions (goal_assignment_id)
  where status in ('pending', 'approved');

-- Missed events: inserts are service-role only (no client forge)
drop policy if exists "Service can insert missed events" on missed_events;

-- Storage: path is {group_id}/{user_id}/{filename}
drop policy if exists "Authenticated users can upload proof" on storage.objects;
drop policy if exists "Group members can view proof images" on storage.objects;

create policy "Members can upload own proof"
  on storage.objects for insert
  with check (
    bucket_id = 'proof-screenshots'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] is not null
    and is_group_member(((storage.foldername(name))[1])::uuid)
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Members can view group proof"
  on storage.objects for select
  using (
    bucket_id = 'proof-screenshots'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] is not null
    and is_group_member(((storage.foldername(name))[1])::uuid)
  );
