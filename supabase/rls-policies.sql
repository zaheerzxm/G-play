-- REQUIRED: run in Supabase SQL Editor so all users can sit + chat
-- Dashboard: https://supabase.com/dashboard → your project → SQL Editor

alter table rooms enable row level security;
alter table seats enable row level security;
alter table messages enable row level security;

-- Rooms (read only)
drop policy if exists "rooms read" on rooms;
create policy "rooms read" on rooms for select using (true);

-- Seats (read + update for sit/leave/change)
drop policy if exists "seats read" on seats;
drop policy if exists "seats update" on seats;
create policy "seats read" on seats for select using (true);
create policy "seats update" on seats
  for update
  using (true)
  with check (true);

-- Messages (read + insert)
drop policy if exists "messages read" on messages;
drop policy if exists "messages insert" on messages;
create policy "messages read" on messages for select using (true);
create policy "messages insert" on messages for insert with check (true);

-- One user id per room
create unique index if not exists seats_one_user_per_room
  on seats (room_id, user_id)
  where user_id is not null;

-- One nickname per room (stops duplicate billu)
create unique index if not exists seats_one_nickname_per_room
  on seats (room_id, lower(btrim(nickname)))
  where nickname is not null;

-- Realtime
alter publication supabase_realtime add table seats;
alter publication supabase_realtime add table messages;
