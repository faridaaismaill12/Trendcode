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
language plpgsql set search_path = '' as $$
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

-- =============================================================
-- Newsletter subscribers (used by the homepage `subscribe` command).
-- Visitors can only ADD an email. Nobody can read, change or delete
-- the list with the public key; view it in Supabase → Table Editor.
-- =============================================================
create table if not exists public.subscribers (
  id         bigint generated always as identity primary key,
  email      text not null,
  created_at timestamptz not null default now(),
  constraint subscribers_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254)
);
create unique index if not exists subscribers_email_lower_key on public.subscribers (lower(email));

alter table public.subscribers enable row level security;
revoke all on public.subscribers from anon, authenticated;
grant insert (email) on public.subscribers to anon, authenticated;

drop policy if exists "Anyone can subscribe" on public.subscribers;
create policy "Anyone can subscribe" on public.subscribers
  for insert to anon, authenticated with check (true);
