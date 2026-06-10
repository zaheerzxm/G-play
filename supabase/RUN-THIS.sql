-- =============================================================================
-- G-play: RUN THIS ONCE in Supabase SQL Editor (safe to re-run — uses IF NOT EXISTS)
-- =============================================================================
-- Prerequisites (run in this order, then this file only — no other supabase/*.sql):
--   1. supabase/schema.sql        (rooms, seats, messages tables)
--   2. supabase/rls-policies.sql  (seat/message RLS)
--   3. Enable Google Auth: Dashboard → Authentication → Providers → Google
--   4. supabase/RUN-THIS.sql      (this file — all app tables, RPCs, policies)
-- =============================================================================

-- Run in Supabase SQL Editor AFTER enabling Google Auth in Dashboard
-- Authentication → Providers → Google

-- Profiles (linked to auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  email text,
  user_code text unique,
  is_super_admin boolean not null default false,
  created_at timestamptz default now()
);

-- Extend rooms for personal voice rooms
alter table rooms add column if not exists room_code text unique;
alter table rooms add column if not exists owner_id uuid references profiles(id);
alter table rooms add column if not exists is_custom boolean not null default false;

-- Wallets: new users start with 500 coins (existing rows unchanged)
alter table wallets alter column coins set default 500;

-- Auto-create profile + wallet on Google sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  on conflict (id) do nothing;

  insert into public.wallets (user_id, coins)
  values (new.id::text, 500)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS for profiles
alter table profiles enable row level security;

drop policy if exists "profiles read" on profiles;
drop policy if exists "profiles insert own" on profiles;
drop policy if exists "profiles update own" on profiles;

create policy "profiles read" on profiles for select using (true);
create policy "profiles insert own" on profiles for insert with check (auth.uid() = id);
create policy "profiles update own" on profiles for update using (auth.uid() = id);

-- Profile photo uploads (public avatars bucket)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

drop policy if exists "avatars public read" on storage.objects;
drop policy if exists "avatars upload own" on storage.objects;
drop policy if exists "avatars update own" on storage.objects;
drop policy if exists "avatars delete own" on storage.objects;

create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars upload own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars update own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars delete own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Room custom background uploads (public room-backgrounds bucket)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'room-backgrounds',
  'room-backgrounds',
  true,
  8388608,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = 8388608,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

drop policy if exists "room backgrounds public read" on storage.objects;
drop policy if exists "room backgrounds upload own" on storage.objects;
drop policy if exists "room backgrounds update own" on storage.objects;
drop policy if exists "room backgrounds delete own" on storage.objects;

create policy "room backgrounds public read" on storage.objects
  for select using (bucket_id = 'room-backgrounds');

create policy "room backgrounds upload own" on storage.objects
  for insert with check (
    bucket_id = 'room-backgrounds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "room backgrounds update own" on storage.objects
  for update using (
    bucket_id = 'room-backgrounds'
    and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'room-backgrounds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "room backgrounds delete own" on storage.objects
  for delete using (
    bucket_id = 'room-backgrounds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Rooms: allow reading all + creating custom rooms
drop policy if exists "rooms insert custom" on rooms;
create policy "rooms insert custom" on rooms for insert with check (true);

-- Seats: allow inserting rows when creating a new room
drop policy if exists "seats insert" on seats;
create policy "seats insert" on seats for insert with check (true);

-- Make yourself super admin (replace with your Google email):
-- update profiles set is_super_admin = true where email = 'your@gmail.com';
-- update wallets set coins = 999999999 where user_id = (select id::text from profiles where email = 'your@gmail.com');
-- Run in Supabase SQL Editor

alter table profiles add column if not exists user_code text unique;

create unique index if not exists profiles_user_code_idx on profiles(user_code);

-- Backfill existing profiles without a code (run once):
-- update profiles set user_code = upper(substr(md5(id::text), 1, 8)) where user_code is null;
-- Run in Supabase SQL Editor

create table if not exists presence (
  room_id text not null references rooms(id) on delete cascade,
  user_id text not null,
  nickname text not null,
  last_seen timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists wallets (
  user_id text primary key,
  coins bigint not null default 10000000,
  updated_at timestamptz default now()
);

alter table presence enable row level security;
alter table wallets enable row level security;

drop policy if exists "presence read" on presence;
drop policy if exists "presence upsert" on presence;
drop policy if exists "presence update" on presence;
drop policy if exists "presence delete" on presence;
create policy "presence read" on presence for select using (true);
create policy "presence upsert" on presence for insert with check (true);
create policy "presence update" on presence for update using (true) with check (true);
create policy "presence delete" on presence for delete using (true);

drop policy if exists "wallets read" on wallets;
drop policy if exists "wallets insert" on wallets;
drop policy if exists "wallets update" on wallets;
create policy "wallets read" on wallets for select using (true);
create policy "wallets insert" on wallets for insert with check (true);
create policy "wallets update" on wallets for update using (true) with check (true);

-- (realtime tables added at end of this file)
-- Saved / followed voice rooms (run in Supabase SQL Editor)

create table if not exists saved_rooms (
  user_id uuid not null references profiles(id) on delete cascade,
  room_id text not null references rooms(id) on delete cascade,
  is_following boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, room_id)
);

create index if not exists saved_rooms_user_idx on saved_rooms (user_id, created_at desc);

alter table saved_rooms enable row level security;

drop policy if exists "saved_rooms read own" on saved_rooms;
drop policy if exists "saved_rooms insert own" on saved_rooms;
drop policy if exists "saved_rooms update own" on saved_rooms;
drop policy if exists "saved_rooms delete own" on saved_rooms;

create policy "saved_rooms read own" on saved_rooms
  for select using (auth.uid() = user_id);

create policy "saved_rooms insert own" on saved_rooms
  for insert with check (auth.uid() = user_id);

create policy "saved_rooms update own" on saved_rooms
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "saved_rooms delete own" on saved_rooms
  for delete using (auth.uid() = user_id);
-- Phase A: Core social (run in Supabase SQL Editor)

-- Room announcement shown in profile sheet + room view
alter table rooms add column if not exists announcement text;
alter table rooms add column if not exists nation text default 'Global';

-- Auto-join as member when user saves/joins a room (handled by app on join)
-- saved_rooms already tracks members (all rows) and fans (is_following = true)

-- Optional: index for fast room stats
create index if not exists saved_rooms_room_stats_idx
  on saved_rooms (room_id, is_following);
-- Phase B: Room settings + admins + blacklist (run in Supabase SQL Editor)

alter table rooms add column if not exists room_mode text not null default 'normal';
alter table rooms add column if not exists room_tag text not null default 'friends';
alter table rooms add column if not exists background_key text not null default 'golden_party';
alter table rooms add column if not exists background_url text;
alter table rooms add column if not exists high_quality boolean not null default true;
alter table rooms add column if not exists ban_chat boolean not null default false;
alter table rooms add column if not exists ban_images boolean not null default false;
alter table rooms add column if not exists room_password text;
alter table rooms add column if not exists gift_sound boolean not null default true;
alter table rooms add column if not exists video_room jsonb not null default '{}'::jsonb;
alter table rooms add column if not exists video_youtube_id text;
alter table rooms add column if not exists video_title text;
alter table rooms add column if not exists video_sync jsonb not null default '{}'::jsonb;

create table if not exists room_admins (
  room_id text not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists room_blacklist (
  room_id text not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table room_admins enable row level security;
alter table room_blacklist enable row level security;

drop policy if exists "room_admins read" on room_admins;
drop policy if exists "room_admins write" on room_admins;
drop policy if exists "room_admins insert" on room_admins;
drop policy if exists "room_admins delete" on room_admins;
drop policy if exists "room_blacklist read" on room_blacklist;
drop policy if exists "room_blacklist write" on room_blacklist;
drop policy if exists "room_blacklist insert" on room_blacklist;
drop policy if exists "room_blacklist delete" on room_blacklist;

create policy "room_admins read" on room_admins for select using (true);
create policy "room_admins insert" on room_admins
  for insert with check (
    exists (
      select 1 from rooms r
      where r.id = room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );
create policy "room_admins delete" on room_admins
  for delete using (
    exists (
      select 1 from rooms r
      where r.id = room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

create policy "room_blacklist read" on room_blacklist for select using (true);
create policy "room_blacklist insert" on room_blacklist for insert with check (true);
create policy "room_blacklist delete" on room_blacklist for delete using (true);

-- Temporary kicks (5 min cooldown); blacklist is permanent until removed
create table if not exists room_kicks (
  room_id text not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  kicked_by uuid references profiles(id) on delete set null,
  kicked_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (room_id, user_id)
);

create index if not exists room_kicks_expires_idx on room_kicks (expires_at);

alter table room_kicks enable row level security;

drop policy if exists "room_kicks read" on room_kicks;
drop policy if exists "room_kicks write" on room_kicks;
drop policy if exists "room_kicks insert" on room_kicks;
drop policy if exists "room_kicks update" on room_kicks;
drop policy if exists "room_kicks delete" on room_kicks;

create policy "room_kicks read" on room_kicks for select using (true);
create policy "room_kicks insert" on room_kicks for insert with check (true);
create policy "room_kicks update" on room_kicks for update using (true) with check (true);
create policy "room_kicks delete" on room_kicks for delete using (true);

-- Personal blocks (profile Block user — not room blacklist)
create table if not exists user_blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_no_self check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocked_idx on user_blocks (blocked_id);

alter table user_blocks enable row level security;

drop policy if exists "user_blocks read" on user_blocks;
drop policy if exists "user_blocks insert" on user_blocks;
drop policy if exists "user_blocks delete" on user_blocks;

create policy "user_blocks read" on user_blocks for select using (true);
create policy "user_blocks insert" on user_blocks for insert with check (true);
create policy "user_blocks delete" on user_blocks for delete using (true);

create table if not exists seat_invites (
  room_id text not null references rooms(id) on delete cascade,
  invitee_id uuid not null references profiles(id) on delete cascade,
  seat_number int not null,
  inviter_id uuid not null references profiles(id) on delete cascade,
  inviter_name text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  primary key (room_id, invitee_id)
);

create index if not exists seat_invites_room_status_idx on seat_invites (room_id, status);

alter table seat_invites enable row level security;

drop policy if exists "seat_invites read" on seat_invites;
drop policy if exists "seat_invites write" on seat_invites;
drop policy if exists "seat_invites update" on seat_invites;
drop policy if exists "seat_invites delete" on seat_invites;

create policy "seat_invites read" on seat_invites for select using (true);
create policy "seat_invites write" on seat_invites for insert with check (true);
create policy "seat_invites update" on seat_invites for update using (true);
create policy "seat_invites delete" on seat_invites for delete using (true);

do $$ begin alter publication supabase_realtime add table seat_invites; exception when duplicate_object then null; end $$;

-- Room owners can update their room settings
drop policy if exists "rooms update owner" on rooms;
create policy "rooms update owner" on rooms
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
-- Phase C: Charm, room levels, daily tasks (run in Supabase SQL Editor)

alter table profiles add column if not exists charm bigint not null default 0;

alter table rooms add column if not exists room_exp bigint not null default 0;
alter table rooms add column if not exists room_level int not null default 1;

create table if not exists daily_task_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  task_date date not null default current_date,
  followed_room boolean not null default false,
  sent_gift boolean not null default false,
  sent_message boolean not null default false,
  watch_minutes int not null default 0,
  chests_claimed int not null default 0,
  primary key (user_id, task_date)
);

alter table daily_task_progress enable row level security;

drop policy if exists "daily_tasks read own" on daily_task_progress;
drop policy if exists "daily_tasks upsert own" on daily_task_progress;
drop policy if exists "daily_tasks update own" on daily_task_progress;

create policy "daily_tasks read own" on daily_task_progress
  for select using (auth.uid() = user_id);
create policy "daily_tasks upsert own" on daily_task_progress
  for insert with check (auth.uid() = user_id);
create policy "daily_tasks update own" on daily_task_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Phase D: Reactions + room modes extras (run in Supabase SQL Editor)
-- room_mode and room_tag columns on rooms

-- Store reaction/game messages in existing messages table (no new table needed).
-- Optional: track reaction cooldown per user
create table if not exists room_reaction_log (
  id bigint generated always as identity primary key,
  room_id text not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reaction_key text not null,
  created_at timestamptz not null default now()
);

alter table room_reaction_log enable row level security;

drop policy if exists "reactions insert" on room_reaction_log;
drop policy if exists "reactions read" on room_reaction_log;

create policy "reactions insert" on room_reaction_log for insert with check (true);
create policy "reactions read" on room_reaction_log for select using (true);
-- Phase E: User levels, VIP, contributions, gift inventory (run in Supabase SQL Editor)

alter table profiles add column if not exists user_exp bigint not null default 0;
alter table profiles add column if not exists user_level int not null default 1;
alter table profiles add column if not exists vip_level int not null default 0;
alter table profiles add column if not exists vip_points bigint not null default 0;
alter table profiles add column if not exists vip_expires_at timestamptz;
alter table profiles add column if not exists title text;
alter table profiles add column if not exists gender text;

create table if not exists vip_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  -- requested_level is kept for old clients; current app grows level from vip_points.
  requested_level int not null default 1 check (requested_level between 1 and 10),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (user_id)
);

create index if not exists vip_requests_status_created_idx
  on vip_requests (status, created_at desc);

alter table vip_requests enable row level security;

alter table vip_requests drop constraint if exists vip_requests_requested_level_check;
alter table vip_requests add constraint vip_requests_requested_level_check
  check (requested_level between 1 and 10);

create table if not exists coin_purchase_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  pack_id text not null,
  coins bigint not null check (coins > 0),
  price_label text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists coin_purchase_requests_status_created_idx
  on coin_purchase_requests (status, created_at desc);

create index if not exists coin_purchase_requests_user_status_idx
  on coin_purchase_requests (user_id, status, created_at desc);

alter table coin_purchase_requests enable row level security;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select p.is_super_admin from profiles p where p.id = auth.uid()), false);
$$;

grant execute on function public.is_super_admin() to authenticated;

drop policy if exists "profiles update super admin" on profiles;
create policy "profiles update super admin" on profiles
  for update using (public.is_super_admin())
  with check (true);

drop policy if exists "vip_requests read own or super" on vip_requests;
drop policy if exists "vip_requests insert own" on vip_requests;
drop policy if exists "vip_requests update own pending" on vip_requests;
drop policy if exists "vip_requests update super" on vip_requests;
drop policy if exists "coin_purchase_requests read own or super" on coin_purchase_requests;
drop policy if exists "coin_purchase_requests insert own" on coin_purchase_requests;
drop policy if exists "coin_purchase_requests update super" on coin_purchase_requests;

create policy "vip_requests read own or super" on vip_requests
  for select using (
    auth.uid() = user_id
    or public.is_super_admin()
  );

create policy "vip_requests insert own" on vip_requests
  for insert with check (auth.uid() = user_id);

create policy "vip_requests update own pending" on vip_requests
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status = 'pending');

create policy "vip_requests update super" on vip_requests
  for update using (public.is_super_admin())
  with check (true);

create policy "coin_purchase_requests read own or super" on coin_purchase_requests
  for select using (
    auth.uid() = user_id
    or public.is_super_admin()
  );

create policy "coin_purchase_requests insert own" on coin_purchase_requests
  for insert with check (auth.uid() = user_id);

create policy "coin_purchase_requests update super" on coin_purchase_requests
  for update using (public.is_super_admin())
  with check (true);

create table if not exists room_contributions (
  room_id text not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  amount bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists gift_inventory (
  user_id uuid not null references profiles(id) on delete cascade,
  gift_id text not null,
  quantity int not null default 0,
  expires_at timestamptz,
  primary key (user_id, gift_id)
);

alter table room_contributions enable row level security;
alter table gift_inventory enable row level security;

drop policy if exists "contributions read" on room_contributions;
drop policy if exists "contributions upsert" on room_contributions;
drop policy if exists "contributions update" on room_contributions;
drop policy if exists "inventory read own" on gift_inventory;
drop policy if exists "inventory write own" on gift_inventory;
drop policy if exists "inventory update own" on gift_inventory;

create policy "contributions read" on room_contributions for select using (true);
create policy "contributions upsert" on room_contributions for insert with check (true);
create policy "contributions update" on room_contributions for update using (true) with check (true);

create policy "inventory read own" on gift_inventory for select using (auth.uid() = user_id);
create policy "inventory write own" on gift_inventory for insert with check (auth.uid() = user_id);
create policy "inventory update own" on gift_inventory for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Phase F: Waiting queue, follows, reports, red packets (run in Supabase SQL Editor)

create table if not exists room_waiting (
  room_id text not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists user_follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

create table if not exists room_reports (
  id bigint generated always as identity primary key,
  room_id text not null references rooms(id) on delete cascade,
  reporter_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists red_packets (
  id bigint generated always as identity primary key,
  room_id text not null references rooms(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  total_coins int not null,
  claims_left int not null,
  created_at timestamptz not null default now()
);

alter table room_waiting enable row level security;
alter table user_follows enable row level security;
alter table room_reports enable row level security;
alter table red_packets enable row level security;

drop policy if exists "waiting read" on room_waiting;
drop policy if exists "waiting write" on room_waiting;
drop policy if exists "waiting delete" on room_waiting;
drop policy if exists "follows read" on user_follows;
drop policy if exists "follows write" on user_follows;
drop policy if exists "follows delete" on user_follows;
drop policy if exists "reports insert" on room_reports;
drop policy if exists "red_packets read" on red_packets;
drop policy if exists "red_packets insert" on red_packets;

create policy "waiting read" on room_waiting for select using (true);
create policy "waiting write" on room_waiting for insert with check (true);
create policy "waiting delete" on room_waiting for delete using (true);

create policy "follows read" on user_follows for select using (true);
create policy "follows write" on user_follows for insert with check (auth.uid() = follower_id);
create policy "follows delete" on user_follows for delete using (auth.uid() = follower_id);

create policy "reports insert" on room_reports for insert with check (auth.uid() = reporter_id);

create policy "red_packets read" on red_packets for select using (true);
create policy "red_packets insert" on red_packets for insert with check (auth.uid() = sender_id);
-- Phase G: Private chat between friends (run in Supabase SQL Editor)
-- user_follows table (defined below)

create table if not exists private_messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists private_messages_sender_idx
  on private_messages (sender_id, created_at desc);

create index if not exists private_messages_recipient_idx
  on private_messages (recipient_id, created_at desc);

create index if not exists private_messages_created_idx
  on private_messages (created_at desc);

alter table private_messages enable row level security;

drop policy if exists "private_messages read" on private_messages;
drop policy if exists "private_messages insert" on private_messages;
drop policy if exists "private_messages update read" on private_messages;

revoke update on private_messages from anon, authenticated;
grant update (read_at) on private_messages to authenticated;

create policy "private_messages read" on private_messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "private_messages insert" on private_messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from user_follows f1
      join user_follows f2
        on f2.follower_id = recipient_id
       and f2.following_id = sender_id
      where f1.follower_id = sender_id
        and f1.following_id = recipient_id
    )
  );

create policy "private_messages update read" on private_messages
  for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- Temporary free party rooms (deleted when empty)
alter table rooms add column if not exists is_temp boolean not null default false;

drop policy if exists "rooms delete own temp" on rooms;
create policy "rooms delete own temp" on rooms
  for delete
  using (is_temp = true and owner_id = auth.uid());

drop policy if exists "seats delete own temp room" on seats;
create policy "seats delete own temp room" on seats
  for delete
  using (
    exists (
      select 1
      from rooms
      where rooms.id = seats.room_id
        and rooms.is_temp = true
        and rooms.owner_id = auth.uid()
    )
  );

drop policy if exists "messages delete own temp room" on messages;
create policy "messages delete own temp room" on messages
  for delete
  using (
    exists (
      select 1
      from rooms
      where rooms.id = messages.room_id
        and rooms.is_temp = true
        and rooms.owner_id = auth.uid()
    )
  );
-- Seat lock + mute controls (G-play-style Close Seat / Mute)
alter table seats add column if not exists is_locked boolean not null default false;

-- mic_on: when false, seat is muted — anyone sitting here cannot speak
alter table seats add column if not exists mic_on boolean not null default true;

-- =============================================================================
-- Realtime (skip if already added)
-- =============================================================================
do $$ begin alter publication supabase_realtime add table presence; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table wallets; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table private_messages; exception when duplicate_object then null; end $$;

-- Charm increments when gifting (cross-user profile updates)
create or replace function public.add_profile_charm(p_user_id uuid, p_amount bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_charm bigint;
begin
  if p_user_id is null or p_amount is null or p_amount <= 0 then
    select coalesce(charm, 0) into new_charm from profiles where id = p_user_id;
    return coalesce(new_charm, 0);
  end if;

  update profiles
  set charm = coalesce(charm, 0) + p_amount
  where id = p_user_id
  returning charm into new_charm;

  return coalesce(new_charm, 0);
end;
$$;

revoke all on function public.add_profile_charm(uuid, bigint) from public;
grant execute on function public.add_profile_charm(uuid, bigint) to authenticated;

create or replace function public.apply_gift_charm(
  p_recipient_id uuid,
  p_sender_id uuid,
  p_charm bigint,
  p_sender_gets_charm boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  delta bigint;
  recipient_total bigint;
  sender_total bigint;
begin
  delta := greatest(0, coalesce(p_charm, 0));
  if delta <= 0 or p_recipient_id is null then
    return jsonb_build_object('recipient_charm', null, 'sender_charm', null);
  end if;

  recipient_total := public.add_profile_charm(p_recipient_id, delta);

  if p_sender_gets_charm and p_sender_id is not null then
    if p_sender_id = p_recipient_id then
      sender_total := recipient_total;
    else
      sender_total := public.add_profile_charm(p_sender_id, delta);
    end if;
  end if;

  return jsonb_build_object(
    'recipient_charm', recipient_total,
    'sender_charm', sender_total
  );
end;
$$;

revoke all on function public.apply_gift_charm(uuid, uuid, bigint, boolean) from public;
grant execute on function public.apply_gift_charm(uuid, uuid, bigint, boolean) to authenticated;

create table if not exists gift_transactions (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  room_id text references rooms(id) on delete set null,
  gift_id text not null,
  gift_name text not null,
  gift_emoji text not null default '🎁',
  quantity int not null default 1,
  cost bigint not null default 0,
  charm bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists gift_transactions_recipient_idx on gift_transactions(recipient_id, created_at desc);
create index if not exists gift_transactions_sender_idx on gift_transactions(sender_id, created_at desc);

alter table gift_transactions enable row level security;

drop policy if exists "gift_tx read" on gift_transactions;
drop policy if exists "gift_tx insert" on gift_transactions;

create policy "gift_tx read" on gift_transactions for select using (true);
create policy "gift_tx insert" on gift_transactions
  for insert with check (auth.uid() = sender_id);

-- Optional: make yourself super admin (replace email, run once):
-- update profiles set is_super_admin = true where email = 'your@gmail.com';
-- update wallets set coins = 999999999 where user_id = (select id::text from profiles where email = 'your@gmail.com');

-- =============================================================================
-- Extended features (auctions, moments, DM calls, 14 seats, red packet rain,
-- relationships, guard bonds, WePlay parity) — safe to re-run
-- =============================================================================

-- Gift wall extras (auctions, moments)
create table if not exists room_auctions (
  room_id text primary key references rooms(id) on delete cascade,
  seat_number int not null default 2,
  min_bid bigint not null default 50,
  current_bid bigint not null default 0,
  high_bidder_id uuid references profiles(id) on delete set null,
  high_bidder_name text,
  status text not null default 'idle',
  started_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table room_auctions enable row level security;

drop policy if exists "auctions read" on room_auctions;
drop policy if exists "auctions insert" on room_auctions;
drop policy if exists "auctions update" on room_auctions;

create policy "auctions read" on room_auctions for select using (true);
create policy "auctions insert" on room_auctions for insert with check (true);
create policy "auctions update" on room_auctions for update using (true) with check (true);

create table if not exists moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  image_url text,
  likes_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists moments_created_idx on moments(created_at desc);

create table if not exists moment_likes (
  moment_id uuid not null references moments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  primary key (moment_id, user_id)
);

alter table moments enable row level security;
alter table moment_likes enable row level security;

drop policy if exists "moments read" on moments;
drop policy if exists "moments insert" on moments;
drop policy if exists "moments update" on moments;
drop policy if exists "moment_likes read" on moment_likes;
drop policy if exists "moment_likes insert" on moment_likes;
drop policy if exists "moment_likes delete" on moment_likes;

create policy "moments read" on moments for select using (true);
create policy "moments insert" on moments for insert with check (auth.uid() = user_id);
create policy "moments update" on moments for update using (true) with check (true);

create policy "moment_likes read" on moment_likes for select using (true);
create policy "moment_likes insert" on moment_likes for insert with check (auth.uid() = user_id);
create policy "moment_likes delete" on moment_likes for delete using (auth.uid() = user_id);

create table if not exists moment_comments (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references moments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists moment_comments_moment_idx on moment_comments(moment_id, created_at);

alter table moment_comments enable row level security;

drop policy if exists "moment_comments read" on moment_comments;
drop policy if exists "moment_comments insert" on moment_comments;
drop policy if exists "moment_comments delete" on moment_comments;

create policy "moment_comments read" on moment_comments for select using (true);
create policy "moment_comments insert" on moment_comments for insert with check (auth.uid() = user_id);
create policy "moment_comments delete" on moment_comments for delete using (auth.uid() = user_id);

drop policy if exists "moments update" on moments;
create policy "moments update" on moments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "moments delete" on moments;
create policy "moments delete" on moments for delete using (auth.uid() = user_id);

-- Temp room cleanup when empty
drop policy if exists "rooms delete empty temp" on rooms;
create policy "rooms delete empty temp" on rooms
  for delete
  using (
    is_temp = true
    and not exists (
      select 1
      from presence p
      where p.room_id = rooms.id
        and p.last_seen > (now() - interval '90 seconds')
    )
    and not exists (
      select 1
      from seats s
      where s.room_id = rooms.id
        and s.user_id is not null
    )
  );

drop policy if exists "rooms delete super admin" on rooms;
create policy "rooms delete super admin" on rooms
  for delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

drop policy if exists "presence delete super admin" on presence;
create policy "presence delete super admin" on presence
  for delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

drop policy if exists "saved_rooms delete super admin" on saved_rooms;
create policy "saved_rooms delete super admin" on saved_rooms
  for delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

drop policy if exists "seats delete super admin" on seats;
create policy "seats delete super admin" on seats
  for delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

drop policy if exists "messages delete super admin" on messages;
create policy "messages delete super admin" on messages
  for delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

drop policy if exists "room_contributions delete super admin" on room_contributions;
create policy "room_contributions delete super admin" on room_contributions
  for delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

drop policy if exists "room_reaction_log delete super admin" on room_reaction_log;
create policy "room_reaction_log delete super admin" on room_reaction_log
  for delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );

-- seats/messages: cascade when a room is deleted (fixes FK 23503 on temp-room purge)
alter table seats drop constraint if exists seats_room_id_fkey;
alter table seats
  add constraint seats_room_id_fkey
  foreign key (room_id) references rooms(id) on delete cascade;

alter table messages drop constraint if exists messages_room_id_fkey;
alter table messages
  add constraint messages_room_id_fkey
  foreign key (room_id) references rooms(id) on delete cascade;

-- 10-minute inactive user cleanup for billing control
delete from presence p
where p.last_seen < (now() - interval '10 minutes');

update seats s
set user_id = null,
    nickname = null
where s.user_id is not null
  and not exists (
    select 1
    from presence p
    where p.room_id = s.room_id
      and p.user_id = s.user_id
      and p.last_seen > (now() - interval '10 minutes')
  );

-- Purge orphaned empty temp rooms (safe to re-run; seats cascade after FK fix above)
with doomed as (
  select r.id
  from rooms r
  where r.is_temp = true
    and not exists (
      select 1 from presence p
      where p.room_id = r.id
        and p.last_seen > (now() - interval '90 seconds')
    )
    and not exists (
      select 1 from seats s
      where s.room_id = r.id and s.user_id is not null
    )
)
delete from rooms r
using doomed d
where r.id = d.id;


-- DM voice call signaling
create table if not exists dm_calls (
  id bigint generated always as identity primary key,
  caller_id uuid not null references profiles(id) on delete cascade,
  callee_id uuid not null references profiles(id) on delete cascade,
  room_name text not null,
  status text not null default 'ringing'
    check (status in ('ringing', 'active', 'rejected', 'ended', 'missed')),
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  ended_at timestamptz,
  check (caller_id <> callee_id)
);

create index if not exists dm_calls_callee_ringing_idx
  on dm_calls (callee_id, status, created_at desc);

create index if not exists dm_calls_participants_idx
  on dm_calls (caller_id, callee_id, created_at desc);

alter table dm_calls enable row level security;

drop policy if exists "dm_calls read" on dm_calls;
drop policy if exists "dm_calls insert" on dm_calls;
drop policy if exists "dm_calls update" on dm_calls;

create policy "dm_calls read" on dm_calls
  for select using (auth.uid() = caller_id or auth.uid() = callee_id);

create policy "dm_calls insert" on dm_calls
  for insert with check (
    auth.uid() = caller_id
    and exists (
      select 1
      from user_follows f1
      join user_follows f2
        on f2.follower_id = callee_id
       and f2.following_id = caller_id
      where f1.follower_id = caller_id
        and f1.following_id = callee_id
    )
  );

create policy "dm_calls update" on dm_calls
  for update using (
    auth.uid() = caller_id or auth.uid() = callee_id
  ) with check (
    auth.uid() = caller_id or auth.uid() = callee_id
  );

-- 14 seats per room
insert into seats (room_id, seat_number)
select r.id, s.n
from rooms r
cross join generate_series(11, 14) as s(n)
where not exists (
  select 1
  from seats existing
  where existing.room_id = r.id
    and existing.seat_number = s.n
);

insert into seats (room_id, seat_number)
select 'global-room', generate_series(11, 14)
where exists (select 1 from rooms where id = 'global-room')
on conflict (room_id, seat_number) do nothing;

-- Room mode: super admins can update any room
drop policy if exists "rooms update super admin" on rooms;
create policy "rooms update super admin" on rooms
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  )
  with check (true);

-- Red packet rain drops + policies
create table if not exists red_packet_drops (
  id bigint generated always as identity primary key,
  packet_id bigint not null references red_packets(id) on delete cascade,
  drop_index int not null,
  coin_value int not null check (coin_value > 0),
  claimed_by uuid references profiles(id) on delete set null,
  claimed_at timestamptz,
  unique (packet_id, drop_index)
);

alter table red_packet_drops enable row level security;

alter table red_packet_drops drop constraint if exists red_packet_drops_coin_value_check;
alter table red_packet_drops add constraint red_packet_drops_coin_value_check check (coin_value > 0);

drop policy if exists "red_packet_drops read" on red_packet_drops;
drop policy if exists "red_packet_drops insert" on red_packet_drops;
drop policy if exists "red_packet_drops update" on red_packet_drops;

create policy "red_packet_drops read" on red_packet_drops for select using (true);
create policy "red_packet_drops insert" on red_packet_drops for insert with check (auth.uid() is not null);
create policy "red_packet_drops update" on red_packet_drops for update using (true) with check (true);

drop policy if exists "red_packets insert" on red_packets;
drop policy if exists "red_packets update" on red_packets;
drop policy if exists "red_packets delete" on red_packets;

create policy "red_packets insert" on red_packets
  for insert with check (auth.uid() = sender_id);

create policy "red_packets update" on red_packets
  for update using (true) with check (true);

create policy "red_packets delete" on red_packets
  for delete using (auth.uid() = sender_id);

create table if not exists red_packet_claims (
  id bigint generated always as identity primary key,
  packet_id bigint not null references red_packets(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  coins int not null,
  created_at timestamptz not null default now(),
  unique (packet_id, user_id)
);

alter table red_packet_claims enable row level security;

drop policy if exists "red_packet_claims read" on red_packet_claims;
drop policy if exists "red_packet_claims insert" on red_packet_claims;

create policy "red_packet_claims read" on red_packet_claims for select using (true);
create policy "red_packet_claims insert" on red_packet_claims for insert with check (auth.uid() = user_id);

-- User bonds (CP, Bro, Sis, Wedding, BFF, Guard, etc.)
create table if not exists user_relationships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  bond_type text,
  level int not null default 1 check (level >= 1),
  guard_points bigint not null default 0,
  started_at timestamptz not null default now(),
  constraint user_relationships_ordered check (user_a < user_b),
  constraint user_relationships_type_check check (
    bond_type is null or bond_type in (
      'cp', 'wedding', 'bro', 'sis', 'bff', 'bestie',
      'guard', 'mentor', 'confidant', 'apprentice',
      'son', 'daughter', 'choti_ghar_wali', 'badi_ghar_wali'
    )
  ),
  unique (user_a, user_b)
);

create index if not exists user_relationships_user_a_idx on user_relationships (user_a);
create index if not exists user_relationships_user_b_idx on user_relationships (user_b);

alter table user_relationships enable row level security;

drop policy if exists "bonds read" on user_relationships;
drop policy if exists "bonds insert" on user_relationships;
drop policy if exists "bonds update" on user_relationships;
drop policy if exists "bonds delete" on user_relationships;

create policy "bonds read" on user_relationships for select using (true);
create policy "bonds insert" on user_relationships
  for insert with check (auth.uid() = user_a or auth.uid() = user_b);
create policy "bonds update" on user_relationships
  for update using (auth.uid() = user_a or auth.uid() = user_b);
create policy "bonds delete" on user_relationships
  for delete using (auth.uid() = user_a or auth.uid() = user_b);

-- WePlay parity columns
alter table user_relationships alter column bond_type drop not null;

alter table user_relationships drop constraint if exists user_relationships_type_check;
alter table user_relationships add constraint user_relationships_type_check check (
  bond_type is null or bond_type in (
    'cp', 'wedding', 'bro', 'sis', 'bff', 'bestie',
    'guard', 'mentor', 'confidant', 'apprentice',
    'son', 'daughter', 'choti_ghar_wali', 'badi_ghar_wali'
  )
);

alter table user_relationships add column if not exists guard_a bigint not null default 0;
alter table user_relationships add column if not exists guard_b bigint not null default 0;
alter table user_relationships add column if not exists status text not null default 'active';
alter table user_relationships add column if not exists proposed_by uuid references profiles(id) on delete set null;
alter table user_relationships add column if not exists proposed_bond_type text;
alter table user_relationships add column if not exists relationship_exp bigint not null default 0;
alter table user_relationships add column if not exists relationship_level int not null default 1;

alter table rooms add column if not exists partner_seat_enabled boolean not null default true;

update user_relationships
set status = 'active'
where bond_type is not null and status is distinct from 'active';

update user_relationships
set relationship_level = greatest(relationship_level, level)
where relationship_level < level;


create or replace function public.are_mutual_friends(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from user_follows f1
    join user_follows f2
      on f1.follower_id = f2.following_id
     and f1.following_id = f2.follower_id
    where f1.follower_id = p_user_a
      and f1.following_id = p_user_b
  );
$$;

create or replace function public.add_gift_guard_points(
  p_sender_id uuid,
  p_recipient_id uuid,
  p_charm bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  delta bigint;
  pair_a uuid;
  pair_b uuid;
  row_id uuid;
  ga bigint;
  gb bigint;
  sender_is_a boolean;
begin
  delta := greatest(0, coalesce(p_charm, 0));
  if delta <= 0 or p_sender_id is null or p_recipient_id is null or p_sender_id = p_recipient_id then
    return jsonb_build_object('guard_a', 0, 'guard_b', 0, 'guard_mine', 0, 'guard_theirs', 0);
  end if;

  if not public.are_mutual_friends(p_sender_id, p_recipient_id) then
    return jsonb_build_object('guard_a', 0, 'guard_b', 0, 'guard_mine', 0, 'guard_theirs', 0);
  end if;

  if p_sender_id < p_recipient_id then
    pair_a := p_sender_id;
    pair_b := p_recipient_id;
    sender_is_a := true;
  else
    pair_a := p_recipient_id;
    pair_b := p_sender_id;
    sender_is_a := false;
  end if;

  select id, guard_a, guard_b into row_id, ga, gb
  from user_relationships
  where user_a = pair_a and user_b = pair_b;

  if row_id is null then
    insert into user_relationships (user_a, user_b, bond_type, status, guard_a, guard_b, relationship_exp, relationship_level)
    values (
      pair_a,
      pair_b,
      null,
      'tracking',
      case when sender_is_a then delta else 0 end,
      case when sender_is_a then 0 else delta end,
      delta,
      1
    )
    returning guard_a, guard_b into ga, gb;
    select id into row_id from user_relationships where user_a = pair_a and user_b = pair_b;
  elsif sender_is_a then
    update user_relationships
    set guard_a = guard_a + delta,
        relationship_exp = relationship_exp + delta,
        level = greatest(level, 1 + (relationship_exp + delta) / 3000),
        relationship_level = greatest(relationship_level, level, 1 + (relationship_exp + delta) / 3000)
    where id = row_id
    returning guard_a, guard_b into ga, gb;
  else
    update user_relationships
    set guard_b = guard_b + delta,
        relationship_exp = relationship_exp + delta,
        level = greatest(level, 1 + (relationship_exp + delta) / 3000),
        relationship_level = greatest(relationship_level, level, 1 + (relationship_exp + delta) / 3000)
    where id = row_id
    returning guard_a, guard_b into ga, gb;
  end if;

  return jsonb_build_object(
    'guard_a', ga,
    'guard_b', gb,
    'guard_mine', case when p_sender_id = pair_a then ga else gb end,
    'guard_theirs', case when p_sender_id = pair_a then gb else ga end
  );
end;
$$;

grant execute on function public.schedule_wedding(uuid, uuid, timestamptz, text) to authenticated;

-- CP slot limits: men up to 4, women 1 (active cp/wedding + outgoing pending proposals)
create or replace function public.cp_bond_limit(p_gender text)
returns int
language sql
immutable
as $$
  select case
    when lower(trim(coalesce(p_gender, ''))) in ('male', 'm', 'man', 'men', 'boy') then 4
    when lower(trim(coalesce(p_gender, ''))) in ('female', 'f', 'woman', 'women', 'girl') then 1
    else 1
  end;
$$;

create or replace function public.cp_slot_count(
  p_user_id uuid,
  p_exclude_user_a uuid default null,
  p_exclude_user_b uuid default null
)
returns int
language sql
stable
as $$
  select count(*)::int
  from user_relationships ur
  where (ur.user_a = p_user_id or ur.user_b = p_user_id)
    and (
      p_exclude_user_a is null
      or not (ur.user_a = p_exclude_user_a and ur.user_b = p_exclude_user_b)
    )
    and (
      (ur.status = 'active' and ur.bond_type in ('cp', 'wedding', 'choti_ghar_wali', 'badi_ghar_wali'))
      or (
        ur.status = 'pending'
        and ur.proposed_bond_type in ('cp', 'wedding', 'choti_ghar_wali', 'badi_ghar_wali')
        and ur.proposed_by = p_user_id
      )
    );
$$;

create or replace function public.assert_cp_slot_available(
  p_user_id uuid,
  p_pair_a uuid,
  p_pair_b uuid
)
returns void
language plpgsql
stable
as $$
declare
  g text;
  lim int;
  cnt int;
begin
  select gender into g from profiles where id = p_user_id;
  if g is null or trim(g) = '' then
    raise exception 'Set gender in profile first (Me → Edit profile). Men: 4 CP max. Women: 1 CP max.';
  end if;
  lim := public.cp_bond_limit(g);
  cnt := public.cp_slot_count(p_user_id, p_pair_a, p_pair_b);
  if cnt >= lim then
    raise exception 'CP limit reached (%/%). Men max 4, women max 1.', cnt, lim;
  end if;
end;
$$;

create or replace function public.propose_user_bond(
  p_proposer_id uuid,
  p_other_id uuid,
  p_bond_type text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pair_a uuid;
  pair_b uuid;
  row_rec user_relationships%rowtype;
  min_guard bigint := 3000;
  proposer_guard bigint;
begin
  if p_proposer_id is null or p_other_id is null or p_proposer_id = p_other_id then
    raise exception 'Invalid users';
  end if;
  if p_bond_type not in (
    'cp', 'wedding', 'bro', 'sis', 'bff', 'bestie',
    'apprentice', 'son', 'daughter', 'choti_ghar_wali', 'badi_ghar_wali'
  ) then
    raise exception 'Invalid bond type';
  end if;

  if p_bond_type in ('bro', 'sis', 'bff', 'bestie', 'apprentice', 'son', 'daughter') then
    min_guard := 1000;
  else
    min_guard := 3000;
  end if;

  if not public.are_mutual_friends(p_proposer_id, p_other_id) then
    raise exception 'Must be mutual friends first';
  end if;

  if p_proposer_id < p_other_id then
    pair_a := p_proposer_id;
    pair_b := p_other_id;
    proposer_guard := coalesce((select guard_a from user_relationships where user_a = pair_a and user_b = pair_b), 0);
  else
    pair_a := p_other_id;
    pair_b := p_proposer_id;
    proposer_guard := coalesce((select guard_b from user_relationships where user_a = pair_a and user_b = pair_b), 0);
  end if;

  if proposer_guard < min_guard then
    raise exception 'Need % guard points (you have %)', min_guard, proposer_guard;
  end if;

  if p_bond_type in ('cp', 'wedding', 'choti_ghar_wali', 'badi_ghar_wali') then
    perform public.assert_cp_slot_available(p_proposer_id, pair_a, pair_b);
    perform public.assert_cp_slot_available(p_other_id, pair_a, pair_b);
  end if;

  select * into row_rec from user_relationships where user_a = pair_a and user_b = pair_b;
  if row_rec.id is not null and row_rec.status = 'active' and row_rec.bond_type is not null then
    raise exception 'Already bonded';
  end if;
  if row_rec.id is not null and row_rec.status = 'pending' then
    raise exception 'Proposal already pending';
  end if;

  if row_rec.id is null then
    insert into user_relationships (user_a, user_b, bond_type, status, proposed_by, proposed_bond_type, guard_a, guard_b)
    values (pair_a, pair_b, null, 'pending', p_proposer_id, p_bond_type, 0, 0)
    returning * into row_rec;
  else
    update user_relationships
    set status = 'pending',
        proposed_by = p_proposer_id,
        proposed_bond_type = p_bond_type,
        bond_type = null
    where id = row_rec.id
    returning * into row_rec;
  end if;

  return jsonb_build_object(
    'status', row_rec.status,
    'proposed_by', row_rec.proposed_by,
    'proposed_bond_type', row_rec.proposed_bond_type,
    'guard_a', row_rec.guard_a,
    'guard_b', row_rec.guard_b
  );
end;
$$;

create or replace function public.respond_user_bond(
  p_responder_id uuid,
  p_other_id uuid,
  p_accept boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pair_a uuid;
  pair_b uuid;
  row_rec user_relationships%rowtype;
begin
  if p_responder_id is null or p_other_id is null then
    raise exception 'Invalid users';
  end if;

  if p_responder_id < p_other_id then
    pair_a := p_responder_id;
    pair_b := p_other_id;
  else
    pair_a := p_other_id;
    pair_b := p_responder_id;
  end if;

  select * into row_rec from user_relationships where user_a = pair_a and user_b = pair_b;
  if row_rec.id is null or row_rec.status <> 'pending' then
    raise exception 'No pending proposal';
  end if;
  if row_rec.proposed_by = p_responder_id then
    raise exception 'Cannot respond to your own proposal';
  end if;

  if p_accept then
    if coalesce(row_rec.proposed_bond_type, 'cp') in ('cp', 'wedding', 'choti_ghar_wali', 'badi_ghar_wali') then
      perform public.assert_cp_slot_available(p_responder_id, pair_a, pair_b);
      perform public.assert_cp_slot_available(row_rec.proposed_by, pair_a, pair_b);
    end if;

    update user_relationships
    set status = 'active',
        bond_type = coalesce(proposed_bond_type, 'cp'),
        started_at = now(),
        proposed_by = null,
        proposed_bond_type = null,
        level = greatest(level, 1),
        relationship_level = greatest(relationship_level, level, 1)
    where id = row_rec.id
    returning * into row_rec;
  else
    update user_relationships
    set status = 'tracking',
        proposed_by = null,
        proposed_bond_type = null,
        bond_type = null
    where id = row_rec.id
    returning * into row_rec;
  end if;

  return jsonb_build_object(
    'status', row_rec.status,
    'bond_type', row_rec.bond_type,
    'guard_a', row_rec.guard_a,
    'guard_b', row_rec.guard_b
  );
end;
$$;

-- Spend coins to add guard toward a mutual friend (WePlay-style Protect)
create or replace function public.protect_user(
  p_protector_id uuid,
  p_target_id uuid,
  p_coins bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cost bigint;
  wallet_coins bigint;
  guard_result jsonb;
begin
  cost := greatest(0, coalesce(p_coins, 0));
  if p_protector_id is null or p_target_id is null or p_protector_id = p_target_id then
    raise exception 'Invalid users';
  end if;
  if cost <= 0 then
    raise exception 'Invalid amount';
  end if;
  if auth.uid() is distinct from p_protector_id then
    raise exception 'Not authorized';
  end if;
  if not public.are_mutual_friends(p_protector_id, p_target_id) then
    raise exception 'Must be mutual friends first';
  end if;

  select coins into wallet_coins
  from wallets
  where user_id = p_protector_id::text
  for update;

  if coalesce(wallet_coins, 0) < cost then
    raise exception 'Insufficient coins';
  end if;

  update wallets
  set coins = coins - cost, updated_at = now()
  where user_id = p_protector_id::text;

  guard_result := public.add_gift_guard_points(p_protector_id, p_target_id, cost);

  return guard_result || jsonb_build_object('coins_spent', cost);
end;
$$;

-- Gift charm + guard for mutual friends
create or replace function public.apply_gift_charm(
  p_recipient_id uuid,
  p_sender_id uuid,
  p_charm bigint,
  p_sender_gets_charm boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  delta bigint;
  recipient_total bigint;
  sender_total bigint;
  guard_result jsonb;
begin
  delta := greatest(0, coalesce(p_charm, 0));
  if delta <= 0 or p_recipient_id is null then
    return jsonb_build_object('recipient_charm', null, 'sender_charm', null);
  end if;

  recipient_total := public.add_profile_charm(p_recipient_id, delta);

  if p_sender_gets_charm and p_sender_id is not null then
    if p_sender_id = p_recipient_id then
      sender_total := recipient_total;
    else
      sender_total := public.add_profile_charm(p_sender_id, delta);
    end if;
  end if;

  guard_result := public.add_gift_guard_points(p_sender_id, p_recipient_id, delta);

  return jsonb_build_object(
    'recipient_charm', recipient_total,
    'sender_charm', sender_total,
    'guard_a', guard_result->'guard_a',
    'guard_b', guard_result->'guard_b',
    'guard_mine', guard_result->'guard_mine',
    'guard_theirs', guard_result->'guard_theirs'
  );
end;
$$;

grant execute on function public.are_mutual_friends(uuid, uuid) to authenticated;
grant execute on function public.add_gift_guard_points(uuid, uuid, bigint) to authenticated;
grant execute on function public.propose_user_bond(uuid, uuid, text) to authenticated;
grant execute on function public.respond_user_bond(uuid, uuid, boolean) to authenticated;
grant execute on function public.protect_user(uuid, uuid, bigint) to authenticated;

-- Room settings (WePlay parity)
alter table rooms add column if not exists ban_red_packet boolean not null default false;

alter table user_relationships add column if not exists wedding_ring text;

-- Church / wedding schedule
create table if not exists wedding_schedules (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  ring_type text not null default 'floral',
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint wedding_schedules_ordered check (user_a < user_b)
);

create index if not exists wedding_schedules_at_idx on wedding_schedules (scheduled_at);
create index if not exists wedding_schedules_status_idx on wedding_schedules (status);

alter table wedding_schedules enable row level security;

drop policy if exists "wedding read" on wedding_schedules;
drop policy if exists "wedding insert" on wedding_schedules;
drop policy if exists "wedding update" on wedding_schedules;

create policy "wedding read" on wedding_schedules for select using (true);
create policy "wedding insert" on wedding_schedules
  for insert with check (auth.uid() = user_a or auth.uid() = user_b);
create policy "wedding update" on wedding_schedules
  for update using (auth.uid() = user_a or auth.uid() = user_b);

create or replace function public.schedule_wedding(
  p_user_id uuid,
  p_partner_id uuid,
  p_scheduled_at timestamptz,
  p_ring_type text default 'floral'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pair_a uuid;
  pair_b uuid;
  row_id uuid;
begin
  if p_user_id is null or p_partner_id is null or p_user_id = p_partner_id then
    raise exception 'Invalid users';
  end if;

  if p_user_id < p_partner_id then
    pair_a := p_user_id;
    pair_b := p_partner_id;
  else
    pair_a := p_partner_id;
    pair_b := p_user_id;
  end if;

  if not exists (
    select 1 from user_relationships
    where user_a = pair_a and user_b = pair_b
      and status = 'active'
      and bond_type in ('cp', 'wedding', 'choti_ghar_wali', 'badi_ghar_wali')
  ) then
    raise exception 'Must have active CP or wedding bond';
  end if;

  insert into wedding_schedules (user_a, user_b, scheduled_at, ring_type, status)
  values (pair_a, pair_b, p_scheduled_at, coalesce(nullif(p_ring_type, ''), 'floral'), 'scheduled')
  returning id into row_id;

  update user_relationships
  set wedding_ring = coalesce(nullif(p_ring_type, ''), 'floral')
  where user_a = pair_a and user_b = pair_b;

  return jsonb_build_object('id', row_id, 'scheduled_at', p_scheduled_at, 'ring_type', p_ring_type);
end;
$$;

grant execute on function public.schedule_wedding(uuid, uuid, timestamptz, text) to authenticated;

-- Realtime publication (idempotent)
do $$ begin alter publication supabase_realtime add table seats; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table messages; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table dm_calls; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table red_packets; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table vip_requests; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table coin_purchase_requests; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table profiles; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table rooms; exception when duplicate_object then null; end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'red_packets'
  ) then
    alter publication supabase_realtime add table red_packets;
  end if;
end $$;

-- Optional one-time: clear stuck seats on global room
-- update seats set user_id = null, nickname = null where room_id = 'global-room';

-- Room audience: members list + contribution periods (WePlay parity)
create table if not exists room_contribution_log (
  id bigserial primary key,
  room_id text not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  amount bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists room_contribution_log_room_time_idx
  on room_contribution_log (room_id, created_at desc);

alter table room_contribution_log enable row level security;

drop policy if exists "contrib log read" on room_contribution_log;
drop policy if exists "contrib log insert" on room_contribution_log;

create policy "contrib log read" on room_contribution_log for select using (true);
create policy "contrib log insert" on room_contribution_log for insert with check (true);

drop policy if exists "saved_rooms read room members" on saved_rooms;
create policy "saved_rooms read room members" on saved_rooms for select using (true);

create or replace function public.get_room_social_stats(p_room_id text)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'members', coalesce((select count(*)::int from saved_rooms where room_id = p_room_id), 0),
    'fans', coalesce((select count(*)::int from saved_rooms where room_id = p_room_id and is_following = true), 0)
  );
$$;

create or replace function public.list_room_members(p_room_id text, p_limit int default 50)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  charm bigint,
  is_following boolean,
  joined_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.id,
    p.display_name,
    p.avatar_url,
    coalesce(p.charm, 0)::bigint,
    sr.is_following,
    sr.created_at
  from saved_rooms sr
  join profiles p on p.id = sr.user_id
  where sr.room_id = p_room_id
  order by sr.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

create or replace function public.list_room_contributors(
  p_room_id text,
  p_period text default 'total',
  p_limit int default 30
)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  charm bigint,
  amount bigint,
  rank bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if coalesce(p_period, 'total') = 'total' then
    return query
    select
      p.id,
      p.display_name,
      p.avatar_url,
      coalesce(p.charm, 0)::bigint,
      rc.amount,
      row_number() over (order by rc.amount desc, rc.updated_at desc)
    from room_contributions rc
    join profiles p on p.id = rc.user_id
    where rc.room_id = p_room_id
    order by rc.amount desc, rc.updated_at desc
    limit greatest(1, least(coalesce(p_limit, 30), 100));
  else
    return query
    with since as (
      select case
        when p_period = 'daily' then date_trunc('day', now())
        else date_trunc('week', now())
      end as t
    ),
    agg as (
      select cl.user_id, sum(cl.amount)::bigint as amount
      from room_contribution_log cl
      cross join since
      where cl.room_id = p_room_id
        and cl.created_at >= since.t
      group by cl.user_id
    )
    select
      p.id,
      p.display_name,
      p.avatar_url,
      coalesce(p.charm, 0)::bigint,
      a.amount,
      row_number() over (order by a.amount desc)
    from agg a
    join profiles p on p.id = a.user_id
    order by a.amount desc
    limit greatest(1, least(coalesce(p_limit, 30), 100));
  end if;
end;
$$;

grant execute on function public.get_room_social_stats(text) to authenticated;
grant execute on function public.list_room_members(text, int) to authenticated;
grant execute on function public.list_room_contributors(text, text, int) to authenticated;

-- Rally room fans: DM everyone following the room (host/admin only)
create or replace function public.rally_room_fans(p_room_id text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room rooms%rowtype;
  v_count int := 0;
  v_msg text;
begin
  select * into v_room
  from rooms
  where id::text = p_room_id or room_code = upper(trim(p_room_id))
  limit 1;

  if not found then
    raise exception 'Room not found';
  end if;

  if auth.uid() is distinct from v_room.owner_id
     and not exists (
       select 1 from room_admins
       where room_id = v_room.id and user_id = auth.uid()
     ) then
    raise exception 'Only the host or an admin can rally fans';
  end if;

  v_msg := '🎉 You''re invited to join "' || coalesce(v_room.name, 'a voice room')
    || '" — come hang out and have fun!' || chr(10) || '[[room:' || v_room.room_code || ']]';

  insert into private_messages (sender_id, recipient_id, message)
  select auth.uid(), sr.user_id, v_msg
  from saved_rooms sr
  where sr.room_id = v_room.id
    and sr.is_following = true
    and sr.user_id <> auth.uid();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.rally_room_fans(text) to authenticated;

-- Room admin management (owner / super admin — bypasses flaky client deletes)
create or replace function public.add_room_admin(p_room_id text, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select owner_id into v_owner from rooms where id = p_room_id;
  if v_owner is null then
    raise exception 'Room not found';
  end if;

  if auth.uid() is distinct from v_owner
     and not exists (
       select 1 from profiles p where p.id = auth.uid() and p.is_super_admin = true
     ) then
    raise exception 'Only the room owner can manage admins';
  end if;

  if p_user_id = v_owner then
    raise exception 'The host is already the owner';
  end if;

  if not exists (select 1 from profiles where id = p_user_id) then
    raise exception 'User not found';
  end if;

  insert into room_admins (room_id, user_id)
  values (p_room_id, p_user_id)
  on conflict (room_id, user_id) do nothing;
end;
$$;

create or replace function public.remove_room_admin(p_room_id text, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select owner_id into v_owner from rooms where id = p_room_id;
  if v_owner is null then
    raise exception 'Room not found';
  end if;

  if auth.uid() is distinct from v_owner
     and not exists (
       select 1 from profiles p where p.id = auth.uid() and p.is_super_admin = true
     ) then
    raise exception 'Only the room owner can manage admins';
  end if;

  delete from room_admins
  where room_id = p_room_id and user_id = p_user_id;
end;
$$;

grant execute on function public.add_room_admin(text, uuid) to authenticated;
grant execute on function public.remove_room_admin(text, uuid) to authenticated;
