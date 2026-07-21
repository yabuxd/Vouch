-- User timezone for assignment deadlines

alter table profiles add column if not exists timezone text not null default 'UTC';

create index idx_profiles_timezone on profiles(timezone);
