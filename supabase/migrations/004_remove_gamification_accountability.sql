-- Remove gamification columns/tables
alter table group_members drop column if exists points;
alter table group_members drop column if exists current_streak;
alter table goals drop column if exists points_value;
alter table groups drop column if exists weekly_reset_enabled;
alter table missed_events drop column if exists streak_before;

drop policy if exists "Members can view points log" on points_log;
drop table if exists points_log;

-- Accountability settings
alter table groups add column if not exists auto_approve_hours int not null default 48;

-- Resubmit tracking and failed status
alter table goal_assignments add column if not exists submit_count int not null default 0;

alter table goal_assignments drop constraint if exists goal_assignments_status_check;
alter table goal_assignments add constraint goal_assignments_status_check
  check (status in ('pending', 'submitted', 'approved', 'rejected', 'failed'));

-- Screenshot metadata flag (warn reviewers, do not block)
alter table submissions add column if not exists capture_date_flag boolean not null default false;
alter table submissions add column if not exists capture_date_note text;

create index if not exists idx_submissions_pending_submitted_at
  on submissions(status, submitted_at)
  where status = 'pending';

-- Atomically resolve submission when vote quorum is reached
create or replace function resolve_submission_if_quorum(
  p_submission_id uuid,
  p_threshold int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission submissions%rowtype;
  v_approvals int;
  v_rejections int;
  v_submit_count int;
  v_assignment_status text;
begin
  select * into v_submission
  from submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission not found';
  end if;

  if v_submission.status <> 'pending' then
    return jsonb_build_object(
      'resolved', false,
      'already_resolved', true,
      'status', v_submission.status
    );
  end if;

  select
    count(*) filter (where decision = 'approve'),
    count(*) filter (where decision = 'reject')
  into v_approvals, v_rejections
  from approvals
  where submission_id = p_submission_id;

  if v_approvals >= p_threshold then
    update submissions set status = 'approved' where id = p_submission_id;
    update goal_assignments set status = 'approved' where id = v_submission.goal_assignment_id;

    return jsonb_build_object(
      'resolved', true,
      'approved', true,
      'approvals', v_approvals,
      'rejections', v_rejections,
      'threshold', p_threshold
    );
  elsif v_rejections >= p_threshold then
    update submissions set status = 'rejected' where id = p_submission_id;

    select submit_count into v_submit_count
    from goal_assignments
    where id = v_submission.goal_assignment_id;

    if coalesce(v_submit_count, 0) >= 2 then
      v_assignment_status := 'failed';
    else
      v_assignment_status := 'rejected';
    end if;

    update goal_assignments
    set status = v_assignment_status
    where id = v_submission.goal_assignment_id;

    return jsonb_build_object(
      'resolved', true,
      'approved', false,
      'failed', v_assignment_status = 'failed',
      'approvals', v_approvals,
      'rejections', v_rejections,
      'threshold', p_threshold
    );
  end if;

  return jsonb_build_object(
    'resolved', false,
    'approvals', v_approvals,
    'rejections', v_rejections,
    'threshold', p_threshold
  );
end;
$$;

-- Auto-approve submissions pending past per-group window
create or replace function auto_approve_stale_submissions()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
  r record;
begin
  for r in
    select s.id as submission_id, s.goal_assignment_id
    from submissions s
    join goal_assignments ga on ga.id = s.goal_assignment_id
    join goals g on g.id = ga.goal_id
    join groups gr on gr.id = g.group_id
    where s.status = 'pending'
      and s.submitted_at < now() - (gr.auto_approve_hours || ' hours')::interval
    for update of s skip locked
  loop
    update submissions set status = 'approved' where id = r.submission_id and status = 'pending';
    update goal_assignments set status = 'approved' where id = r.goal_assignment_id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
