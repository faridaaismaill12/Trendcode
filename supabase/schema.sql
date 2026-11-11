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

-- =============================================================
-- COMMUNITY: predictions, article discussions and chat rooms.
-- Run this block once (it is safe to re-run). Everything is readable
-- by visitors; only signed-in people with a profile can post, and
-- they can only change or delete their own rows.
-- =============================================================

-- ---------- Make Your Prediction ----------
create table if not exists public.predictions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  question_id text not null check (question_id ~ '^[a-z0-9-]{3,60}$'),
  stance      text not null check (stance in ('yes', 'no')),
  confidence  int  not null check (confidence between 50 and 99),
  reasoning   text not null default '' check (char_length(reasoning) <= 600),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, question_id)
);
drop trigger if exists predictions_touch on public.predictions;
create trigger predictions_touch before update on public.predictions
  for each row execute function public.touch_updated_at();

alter table public.predictions enable row level security;
drop policy if exists "Predictions are public" on public.predictions;
create policy "Predictions are public" on public.predictions for select using (true);
drop policy if exists "Users add their own predictions" on public.predictions;
create policy "Users add their own predictions" on public.predictions for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users change their own predictions" on public.predictions;
create policy "Users change their own predictions" on public.predictions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users delete their own predictions" on public.predictions;
create policy "Users delete their own predictions" on public.predictions for delete to authenticated using (auth.uid() = user_id);

-- Crowd forecast per question: how many said yes/no and the average
-- probability of "yes" (a 70%-confident "no" counts as a 30% "yes").
create or replace function public.prediction_stats()
returns table (question_id text, yes_count bigint, no_count bigint, avg_yes numeric)
language sql stable set search_path = '' as $$
  select p.question_id,
         count(*) filter (where p.stance = 'yes'),
         count(*) filter (where p.stance = 'no'),
         round(avg(case when p.stance = 'yes' then p.confidence else 100 - p.confidence end), 1)
  from public.predictions p
  group by p.question_id
$$;
grant execute on function public.prediction_stats() to anon, authenticated;

-- ---------- Discussion under articles and Library guides ----------
create table if not exists public.comments (
  id         bigint generated always as identity primary key,
  thread     text not null check (thread ~ '^(post|lib|lab|predict):[a-z0-9-]{2,80}$'),
  parent_id  bigint references public.comments (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists comments_thread_idx on public.comments (thread, created_at);

alter table public.comments enable row level security;
drop policy if exists "Comments are public" on public.comments;
create policy "Comments are public" on public.comments for select using (true);
drop policy if exists "Users post their own comments" on public.comments;
create policy "Users post their own comments" on public.comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users delete their own comments" on public.comments;
create policy "Users delete their own comments" on public.comments for delete to authenticated using (auth.uid() = user_id);

-- =============================================================
-- CHAT SERVERS (Discord-style): servers, channels, members, messages,
-- reactions and poll votes. Public servers can be read by anyone;
-- private ones only by members. Members post; admins manage.
-- =============================================================

create table if not exists public.servers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 2 and 40),
  description text not null default '' check (char_length(description) <= 200),
  icon        text not null default '' check (char_length(icon) <= 3),
  color       text not null default '#22d3ee' check (color ~ '^#[0-9a-fA-F]{6}$'),
  banner      text not null default 'grid' check (banner in ('grid', 'dots', 'circuit', 'waves', 'rings', 'stripes', 'plain')),
  is_public   boolean not null default true,
  invite_code text not null unique default substr(md5(gen_random_uuid()::text), 1, 8),
  owner_id    uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.server_members (
  server_id uuid not null references public.servers (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'admin', 'member')),
  nickname  text not null default '' check (char_length(nickname) <= 32),
  joined_at timestamptz not null default now(),
  primary key (server_id, user_id)
);
create index if not exists server_members_user_idx on public.server_members (user_id);

create table if not exists public.channels (
  id         uuid primary key default gen_random_uuid(),
  server_id  uuid not null references public.servers (id) on delete cascade,
  name       text not null check (name ~ '^[a-z0-9][a-z0-9-]{0,29}$'),
  topic      text not null default '' check (char_length(topic) <= 120),
  kind       text not null default 'text' check (kind in ('text', 'announce')),
  position   int  not null default 0,
  created_at timestamptz not null default now(),
  unique (server_id, name)
);

