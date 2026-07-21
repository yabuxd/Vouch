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
