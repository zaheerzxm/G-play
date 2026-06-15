-- FB-005 Phase A: group DM schema + create/send RPCs
-- Run after supabase/RUN-THIS.sql (profiles, user_follows, user_blocks)

create table if not exists public.dm_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (char_length(trim(name)) >= 1),
  check (char_length(name) <= 40)
);

create table if not exists public.dm_group_members (
  group_id uuid not null references public.dm_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists idx_dm_group_members_user on public.dm_group_members(user_id, joined_at desc);

create table if not exists public.dm_group_messages (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.dm_groups(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now(),
  check (char_length(trim(message)) >= 1),
  check (char_length(message) <= 500)
);

create index if not exists idx_dm_group_messages_group_created
  on public.dm_group_messages(group_id, created_at desc);

create table if not exists public.dm_group_reads (
  group_id uuid not null references public.dm_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_message_id bigint references public.dm_group_messages(id) on delete set null,
  last_read_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create or replace function public.is_dm_group_member(p_group_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.dm_group_members m
    where m.group_id = p_group_id
      and m.user_id = coalesce(p_user_id, auth.uid())
  );
$$;

create or replace function public.is_users_blocked_either_way(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_blocks b
    where (b.blocker_id = p_user_a and b.blocked_id = p_user_b)
       or (b.blocker_id = p_user_b and b.blocked_id = p_user_a)
  );
$$;

alter table public.dm_groups enable row level security;
alter table public.dm_group_members enable row level security;
alter table public.dm_group_messages enable row level security;
alter table public.dm_group_reads enable row level security;

drop policy if exists "dm_groups read members" on public.dm_groups;
create policy "dm_groups read members"
  on public.dm_groups for select
  using (public.is_dm_group_member(id));

drop policy if exists "dm_group_members read members" on public.dm_group_members;
create policy "dm_group_members read members"
  on public.dm_group_members for select
  using (public.is_dm_group_member(group_id));

drop policy if exists "dm_group_messages read members" on public.dm_group_messages;
create policy "dm_group_messages read members"
  on public.dm_group_messages for select
  using (public.is_dm_group_member(group_id));

drop policy if exists "dm_group_reads read own" on public.dm_group_reads;
create policy "dm_group_reads read own"
  on public.dm_group_reads for select
  using (user_id = auth.uid());

drop policy if exists "dm_group_reads update own" on public.dm_group_reads;
create policy "dm_group_reads update own"
  on public.dm_group_reads for update
  using (user_id = auth.uid() and public.is_dm_group_member(group_id))
  with check (user_id = auth.uid() and public.is_dm_group_member(group_id));

create or replace function public.create_dm_group(
  p_name text,
  p_member_ids uuid[] default array[]::uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  trimmed_name text := trim(coalesce(p_name, ''));
  member_id uuid;
  all_members uuid[] := array[]::uuid[];
  member_count int;
  i int;
  j int;
  new_group public.dm_groups%rowtype;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if trimmed_name = '' then
    raise exception 'Group name is required';
  end if;
  if char_length(trimmed_name) > 40 then
    raise exception 'Group name is too long';
  end if;

  all_members := array[uid];

  if p_member_ids is not null then
    foreach member_id in array p_member_ids loop
      if member_id is null or member_id = uid then
        continue;
      end if;
      if not member_id = any(all_members) then
        all_members := array_append(all_members, member_id);
      end if;
    end loop;
  end if;

  member_count := coalesce(array_length(all_members, 1), 0);
  if member_count < 3 then
    raise exception 'Group needs at least 3 members';
  end if;

  foreach member_id in array all_members loop
    if member_id <> uid and not public.are_mutual_friends(uid, member_id) then
      raise exception 'All members must be mutual friends';
    end if;
  end loop;

  for i in 1..member_count loop
    for j in (i + 1)..member_count loop
      if public.is_users_blocked_either_way(all_members[i], all_members[j]) then
        raise exception 'Blocked users cannot be in the same group';
      end if;
    end loop;
  end loop;

  insert into public.dm_groups (name, created_by)
  values (trimmed_name, uid)
  returning * into new_group;

  foreach member_id in array all_members loop
    insert into public.dm_group_members (group_id, user_id, role)
    values (
      new_group.id,
      member_id,
      case when member_id = uid then 'owner' else 'member' end
    );

    insert into public.dm_group_reads (group_id, user_id, last_read_message_id, last_read_at)
    values (new_group.id, member_id, null, now());
  end loop;

  return jsonb_build_object(
    'id', new_group.id,
    'name', new_group.name,
    'created_by', new_group.created_by,
    'created_at', new_group.created_at,
    'member_count', member_count
  );
end;
$$;

create or replace function public.send_dm_group_message(
  p_group_id uuid,
  p_message text
)
returns public.dm_group_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  trimmed text := trim(coalesce(p_message, ''));
  row public.dm_group_messages%rowtype;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_group_id is null then
    raise exception 'Group required';
  end if;
  if trimmed = '' then
    raise exception 'Message is empty';
  end if;
  if char_length(trimmed) > 500 then
    raise exception 'Message is too long';
  end if;
  if not public.is_dm_group_member(p_group_id, uid) then
    raise exception 'Not a group member';
  end if;

  insert into public.dm_group_messages (group_id, sender_id, message)
  values (p_group_id, uid, trimmed)
  returning * into row;

  return row;
end;
$$;

grant execute on function public.is_dm_group_member(uuid, uuid) to authenticated;
grant execute on function public.create_dm_group(text, uuid[]) to authenticated;
grant execute on function public.send_dm_group_message(uuid, text) to authenticated;