create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  channel_id uuid not null references public.channels (id) on delete cascade,
  server_id  uuid not null references public.servers (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind       text not null default 'text' check (kind in ('text', 'me', 'poll', 'roll', 'flip', '8ball', 'hash', 'cipher', 'quiz')),
  body       text not null default '' check (char_length(body) <= 2000),
  meta       jsonb not null default '{}'::jsonb check (pg_column_size(meta) < 4000),
  reply_to   bigint references public.messages (id) on delete set null,
  edited_at  timestamptz,
  created_at timestamptz not null default now(),
  check (kind <> 'text' or char_length(btrim(body)) > 0)
);
create index if not exists messages_channel_idx on public.messages (channel_id, created_at desc);
create index if not exists messages_server_idx on public.messages (server_id, channel_id, created_at desc);

create table if not exists public.reactions (
  message_id bigint not null references public.messages (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  emoji      text not null check (char_length(emoji) between 1 and 16),
  server_id  uuid references public.servers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create table if not exists public.poll_votes (
  message_id bigint not null references public.messages (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  option     int not null check (option between 0 and 9),
  server_id  uuid references public.servers (id) on delete cascade,
  primary key (message_id, user_id)
);

-- ---------- helpers used by the security rules (security definer avoids RLS recursion) ----------
create or replace function public.server_role(s uuid) returns text
language sql stable security definer set search_path = '' as $$
  select role from public.server_members where server_id = s and user_id = auth.uid()
$$;
create or replace function public.can_view_server(s uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.servers where id = s and is_public)
      or exists (select 1 from public.server_members where server_id = s and user_id = auth.uid())
$$;
create or replace function public.can_post(ch uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.channels c join public.server_members m on m.server_id = c.server_id and m.user_id = auth.uid()
    where c.id = ch and (c.kind = 'text' or m.role in ('owner', 'admin')))
$$;
create or replace function public.message_server(mid bigint) returns uuid
language sql stable security definer set search_path = '' as $$
  select server_id from public.messages where id = mid
$$;

-- ---------- triggers: fill server_id, set up new servers, limits ----------
create or replace function public.fill_server_id() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'messages' then
    select server_id into new.server_id from public.channels where id = new.channel_id;
  else
    new.server_id := public.message_server(new.message_id);
  end if;
  return new;
end $$;
drop trigger if exists messages_fill on public.messages;
create trigger messages_fill before insert on public.messages for each row execute function public.fill_server_id();
drop trigger if exists reactions_fill on public.reactions;
create trigger reactions_fill before insert on public.reactions for each row execute function public.fill_server_id();
drop trigger if exists votes_fill on public.poll_votes;
create trigger votes_fill before insert or update on public.poll_votes for each row execute function public.fill_server_id();

create or replace function public.message_edited() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.body is distinct from old.body or new.meta is distinct from old.meta then new.edited_at := now(); end if;
  return new;
end $$;
drop trigger if exists messages_edited on public.messages;
create trigger messages_edited before update on public.messages for each row execute function public.message_edited();

create or replace function public.server_created() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.owner_id is not null then
    insert into public.server_members (server_id, user_id, role) values (new.id, new.owner_id, 'owner') on conflict do nothing;
    insert into public.channels (server_id, name, topic) values (new.id, 'general', 'Say hi!') on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists servers_created on public.servers;
create trigger servers_created after insert on public.servers for each row execute function public.server_created();

create or replace function public.server_limits() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Nested so each branch only touches columns its own table has
  if tg_table_name = 'servers' then
    if (select count(*) from public.servers where owner_id = new.owner_id) >= 10 then
      raise exception 'You can own up to 10 servers.' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'channels' then
    if (select count(*) from public.channels where server_id = new.server_id) >= 40 then
      raise exception 'A server can have up to 40 channels.' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'messages' then
    if (select count(*) from public.messages where user_id = new.user_id and created_at > now() - interval '10 seconds') >= 8 then
      raise exception 'Slow down a little: 8 messages per 10 seconds.' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists servers_limit on public.servers;
create trigger servers_limit before insert on public.servers for each row execute function public.server_limits();
drop trigger if exists channels_limit on public.channels;
create trigger channels_limit before insert on public.channels for each row execute function public.server_limits();
drop trigger if exists messages_limit on public.messages;
create trigger messages_limit before insert on public.messages for each row execute function public.server_limits();

-- ---------- row level security ----------
alter table public.servers        enable row level security;
alter table public.server_members enable row level security;
alter table public.channels       enable row level security;
alter table public.messages       enable row level security;
alter table public.reactions      enable row level security;
alter table public.poll_votes     enable row level security;

drop policy if exists "See public or joined servers" on public.servers;
create policy "See public or joined servers" on public.servers for select using (is_public or owner_id = auth.uid() or public.server_role(id) is not null);
drop policy if exists "Create your own servers" on public.servers;
create policy "Create your own servers" on public.servers for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "Admins customise servers" on public.servers;
create policy "Admins customise servers" on public.servers for update to authenticated using (public.server_role(id) in ('owner', 'admin'));
drop policy if exists "Owners delete servers" on public.servers;
create policy "Owners delete servers" on public.servers for delete to authenticated using (owner_id = auth.uid());
-- Only these columns can be changed from the browser (not the owner or the invite code)
revoke update on public.servers from anon, authenticated;
grant update (name, description, icon, color, banner, is_public) on public.servers to authenticated;

drop policy if exists "See members" on public.server_members;
create policy "See members" on public.server_members for select using (public.can_view_server(server_id));
drop policy if exists "Join public servers" on public.server_members;
create policy "Join public servers" on public.server_members for insert to authenticated
  with check (user_id = auth.uid() and role = 'member' and exists (select 1 from public.servers s where s.id = server_id and s.is_public));
drop policy if exists "Change your nickname" on public.server_members;
create policy "Change your nickname" on public.server_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.server_members from anon, authenticated;
grant update (nickname) on public.server_members to authenticated;
drop policy if exists "Leave or kick" on public.server_members;
create policy "Leave or kick" on public.server_members for delete to authenticated using (
  role <> 'owner' and (user_id = auth.uid() or public.server_role(server_id) = 'owner' or (public.server_role(server_id) = 'admin' and role = 'member')));

drop policy if exists "See channels" on public.channels;
create policy "See channels" on public.channels for select using (public.can_view_server(server_id));
drop policy if exists "Admins manage channels" on public.channels;
create policy "Admins manage channels" on public.channels for all to authenticated
  using (public.server_role(server_id) in ('owner', 'admin')) with check (public.server_role(server_id) in ('owner', 'admin'));

drop policy if exists "Read messages" on public.messages;
create policy "Read messages" on public.messages for select using (public.can_view_server(server_id));
drop policy if exists "Members post" on public.messages;
create policy "Members post" on public.messages for insert to authenticated with check (user_id = auth.uid() and public.can_post(channel_id));
drop policy if exists "Edit your messages" on public.messages;
create policy "Edit your messages" on public.messages for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.messages from anon, authenticated;
grant update (body, meta) on public.messages to authenticated;
drop policy if exists "Delete yours, admins delete any" on public.messages;
create policy "Delete yours, admins delete any" on public.messages for delete to authenticated
  using (user_id = auth.uid() or public.server_role(server_id) in ('owner', 'admin'));

drop policy if exists "Read reactions" on public.reactions;
create policy "Read reactions" on public.reactions for select using (public.can_view_server(server_id));
drop policy if exists "Members react" on public.reactions;
create policy "Members react" on public.reactions for insert to authenticated
  with check (user_id = auth.uid() and public.server_role(public.message_server(message_id)) is not null);
drop policy if exists "Remove your reactions" on public.reactions;
create policy "Remove your reactions" on public.reactions for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Read votes" on public.poll_votes;
create policy "Read votes" on public.poll_votes for select using (public.can_view_server(server_id));
drop policy if exists "Members vote" on public.poll_votes;
create policy "Members vote" on public.poll_votes for insert to authenticated
  with check (user_id = auth.uid() and public.server_role(public.message_server(message_id)) is not null);
drop policy if exists "Change your vote" on public.poll_votes;
create policy "Change your vote" on public.poll_votes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Remove your vote" on public.poll_votes;
create policy "Remove your vote" on public.poll_votes for delete to authenticated using (user_id = auth.uid());

-- ---------- functions the chat page calls ----------
-- Join any server by invite code (works for private servers too)
create or replace function public.join_server(code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare sid uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first.' using errcode = 'P0001'; end if;
  select id into sid from public.servers where invite_code = lower(btrim(code));
  if sid is null then raise exception 'That invite is invalid or has expired.' using errcode = 'P0001'; end if;
  insert into public.server_members (server_id, user_id) values (sid, auth.uid()) on conflict do nothing;
  return sid;
end $$;

-- What an invite link points to, before joining
create or replace function public.server_preview(code text)
returns table (id uuid, name text, description text, icon text, color text, banner text, members bigint)
language sql stable security definer set search_path = '' as $$
  select s.id, s.name, s.description, s.icon, s.color, s.banner, (select count(*) from public.server_members m where m.server_id = s.id)
  from public.servers s where s.invite_code = lower(btrim(code))
$$;

-- Explore: public servers, biggest first
create or replace function public.public_servers()
returns table (id uuid, name text, description text, icon text, color text, banner text, members bigint)
language sql stable security definer set search_path = '' as $$
  select s.id, s.name, s.description, s.icon, s.color, s.banner, count(m.user_id)
  from public.servers s left join public.server_members m on m.server_id = s.id
  where s.is_public group by s.id order by count(m.user_id) desc, s.created_at limit 60
$$;

-- Latest message per channel, for unread dots
create or replace function public.channel_activity(s uuid)
returns table (channel_id uuid, last_at timestamptz)
language sql stable set search_path = '' as $$
  select channel_id, max(created_at) from public.messages where server_id = s group by channel_id
$$;

-- Owners promote/demote; nobody can take the owner's role
create or replace function public.set_member_role(s uuid, u uuid, r text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(public.server_role(s), '') <> 'owner' then raise exception 'Only the server owner can change roles.' using errcode = 'P0001'; end if;
  if r not in ('admin', 'member') then raise exception 'Unknown role.' using errcode = 'P0001'; end if;
  update public.server_members set role = r where server_id = s and user_id = u and role <> 'owner';
end $$;

create or replace function public.regenerate_invite(s uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare code text := substr(md5(gen_random_uuid()::text), 1, 8);
begin
  if coalesce(public.server_role(s), '') not in ('owner', 'admin') then raise exception 'Only admins can do that.' using errcode = 'P0001'; end if;
  update public.servers set invite_code = code where id = s;
  return code;
end $$;

grant execute on function public.join_server(text), public.server_preview(text), public.public_servers(),
  public.channel_activity(uuid), public.set_member_role(uuid, uuid, text), public.regenerate_invite(uuid) to anon, authenticated;

-- ---------- the official server everyone lands in ----------
insert into public.servers (id, name, description, icon, color, banner, is_public, invite_code)
values ('00000000-0000-4000-8000-000000000001', 'Trendcode HQ', 'The official Trendcode server. Ask questions, share what you build, argue about the future.', 'TC', '#22d3ee', 'circuit', true, 'trendcode')
on conflict (id) do nothing;
insert into public.channels (server_id, name, topic, kind, position) values
  ('00000000-0000-4000-8000-000000000001', 'announcements', 'New explainers, labs and site news.', 'announce', 0),
  ('00000000-0000-4000-8000-000000000001', 'lobby', 'Say hello, ask anything, share what you are learning.', 'text', 1),
  ('00000000-0000-4000-8000-000000000001', 'crypto', 'Ciphers, hashes, post-quantum and the maths behind them.', 'text', 2),
  ('00000000-0000-4000-8000-000000000001', 'ai', 'Models, agents, alignment and AI security.', 'text', 3),
  ('00000000-0000-4000-8000-000000000001', 'security', 'Threats, defences, privacy and staying safe online.', 'text', 4),
  ('00000000-0000-4000-8000-000000000001', 'emerging', 'Quantum, robotics, BCIs and the next big thing.', 'text', 5),
  ('00000000-0000-4000-8000-000000000001', 'code-help', 'Stuck on a lab or the playground? Paste it here.', 'text', 6),
  ('00000000-0000-4000-8000-000000000001', 'predictions', 'Argue about the future. Bring receipts.', 'text', 7),
  ('00000000-0000-4000-8000-000000000001', 'games', 'Try /roll, /flip, /8ball, /quiz and /poll.', 'text', 8)
on conflict (server_id, name) do nothing;
-- To run HQ yourself, make your account its owner (replace the username):
--   insert into public.server_members (server_id, user_id, role)
--   select '00000000-0000-4000-8000-000000000001', id, 'owner' from public.profiles where username = 'your_username'
--   on conflict (server_id, user_id) do update set role = 'owner';

-- ---------- flood protection for article comments ----------
create or replace function public.community_rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare recent int;
begin
  select count(*) into recent from public.comments
    where user_id = new.user_id and created_at > now() - interval '2 minutes';
  if recent >= 5 then raise exception 'Slow down a little: 5 comments per 2 minutes.' using errcode = 'P0001'; end if;
  return new;
end $$;
drop trigger if exists comments_rate on public.comments;
create trigger comments_rate before insert on public.comments for each row execute function public.community_rate_limit();

-- ---------- live updates (Realtime) ----------
alter table public.reactions replica identity full;
alter table public.poll_votes replica identity full;
do $$
declare t text;
begin
  foreach t in array array['comments', 'messages', 'reactions', 'poll_votes', 'channels', 'server_members', 'servers'] loop
    begin execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null; end;
  end loop;
end $$;
