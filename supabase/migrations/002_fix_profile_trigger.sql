-- ============================================================
-- FIX: Signup returns 500 "Database error saving new user"
-- Run this ENTIRE file in Supabase → SQL Editor → Run
-- ============================================================

-- 1. Ensure profiles table exists
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- 2. Recreate the signup trigger function (Supabase-recommended pattern)
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

-- 3. Recreate trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Grant permissions so auth can write profiles
grant usage on schema public to supabase_auth_admin;
grant all on table public.profiles to supabase_auth_admin;
grant all on all sequences in schema public to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- 5. Profile RLS policies (minimum needed for signup)
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Done. Try signing up again.
