-- Seat invites: moderator sends invite, user accepts or rejects before seating
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
