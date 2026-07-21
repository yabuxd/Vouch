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
