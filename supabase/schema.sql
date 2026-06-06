create table rooms (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

create table seats (
  id bigint generated always as identity primary key,
  room_id text references rooms(id),
  seat_number int not null,
  user_id text,
  nickname text,
  mic_on boolean default true,
  updated_at timestamptz default now(),
  unique(room_id, seat_number)
);

create table messages (
  id bigint generated always as identity primary key,
  room_id text references rooms(id),
  user_id text,
  nickname text,
  message text,
  created_at timestamptz default now()
);

insert into rooms(id, name)
values ('global-room', 'Global Room');

insert into seats(room_id, seat_number)
select 'global-room', generate_series(1, 10);

-- Enable RLS policies + realtime for seats and messages in Supabase dashboard
