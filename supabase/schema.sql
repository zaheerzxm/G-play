create table rooms (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

create table seats (
  id bigint generated always as identity primary key,
  room_id text references rooms(id) on delete cascade,
  seat_number int not null,
  user_id text,
  nickname text,
  mic_on boolean default true,
  updated_at timestamptz default now(),
  unique(room_id, seat_number)
);

create table messages (
  id bigint generated always as identity primary key,
  room_id text references rooms(id) on delete cascade,
  user_id text,
  nickname text,
  message text,
  created_at timestamptz default now()
);

insert into rooms(id, name)
values ('global-room', 'Global Room');

insert into seats(room_id, seat_number)
select 'global-room', generate_series(1, 14);

create unique index if not exists seats_one_user_per_room
  on seats (room_id, user_id)
  where user_id is not null;

create unique index if not exists seats_one_nickname_per_room
  on seats (room_id, lower(btrim(nickname)))
  where nickname is not null;

-- Run rls-policies.sql for RLS + realtime
