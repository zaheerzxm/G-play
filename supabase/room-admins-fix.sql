-- Run this in Supabase SQL Editor if Add/Remove admin does not work.
-- Safe to re-run.

create table if not exists room_admins (
  room_id text not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table room_admins enable row level security;

drop policy if exists "room_admins read" on room_admins;
drop policy if exists "room_admins insert" on room_admins;
drop policy if exists "room_admins delete" on room_admins;

create policy "room_admins read" on room_admins for select using (true);

create policy "room_admins insert" on room_admins
  for insert with check (
    exists (select 1 from rooms r where r.id = room_id and r.owner_id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_super_admin = true)
  );

create policy "room_admins delete" on room_admins
  for delete using (
    exists (select 1 from rooms r where r.id = room_id and r.owner_id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_super_admin = true)
  );

create or replace function public.add_room_admin(p_room_id text, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;

  select owner_id into v_owner from rooms where id = p_room_id;
  if v_owner is null then raise exception 'Room not found'; end if;

  if auth.uid() is distinct from v_owner
     and not exists (select 1 from profiles p where p.id = auth.uid() and p.is_super_admin = true) then
    raise exception 'Only the room owner can manage admins';
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
  if auth.uid() is null then raise exception 'Not signed in'; end if;

  select owner_id into v_owner from rooms where id = p_room_id;
  if v_owner is null then raise exception 'Room not found'; end if;

  if auth.uid() is distinct from v_owner
     and not exists (select 1 from profiles p where p.id = auth.uid() and p.is_super_admin = true) then
    raise exception 'Only the room owner can manage admins';
  end if;

  delete from room_admins where room_id = p_room_id and user_id = p_user_id;
end;
$$;

grant execute on function public.add_room_admin(text, uuid) to authenticated;
grant execute on function public.remove_room_admin(text, uuid) to authenticated;
