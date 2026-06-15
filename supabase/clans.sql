-- Clan system: tables, RLS, and helper RPCs
-- Run in Supabase SQL editor after schema.sql

create table if not exists clans (
  id uuid primary key default gen_random_uuid(),
  clan_code bigint not null unique,
  name text not null,
  avatar_url text,
  intro text not null default '',
  sign_label text not null default '',
  level int not null default 1 check (level >= 1),
  activeness int not null default 0,
  weekly_activeness int not null default 0,
  fund bigint not null default 0,
  clan_coins bigint not null default 0,
  shield int not null default 0,
  announcement text not null default '',
  join_mode text not null default 'application' check (join_mode in ('open', 'application')),
  accept_applications boolean not null default true,
  min_charm_level int not null default 0,
  max_members int not null default 70,
  weekly_rank int,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists clans_clan_code_idx on clans (clan_code);

create table if not exists clan_members (
  clan_id uuid not null references clans(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('leader', 'deputy', 'admin', 'member')),
  weekly_donation bigint not null default 0,
  total_donation bigint not null default 0,
  joined_at timestamptz not null default now(),
  primary key (clan_id, user_id)
);

create unique index if not exists clan_members_user_unique on clan_members (user_id);
create index if not exists clan_members_clan_idx on clan_members (clan_id, role);

create table if not exists clan_applications (
  id bigint generated always as identity primary key,
  clan_id uuid not null references clans(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  message text not null default '',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references profiles(id) on delete set null
);

create unique index if not exists clan_applications_pending_unique
  on clan_applications (clan_id, user_id)
  where status = 'pending';

create index if not exists clan_applications_clan_status_idx
  on clan_applications (clan_id, status, created_at desc);

create table if not exists clan_messages (
  id bigint generated always as identity primary key,
  clan_id uuid not null references clans(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists clan_messages_clan_created_idx
  on clan_messages (clan_id, created_at desc);

create table if not exists clan_news (
  id bigint generated always as identity primary key,
  clan_id uuid references clans(id) on delete cascade,
  kind text not null default 'info',
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists clan_news_scope_idx
  on clan_news (clan_id, created_at desc);

create table if not exists clan_task_claims (
  user_id uuid not null references profiles(id) on delete cascade,
  clan_id uuid not null references clans(id) on delete cascade,
  task_id text not null,
  claimed_date date not null default (current_date),
  primary key (user_id, clan_id, task_id, claimed_date)
);

-- Helper: generate unique 6-digit clan code
create or replace function public.generate_clan_code()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  code bigint;
  taken boolean;
begin
  loop
    code := floor(random() * 900000 + 100000)::bigint;
    select exists(select 1 from clans c where c.clan_code = code) into taken;
    exit when not taken;
  end loop;
  return code;
end;
$$;

grant execute on function public.generate_clan_code() to authenticated;

-- RPC: create clan + leader membership (coin deduction handled in app)
create or replace function public.create_clan(p_name text, p_user_id uuid)
returns public.clans
language plpgsql
security definer
set search_path = public
as $$
declare
  new_clan public.clans;
  trimmed text;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Not authorized';
  end if;

  trimmed := trim(coalesce(p_name, ''));
  if length(trimmed) < 2 then
    raise exception 'Clan name is too short';
  end if;
  if length(trimmed) > 24 then
    raise exception 'Clan name is too long';
  end if;

  if exists(select 1 from clan_members m where m.user_id = p_user_id) then
    raise exception 'Already in a clan';
  end if;

  insert into clans (clan_code, name, created_by)
  values (public.generate_clan_code(), trimmed, p_user_id)
  returning * into new_clan;

  insert into clan_members (clan_id, user_id, role)
  values (new_clan.id, p_user_id, 'leader');

  insert into clan_news (clan_id, kind, body)
  values (new_clan.id, 'milestone', format('Clan "%s" was founded!', trimmed));

  return new_clan;
end;
$$;

grant execute on function public.create_clan(text, uuid) to authenticated;

-- Membership helpers for RLS
create or replace function public.is_clan_member(p_clan_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from clan_members m
    where m.clan_id = p_clan_id and m.user_id = auth.uid()
  );
$$;

grant execute on function public.is_clan_member(uuid) to authenticated;

create or replace function public.clan_member_role(p_clan_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select m.role from clan_members m
  where m.clan_id = p_clan_id and m.user_id = auth.uid()
  limit 1;
$$;

grant execute on function public.clan_member_role(uuid) to authenticated;

create or replace function public.is_clan_manager(p_clan_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.clan_member_role(p_clan_id) in ('leader', 'deputy'), false);
$$;

grant execute on function public.is_clan_manager(uuid) to authenticated;

create or replace function public.is_clan_leader(p_clan_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.clan_member_role(p_clan_id) = 'leader', false);
$$;

grant execute on function public.is_clan_leader(uuid) to authenticated;

-- RLS
alter table clans enable row level security;
alter table clan_members enable row level security;
alter table clan_applications enable row level security;
alter table clan_messages enable row level security;
alter table clan_news enable row level security;
alter table clan_task_claims enable row level security;

-- clans: members read full row; anyone authenticated can search by code (limited via select *)
drop policy if exists "clans read members or search" on clans;
create policy "clans read members or search" on clans
  for select using (
    public.is_clan_member(id)
    or auth.uid() is not null
  );

drop policy if exists "clans update managers" on clans;
create policy "clans update managers" on clans
  for update using (public.is_clan_manager(id))
  with check (public.is_clan_manager(id));

-- clan_members
drop policy if exists "clan_members read clan or self" on clan_members;
create policy "clan_members read clan or self" on clan_members
  for select using (
    public.is_clan_member(clan_id)
    or user_id = auth.uid()
  );

drop policy if exists "clan_members insert join" on clan_members;
create policy "clan_members insert join" on clan_members
  for insert with check (
    user_id = auth.uid()
    or public.is_clan_manager(clan_id)
  );

drop policy if exists "clan_members update managers" on clan_members;
create policy "clan_members update managers" on clan_members
  for update using (public.is_clan_manager(clan_id) or public.is_clan_leader(clan_id))
  with check (public.is_clan_manager(clan_id) or public.is_clan_leader(clan_id));

drop policy if exists "clan_members delete self or leader" on clan_members;
create policy "clan_members delete self or leader" on clan_members
  for delete using (
    user_id = auth.uid()
    or public.is_clan_leader(clan_id)
  );

-- applications
drop policy if exists "clan_applications read own or managers" on clan_applications;
create policy "clan_applications read own or managers" on clan_applications
  for select using (
    user_id = auth.uid()
    or public.is_clan_manager(clan_id)
  );

drop policy if exists "clan_applications insert own" on clan_applications;
create policy "clan_applications insert own" on clan_applications
  for insert with check (user_id = auth.uid());

drop policy if exists "clan_applications update managers" on clan_applications;
create policy "clan_applications update managers" on clan_applications
  for update using (public.is_clan_manager(clan_id))
  with check (public.is_clan_manager(clan_id));

-- messages
drop policy if exists "clan_messages read members" on clan_messages;
create policy "clan_messages read members" on clan_messages
  for select using (public.is_clan_member(clan_id));

drop policy if exists "clan_messages insert members" on clan_messages;
create policy "clan_messages insert members" on clan_messages
  for insert with check (
    public.is_clan_member(clan_id) and user_id = auth.uid()
  );

-- news
drop policy if exists "clan_news read world or members" on clan_news;
create policy "clan_news read world or members" on clan_news
  for select using (
    clan_id is null
    or public.is_clan_member(clan_id)
  );

drop policy if exists "clan_news insert managers" on clan_news;
create policy "clan_news insert managers" on clan_news
  for insert with check (
    clan_id is not null and public.is_clan_manager(clan_id)
  );

-- task claims
drop policy if exists "clan_task_claims read own" on clan_task_claims;
create policy "clan_task_claims read own" on clan_task_claims
  for select using (user_id = auth.uid());

drop policy if exists "clan_task_claims insert own" on clan_task_claims;
create policy "clan_task_claims insert own" on clan_task_claims
  for insert with check (user_id = auth.uid());
