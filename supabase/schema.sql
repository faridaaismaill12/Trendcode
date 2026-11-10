-- =============================================================
-- Trendcode accounts: run this once in Supabase → SQL Editor.
-- Creates the profiles table and the security rules that protect it.
-- =============================================================

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default '' check (char_length(display_name) <= 40),
  bio          text not null default '' check (char_length(bio) <= 200),
  character    jsonb not null default '{}'::jsonb,   -- avatar options + class
  progress     jsonb not null default '{}'::jsonb,   -- posts read, labs, streaks, scores…
  is_public    boolean not null default true,        -- show on profile.html?u=username
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Row Level Security: the public key can only do what these policies allow.
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are readable" on public.profiles;
create policy "Public profiles are readable" on public.profiles
  for select using (is_public or auth.uid() = id);

drop policy if exists "Users create their own profile" on public.profiles;
create policy "Users create their own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users delete their own profile" on public.profiles;
create policy "Users delete their own profile" on public.profiles
  for delete using (auth.uid() = id);
