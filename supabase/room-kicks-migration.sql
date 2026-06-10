-- Run in Supabase SQL Editor if room_kicks table is missing
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
drop policy if exists "room_kicks insert" on room_kicks;
drop policy if exists "room_kicks update" on room_kicks;
drop policy if exists "room_kicks delete" on room_kicks;

create policy "room_kicks read" on room_kicks for select using (true);
create policy "room_kicks insert" on room_kicks for insert with check (true);
create policy "room_kicks update" on room_kicks for update using (true) with check (true);
create policy "room_kicks delete" on room_kicks for delete using (true);
